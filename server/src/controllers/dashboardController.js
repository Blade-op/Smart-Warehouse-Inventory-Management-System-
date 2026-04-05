import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Warehouse } from "../models/Warehouse.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Order } from "../models/Order.js";

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const [productCount, totalStockAgg, warehouseCount, lowStockCount, orderCount] =
      await Promise.all([
        Product.countDocuments(),
        InventoryItem.aggregate([
          { $group: { _id: null, total: { $sum: "$quantity" } } },
        ]),
        Warehouse.countDocuments(),
        InventoryItem.countDocuments({
          status: { $in: ["low", "critical", "out"] },
        }),
        Order.countDocuments(),
      ]);

    const totalStock = totalStockAgg[0]?.total || 0;

    return res.json({
      totalProducts: productCount,
      totalStock,
      warehouses: warehouseCount,
      lowStockAlerts: lowStockCount,
      orders: orderCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.warehouseId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.warehouseId)) {
        return res.status(400).json({ message: "Invalid warehouse id" });
      }
      filter.warehouse = req.query.warehouseId;
    }
    const orders = await Order.find(filter)
      .populate("items.product", "name")
      .populate("warehouse", "name")
      .sort({ createdAt: -1 })
      .limit(req.query.warehouseId ? 100 : 10)
      .lean();

    const formattedOrders = orders.map((order) => ({
      id: order.orderNumber,
      product: order.items?.[0]?.product?.name || "Unknown Product",
      quantity: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      warehouse: order.warehouse?.name || "Unknown Warehouse",
      status: order.status,
      date: order.createdAt,
      totalAmount: order.totalAmount,
    }));

    res.json(formattedOrders);
  } catch (error) {
    next(error);
  }
};

export const getWarehouseOrdersDetail = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ message: "Invalid warehouse id" });
    }
    const orders = await Order.find({ warehouse: warehouseId })
      .populate("items.product", "name sku")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = orders.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      items: (order.items || []).map((it) => ({
        name: it.product?.name || "Unknown",
        sku: it.product?.sku || "",
        quantity: it.quantity,
        lineTotal: it.quantity * (it.price || 0),
      })),
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (req, res, next) => {
  try {
    const lowStockItems = await InventoryItem.find({
      status: { $in: ["low", "critical", "out"] },
    })
      .populate("product", "name")
      .populate("warehouse", "name")
      .sort({ quantity: 1 })
      .limit(10)
      .lean();

    const formattedItems = lowStockItems.map((item) => ({
      name: item.product?.name || "Unknown Product",
      current: item.quantity,
      threshold: item.status === "critical" ? 10 : item.status === "low" ? 30 : 50,
      warehouse: item.warehouse?.name || "Unknown Warehouse",
      status: item.status,
    }));

    res.json(formattedItems);
  } catch (error) {
    next(error);
  }
};

export const getInventoryChartData = async (req, res, next) => {
  try {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get inbound (orders received)
      const inboundOrders = await Order.countDocuments({
        status: "completed",
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });

      // Get outbound (orders shipped)
      const outboundOrders = await Order.countDocuments({
        status: "shipped",
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });

      data.push({
        month: months[date.getMonth()],
        inbound: inboundOrders * 100, // Scale for visualization
        outbound: outboundOrders * 100,
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = [];

    // Low stock notifications
    const lowStockCount = await InventoryItem.countDocuments({
      status: { $in: ["low", "critical", "out"] },
    });
    if (lowStockCount > 0) {
      notifications.push({
        id: "low-stock",
        type: "warning",
        title: "Low Stock Alert",
        message: `${lowStockCount} item${lowStockCount > 1 ? "s" : ""} need attention`,
        timestamp: new Date(),
      });
    }

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("items.product", "name")
      .lean();

    recentOrders.forEach((order) => {
      if (order.status === "completed") {
        notifications.push({
          id: `order-${order._id}`,
          type: "success",
          title: "Order Completed",
          message: `Order ${order.orderNumber} has been fulfilled`,
          timestamp: order.createdAt,
        });
      } else if (order.status === "pending") {
        notifications.push({
          id: `order-pending-${order._id}`,
          type: "info",
          title: "New Order",
          message: `Order ${order.orderNumber} is pending`,
          timestamp: order.createdAt,
        });
      }
    });

    // Sort by timestamp
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(notifications.slice(0, 10));
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ products: [], warehouses: [] });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, "i");

    const [products, warehouses] = await Promise.all([
      Product.find({
        $or: [
          { name: searchRegex },
          { sku: searchRegex },
          { category: searchRegex },
        ],
      })
        .limit(10)
        .select("name sku category price status _id")
        .lean(),
      Warehouse.find({
        $or: [{ name: searchRegex }, { location: searchRegex }],
      })
        .limit(10)
        .select("name location _id")
        .lean(),
    ]);

    res.json({ products, warehouses });
  } catch (error) {
    next(error);
  }
};


