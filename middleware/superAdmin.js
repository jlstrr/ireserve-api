import Admin from "../models/Admin.js";

export const superAdminMiddleware = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.userId);

    if (!admin || !admin.isSuperAdmin) {
      return res.status(403).json({ message: "Access denied. Super Admin only." });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
