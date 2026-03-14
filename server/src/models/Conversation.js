'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  botId:  { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },

  // Customer info
  customerWaId:      { type: DataTypes.STRING(50),  allowNull: false },
  customerName:      { type: DataTypes.STRING(100) },
  customerPhone:     { type: DataTypes.STRING(30) },
  customerEmail:     { type: DataTypes.STRING(255) },
  customerLanguage:  { type: DataTypes.STRING(20) },
  customerProfilePic:{ type: DataTypes.STRING(500) },

  platform: {
    type: DataTypes.ENUM('whatsapp', 'telegram'),
    defaultValue: 'whatsapp',
  },

  status: {
    type: DataTypes.ENUM('active','resolved','escalated','abandoned'),
    defaultValue: 'active',
  },

  handedOffAt:  { type: DataTypes.DATE },
  handedOffToId:{ type: DataTypes.UUID },
  resolvedAt:   { type: DataTypes.DATE },
  resolvedBy:   { type: DataTypes.ENUM('bot','agent') },
  lastMessageAt:{ type: DataTypes.DATE, defaultValue: DataTypes.NOW },

  satisfactionScore: { type: DataTypes.TINYINT },
  satisfactionNote:  { type: DataTypes.TEXT },

  // Cached stats
  messageCount:       { type: DataTypes.INTEGER, defaultValue: 0 },
  avgResponseTimeMs:  { type: DataTypes.FLOAT,   defaultValue: 0 },
  totalTokensUsed:    { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'conversations',
  indexes: [
    { fields: ['botId', 'status'] },
    { fields: ['userId', 'lastMessageAt'] },
    { fields: ['customerWaId', 'botId'] },
  ],
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  conversationId: { type: DataTypes.UUID, allowNull: false },
  role: {
    type: DataTypes.ENUM('user','assistant','system','agent'),
    allowNull: false,
  },
  content:        { type: DataTypes.TEXT, allowNull: false },
  tokensUsed:     { type: DataTypes.INTEGER },
  responseTimeMs: { type: DataTypes.INTEGER },
  confidence:     { type: DataTypes.FLOAT },
  model:          { type: DataTypes.STRING(80) },
  agentId:        { type: DataTypes.UUID },
  whatsappMsgId:  { type: DataTypes.STRING(100) },
  isHandoff:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'messages',
  indexes: [{ fields: ['conversationId', 'createdAt'] }],
});

// Associations
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

module.exports = { Conversation, Message };
