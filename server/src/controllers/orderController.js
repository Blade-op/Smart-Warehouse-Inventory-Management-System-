import mongoose from "mongoose";
import { InventoryItem } from "../models/InventoryItem.js";
import { Warehouse } from "../models/Warehouse.js";
import { Order } from "../models/Order.js";
import { computeInventoryStatus, syncWarehouseTotalItems } from "../utils/inventorySync.js";

function generateOrderNumber(warehouseId) {
  // Timestamp + randomness to avoid collisions with the unique index.
  const ts = Date.now().toString().slice(-10);
  const suffix = Math.floor(100000 + Math.random() * 900000).toString();
  return `ORD-${warehouseId.toString().slice(-4).toUpperCase()}-${ts}-${suffix}`;
}

export const createOfflineOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { warehouseId, lines } = req.body;

    if (!warehouseId || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ message: "Valid warehouseId is required" });
    }
    if (!Array.isArray(lines) || lines.length < 1) {
      return res.status(400).json({ message: "Select at least one product line" });
    }

    const qtyByProductId = new Map();
    for (const line of lines) {
      const { productId, quantity } = line || {};
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Each line requires a valid productId" });
      }
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Each line requires quantity as integer >= 1" });
      }

      qtyByProductId.set(productId, (qtyByProductId.get(productId) || 0) + qty);
    }

    const normalizedLines = [...qtyByProductId.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const productIds = normalizedLines.map((l) => l.productId);

    let billPayload = null;
    await session.withTransaction(async () => {
      const warehouse = await Warehouse.findById(warehouseId).session(session);
      if (!warehouse) {
        throw Object.assign(new Error("Warehouse not found"), { statusCode: 404 });
      }

      const inventoryItems = await InventoryItem.find({
        warehouse: warehouseId,
        product: { $in: productIds },
      })
        .populate("product")
        .session(session);

      const invByProductId = new Map(inventoryItems.map((i) => [i.product._id.toString(), i]));

      if (invByProductId.size < productIds.length) {
        const missing = productIds.filter((pid) => !invByProductId.has(pid));
        throw Object.assign(
          new Error(`Missing inventory lines for product(s): ${missing.join(", ")}`),
          { statusCode: 400 }
        );
      }

      // Validate availability first, so we fail fast without partial updates.
      for (const line of normalizedLines) {
        const inv = invByProductId.get(line.productId);
        if (!inv) continue;
        if (inv.available < line.quantity) {
          const sku = inv.product?.sku || line.productId;
          throw Object.assign(
            new Error(`Insufficient stock for ${sku}: requested ${line.quantity}, available ${inv.available}`),
            { statusCode: 400 }
          );
        }
      }

      // Total amount based on product price.
      let totalAmount = 0;
      for (const line of normalizedLines) {
        const inv = invByProductId.get(line.productId);
        const price = inv.product?.price || 0;
        totalAmount += line.quantity * price;
      }

      // Reduce inventory.
      for (const line of normalizedLines) {
        const inv = invByProductId.get(line.productId);
        inv.quantity = inv.quantity - line.quantity;
        if (inv.quantity < 0) {
          throw Object.assign(new Error("Inventory quantity cannot go negative"), { statusCode: 400 });
        }

        // reserved may exist; clamp so available remains >= 0.
        inv.reserved = Math.min(inv.reserved, inv.quantity);
        inv.available = inv.quantity - inv.reserved;
        inv.lastUpdated = new Date();
        inv.status = computeInventoryStatus(inv.quantity, inv.available);
        await inv.save({ session });
      }

      // Keep product status in sync with updated quantities.
      const totals = await InventoryItem.aggregate([
        { $match: { product: { $in: productIds } } },
        { $group: { _id: "$product", total: { $sum: "$quantity" } } },
      ]).session(session);

      const totalByProductId = new Map(totals.map((t) => [t._id.toString(), t.total]));

      // Update any affected products' status.
      for (const inv of inventoryItems) {
        const total = totalByProductId.get(inv.product._id.toString()) ?? 0;
        let pStatus = "in-stock";
        if (total <= 0) pStatus = "out-of-stock";
        else if (total < 40) pStatus = "low-stock";

        if (inv.product.status !== pStatus) {
          inv.product.status = pStatus;
          await inv.product.save({ session });
        }
      }

      await syncWarehouseTotalItems(warehouseId, session);

      const orderNumber = generateOrderNumber(warehouseId);

      const order = new Order({
        orderNumber,
        status: "completed",
        items: normalizedLines.map((line) => {
          const inv = invByProductId.get(line.productId);
          const price = inv.product?.price || 0;
          return { product: line.productId, quantity: line.quantity, price };
        }),
        warehouse: warehouseId,
        totalAmount,
      });

      await order.save({ session });

      const totalItems = normalizedLines.reduce((s, l) => s + l.quantity, 0);
      const billItems = normalizedLines.map((line) => {
        const inv = invByProductId.get(line.productId);
        const price = inv.product?.price || 0;
        return {
          productId: line.productId,
          name: inv.product?.name || "Unknown",
          sku: inv.product?.sku || "",
          quantity: line.quantity,
          unitPrice: price,
          lineTotal: line.quantity * price,
        };
      });

      billPayload = {
        orderId: order.orderNumber,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        warehouseId,
        items: billItems,
        totalItems,
        totalAmount: order.totalAmount,
      };
    });

    return res.status(201).json({
      message: "Order created and stock updated.",
      bill: billPayload,
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({
      message: error?.message || "Failed to create order",
    });
  } finally {
    session.endSession();
  }
};

