import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    capacity: { type: Number, default: 0 }, // percentage 0-100
    totalItems: { type: Number, default: 0 },
    staff: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["operational", "maintenance", "offline"],
      default: "operational",
    },
    monthlyThroughput: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Warehouse = mongoose.model("Warehouse", warehouseSchema);


