'use strict';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, businessName, phone } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) return error(res, 'Email already registered', 409);

  const verifyToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    firstName, lastName, email, password, businessName, phone,
    emailVerifyToken: crypto.createHash('sha256').update(verifyToken).digest('hex'),
  });

  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  logger.info(`New user registered: ${email}`);
  return created(res, {
    accessToken, refreshToken,
    user: user.toPublic(),
  }, 'Account created successfully');
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.matchPassword(password))) {
    return error(res, 'Invalid email or password', 401);
  }
  if (!user.isActive) return error(res, 'Account deactivated. Contact support.', 403);

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  logger.info(`User logged in: ${email}`);
  return success(res, {
    accessToken, refreshToken,
    user: user.toPublic(),
  }, 'Logged in successfully');
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return error(res, 'Refresh token required', 400);
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) return error(res, 'Invalid refresh token', 401);
    return success(res, { accessToken: user.generateAccessToken() });
  } catch {
    return error(res, 'Invalid or expired refresh token', 401);
  }
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) return success(res, {}, 'If that email exists, a reset link has been sent');

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // In production send email. Here just return token for testing
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  logger.info(`Password reset link: ${resetUrl}`);

  return success(res, {}, 'Reset link sent if email exists');
});

// POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    where: {
      passwordResetToken: hashed,
    },
  });
  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    return error(res, 'Invalid or expired reset token', 400);
  }

  user.password = req.body.password;
  user.passwordResetToken   = null;
  user.passwordResetExpires = null;
  await user.save();

  return success(res, { accessToken: user.generateAccessToken() }, 'Password reset successful');
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  return success(res, { user: user.toPublic() });
});

module.exports = { register, login, refresh, forgotPassword, resetPassword, getMe };
