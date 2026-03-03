import express from "express";
import { getUsers, createUser, updateUserRole, deleteUser } from "../controllers/userController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require admin access
router.get("/", protect, authorizeRoles("admin"), getUsers);
router.post("/", protect, authorizeRoles("admin"), createUser);
router.patch("/:id/role", protect, authorizeRoles("admin"), updateUserRole);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

export default router;


