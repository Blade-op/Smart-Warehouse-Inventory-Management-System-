import mongoose from "mongoose";
import { buildWarehouseExcelBuffer, streamWarehousePdf } from "../utils/warehouseReport.js";

export const exportWarehouseExcel = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ message: "Invalid warehouse id" });
    }
    const result = await buildWarehouseExcelBuffer(warehouseId);
    if (!result) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(result.filename)}"`
    );
    res.send(result.buffer);
  } catch (error) {
    next(error);
  }
};

export const exportWarehousePdf = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ message: "Invalid warehouse id" });
    }
    const ok = await streamWarehousePdf(res, warehouseId);
    if (!ok) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
  } catch (error) {
    next(error);
  }
};
