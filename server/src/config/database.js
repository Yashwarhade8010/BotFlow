const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const isProduction = process.env.NODE_ENV === "production";

let sslConfig = {};
if (isProduction) {
  if (process.env.DB_SSL_CERT) {
    // Base64 cert from Render env variable
    sslConfig = {
      ssl: {
        ca: Buffer.from(process.env.DB_SSL_CERT, "base64").toString("utf-8"),
        rejectUnauthorized: true,
      },
    };
  } else if (fs.existsSync(path.join(__dirname, "ca.pem"))) {
    // Local ca.pem file
    sslConfig = {
      ssl: {
        ca: fs.readFileSync(path.join(__dirname, "ca.pem")),
        rejectUnauthorized: true,
      },
    };
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: sslConfig,
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    logger.info("✅ MySQL connected via Sequelize");
  } catch (err) {
    logger.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };