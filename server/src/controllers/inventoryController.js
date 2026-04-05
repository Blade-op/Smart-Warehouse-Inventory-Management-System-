import mongoose from "mongoose";
import { InventoryItem } from "../models/InventoryItem.js";
import { Product } from "../models/Product.js";
import { computeInventoryStatus, syncWarehouseTotalItems } from "../utils/inventorySync.js";

export const getInventory = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;
    const filter = {};
    if (warehouseId) {
      if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
        return res.status(400).json({ message: "Invalid warehouse id" });
      }
      filter.warehouse = warehouseId;
    }
    const items = await InventoryItem.find(filter)
      .populate("product")
      .populate("warehouse")
      .sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

/**
 * Record units sold offline (cash-and-carry, retail counter, etc.).
 * Reduces on-hand quantity and available; reserved is clamped if needed.
 */
export const recordOfflineSale = async (req, res, next) => {
  try {
    const { inventoryItemId, quantity } = req.body;
    if (!inventoryItemId || !mongoose.Types.ObjectId.isValid(inventoryItemId)) {
      return res.status(400).json({ message: "Valid inventoryItemId is required" });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ message: "quantity must be a positive number" });
    }

    const item = await InventoryItem.findById(inventoryItemId);
    if (!item) {
      return res.status(404).json({ message: "Inventory line not found" });
    }
    if (qty > item.available) {
      return res.status(400).json({
        message: `Cannot sell ${qty} units offline — only ${item.available} available (not reserved).`,
      });
    }

    item.quantity -= qty;
    if (item.reserved > item.quantity) {
      item.reserved = item.quantity;
    }
    item.available = item.quantity - item.reserved;
    item.lastUpdated = new Date();
    item.status = computeInventoryStatus(item.quantity, item.available);
    await item.save();

    const product = await Product.findById(item.product);
    if (product) {
      const globalAgg = await InventoryItem.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]);
      const total = globalAgg[0]?.total ?? 0;
      let pStatus = "in-stock";
      if (total <= 0) pStatus = "out-of-stock";
      else if (total < 40) pStatus = "low-stock";
      if (product.status !== pStatus) {
        product.status = pStatus;
        await product.save();
      }
    }

    await syncWarehouseTotalItems(item.warehouse);

    const populated = await InventoryItem.findById(item._id)
      .populate("product")
      .populate("warehouse");

    res.json({
      message: "Offline sale recorded. Stock updated.",
      item: populated,
    });
  } catch (error) {
    next(error);
  }
};


