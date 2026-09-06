const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

// =====================================================
// REGISTER API
// POST /api/auth/register
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      username,
      date_of_birth,
      city,
      password,
    } = req.body;

    // -------------------------
    // Check required fields
    // -------------------------

    if (!name || !username || !date_of_birth || !city || !password) {
      return res.status(400).json({
        message: "Name, username, date of birth, city and password are required",
      });
    }

    // -------------------------
    // Username validation
    // -------------------------

    if (username.length < 4 || username.length > 20) {
      return res.status(400).json({
        message: "Username must be between 4 and 20 characters",
      });
    }

    // -------------------------
    // Password validation
    // -------------------------

    if (password.length < 8 || password.length > 20) {
      return res.status(400).json({
        message: "Password must be between 8 and 20 characters",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain an uppercase letter",
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain a lowercase letter",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain a number",
      });
    }

    if (!/[!@#$%^&*]/.test(password)) {
      return res.status(400).json({
        message: "Password must contain a special character",
      });
    }

    // -------------------------
    // Check existing username
    // -------------------------

    const checkUserSql =
      "SELECT id FROM users WHERE username = ?";

    db.query(checkUserSql, [username], async (err, results) => {
      if (err) {
        console.error("Database error:", err);

        return res.status(500).json({
          message: "Database error",
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }

      // -------------------------
      // Hash password
      // -------------------------

      const hashedPassword = await bcrypt.hash(password, 10);

      // -------------------------
      // Insert user
      // -------------------------

      const insertSql = `
        INSERT INTO users
        (name, username, date_of_birth, city, password)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          name.trim(),
          username.trim(),
          date_of_birth,
          city.trim(),
          hashedPassword,
        ],
        (err, result) => {
          if (err) {
            console.error("Insert error:", err);

            return res.status(500).json({
              message: "Failed to create user",
            });
          }

          res.status(201).json({
            message: "User registered successfully",
            userId: result.insertId,
          });
        }
      );
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// LOGIN API
// POST /api/auth/login
// =====================================================

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // -------------------------
  // Check required fields
  // -------------------------

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  // -------------------------
  // Find user
  // -------------------------

  const sql =
    "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("Database error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const user = results[0];

    // -------------------------
    // Compare password
    // -------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // -------------------------
    // Login successful
    // -------------------------

    res.status(200).json({
      message: "Login successful",

      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        date_of_birth: user.date_of_birth,
        city: user.city,
        is_admin: user.is_admin,
      },
    });
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;