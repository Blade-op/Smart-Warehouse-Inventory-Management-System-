import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    quantity: { type: Number, required: true },
    reserved: { type: Number, default: 0 },
    available: { type: Number, required: true },
    status: {
      type: String,
      enum: ["optimal", "low", "critical", "out"],
      default: "optimal",
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);


