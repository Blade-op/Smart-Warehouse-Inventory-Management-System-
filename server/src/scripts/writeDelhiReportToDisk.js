import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Warehouse } from "../models/Warehouse.js";
import { buildWarehouseExcelBuffer, buildWarehousePdfBuffer } from "../utils/warehouseReport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * Writes Delhi warehouse Excel + PDF into /reports at project root (next to /server).
 * Run: npm run report:delhi
 */
async function main() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/warehouse";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const wh = await Warehouse.findOne({ name: /^Delhi warehouse$/i });
  if (!wh) {
    console.error('No warehouse named "Delhi warehouse" found.');
    await mongoose.connection.close();
    process.exit(1);
  }

  const reportsDir = path.join(__dirname, "../../../reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `DelhiWarehouse_Report_${stamp}`;

  const excel = await buildWarehouseExcelBuffer(wh._id);
  const pdf = await buildWarehousePdfBuffer(wh._id);
  if (!excel || !pdf) {
    console.error("Failed to build report buffers.");
    await mongoose.connection.close();
    process.exit(1);
  }

  const xlsxPath = path.join(reportsDir, `${base}.xlsx`);
  const pdfPath = path.join(reportsDir, `${base}.pdf`);
  fs.writeFileSync(xlsxPath, excel.buffer);
  fs.writeFileSync(pdfPath, pdf);

  console.log("Written:", xlsxPath);
  console.log("Written:", pdfPath);
  await mongoose.connection.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
