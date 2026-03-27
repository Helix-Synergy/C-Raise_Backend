// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { signup, login, createAdmin } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");

// Public
router.post("/signup", signup);
router.post("/login", login);
router.post("/create-admin", createAdmin);


// Protected (Employee + Admin)
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});
router.put("/change-password", protect, require("../controllers/authController").changePassword);

// Admin Only
router.get("/admin-dashboard", protect, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin Dashboard" });
});

module.exports = router;