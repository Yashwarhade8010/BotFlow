'use strict';
const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack }) =>
      `${timestamp} [${level.toUpperCase()}] ${stack || message}`)
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5 * 1024 * 1024,
    }),
  ],
});

module.exports = logger;
