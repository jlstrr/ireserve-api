import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../../../models/User.js";
import { authMiddleware } from "../../../middleware/auth.js";

const router = Router();

// Secrets
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

// In-memory store for refresh tokens (👉 better to use Redis/DB in prod)
let refreshTokens = [];

// Generate Tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, user_type: user.user_type }, // include role
    JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (userId) => {
  const token = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: "7d" });
  refreshTokens.push(token);
  return token;
};

// --- Register ---
router.post("/register", async (req, res) => {
  try {
    const {
      id_number,
      firstname,
      middleInitial,
      lastname,
      program,
      email,
      user_type,
      password,
      remaining_time,
    } = req.body;

    const existing = await User.findOne({ id_number });
    if (existing) return res.status(400).json({ message: "User already exists" });

    if (user_type === "student" && (remaining_time === null || remaining_time === undefined)) {
      return res.status(400).json({ message: "Students must have remaining_time" });
    }

    const user = new User({
      id_number,
      firstname,
      middleInitial,
      lastname,
      program,
      email,
      user_type,
      password,
      remaining_time: user_type === "student" ? remaining_time : undefined,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Login (using id_number) ---
router.post("/login", async (req, res) => {
  try {
    const { id_number, password } = req.body;

    const user = await User.findOne({ id_number, isDeleted: false });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Profile (Protected) ---
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -__v");
    if (!user || user.isDeleted)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Refresh Token ---
router.post("/refresh", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Refresh token required" });
  if (!refreshTokens.includes(token))
    return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(token, REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired refresh token" });

    const accessToken = generateAccessToken(decoded.id);
    res.json({ accessToken });
  });
});

// --- Logout ---
router.post("/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.json({ message: "Logged out successfully" });
});

export default router;
