'use strict';
// Import all models to register them with Sequelize
const User = require('./User');
const Bot  = require('./Bot');
const { Conversation, Message } = require('./Conversation');
const { KnowledgeSource, DailyStats } = require('./KnowledgeSource');

// ── Associations ──────────────────────────────────
User.hasMany(Bot,              { foreignKey: 'userId', as: 'bots',          onDelete: 'CASCADE' });
Bot.belongsTo(User,            { foreignKey: 'userId', as: 'owner' });

User.hasMany(Conversation,     { foreignKey: 'userId', as: 'conversations',  onDelete: 'CASCADE' });
Conversation.belongsTo(User,   { foreignKey: 'userId', as: 'owner' });

Bot.hasMany(Conversation,      { foreignKey: 'botId',  as: 'conversations',  onDelete: 'CASCADE' });
Conversation.belongsTo(Bot,    { foreignKey: 'botId',  as: 'bot' });

Bot.hasMany(KnowledgeSource,   { foreignKey: 'botId',  as: 'knowledgeSources', onDelete: 'CASCADE' });
KnowledgeSource.belongsTo(Bot, { foreignKey: 'botId',  as: 'bot' });

User.hasMany(KnowledgeSource,  { foreignKey: 'userId', as: 'knowledgeSources', onDelete: 'CASCADE' });
KnowledgeSource.belongsTo(User,{ foreignKey: 'userId', as: 'owner' });

Bot.hasMany(DailyStats,        { foreignKey: 'botId',  as: 'dailyStats',    onDelete: 'CASCADE' });
DailyStats.belongsTo(Bot,      { foreignKey: 'botId' });

module.exports = { User, Bot, Conversation, Message, KnowledgeSource, DailyStats };
