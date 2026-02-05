import express from "express";
import {
    deleteUser,
    updateUserProfile,
    getAllUsers,
    getUserById
} from "../controllers/user.js";

import {
    verifyUser,
    verifyAdmin
} from "../utils/verifyToken.js";

const router = express.Router();

// ✅ Update user (same user or admin)
router.put("/:id", verifyUser, updateUserProfile);

// ✅ Get all users (admin only)
router.get("/", verifyAdmin, getAllUsers);

// ✅ Get single user (same user or admin)
router.get("/:id", verifyUser, getUserById);

// ✅ Delete user (same user or admin)
router.delete("/:id", verifyUser, deleteUser);

export default router;
