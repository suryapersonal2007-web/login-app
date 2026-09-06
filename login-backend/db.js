const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Surya@2007",
  database: "loginDB",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:");
    console.error(err.message);
    return;
  }

  console.log("MySQL connected successfully");
});

module.exports = db;