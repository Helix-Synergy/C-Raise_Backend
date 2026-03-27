// seed.js — Run once: node seed.js
// Creates companies and their admin accounts
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const Company = require("./models/company");
const User = require("./models/user");

const companies = [
  { name: "Helix",   domain: "helix.com" },
  { name: "Infosys", domain: "infosys.com" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  for (const comp of companies) {
    // Upsert company
    let company = await Company.findOne({ name: comp.name });
    if (!company) {
      company = await Company.create(comp);
      console.log(`🏢 Created company: ${comp.name}  (id: ${company._id})`);
    } else {
      console.log(`🏢 Company exists: ${comp.name}  (id: ${company._id})`);
    }

    // Admin email pattern: admin@companyname  (lowercase)
    const email = `admin@${comp.name.toLowerCase()}`;
    const existing = await User.findOne({ email });

    if (!existing) {
      const hashed = await bcrypt.hash("admin", 10);
      await User.create({
        name: `${comp.name} Admin`,
        email,
        password: hashed,
        role: "admin",
        companyId: company._id,
      });
      console.log(`👤 Admin created → email: ${email}  | password: admin`);
    } else {
      console.log(`👤 Admin exists  → ${email}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n🎉 Seed complete!\n");
  console.log("Login credentials:");
  companies.forEach(c =>
    console.log(`  ${c.name}: admin@${c.name.toLowerCase()} / admin`)
  );
}

seed().catch((e) => { console.error(e); process.exit(1); });
