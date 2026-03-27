// middleware/roleMiddleware.js

// Only Admin can access
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only."
    });
  }
  next();
};