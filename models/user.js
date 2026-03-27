// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Employee"
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true 
    },
password: {
  type: String,
  required: true
},
    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyDetails",
      required: true,
      index: true 
    },
    department: {
      type: String,
      default: "General"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserDetails", userSchema);