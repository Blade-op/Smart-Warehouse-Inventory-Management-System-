import { InventoryItem } from "../models/InventoryItem.js";

export const getInventory = async (req, res, next) => {
  try {
    const items = await InventoryItem.find()
      .populate("product")
      .populate("warehouse")
      .sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};


