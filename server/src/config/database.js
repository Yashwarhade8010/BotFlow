'use strict';
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'botflow',
  process.env.DB_USER     || 'root',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development'
      ? (sql) => logger.debug(sql)
      : false,
    pool: {
      max: 10, min: 0, acquire: 30000, idle: 10000,
    },
    define: {
      underscored: false,
      timestamps: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('✅ MySQL connected via Sequelize');

    // Sync all models (alter in dev, no-op in prod unless run migrate)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('📦 DB tables synced');
    } else {
      await sequelize.sync();
    }
  } catch (err) {
    logger.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
