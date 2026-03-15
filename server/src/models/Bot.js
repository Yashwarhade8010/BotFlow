'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bot = sequelize.define('Bot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId:       { type: DataTypes.UUID, allowNull: false },
  name:         { type: DataTypes.STRING(60),  allowNull: false },
  businessName: { type: DataTypes.STRING(100) },
  industry:     { type: DataTypes.STRING(80) },
  welcomeMessage: {
    type: DataTypes.TEXT,
    defaultValue: "Hi! I'm your AI assistant. How can I help? 😊",
  },
  aiModel: {
    type: DataTypes.STRING(100),
    defaultValue: 'claude-3-5-sonnet-20241022',
  },
  personality: {
    type: DataTypes.STRING(50),
    defaultValue: 'friendly',
  },
  temperature:  { type: DataTypes.FLOAT,   defaultValue: 0.4 },
  maxTokens:    { type: DataTypes.INTEGER, defaultValue: 500 },
  systemPromptOverride: { type: DataTypes.TEXT },

  // Settings stored as JSON
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      autoLanguageDetection: true,
      humanHandoff: true,
      humanHandoffThreshold: 0.65,
      collectLeadInfo: false,
      afterHoursEnabled: false,
      afterHoursText: "We are currently closed. We'll be back soon!",
    },
  },

  // WhatsApp connection (sensitive fields encrypted/hidden in responses)
  waConnected:     { type: DataTypes.BOOLEAN, defaultValue: false },
  waPhoneNumberId: { type: DataTypes.STRING(50) },
  waPhoneNumber:   { type: DataTypes.STRING(30) },
  waAccessToken:   { type: DataTypes.TEXT },
  waVerifyToken:   { type: DataTypes.STRING(100) },
  waWebhookUrl:    { type: DataTypes.STRING(500) },
  waVerifiedAt:    { type: DataTypes.DATE },

  // Telegram connection
  tgConnected:     { type: DataTypes.BOOLEAN, defaultValue: false },
  tgBotToken:      { type: DataTypes.TEXT },
  tgBotUsername:   { type: DataTypes.STRING(100) },
  tgWebhookUrl:    { type: DataTypes.STRING(500) },
  tgConnectedAt:   { type: DataTypes.DATE },

  status: {
    type: DataTypes.ENUM('draft','active','paused','error'),
    defaultValue: 'draft',
  },

  // Cached stats (updated by cron)
  statsTotalConversations: { type: DataTypes.INTEGER, defaultValue: 0 },
  statsTotalMessages:      { type: DataTypes.INTEGER, defaultValue: 0 },
  statsResolutionRate:     { type: DataTypes.FLOAT,   defaultValue: 0 },
  statsAvgResponseTimeMs:  { type: DataTypes.FLOAT,   defaultValue: 0 },
  statsSatisfactionScore:  { type: DataTypes.FLOAT,   defaultValue: 0 },
  statsHandoffRate:        { type: DataTypes.FLOAT,   defaultValue: 0 },
}, {
  tableName: 'bots',
});

Bot.prototype.toPublic = function() {
  const obj = this.toJSON();
  delete obj.waAccessToken;
  delete obj.waPhoneNumberId;
  delete obj.waVerifyToken;
  delete obj.tgBotToken;
  return {
    ...obj,
    stats: {
      totalConversations: obj.statsTotalConversations,
      totalMessages: obj.statsTotalMessages,
      resolutionRate: obj.statsResolutionRate,
      avgResponseTimeMs: obj.statsAvgResponseTimeMs,
      satisfactionScore: obj.statsSatisfactionScore,
      handoffRate: obj.statsHandoffRate,
    },
    whatsapp: {
      connected: obj.waConnected,
      phoneNumber: obj.waPhoneNumber,
      webhookUrl: obj.waWebhookUrl,
      verifiedAt: obj.waVerifiedAt,
    },
    telegram: {
      connected: obj.tgConnected,
      username: obj.tgBotUsername,
      webhookUrl: obj.tgWebhookUrl,
      verifyToken: obj.waVerifyToken,
      connectedAt: obj.tgConnectedAt,
    },
  };
};

module.exports = Bot;
