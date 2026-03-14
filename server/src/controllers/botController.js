'use strict';
const { v4: uuidv4 } = require('uuid');
const { Bot, KnowledgeSource, Conversation, Message } = require('../models/index');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');

// GET /api/bots
const getBots = asyncHandler(async (req, res) => {
  const bots = await Bot.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  return success(res, { bots: bots.map(b => b.toPublic()), count: bots.length });
});

// GET /api/bots/:id
const getBot = asyncHandler(async (req, res) => {
  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);
  return success(res, { bot: bot.toPublic() });
});

// POST /api/bots
const createBot = asyncHandler(async (req, res) => {
  const { name, businessName, industry, welcomeMessage, aiModel, personality, temperature, settings } = req.body;

  // Check plan limits
  const count = await Bot.count({ where: { userId: req.user.id } });
  const limits = req.user.getPlanLimits();
  if (count >= limits.bots) {
    return error(res, `Your ${req.user.plan} plan allows max ${limits.bots} bot(s). Upgrade to add more.`, 403);
  }

  const verifyToken = uuidv4();
  const apiUrl = process.env.API_URL || 'http://localhost:5000';
  const webhookUrl = `${apiUrl}/api/webhook/${verifyToken}`;

  const bot = await Bot.create({
    userId: req.user.id,
    name, businessName, industry, welcomeMessage,
    aiModel: aiModel || 'claude-3-5-sonnet-20241022',
    personality: personality || 'friendly',
    temperature: temperature ?? 0.4,
    settings: settings || undefined,
    waVerifyToken: verifyToken,
    waWebhookUrl:  webhookUrl,
  });

  return created(res, { bot: bot.toPublic() }, 'Bot created successfully');
});

// PUT /api/bots/:id
const updateBot = asyncHandler(async (req, res) => {
  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  const allowed = ['name','businessName','industry','welcomeMessage','aiModel',
    'personality','temperature','maxTokens','settings','systemPromptOverride'];
  const updates = {};
  for (const f of allowed) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  await bot.update(updates);
  return success(res, { bot: bot.toPublic() }, 'Bot updated');
});

// DELETE /api/bots/:id
const deleteBot = asyncHandler(async (req, res) => {
  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  // Cascade via DB constraints (KnowledgeSource, Conversation)
  await bot.destroy();
  return success(res, {}, 'Bot deleted');
});

// PATCH /api/bots/:id/status
const updateBotStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active','paused'].includes(status)) return error(res, 'Invalid status', 400);

  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);
  await bot.update({ status });
  return success(res, { bot: bot.toPublic() }, `Bot ${status}`);
});

// POST /api/bots/:id/whatsapp/connect
const connectWhatsApp = asyncHandler(async (req, res) => {
  const { phoneNumberId, accessToken, phoneNumber } = req.body;
  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  try {
    const axios = require('axios');
    const version = process.env.WHATSAPP_API_VERSION || 'v19.0';
    await axios.get(`https://graph.facebook.com/${version}/${phoneNumberId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 8000,
    });
  } catch {
    return error(res, 'WhatsApp verification failed — check your Phone Number ID and Access Token', 400);
  }

  await bot.update({
    waPhoneNumberId: phoneNumberId,
    waAccessToken:   accessToken,
    waPhoneNumber:   phoneNumber,
    waConnected:     true,
    waVerifiedAt:    new Date(),
    status: 'active',
  });

  return success(res, {
    webhookUrl:  bot.waWebhookUrl,
    verifyToken: bot.waVerifyToken,
  }, 'WhatsApp connected');
});

// POST /api/bots/:id/telegram/connect
const connectTelegram = asyncHandler(async (req, res) => {
  const { botToken } = req.body;
  if (!botToken) return error(res, 'Bot token is required', 400);

  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  // Verify token with Telegram
  let botInfo;
  try {
    const axios = require('axios');
    const resp = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 8000 });
    botInfo = resp.data.result;
  } catch {
    return error(res, 'Invalid Telegram bot token — check it in BotFather', 400);
  }

  // Register webhook with Telegram
  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const webhookUrl = `${apiUrl}/api/telegram/${botToken}`;

  try {
    const axios = require('axios');
    await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, { url: webhookUrl }, { timeout: 8000 });
  } catch (err) {
    return error(res, 'Failed to set Telegram webhook: ' + err.message, 400);
  }

  await bot.update({
    tgBotToken:    botToken,
    tgBotUsername: botInfo.username,
    tgWebhookUrl:  webhookUrl,
    tgConnected:   true,
    tgConnectedAt: new Date(),
    status: 'active',
  });

  return success(res, {
    username:   botInfo.username,
    webhookUrl,
  }, `Telegram @${botInfo.username} connected`);
});

// POST /api/bots/:id/telegram/disconnect
const disconnectTelegram = asyncHandler(async (req, res) => {
  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  if (bot.tgBotToken) {
    const axios = require('axios');
    await axios.post(`https://api.telegram.org/bot${bot.tgBotToken}/deleteWebhook`, {}, { timeout: 8000 }).catch(() => {});
  }

  await bot.update({
    tgBotToken: null, tgBotUsername: null,
    tgWebhookUrl: null, tgConnected: false, tgConnectedAt: null,
  });

  return success(res, {}, 'Telegram disconnected');
});

// GET /api/bots/:id/stats
const getBotStats = asyncHandler(async (req, res) => {
  const bot = await Bot.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);
  return success(res, { stats: bot.toPublic().stats });
});

module.exports = { getBots, getBot, createBot, updateBot, deleteBot, updateBotStatus, connectWhatsApp, connectTelegram, disconnectTelegram, getBotStats };
