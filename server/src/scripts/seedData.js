import dotenv from "dotenv";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Warehouse } from "../models/Warehouse.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { Order } from "../models/Order.js";

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/warehouse";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    await InventoryItem.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await Warehouse.deleteMany({});
    console.log("Cleared warehouses, products, inventory, and orders.\n");

    const warehousesData = [
      {
        name: "Delhi warehouse",
        location: "Delhi, India",
        address: "Plot 12, Industrial Area Phase II, Okhla, New Delhi, Delhi 110020",
        capacity: 78,
        staff: 32,
        monthlyThroughput: 9200,
        status: "operational",
      },
      {
        name: "Mumbai warehouse",
        location: "Mumbai, India",
        address: "Unit 4B, MIDC Logistics Park, Taloja, Navi Mumbai, Maharashtra 410208",
        capacity: 85,
        staff: 41,
        monthlyThroughput: 12400,
        status: "operational",
      },
      {
        name: "Pune warehouse",
        location: "Pune, India",
        address: "Gate 7, Chakan Industrial Area, Pune, Maharashtra 410501",
        capacity: 68,
        staff: 24,
        monthlyThroughput: 7100,
        status: "operational",
      },
      {
        name: "Hyderabad warehouse",
        location: "Hyderabad, India",
        address: "Survey No. 88, Shamshabad Logistics Zone, Hyderabad, Telangana 501218",
        capacity: 72,
        staff: 28,
        monthlyThroughput: 8800,
        status: "operational",
      },
    ];

    const createdWarehouses = await Warehouse.insertMany(warehousesData);
    createdWarehouses.forEach((w) => console.log(`Created warehouse: ${w.name}`));

    const [delhi, mumbai, pune, hyderabad] = createdWarehouses;

    const products = [
      { name: "Plush Teddy Bear (Large)", sku: "TOY-PLUSH-BEAR-L", category: "Plush Toys", price: 599, status: "in-stock" },
      { name: "RC Rally Car 1:16", sku: "TOY-RC-RALLY-16", category: "RC Vehicles", price: 1299, status: "in-stock" },
      { name: "Building Blocks 100 Pieces", sku: "TOY-BLOCK-100", category: "Building Sets", price: 449, status: "in-stock" },
      { name: "Fashion Doll Studio Set", sku: "TOY-DOLL-STUDIO", category: "Dolls", price: 899, status: "in-stock" },
      { name: "Brick City Airport Playset", sku: "TOY-BRICK-CITY", category: "Building Sets", price: 1599, status: "low-stock" },
      { name: "Jungle Adventure Puzzle 500pc", sku: "TOY-PZL-JUNGLE", category: "Board Games", price: 349, status: "in-stock" },
      { name: "Wooden Train & Track Set", sku: "TOY-WOOD-TRAIN", category: "Wooden Toys", price: 799, status: "in-stock" },
      { name: "Superhero Action Figure 12\"", sku: "TOY-ACT-HERO-12", category: "Action Figures", price: 399, status: "in-stock" },
      { name: "Snakes & Ladders Classic", sku: "TOY-BG-SNL", category: "Board Games", price: 199, status: "in-stock" },
      { name: "Soft Foam Blaster Set", sku: "TOY-FOAM-SHOOT", category: "Outdoor Play", price: 649, status: "in-stock" },
      { name: "Mini Piano 25 Keys", sku: "TOY-KEY-MINI-25", category: "Musical Toys", price: 1199, status: "in-stock" },
      { name: "Doctor Dress-Up Play Kit", sku: "TOY-PLAY-DOC", category: "Role Play", price: 549, status: "in-stock" },
      { name: "Die-cast Cars 5-Pack", sku: "TOY-DIE-5PK", category: "Vehicles", price: 699, status: "in-stock" },
      { name: "Puzzle Cube 3x3", sku: "TOY-RUBIK-3", category: "Puzzles", price: 299, status: "in-stock" },
      { name: "STEM Robot Building Kit", sku: "TOY-STEM-BOT", category: "Educational", price: 2299, status: "low-stock" },
      { name: "Friction Monster Truck", sku: "TOY-TRUCK-MON", category: "Vehicles", price: 449, status: "in-stock" },
      { name: "Door Basketball Hoop Set", sku: "TOY-BB-HOOP", category: "Sports Toys", price: 899, status: "in-stock" },
      { name: "Light-Up Yo-Yo Pro", sku: "TOY-YOYO-PRO", category: "Classic Toys", price: 249, status: "in-stock" },
      { name: "Stacking Rings Baby Toy", sku: "TOY-BABY-RINGS", category: "Infant Toys", price: 329, status: "in-stock" },
      { name: "Kitchen Playset 22 Pieces", sku: "TOY-KITCHEN-22", category: "Role Play", price: 1399, status: "in-stock" },
    ];

    const createdProducts = await Product.insertMany(products);
    createdProducts.forEach((p) => console.log(`Created product: ${p.name} (${p.sku})`));

    const bySku = (sku) => createdProducts.find((p) => p.sku === sku);

    const inventoryRows = [
      { sku: "TOY-PLUSH-BEAR-L", warehouse: delhi, quantity: 180, reserved: 12, status: "optimal" },
      { sku: "TOY-PLUSH-BEAR-L", warehouse: mumbai, quantity: 95, reserved: 5, status: "optimal" },
      { sku: "TOY-RC-RALLY-16", warehouse: mumbai, quantity: 72, reserved: 4, status: "optimal" },
      { sku: "TOY-RC-RALLY-16", warehouse: hyderabad, quantity: 48, reserved: 2, status: "optimal" },
      { sku: "TOY-BLOCK-100", warehouse: delhi, quantity: 240, reserved: 20, status: "optimal" },
      { sku: "TOY-BLOCK-100", warehouse: pune, quantity: 160, reserved: 10, status: "optimal" },
      { sku: "TOY-DOLL-STUDIO", warehouse: mumbai, quantity: 110, reserved: 8, status: "optimal" },
      { sku: "TOY-DOLL-STUDIO", warehouse: pune, quantity: 65, reserved: 3, status: "optimal" },
      { sku: "TOY-BRICK-CITY", warehouse: delhi, quantity: 22, reserved: 2, status: "low" },
      { sku: "TOY-BRICK-CITY", warehouse: hyderabad, quantity: 14, reserved: 0, status: "critical" },
      { sku: "TOY-PZL-JUNGLE", warehouse: pune, quantity: 130, reserved: 6, status: "optimal" },
      { sku: "TOY-WOOD-TRAIN", warehouse: delhi, quantity: 88, reserved: 4, status: "optimal" },
      { sku: "TOY-WOOD-TRAIN", warehouse: mumbai, quantity: 52, reserved: 2, status: "optimal" },
      { sku: "TOY-ACT-HERO-12", warehouse: hyderabad, quantity: 200, reserved: 15, status: "optimal" },
      { sku: "TOY-ACT-HERO-12", warehouse: delhi, quantity: 75, reserved: 5, status: "optimal" },
      { sku: "TOY-BG-SNL", warehouse: pune, quantity: 310, reserved: 25, status: "optimal" },
      { sku: "TOY-FOAM-SHOOT", warehouse: mumbai, quantity: 140, reserved: 10, status: "optimal" },
      { sku: "TOY-KEY-MINI-25", warehouse: hyderabad, quantity: 36, reserved: 2, status: "low" },
      { sku: "TOY-PLAY-DOC", warehouse: delhi, quantity: 125, reserved: 8, status: "optimal" },
      { sku: "TOY-DIE-5PK", warehouse: pune, quantity: 98, reserved: 6, status: "optimal" },
      { sku: "TOY-DIE-5PK", warehouse: hyderabad, quantity: 84, reserved: 4, status: "optimal" },
      { sku: "TOY-RUBIK-3", warehouse: mumbai, quantity: 420, reserved: 30, status: "optimal" },
      { sku: "TOY-STEM-BOT", warehouse: delhi, quantity: 18, reserved: 1, status: "low" },
      { sku: "TOY-STEM-BOT", warehouse: mumbai, quantity: 12, reserved: 0, status: "critical" },
      { sku: "TOY-TRUCK-MON", warehouse: pune, quantity: 175, reserved: 12, status: "optimal" },
      { sku: "TOY-BB-HOOP", warehouse: hyderabad, quantity: 55, reserved: 4, status: "optimal" },
      { sku: "TOY-YOYO-PRO", warehouse: delhi, quantity: 260, reserved: 18, status: "optimal" },
      { sku: "TOY-BABY-RINGS", warehouse: mumbai, quantity: 190, reserved: 10, status: "optimal" },
      { sku: "TOY-KITCHEN-22", warehouse: hyderabad, quantity: 62, reserved: 3, status: "optimal" },
      { sku: "TOY-KITCHEN-22", warehouse: pune, quantity: 44, reserved: 2, status: "optimal" },
    ];

    for (const row of inventoryRows) {
      const product = bySku(row.sku);
      if (!product) continue;
      const { quantity, reserved, status, warehouse } = row;
      const available = quantity - reserved;
      await InventoryItem.create({
        product: product._id,
        warehouse: warehouse._id,
        quantity,
        reserved,
        available,
        status,
      });
      console.log(`Inventory: ${row.sku} @ ${warehouse.name} (qty ${quantity})`);
    }

    for (const wh of createdWarehouses) {
      const agg = await InventoryItem.aggregate([
        { $match: { warehouse: wh._id } },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]);
      const totalItems = agg[0]?.total ?? 0;
      await Warehouse.findByIdAndUpdate(wh._id, { totalItems });
    }

    const sampleOrders = [
      {
        orderNumber: "TOY-ORD-2025-1001",
        status: "processing",
        items: [
          { product: bySku("TOY-BLOCK-100")._id, quantity: 48, price: 449 },
          { product: bySku("TOY-RUBIK-3")._id, quantity: 24, price: 299 },
        ],
        warehouse: delhi._id,
        totalAmount: 48 * 449 + 24 * 299,
      },
      {
        orderNumber: "TOY-ORD-2025-1002",
        status: "shipped",
        items: [{ product: bySku("TOY-PLUSH-BEAR-L")._id, quantity: 60, price: 599 }],
        warehouse: mumbai._id,
        totalAmount: 60 * 599,
      },
      {
        orderNumber: "TOY-ORD-2025-1003",
        status: "pending",
        items: [
          { product: bySku("TOY-RC-RALLY-16")._id, quantity: 15, price: 1299 },
          { product: bySku("TOY-FOAM-SHOOT")._id, quantity: 30, price: 649 },
        ],
        warehouse: hyderabad._id,
        totalAmount: 15 * 1299 + 30 * 649,
      },
      {
        orderNumber: "TOY-ORD-2025-1004",
        status: "completed",
        items: [{ product: bySku("TOY-BG-SNL")._id, quantity: 100, price: 199 }],
        warehouse: pune._id,
        totalAmount: 100 * 199,
      },
    ];

    await Order.insertMany(sampleOrders);
    console.log(`\nCreated ${sampleOrders.length} sample orders.`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Seed complete: toy manufacturing demo data");
    console.log(`Warehouses: ${createdWarehouses.length} | Products: ${createdProducts.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding data:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
