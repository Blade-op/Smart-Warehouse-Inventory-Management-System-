import express from "express";
import { exportWarehouseExcel, exportWarehousePdf } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/warehouse/:warehouseId/excel", protect, exportWarehouseExcel);
router.get("/warehouse/:warehouseId/pdf", protect, exportWarehousePdf);

export default router;
