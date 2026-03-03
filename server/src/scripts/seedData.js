import dotenv from "dotenv";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Warehouse } from "../models/Warehouse.js";
import { InventoryItem } from "../models/InventoryItem.js";

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/warehouse";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Product.deleteMany({});
    // await Warehouse.deleteMany({});
    // await InventoryItem.deleteMany({});

    // Create Warehouses
    const warehouses = [
      { name: "Warehouse A", location: "New York, NY", address: "123 Main St, New York, NY 10001" },
      { name: "Warehouse B", location: "Los Angeles, CA", address: "456 Broadway, Los Angeles, CA 90001" },
      { name: "Warehouse C", location: "Chicago, IL", address: "789 Michigan Ave, Chicago, IL 60601" },
      { name: "Warehouse D", location: "Houston, TX", address: "321 Commerce St, Houston, TX 77002" },
    ];

    const createdWarehouses = [];
    for (const wh of warehouses) {
      const existing = await Warehouse.findOne({ name: wh.name });
      if (existing) {
        console.log(`Warehouse "${wh.name}" already exists, skipping...`);
        createdWarehouses.push(existing);
      } else {
        const warehouse = await Warehouse.create(wh);
        createdWarehouses.push(warehouse);
        console.log(`✅ Created warehouse: ${warehouse.name}`);
      }
    }

    // Create Products
    const products = [
      {
        name: "iPhone 15 Pro",
        sku: "IPH15PRO-128",
        category: "Electronics",
        price: 999.99,
        status: "in-stock",
      },
      {
        name: "iPhone 15",
        sku: "IPH15-128",
        category: "Electronics",
        price: 799.99,
        status: "in-stock",
      },
      {
        name: "MacBook Air M3",
        sku: "MBA-M3-256",
        category: "Computers",
        price: 1299.99,
        status: "in-stock",
      },
      {
        name: "MacBook Pro 16",
        sku: "MBP-16-M3",
        category: "Computers",
        price: 2499.99,
        status: "in-stock",
      },
      {
        name: "iPad Pro 12.9",
        sku: "IPAD-PRO-128",
        category: "Tablets",
        price: 1099.99,
        status: "in-stock",
      },
      {
        name: "AirPods Pro",
        sku: "AIRPODS-PRO",
        category: "Audio",
        price: 249.99,
        status: "in-stock",
      },
      {
        name: "AirPods Max",
        sku: "AIRPODS-MAX",
        category: "Audio",
        price: 549.99,
        status: "low-stock",
      },
      {
        name: "Apple Watch Ultra",
        sku: "AW-ULTRA",
        category: "Wearables",
        price: 799.99,
        status: "in-stock",
      },
      {
        name: "Magic Keyboard",
        sku: "MK-PRO",
        category: "Accessories",
        price: 149.99,
        status: "low-stock",
      },
      {
        name: "Apple Pencil Pro",
        sku: "AP-PRO",
        category: "Accessories",
        price: 129.99,
        status: "in-stock",
      },
      {
        name: "Samsung Galaxy S24",
        sku: "SGS24-256",
        category: "Electronics",
        price: 899.99,
        status: "in-stock",
      },
      {
        name: "Dell XPS 15",
        sku: "Dell-XPS15",
        category: "Computers",
        price: 1799.99,
        status: "in-stock",
      },
      {
        name: "Sony WH-1000XM5",
        sku: "SONY-WH1000",
        category: "Audio",
        price: 399.99,
        status: "in-stock",
      },
      {
        name: "Logitech MX Master 3",
        sku: "LOG-MX3",
        category: "Accessories",
        price: 99.99,
        status: "in-stock",
      },
      {
        name: "Samsung 4K Monitor",
        sku: "SAM-4K-27",
        category: "Displays",
        price: 499.99,
        status: "in-stock",
      },
    ];

    const createdProducts = [];
    for (const prod of products) {
      const existing = await Product.findOne({ sku: prod.sku });
      if (existing) {
        console.log(`Product "${prod.name}" (${prod.sku}) already exists, skipping...`);
        createdProducts.push(existing);
      } else {
        const product = await Product.create(prod);
        createdProducts.push(product);
        console.log(`✅ Created product: ${product.name} (${product.sku})`);
      }
    }

    // Create Inventory Items
    const inventoryItems = [
      // iPhone 15 Pro in multiple warehouses
      {
        product: createdProducts.find((p) => p.sku === "IPH15PRO-128")._id,
        warehouse: createdWarehouses[0]._id, // Warehouse A
        quantity: 45,
        reserved: 5,
        available: 40,
        status: "optimal",
      },
      {
        product: createdProducts.find((p) => p.sku === "IPH15PRO-128")._id,
        warehouse: createdWarehouses[1]._id, // Warehouse B
        quantity: 25,
        reserved: 2,
        available: 23,
        status: "optimal",
      },
      // iPhone 15
      {
        product: createdProducts.find((p) => p.sku === "IPH15-128")._id,
        warehouse: createdWarehouses[0]._id,
        quantity: 60,
        reserved: 10,
        available: 50,
        status: "optimal",
      },
      // MacBook Air M3
      {
        product: createdProducts.find((p) => p.sku === "MBA-M3-256")._id,
        warehouse: createdWarehouses[0]._id,
        quantity: 30,
        reserved: 3,
        available: 27,
        status: "optimal",
      },
      {
        product: createdProducts.find((p) => p.sku === "MBA-M3-256")._id,
        warehouse: createdWarehouses[2]._id, // Warehouse C
        quantity: 20,
        reserved: 1,
        available: 19,
        status: "optimal",
      },
      // AirPods Max (low stock)
      {
        product: createdProducts.find((p) => p.sku === "AIRPODS-MAX")._id,
        warehouse: createdWarehouses[1]._id,
        quantity: 8,
        reserved: 0,
        available: 8,
        status: "low",
      },
      // Magic Keyboard (low stock)
      {
        product: createdProducts.find((p) => p.sku === "MK-PRO")._id,
        warehouse: createdWarehouses[0]._id,
        quantity: 5,
        reserved: 0,
        available: 5,
        status: "critical",
      },
      // iPad Pro
      {
        product: createdProducts.find((p) => p.sku === "IPAD-PRO-128")._id,
        warehouse: createdWarehouses[0]._id,
        quantity: 35,
        reserved: 5,
        available: 30,
        status: "optimal",
      },
      // AirPods Pro
      {
        product: createdProducts.find((p) => p.sku === "AIRPODS-PRO")._id,
        warehouse: createdWarehouses[1]._id,
        quantity: 50,
        reserved: 10,
        available: 40,
        status: "optimal",
      },
      // Apple Watch Ultra
      {
        product: createdProducts.find((p) => p.sku === "AW-ULTRA")._id,
        warehouse: createdWarehouses[2]._id,
        quantity: 25,
        reserved: 2,
        available: 23,
        status: "optimal",
      },
    ];

    for (const item of inventoryItems) {
      const existing = await InventoryItem.findOne({
        product: item.product,
        warehouse: item.warehouse,
      });
      if (!existing) {
        await InventoryItem.create(item);
        console.log(`✅ Created inventory item`);
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Seed data created successfully!");
    console.log(`📦 Created/Skipped ${createdProducts.length} products`);
    console.log(`🏢 Created/Skipped ${createdWarehouses.length} warehouses`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding data:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedData();
