import express from "express";
import {
  createWarehouse,
  getWarehouses,
} from "../controllers/warehouseController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWarehouses);
router.post("/", protect, authorizeRoles("admin"), createWarehouse);

export default router;


