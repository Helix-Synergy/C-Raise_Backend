const User = require("../models/user");
const Company = require("../models/company");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// SIGNUP: Auto-detects company from email domain
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !email.includes("@")) return res.status(400).json({ message: "Invalid email" });

    const companyDomain = email.split("@")[1]?.toLowerCase();
    if (!companyDomain) return res.status(400).json({ message: "Invalid domain" });

    // Check Case-insensitive Company
    const company = await Company.findOne({
      name: { $regex: new RegExp(`^${companyDomain}$`, "i") },
    });
    
    if (!company) {
      return res.status(404).json({
        message: `Company '${companyDomain}' not found. Admin must login as admin@${companyDomain} first.`,
      });
    }

    const emailLow = email.toLowerCase();
    const existingUser = await User.findOne({ email: emailLow });
    if (existingUser) return res.status(400).json({ message: "User exists with this email" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name || "Employee",
      email: emailLow,
      password: hashedPassword,
      role: "employee",
      companyId: company._id,
    });

    console.log(`👤 Registered: ${emailLow} for Company: ${companyDomain}`);

    res.status(201).json({
      message: "Success",
      token: generateToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: companyDomain,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN: Universal Admin + Standard Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const emailLow = email.toLowerCase();

    // --- CASE 1: Universal Admin (admin@company with password admin) ---
    if (emailLow.startsWith("admin@") && password === "admin") {
      const companyDomain = emailLow.split("@")[1];
      if (!companyDomain) return res.status(400).json({ message: "Invalid admin format" });

      // Find or Create Company using domain (always lowercase)
      let company = await Company.findOne({
        name: { $regex: new RegExp(`^${companyDomain}$`, "i") },
      });
      if (!company) {
        company = await Company.create({ name: companyDomain, domain: companyDomain });
        console.log(`🏢 Universal-Admin: Created NEW company - ${companyDomain}`);
      }

      // Check for Existing User with this email
      let admin = await User.findOne({ email: emailLow });
      
      if (!admin) {
        // Create new admin
        const hashedAdminPassword = await bcrypt.hash("admin", 10);
        admin = await User.create({
          name: `${companyDomain} Admin`,
          email: emailLow,
          password: hashedAdminPassword,
          role: "admin",
          companyId: company._id,
        });
        console.log(`🛡️ Created NEW admin: ${emailLow}`);
      } else {
        // Upgrade existing user and ensure the correct company record
        admin.role = "admin";
        admin.companyId = company._id;
        await admin.save();
        console.log(`🛡️ Logged in/Upgraded admin: ${emailLow}`);
      }

      return res.json({
        message: "Admin Successful",
        token: generateToken(admin),
        user: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          companyId: admin.companyId,
          companyName: companyDomain,
        },
      });
    }

    // --- CASE 2: Standard Login ---
    const user = await User.findOne({ email: emailLow });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login Successful",
      token: generateToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.email.split("@")[1]?.toLowerCase() || "N/A",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE-ADMIN: Manual Admin Creation
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !email.includes("@")) return res.status(400).json({ message: "Invalid email" });

    const domain = email.split("@")[1]?.toLowerCase();
    
    // Find or Create Company using domain
    let company = await Company.findOne({
      name: { $regex: new RegExp(`^${domain}$`, "i") },
    });
    if (!company) {
      company = await Company.create({ name: domain, domain: domain });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name: name || `${domain} Admin`,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      companyId: company._id, // Mapping the domain to companyId as per schema
    });

    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};