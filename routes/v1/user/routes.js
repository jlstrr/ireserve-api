import { Router } from "express";
import User from "../../../models/User.js";
import { authMiddleware } from "../../../middleware/auth.js";
import { authorizeRoles } from "../../../middleware/authorize.js";

const router = Router();

// --- Get all users (admin only) ---
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find({ isDeleted: false }).select("-password -__v");
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// --- Get a user by ID (admin only) ---
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password -__v");
      if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// --- Update a user by ID (admin only) ---
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).select("-password -__v");

      if (!updatedUser) return res.status(404).json({ message: "User not found" });
      res.json(updatedUser);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// --- Soft delete a user by ID (admin only) ---
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndUpdate(
        req.params.id,
        { isDeleted: true },
        { new: true }
      ).select("-password -__v");

      if (!deletedUser) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted successfully", user: deletedUser });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
