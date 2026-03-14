'use strict';
// ── Auth Middleware ────────────────────────────────
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requirePlan = (...plans) => (req, res, next) => {
  if (!plans.includes(req.user.plan)) {
    return res.status(403).json({ success: false, message: `This feature requires one of: ${plans.join(', ')} plan` });
  }
  next();
};

module.exports = { protect, requirePlan };
