const Ticket = require("../models/tickect");

// Employee: Raise a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, attachments } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    // AI/Auto Classification Logic (Simple keyword mapping)
    let category = "general";
    const content = (title + " " + description).toLowerCase();
    if (content.includes("password") || content.includes("login") || content.includes("access")) category = "Access/IT";
    else if (content.includes("hardware") || content.includes("laptop") || content.includes("printer")) category = "Hardware";
    else if (content.includes("salary") || content.includes("payroll") || content.includes("leave")) category = "HR/Payroll";
    else if (content.includes("network") || content.includes("wifi") || content.includes("internet")) category = "Networking";

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || "medium",
      category,
      attachments: attachments || [],
      user: req.user._id,
      companyId: req.user.companyId,
      status: "open",
    });

    // Prepare enriched ticket for real-time notification
    const ticketWithUser = {
      ...ticket.toObject(),
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    };

    // Emit real-time event to admin room for this company
    const io = req.app.get("io");
    if (io) {
      io.to(`company_${req.user.companyId}`).emit("newTicket", ticketWithUser);
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Employee: Get own tickets
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all tickets for their company
exports.getCompanyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ companyId: req.user.companyId })
      .populate("user", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,  // company isolation guard
    });

    if (!ticket)
      return res.status(404).json({ message: "Ticket not found or access denied" });

    if (status) ticket.status = status;
    if (adminReply !== undefined) ticket.adminReply = adminReply;
    
    await ticket.save();

    // Emit status update to company room
    const io = req.app.get("io");
    if (io) {
      io.to(`company_${req.user.companyId}`).emit("ticketUpdated", ticket);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get employees of their company
exports.getCompanyEmployees = async (req, res) => {
  try {
    const User = require("../models/user");
    const employees = await User.find({ companyId: req.user.companyId })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Add comment to ticket
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findOne({ _id: req.params.id, companyId: req.user.companyId });
    
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    
    ticket.comments.push({
      user: req.user._id,
      text
    });
    
    await ticket.save();
    
    const enrichedTicket = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email");

    const io = req.app.get("io");
    if (io) {
      io.to(`company_${req.user.companyId}`).emit("ticketUpdated", enrichedTicket);
    }

    res.json(enrichedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Assign ticket to employee
exports.assignTicket = async (req, res) => {
  try {
    const { userId } = req.body;
    const ticket = await Ticket.findOne({ _id: req.params.id, companyId: req.user.companyId });
    
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    
    ticket.assignedTo = userId;
    await ticket.save();
    
    const enrichedTicket = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email");

    const io = req.app.get("io");
    if (io) {
      io.to(`company_${req.user.companyId}`).emit("ticketUpdated", enrichedTicket);
    }

    res.json(enrichedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
