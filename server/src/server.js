import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();

// Connect DB
await connectDB();

const app = express();

// ✅ BULLETPROOF CORS FIX
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
];

if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow if the origin is in our allowedOrigins list or if it's a vercel branch deployment
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
  })
);

// ✅ HANDLE PREFLIGHT (VERY IMPORTANT)
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Smart Warehouse API running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});