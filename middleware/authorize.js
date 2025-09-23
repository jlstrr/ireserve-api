export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};
