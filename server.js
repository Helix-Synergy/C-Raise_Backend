const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH"] },
});

// Attach io to app so controllers can use it
app.set("io", io);

// Company rooms — clients join their companyId room on connect
io.on("connection", (socket) => {
  socket.on("joinCompany", (companyId) => {
    socket.join(`company_${companyId}`);
    console.log(`Socket ${socket.id} joined company_${companyId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// DB Connection
const ConnectionDB = require("./config/db");
ConnectionDB();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));

// Health check
app.get("/", (req, res) => res.json({ status: "C-Raise API running 🚀" }));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
