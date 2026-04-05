import dotenv from "dotenv";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Warehouse } from "../models/Warehouse.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Order } from "../models/Order.js";
import { parseDelhiLines, mapPdfStatus, guessCategory, priceFromSku } from "../data/parseDelhiLines.js";
import { computeInventoryStatus, syncWarehouseTotalItems } from "../utils/inventorySync.js";

dotenv.config();

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

function productStatusFromQty(qty) {
  if (qty <= 0) return "out-of-stock";
  if (qty < 25) return "low-stock";
  return "in-stock";
}

async function seed() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/warehouse";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  await InventoryItem.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
  console.log("Cleared products, inventory, orders.");

  const delhiRows = parseDelhiLines();
  if (delhiRows.length !== 300) {
    console.warn(`Expected 300 Delhi rows, got ${delhiRows.length}`);
  }

  const products = [];
  for (const row of delhiRows) {
    const price = priceFromSku(row.sku);
    const category = guessCategory(row.name);
    products.push(
      await Product.create({
        name: row.name,
        sku: row.sku,
        category,
        price,
        status: productStatusFromQty(row.quantity),
      })
    );
  }
  console.log(`Created ${products.length} products.`);

  const whDelhi = await Warehouse.findOne({ name: /^Delhi warehouse$/i });
  const whMumbai = await Warehouse.findOne({ name: /^Mumbai warehouse$/i });
  const whPune = await Warehouse.findOne({ name: /^Pune warehouse$/i });
  const whHyd = await Warehouse.findOne({ name: /^Hyderabad warehouse$/i });
  if (!whDelhi || !whMumbai || !whPune || !whHyd) {
    throw new Error("Missing one of the four warehouses. Run seed:data or create warehouses first.");
  }

  for (const row of delhiRows) {
    const p = products.find((x) => x.sku === row.sku);
    const status = mapPdfStatus(row.statusRaw);
    await InventoryItem.create({
      product: p._id,
      warehouse: whDelhi._id,
      quantity: row.quantity,
      reserved: row.reserved,
      available: row.available,
      status,
    });
  }
  console.log(`Delhi: ${delhiRows.length} inventory lines (from PDF).`);

  const other = [
    { wh: whMumbai, seed: 10101 },
    { wh: whPune, seed: 20202 },
    { wh: whHyd, seed: 30303 },
  ];

  for (const { wh, seed } of other) {
    const rng = mulberry32(seed);
    const lineCount = randInt(250, 300, rng);
    const indices = shuffle(
      [...Array(products.length).keys()],
      rng
    ).slice(0, lineCount);

    for (const idx of indices) {
      const p = products[idx];
      const quantity = randInt(25, 400, rng);
      let reserved = randInt(0, Math.floor(quantity * 0.22), rng);
      reserved = Math.min(reserved, Math.max(0, quantity - 1));
      const available = quantity - reserved;
      const status = computeInventoryStatus(quantity, available);
      await InventoryItem.create({
        product: p._id,
        warehouse: wh._id,
        quantity,
        reserved,
        available,
        status,
      });
    }
    console.log(`${wh.name}: ${lineCount} random inventory lines.`);
  }

  for (const wh of [whDelhi, whMumbai, whPune, whHyd]) {
    await syncWarehouseTotalItems(wh._id);
  }

  await Order.insertMany([
    {
      orderNumber: "TOY-ORD-DEL-5001",
      status: "processing",
      items: [
        { product: products[0]._id, quantity: 12, price: products[0].price },
        { product: products[5]._id, quantity: 6, price: products[5].price },
      ],
      warehouse: whDelhi._id,
      totalAmount: 12 * products[0].price + 6 * products[5].price,
    },
    {
      orderNumber: "TOY-ORD-MUM-5002",
      status: "shipped",
      items: [{ product: products[10]._id, quantity: 40, price: products[10].price }],
      warehouse: whMumbai._id,
      totalAmount: 40 * products[10].price,
    },
    {
      orderNumber: "TOY-ORD-PUN-5003",
      status: "pending",
      items: [{ product: products[20]._id, quantity: 18, price: products[20].price }],
      warehouse: whPune._id,
      totalAmount: 18 * products[20].price,
    },
    {
      orderNumber: "TOY-ORD-HYD-5004",
      status: "completed",
      items: [{ product: products[30]._id, quantity: 22, price: products[30].price }],
      warehouse: whHyd._id,
      totalAmount: 22 * products[30].price,
    },
  ]);
  console.log("Inserted sample orders.");

  console.log("\nDone. Delhi uses PDF data; other warehouses have 250–300 random lines each.");
  await mongoose.connection.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
