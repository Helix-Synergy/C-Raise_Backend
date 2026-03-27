const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { adminOnly } = require("../middlewares/roleMiddleware");
const {
  createTicket,
  getMyTickets,
  getCompanyTickets,
  updateTicketStatus,
  getCompanyEmployees,
  addComment,
  assignTicket,
} = require("../controllers/ticketController");

// Common routes (authenticated)
router.post("/:id/comments", protect, addComment);   // Add comment to any ticket in company

// Employee routes (authenticated)
router.post("/", protect, createTicket);             // Raise ticket
router.get("/my", protect, getMyTickets);            // My tickets

// Admin routes (admin only)
router.get("/company", protect, adminOnly, getCompanyTickets);           // All company tickets
router.patch("/:id/status", protect, adminOnly, updateTicketStatus);    // Update status
router.patch("/:id/assign", protect, adminOnly, assignTicket);        // Assign to teammate
router.get("/employees", protect, adminOnly, getCompanyEmployees);       // Company employees

module.exports = router;
