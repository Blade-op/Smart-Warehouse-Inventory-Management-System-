import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/warehouse";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@wareflow.com" });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt); // Default password

    const admin = await User.create({
      name: "Administrator",
      email: "admin@wareflow.com",
      password: hashedPassword,
      provider: "local",
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: admin@wareflow.com");
    console.log("🔑 Password: admin123");
    console.log("👤 Role: Administrator");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  Please change the password after first login!");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding admin:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
