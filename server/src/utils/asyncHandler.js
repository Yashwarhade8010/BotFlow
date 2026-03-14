'use strict';
const logger = require('./logger');
// ── asyncHandler ───────────────────────────────────
module.exports = fn => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(err => {
    logger.error('AsyncHandler caught: ' + err.message + '\n' + err.stack);
    next(err);
  });

