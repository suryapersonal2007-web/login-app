const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

const JWT_SECRET = "your_secret_key_change_this";

// =====================================================
// ADMIN LOGIN
// POST /api/admin/login
// =====================================================

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error(err);

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

    // Check administrator
    if (!user.is_admin) {
      return res.status(403).json({
        message: "You are not an administrator",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        is_admin: true,
      },
      JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      message: "Admin login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        date_of_birth: user.date_of_birth,
        city: user.city,
        cgpa: user.cgpa,
        is_admin: true,
      },
    });
  });
});

// =====================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =====================================================

function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization token required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authorization token required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    if (!decoded.is_admin) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// =====================================================
// GET ALL USERS
// GET /api/admin/users
// =====================================================

router.get("/users", verifyAdmin, (req, res) => {
  const sql = `
    SELECT
      id,
      name,
      username,
      date_of_birth,
      city,
      cgpa,
      created_at,
      is_admin
    FROM users
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get users error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      users: results,
    });
  });
});

// =====================================================
// DOWNLOAD ALL USERS AS CSV
// GET /api/admin/users/download
// =====================================================

router.get("/users/download", verifyAdmin, (req, res) => {
  const sql = `
    SELECT
      username,
      date_of_birth,
      city,
      cgpa,
      created_at
    FROM users
    ORDER BY id ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Download users error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    }

    const totalUsers = results.length;

    // Safely escape CSV values
    const escapeCsv = (value) => {
      const text = value == null ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    let csv = "";

    // Total count
    csv += `Total Users,${totalUsers}\n`;
    csv += "\n";

    // Column headings
    csv +=
      "Username,Date of Birth,City,CGPA,Created Date\n";

    // User data
    results.forEach((user) => {
      let dob = "";

      if (user.date_of_birth) {
        const dateString = String(user.date_of_birth).substring(0, 10);
        const parts = dateString.split("-");

        if (parts.length === 3) {
          dob = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          dob = dateString;
        }
      }

      let createdDate = "";

      if (user.created_at) {
        createdDate = new Date(
          user.created_at
        ).toLocaleDateString("en-GB");
      }

      const cgpa =
        user.cgpa !== null &&
        user.cgpa !== undefined
          ? Number(user.cgpa).toFixed(2)
          : "";

      csv += [
        escapeCsv(user.username),
        escapeCsv(dob),
        escapeCsv(user.city),
        escapeCsv(cgpa),
        escapeCsv(createdDate),
      ].join(",");

      csv += "\n";
    });

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="users.csv"'
    );

    res.send(csv);
  });
});

// =====================================================
// CREATE USER
// POST /api/admin/users
// =====================================================

router.post("/users", verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      username,
      date_of_birth,
      city,
      cgpa,
      password,
      is_admin,
    } = req.body;

    // Required fields
    if (
      !name ||
      !username ||
      !date_of_birth ||
      !city ||
      cgpa === undefined ||
      cgpa === null ||
      cgpa === "" ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, username, date of birth, city, CGPA and password are required",
      });
    }

    // CGPA validation
    const cgpaNumber = Number(cgpa);

    if (
      Number.isNaN(cgpaNumber) ||
      cgpaNumber < 0 ||
      cgpaNumber > 10
    ) {
      return res.status(400).json({
        message: "CGPA must be between 0 and 10",
      });
    }

    // Username validation
    if (
      username.trim().length < 4 ||
      username.trim().length > 20
    ) {
      return res.status(400).json({
        message:
          "Username must be between 4 and 20 characters",
      });
    }

    // Password validation
    if (
      password.length < 8 ||
      password.length > 20
    ) {
      return res.status(400).json({
        message:
          "Password must be between 8 and 20 characters",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain an uppercase letter",
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain a lowercase letter",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain a number",
      });
    }

    if (!/[!@#$%^&*]/.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain a special character",
      });
    }

    // Check username
    const checkSql =
      "SELECT id FROM users WHERE username = ?";

    db.query(
      checkSql,
      [username.trim()],
      async (err, results) => {
        if (err) {
          console.error(
            "Check username error:",
            err
          );

          return res.status(500).json({
            message: "Database error",
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            message: "Username already exists",
          });
        }

        // Hash password
        const hashedPassword =
          await bcrypt.hash(password, 10);

        // Insert user
        const insertSql = `
          INSERT INTO users
          (
            name,
            username,
            date_of_birth,
            city,
            cgpa,
            password,
            is_admin
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [
            name.trim(),
            username.trim(),
            date_of_birth,
            city.trim(),
            cgpaNumber,
            hashedPassword,
            is_admin ? 1 : 0,
          ],
          (err, result) => {
            if (err) {
              console.error(
                "Create user error:",
                err
              );

              return res.status(500).json({
                message: "Failed to create user",
              });
            }

            res.status(201).json({
              message:
                "User created successfully",
              userId: result.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(
      "Admin create user error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// UPDATE USER
// PUT /api/admin/users/:id
// =====================================================

router.put(
  "/users/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        name,
        username,
        date_of_birth,
        city,
        cgpa,
        password,
        is_admin,
      } = req.body;

      const userId = req.params.id;

      // Required fields
      if (
        !name ||
        !name.trim() ||
        !username ||
        !username.trim() ||
        !date_of_birth ||
        !city ||
        !city.trim() ||
        cgpa === undefined ||
        cgpa === null ||
        cgpa === ""
      ) {
        return res.status(400).json({
          message:
            "Name, username, date of birth, city and CGPA are required",
        });
      }

      // CGPA validation
      const cgpaNumber = Number(cgpa);

      if (
        Number.isNaN(cgpaNumber) ||
        cgpaNumber < 0 ||
        cgpaNumber > 10
      ) {
        return res.status(400).json({
          message: "CGPA must be between 0 and 10",
        });
      }

      // Username validation
      if (
        username.trim().length < 4 ||
        username.trim().length > 20
      ) {
        return res.status(400).json({
          message:
            "Username must be between 4 and 20 characters",
        });
      }

      // Check duplicate username
      const duplicateSql = `
        SELECT id
        FROM users
        WHERE username = ?
        AND id != ?
      `;

      db.query(
        duplicateSql,
        [username.trim(), userId],
        async (err, results) => {
          if (err) {
            console.error(
              "Duplicate username error:",
              err
            );

            return res.status(500).json({
              message: "Database error",
            });
          }

          if (results.length > 0) {
            return res.status(409).json({
              message:
                "Username already exists",
            });
          }

          // Update with new password
          if (
            password &&
            password.trim() !== ""
          ) {
            if (
              password.length < 8 ||
              password.length > 20
            ) {
              return res.status(400).json({
                message:
                  "Password must be between 8 and 20 characters",
              });
            }

            if (!/[A-Z]/.test(password)) {
              return res.status(400).json({
                message:
                  "Password must contain an uppercase letter",
              });
            }

            if (!/[a-z]/.test(password)) {
              return res.status(400).json({
                message:
                  "Password must contain a lowercase letter",
              });
            }

            if (!/[0-9]/.test(password)) {
              return res.status(400).json({
                message:
                  "Password must contain a number",
              });
            }

            if (!/[!@#$%^&*]/.test(password)) {
              return res.status(400).json({
                message:
                  "Password must contain a special character",
              });
            }

            const hashedPassword =
              await bcrypt.hash(
                password,
                10
              );

            const sql = `
              UPDATE users
              SET
                name = ?,
                username = ?,
                date_of_birth = ?,
                city = ?,
                cgpa = ?,
                password = ?,
                is_admin = ?
              WHERE id = ?
            `;

            db.query(
              sql,
              [
                name.trim(),
                username.trim(),
                date_of_birth,
                city.trim(),
                cgpaNumber,
                hashedPassword,
                is_admin ? 1 : 0,
                userId,
              ],
              (err, result) => {
                if (err) {
                  console.error(
                    "Update user error:",
                    err
                  );

                  return res.status(500).json({
                    message:
                      "Failed to update user",
                  });
                }

                if (
                  result.affectedRows === 0
                ) {
                  return res.status(404).json({
                    message:
                      "User not found",
                  });
                }

                res.json({
                  message:
                    "User updated successfully",
                });
              }
            );
          } else {
            // Update without password
            const sql = `
              UPDATE users
              SET
                name = ?,
                username = ?,
                date_of_birth = ?,
                city = ?,
                cgpa = ?,
                is_admin = ?
              WHERE id = ?
            `;

            db.query(
              sql,
              [
                name.trim(),
                username.trim(),
                date_of_birth,
                city.trim(),
                cgpaNumber,
                is_admin ? 1 : 0,
                userId,
              ],
              (err, result) => {
                if (err) {
                  console.error(
                    "Update user error:",
                    err
                  );

                  return res.status(500).json({
                    message:
                      "Failed to update user",
                  });
                }

                if (
                  result.affectedRows === 0
                ) {
                  return res.status(404).json({
                    message:
                      "User not found",
                  });
                }

                res.json({
                  message:
                    "User updated successfully",
                });
              }
            );
          }
        }
      );
    } catch (error) {
      console.error(
        "Admin update error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// DELETE USER
// DELETE /api/admin/users/:id
// =====================================================

router.delete(
  "/users/:id",
  verifyAdmin,
  (req, res) => {
    const userId = req.params.id;

    // Prevent admin from deleting own account
    if (
      Number(userId) ===
      Number(req.admin.id)
    ) {
      return res.status(400).json({
        message:
          "You cannot delete your own admin account",
      });
    }

    const sql =
      "DELETE FROM users WHERE id = ?";

    db.query(
      sql,
      [userId],
      (err, result) => {
        if (err) {
          console.error(
            "Delete user error:",
            err
          );

          return res.status(500).json({
            message: "Database error",
          });
        }

        if (
          result.affectedRows === 0
        ) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        res.json({
          message:
            "User deleted successfully",
        });
      }
    );
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;