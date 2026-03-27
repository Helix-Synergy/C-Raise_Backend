const mongoose = require('mongoose');

async function ConnectionDB() {
  try {
    const Connection = await mongoose.connect(process.env.MONGODB_URI);
    if (Connection) {
      console.log("✅ Connected to the Database");
    }
  } catch (error) {
    console.error(`❌ MONGODB Connection Failed: ${error.message}`);
    console.log("⚠️ Server will stay alive but database operations will fail until fixed.");
    // removed process.exit(1) to let the server start for debugging
  }
}

module.exports = ConnectionDB;