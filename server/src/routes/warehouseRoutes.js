import express from "express";
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
} from "../controllers/warehouseController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWarehouses);
router.post("/", protect, authorizeRoles("admin"), createWarehouse);
router.get("/:id", protect, getWarehouseById);
router.patch("/:id", protect, authorizeRoles("admin"), updateWarehouse);

export default router;


