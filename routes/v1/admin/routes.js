import { Router } from "express";
import jwt from "jsonwebtoken";
import Admin from "../../../models/Admin.js";
import { authMiddleware } from "../../../middleware/auth.js";
import { superAdminMiddleware } from "../../../middleware/superAdmin.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

let refreshTokens = [];

// === TOKEN UTILS ===
const generateAccessToken = (adminId) => {
  return jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (adminId) => {
  const token = jwt.sign({ id: adminId }, REFRESH_SECRET, { expiresIn: "7d" });
  refreshTokens.push(token);
  return token;
};

// ==========================
// 🔐 AUTH ROUTES
// ==========================

// Register
router.post("/register", async (req, res) => {
  try {
    const { profile_picture, firstname, middle_initial, lastname, username, email, password, isSuperAdmin } = req.body;

    const existing = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const admin = new Admin({
      profile_picture,
      firstname,
      middle_initial,
      lastname,
      username,
      email,
      password,
      isSuperAdmin,
    });

    await admin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (admin.status !== "active") {
      return res.status(403).json({ message: "Admin account is not active" });
    }

    const accessToken = generateAccessToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);

    res.json({ message: "Login successful", accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.userId).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh Token
router.post("/refresh", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Refresh token required" });
  if (!refreshTokens.includes(token)) return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(token, REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired refresh token" });

    const accessToken = generateAccessToken(decoded.id);
    res.json({ accessToken });
  });
});

// Logout
router.post("/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.json({ message: "Logged out successfully" });
});

// ==========================
// 📦 CRUD ROUTES (SuperAdmin only)
// ==========================

// Get All Admins
router.get("/", authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Admin by ID
router.get("/:id", authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Admin
router.put("/:id", authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const admin = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({ message: "Admin updated successfully", admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete (Deactivate) Admin
router.delete("/:id", authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, { status: "inactive" }, { new: true });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({ message: "Admin deactivated successfully", admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
