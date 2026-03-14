'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KnowledgeSource = sequelize.define('KnowledgeSource', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  botId:  { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  type:   { type: DataTypes.ENUM('pdf','docx','txt','csv','url','text'), allowNull: false },
  name:   { type: DataTypes.STRING(255), allowNull: false },
  status: { type: DataTypes.ENUM('pending','processing','indexed','failed'), defaultValue: 'pending' },
  errorMessage: { type: DataTypes.TEXT },
  filePath:  { type: DataTypes.STRING(500) },
  fileSize:  { type: DataTypes.INTEGER },
  mimeType:  { type: DataTypes.STRING(100) },
  url:       { type: DataTypes.TEXT },
  rawText:   { type: DataTypes.TEXT('long') },
  // Chunks stored as JSON array: [{text, tokens, metadata}]
  chunksJson:  { type: DataTypes.TEXT('long') },
  chunkCount:  { type: DataTypes.INTEGER, defaultValue: 0 },
  totalTokens: { type: DataTypes.INTEGER, defaultValue: 0 },
  indexedAt:   { type: DataTypes.DATE },
}, {
  tableName: 'knowledge_sources',
  indexes: [
    { fields: ['botId', 'status'] },
    { fields: ['userId'] },
  ],
});

KnowledgeSource.prototype.getChunks = function() {
  if (!this.chunksJson) return [];
  try { return JSON.parse(this.chunksJson); } catch { return []; }
};

KnowledgeSource.prototype.setChunks = function(chunks) {
  this.chunksJson = JSON.stringify(chunks);
  this.chunkCount = chunks.length;
};

// ── Daily Stats ───────────────────────────────────
const DailyStats = sequelize.define('DailyStats', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  botId:  { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  date:   { type: DataTypes.DATEONLY, allowNull: false },

  conversations:    { type: DataTypes.INTEGER, defaultValue: 0 },
  newConversations: { type: DataTypes.INTEGER, defaultValue: 0 },
  messages:         { type: DataTypes.INTEGER, defaultValue: 0 },
  resolvedCount:    { type: DataTypes.INTEGER, defaultValue: 0 },
  escalatedCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
  avgResponseTimeMs:{ type: DataTypes.FLOAT,   defaultValue: 0 },
  totalTokensUsed:  { type: DataTypes.INTEGER, defaultValue: 0 },
  satisfactionSum:  { type: DataTypes.FLOAT,   defaultValue: 0 },
  satisfactionCount:{ type: DataTypes.INTEGER, defaultValue: 0 },
  uniqueUsers:      { type: DataTypes.INTEGER, defaultValue: 0 },

  queryTypesJson:   { type: DataTypes.TEXT },
  languagesJson:    { type: DataTypes.TEXT },
  hourlyVolumeJson: { type: DataTypes.TEXT },
}, {
  tableName: 'daily_stats',
  indexes: [
    { unique: true, fields: ['botId', 'date'] },
    { fields: ['userId', 'date'] },
  ],
});

module.exports = { KnowledgeSource, DailyStats };
