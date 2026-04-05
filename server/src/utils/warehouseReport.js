import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Warehouse } from "../models/Warehouse.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Order } from "../models/Order.js";
import "../models/Product.js";

const SUPPLIERS = [
  "Mittal Toys Pvt Ltd, Delhi NCR",
  "Krishna Plastics & Toys, Ghaziabad",
  "Bharat Educational Aids, Sonipat",
  "PlayWell Imports India LLP, Mumbai",
  "Shree Ganesh Packaging, Faridabad",
];

function buildPurchaseRows(items, warehouseName) {
  const rows = [];
  const skus = items.length
    ? items.map((i) => i.product?.sku || "—")
    : ["TOY-SAMPLE-01"];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const sku = skus[i % skus.length];
    const qty = 40 + (i % 7) * 15;
    const rate = 80 + (i % 5) * 25;
    const amount = qty * rate;
    rows.push({
      date: new Date(now - i * 2.5 * 86400000),
      poNumber: `PO-${warehouseName.slice(0, 3).toUpperCase()}-2025-${String(1001 + i)}`,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      sku,
      qtyReceived: qty,
      rateINR: rate,
      amountINR: amount,
      grn: `GRN-${20250320 + i}`,
    });
  }
  return rows;
}

/**
 * Builds Excel workbook: report info, Inventory sheet (matches UI table), dispatch orders, illustrative inbound PO lines.
 */
export async function buildWarehouseExcelBuffer(warehouseId) {
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) return null;

  const items = await InventoryItem.find({ warehouse: warehouseId })
    .populate("product")
    .sort({ updatedAt: -1 });

  const orders = await Order.find({ warehouse: warehouseId })
    .populate("items.product", "name sku")
    .sort({ createdAt: -1 })
    .limit(100);

  const purchaseRows = buildPurchaseRows(items, warehouse.name);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart Warehouse IMS";
  workbook.created = new Date();

  const cover = workbook.addWorksheet("Report info");
  cover.getColumn(1).width = 28;
  cover.getColumn(2).width = 52;
  cover.addRows([
    ["Warehouse operational report", ""],
    ["Warehouse", warehouse.name],
    ["Address", warehouse.address],
    ["Location", warehouse.location],
    ["Status", warehouse.status],
    ["Staff (on record)", warehouse.staff],
    ["Monthly throughput (units)", warehouse.monthlyThroughput],
    ["Export timestamp (ISO)", new Date().toISOString()],
    ["", ""],
    [
      "Notes",
      "The Inventory sheet matches the warehouse detail page table (Product, SKU, Qty, Reserved, Available, Status). Dispatch and Inbound sheets are additional context; Inbound uses illustrative PO lines for documentation.",
    ],
  ]);

  // Same columns and order as warehouse detail Inventory tab: Product, SKU, Qty, Reserved, Available, Status
  const stock = workbook.addWorksheet("Inventory");
  stock.columns = [
    { header: "Product", key: "name", width: 36 },
    { header: "SKU", key: "sku", width: 18 },
    { header: "Qty", key: "quantity", width: 10 },
    { header: "Reserved", key: "reserved", width: 12 },
    { header: "Available", key: "available", width: 12 },
    { header: "Status", key: "status", width: 12 },
  ];
  stock.getRow(1).font = { bold: true };
  items.forEach((row) => {
    stock.addRow({
      name: row.product?.name ?? "",
      sku: row.product?.sku ?? "",
      quantity: row.quantity,
      reserved: row.reserved,
      available: row.available,
      status: row.status,
    });
  });

  const dispatch = workbook.addWorksheet("Dispatch orders");
  dispatch.columns = [
    { header: "Order #", key: "orderNumber", width: 22 },
    { header: "Date", key: "date", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Line items", key: "lines", width: 40 },
    { header: "Total (INR)", key: "total", width: 14 },
  ];
  dispatch.getRow(1).font = { bold: true };
  orders.forEach((o) => {
    const lines =
      o.items
        ?.map((it) => `${it.product?.name || "?"} × ${it.quantity}`)
        .join("; ") || "";
    dispatch.addRow({
      orderNumber: o.orderNumber,
      date: new Date(o.createdAt).toISOString(),
      status: o.status,
      lines,
      total: o.totalAmount,
    });
  });

  const inbound = workbook.addWorksheet("Inbound purchases");
  inbound.columns = [
    { header: "Receipt date", key: "date", width: 22 },
    { header: "PO number", key: "poNumber", width: 22 },
    { header: "Supplier", key: "supplier", width: 36 },
    { header: "SKU", key: "sku", width: 18 },
    { header: "Qty received", key: "qtyReceived", width: 14 },
    { header: "Rate (INR)", key: "rateINR", width: 12 },
    { header: "Amount (INR)", key: "amountINR", width: 14 },
    { header: "GRN", key: "grn", width: 14 },
  ];
  inbound.getRow(1).font = { bold: true };
  purchaseRows.forEach((r) => {
    inbound.addRow({
      date: r.date.toISOString(),
      poNumber: r.poNumber,
      supplier: r.supplier,
      sku: r.sku,
      qtyReceived: r.qtyReceived,
      rateINR: r.rateINR,
      amountINR: r.amountINR,
      grn: r.grn,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = `${warehouse.name.replace(/[^\w\d-]+/g, "_")}_Report.xlsx`;
  return { buffer: Buffer.from(buffer), filename: safeName };
}

const PDF_MARGIN = 48;
const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PDF_BOTTOM = PDF_PAGE_HEIGHT - PDF_MARGIN;

/** Truncate for single-line PDF cells (matches on-screen table intent). */
function pdfTruncate(str, maxChars) {
  const s = str == null || str === "" ? "—" : String(str);
  if (s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 1))}…`;
}

/**
 * Full inventory table: Product, SKU, Qty, Reserved, Available, Status (same as UI / Excel Inventory sheet).
 */
function drawInventoryPdfTable(doc, items) {
  const usable = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
  const col = {
    product: PDF_MARGIN,
    wProduct: Math.round(usable * 0.38),
    sku: 0,
    wSku: Math.round(usable * 0.18),
    qty: 0,
    wQty: Math.round(usable * 0.09),
    reserved: 0,
    wReserved: Math.round(usable * 0.12),
    available: 0,
    wAvailable: Math.round(usable * 0.12),
    status: 0,
    wStatus: Math.round(usable * 0.11),
  };
  col.sku = col.product + col.wProduct;
  col.qty = col.sku + col.wSku;
  col.reserved = col.qty + col.wQty;
  col.available = col.reserved + col.wReserved;
  col.status = col.available + col.wAvailable;

  const rowH = 11;
  const headerH = 13;
  let y = doc.y;

  const drawHeaderRow = () => {
    doc.font("Helvetica-Bold").fontSize(8);
    doc.text("Product", col.product, y, { width: col.wProduct });
    doc.text("SKU", col.sku, y, { width: col.wSku });
    doc.text("Qty", col.qty, y, { width: col.wQty, align: "right" });
    doc.text("Reserved", col.reserved, y, { width: col.wReserved, align: "right" });
    doc.text("Available", col.available, y, { width: col.wAvailable, align: "right" });
    doc.text("Status", col.status, y, { width: col.wStatus });
    y += headerH;
    doc
      .moveTo(PDF_MARGIN, y - 2)
      .lineTo(PDF_PAGE_WIDTH - PDF_MARGIN, y - 2)
      .strokeColor("#333333")
      .stroke();
    y += 4;
  };

  drawHeaderRow();
  doc.font("Helvetica").fontSize(7).fillColor("#000000");

  for (const row of items) {
    if (y + rowH > PDF_BOTTOM) {
      doc.addPage();
      y = PDF_MARGIN;
      drawHeaderRow();
      doc.font("Helvetica").fontSize(7);
    }

    const name = pdfTruncate(row.product?.name, 42);
    const sku = pdfTruncate(row.product?.sku, 16);
    doc.text(name, col.product, y, { width: col.wProduct });
    doc.text(sku, col.sku, y, { width: col.wSku });
    doc.text(String(row.quantity ?? 0), col.qty, y, { width: col.wQty, align: "right" });
    doc.text(String(row.reserved ?? 0), col.reserved, y, { width: col.wReserved, align: "right" });
    doc.text(String(row.available ?? 0), col.available, y, { width: col.wAvailable, align: "right" });
    doc.text(String(row.status ?? "—"), col.status, y, { width: col.wStatus });
    y += rowH;
  }

  doc.y = y;
}

function renderWarehousePdfBody(doc, warehouse, items) {
  doc.fontSize(16).text("Warehouse inventory export", { align: "center" });
  doc.moveDown(0.35);
  doc.fontSize(9).text(`Generated: ${new Date().toISOString()}`, { align: "center" });
  doc.moveDown(0.9);

  doc.fontSize(12).font("Helvetica-Bold").text(warehouse.name, { underline: false });
  doc.font("Helvetica").fontSize(9);
  doc.text(`${warehouse.location}`);
  doc.text(`${warehouse.address}`);
  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica-Bold").text("Inventory");
  doc.font("Helvetica").fontSize(8).fillColor("#444444");
  doc.text("Product, SKU, Qty, Reserved, Available, Status — same as the warehouse detail page table.");
  doc.fillColor("#000000");
  doc.moveDown(0.4);

  doc.x = PDF_MARGIN;
  drawInventoryPdfTable(doc, items);
}

async function loadWarehouseReportData(warehouseId) {
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) return null;

  const items = await InventoryItem.find({ warehouse: warehouseId })
    .populate("product")
    .sort({ updatedAt: -1 });

  return { warehouse, items };
}

/**
 * PDF as buffer (e.g. write to disk).
 */
export async function buildWarehousePdfBuffer(warehouseId) {
  const data = await loadWarehouseReportData(warehouseId);
  if (!data) return null;

  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);
    renderWarehousePdfBody(doc, data.warehouse, data.items);
    doc.end();
  });
}

/**
 * Simple PDF summary for printing / submission (HTTP response).
 */
export async function streamWarehousePdf(res, warehouseId) {
  const data = await loadWarehouseReportData(warehouseId);
  if (!data) {
    return false;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(data.warehouse.name.replace(/\s+/g, "_"))}_Report.pdf"`
  );

  const doc = new PDFDocument({ margin: 48, size: "A4" });
  doc.pipe(res);
  renderWarehousePdfBody(doc, data.warehouse, data.items);
  doc.end();
  return true;
}
