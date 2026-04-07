import { InventoryItem } from "../models/InventoryItem.js";
import { Warehouse } from "../models/Warehouse.js";

export function computeInventoryStatus(quantity, available) {
  if (quantity <= 0 || available <= 0) return "out";
  if (available < 10) return "critical";
  if (available < 40) return "low";
  return "optimal";
}

export async function syncWarehouseTotalItems(warehouseId, session) {
  const agg = await InventoryItem.aggregate([
    { $match: { warehouse: warehouseId } },
    { $group: { _id: null, total: { $sum: "$quantity" } } },
  ]).session(session);
  const total = agg[0]?.total ?? 0;
  
  // Dynamically calculate capacity assuming a baseline max capacity of 100,000 items
  const maxCapacity = 100000;
  const capacity = Math.min(Math.round((total / maxCapacity) * 100), 100);

  await Warehouse.findByIdAndUpdate(warehouseId, { totalItems: total, capacity }, { session });
}
