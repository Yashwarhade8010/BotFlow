'use strict';
const { Op, fn, col, literal } = require('sequelize');
const { Conversation, Bot, DailyStats } = require('../models/index');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// GET /api/analytics/overview?days=30
const getOverview = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date(); since.setDate(since.getDate() - days);

  const bots = await Bot.findAll({
    where: { userId: req.user.id },
    attributes: ['id','name','status','statsTotalConversations','statsResolutionRate','statsSatisfactionScore'],
  });

  const [totalConvs, activeConvs, resolvedConvs, escalatedConvs] = await Promise.all([
    Conversation.count({ where: { userId: req.user.id, createdAt: { [Op.gte]: since } } }),
    Conversation.count({ where: { userId: req.user.id, status: 'active' } }),
    Conversation.count({ where: { userId: req.user.id, status: 'resolved', createdAt: { [Op.gte]: since } } }),
    Conversation.count({ where: { userId: req.user.id, status: 'escalated', createdAt: { [Op.gte]: since } } }),
  ]);

  const resolutionRate = totalConvs > 0 ? Math.round((resolvedConvs / totalConvs) * 100) : 0;

  // Avg response time and satisfaction
  const stats = await Conversation.findOne({
    where: { userId: req.user.id, createdAt: { [Op.gte]: since } },
    attributes: [
      [fn('AVG', col('avgResponseTimeMs')), 'avgRt'],
      [fn('AVG', col('satisfactionScore')), 'avgScore'],
    ],
    raw: true,
  });

  return success(res, {
    bots: bots.length,
    totalConversations: totalConvs,
    activeConversations: activeConvs,
    resolvedConversations: resolvedConvs,
    escalatedConversations: escalatedConvs,
    resolutionRate,
    avgResponseTimeSec: ((stats?.avgRt || 0) / 1000).toFixed(1),
    avgSatisfaction: stats?.avgScore ? parseFloat(Number(stats.avgScore).toFixed(1)) : null,
    botStats: bots.map(b => ({
      id: b.id, name: b.name, status: b.status,
      stats: {
        totalConversations: b.statsTotalConversations,
        resolutionRate: b.statsResolutionRate,
        satisfactionScore: b.statsSatisfactionScore,
      },
    })),
  });
});

// GET /api/analytics/bot/:botId?days=30
const getBotAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const bot = await Bot.findOne({ where: { id: req.params.botId, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  const since = new Date(); since.setDate(since.getDate() - days);

  const daily = await DailyStats.findAll({
    where: { botId: bot.id, date: { [Op.gte]: since } },
    order: [['date', 'ASC']],
    raw: true,
  });

  const totals = daily.reduce((acc, d) => ({
    conversations:  acc.conversations  + d.conversations,
    messages:       acc.messages       + d.messages,
    resolved:       acc.resolved       + d.resolvedCount,
    escalated:      acc.escalated      + d.escalatedCount,
    tokensUsed:     acc.tokensUsed     + d.totalTokensUsed,
  }), { conversations:0, messages:0, resolved:0, escalated:0, tokensUsed:0 });

  return success(res, {
    bot: { id: bot.id, name: bot.name },
    daily: daily.map(d => ({
      date: d.date, conversations: d.conversations, messages: d.messages,
      resolved: d.resolvedCount, escalated: d.escalatedCount,
    })),
    totals,
    resolutionRate: totals.conversations > 0
      ? Math.round((totals.resolved / totals.conversations) * 100) : 0,
  });
});

// GET /api/analytics/conversations/volume?botId=&days=7
const getVolumeChart = asyncHandler(async (req, res) => {
  const { botId, days = 7 } = req.query;
  const since = new Date(); since.setDate(since.getDate() - Number(days));

  const where = { userId: req.user.id, createdAt: { [Op.gte]: since } };
  if (botId) where.botId = botId;

  const volume = await Conversation.findAll({
    where,
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('COUNT', col('id')), 'conversations'],
      [fn('SUM', literal("CASE WHEN status='resolved' THEN 1 ELSE 0 END")), 'resolved'],
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']],
    raw: true,
  });

  return success(res, { volume });
});

// GET /api/analytics/languages?botId=
const getLanguageStats = asyncHandler(async (req, res) => {
  const { botId } = req.query;
  const where = { userId: req.user.id };
  if (botId) where.botId = botId;
  where.customerLanguage = { [Op.ne]: null };

  const languages = await Conversation.findAll({
    where,
    attributes: [
      'customerLanguage',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['customerLanguage'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: 10,
    raw: true,
  });

  return success(res, { languages });
});

module.exports = { getOverview, getBotAnalytics, getVolumeChart, getLanguageStats };
