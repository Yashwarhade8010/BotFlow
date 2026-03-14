'use strict';
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName:    { type: DataTypes.STRING(50),  allowNull: false },
  lastName:     { type: DataTypes.STRING(50),  allowNull: false },
  email:        { type: DataTypes.STRING(255), allowNull: false, unique: true,
                  validate: { isEmail: true } },
  password:     { type: DataTypes.STRING(255), allowNull: false },
  businessName: { type: DataTypes.STRING(100) },
  phone:        { type: DataTypes.STRING(30) },
  avatar:       { type: DataTypes.STRING(500) },
  role:         { type: DataTypes.ENUM('user','admin'), defaultValue: 'user' },
  plan:         { type: DataTypes.ENUM('free','starter','growth','enterprise'), defaultValue: 'free' },
  planExpiresAt:{ type: DataTypes.DATE },
  stripeCustomerId:     { type: DataTypes.STRING(100) },
  stripeSubscriptionId: { type: DataTypes.STRING(100) },
  emailVerified:        { type: DataTypes.BOOLEAN, defaultValue: false },
  emailVerifyToken:     { type: DataTypes.STRING(255) },
  passwordResetToken:   { type: DataTypes.STRING(255) },
  passwordResetExpires: { type: DataTypes.DATE },
  lastLoginAt:          { type: DataTypes.DATE },
  isActive:             { type: DataTypes.BOOLEAN, defaultValue: true },
  // Usage tracking (reset monthly)
  conversationsThisMonth: { type: DataTypes.INTEGER, defaultValue: 0 },
  messagesThisMonth:      { type: DataTypes.INTEGER, defaultValue: 0 },
  usageResetAt:           { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
    },
  },
});

// Instance methods
User.prototype.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

User.prototype.generateAccessToken = function() {
  return jwt.sign(
    { id: this.id, role: this.role, plan: this.plan },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

User.prototype.generateRefreshToken = function() {
  return jwt.sign(
    { id: this.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

User.prototype.getPlanLimits = function() {
  const limits = {
    free:       { bots: 1,        conversations: 100,      knowledgeMB: 2   },
    starter:    { bots: 1,        conversations: 500,      knowledgeMB: 10  },
    growth:     { bots: 3,        conversations: 5000,     knowledgeMB: 100 },
    enterprise: { bots: Infinity, conversations: Infinity, knowledgeMB: Infinity },
  };
  return limits[this.plan] || limits.free;
};

User.prototype.toPublic = function() {
  return {
    id: this.id, firstName: this.firstName, lastName: this.lastName,
    email: this.email, businessName: this.businessName, phone: this.phone,
    plan: this.plan, role: this.role, emailVerified: this.emailVerified,
    lastLoginAt: this.lastLoginAt, createdAt: this.createdAt,
    conversationsThisMonth: this.conversationsThisMonth,
    messagesThisMonth: this.messagesThisMonth,
  };
};

module.exports = User;
