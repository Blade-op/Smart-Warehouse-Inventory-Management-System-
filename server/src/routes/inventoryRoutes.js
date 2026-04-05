import express from "express";
import { getInventory, recordOfflineSale } from "../controllers/inventoryController.js";
import { createOfflineOrder } from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getInventory);
router.post("/offline-sale", protect, authorizeRoles("admin"), recordOfflineSale);
router.post("/create-order", protect, authorizeRoles("admin"), createOfflineOrder);

export default router;


