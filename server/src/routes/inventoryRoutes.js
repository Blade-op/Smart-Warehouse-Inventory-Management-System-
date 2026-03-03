import express from "express";
import { getInventory } from "../controllers/inventoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getInventory);

export default router;


