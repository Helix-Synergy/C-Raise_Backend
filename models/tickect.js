const mongoose = require("mongoose");
const ticketSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyDetails",
      index: true
    },
    status: {
      type: String,
      enum: ["open","inprogress", "closed", "rejected"],
      default: "open"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    category: {
      type: String,
      default: "general" // For AI classification later
    },
    attachments: [String], // Array of URLs
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserDetails"
    },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "UserDetails" },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    adminReply: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TicketDetails", ticketSchema);