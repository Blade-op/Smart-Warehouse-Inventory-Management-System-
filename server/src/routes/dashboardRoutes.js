import express from "express";
import {
  getDashboardMetrics,
  getRecentOrders,
  getLowStockItems,
  getInventoryChartData,
  getNotifications,
  search,
  getWarehouseOrdersDetail,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/metrics", protect, getDashboardMetrics);
router.get("/orders", protect, getRecentOrders);
router.get("/warehouse/:warehouseId/orders", protect, getWarehouseOrdersDetail);
router.get("/low-stock", protect, getLowStockItems);
router.get("/chart-data", protect, getInventoryChartData);
router.get("/notifications", protect, getNotifications);
router.get("/search", protect, search);

export default router;


