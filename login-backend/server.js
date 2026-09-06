const express = require("express");
const cors = require("cors");

const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// User routes
app.use("/api/auth", authRoutes);


// Admin routes
app.use("/api/admin", adminRoutes);


// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Login backend is running",
  });
});


// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});