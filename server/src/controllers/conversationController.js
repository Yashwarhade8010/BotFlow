'use strict';
const { Op } = require('sequelize');
const { Conversation, Message, Bot } = require('../models/index');
const asyncHandler = require('../utils/asyncHandler');
const { success, error, paginated } = require('../utils/apiResponse');
const { emitToBot } = require('../services/index');
const whatsappService = require("../services/index");

// GET /api/conversations
const getConversations = asyncHandler(async (req, res) => {
  const { botId, status, page = 1, limit = 20, search } = req.query;

  const where = { userId: req.user.id };
  if (botId)  where.botId  = botId;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { customerName:  { [Op.like]: `%${search}%` } },
      { customerPhone: { [Op.like]: `%${search}%` } },
      { customerWaId:  { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Conversation.findAndCountAll({
    where,
    include: [{ model: Bot, as: 'bot', attributes: ['id','name'] }],
    order: [['lastMessageAt', 'DESC']],
    limit:  Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  return paginated(res, rows, count, Number(page), Number(limit));
});

// GET /api/conversations/:id
const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [
      { model: Bot,     as: 'bot',      attributes: ['id','name','aiModel'] },
      { model: Message, as: 'messages', order: [['createdAt','ASC']] },
    ],
  });
  if (!conversation) return error(res, 'Conversation not found', 404);
  return success(res, { conversation });
});

// POST /api/conversations/:id/reply
const agentReply = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return error(res, 'Message is required', 400);
  const conversation = await Conversation.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{ model: Bot, as: 'bot' }],
  });
  if (!conversation) return error(res, 'Conversation not found', 404);

  const msg = await Message.create({
    conversationId: conversation.id,
    role: 'agent',
    content: message,
    agentId: req.user.id,
  });

  await conversation.update({
    lastMessageAt: new Date(),
    messageCount: (conversation.messageCount || 0) + 1,
  });

  // Send through the same channel the customer used.
  const bot = conversation.bot;
  if (conversation.platform === 'telegram' && bot?.tgConnected && bot?.tgBotToken) {
    const chatId = conversation.customerWaId.replace(/^tg:/, '');
    await whatsappService.sendTelegramMessage(bot.tgBotToken, chatId, message).catch(() => {});
  } else if (bot?.waConnected && bot?.waPhoneNumberId && bot?.waAccessToken) {
    await whatsappService
      .sendMessage(
        bot.waPhoneNumberId,
        bot.waAccessToken,
        conversation.customerWaId,
        message
      )
      .catch(() => {});
  }

  emitToBot(conversation.botId, 'conversation:message', {
    conversationId: conversation.id,
    message: msg.toJSON(),
  });

  return success(res, { message: msg });
});

// PATCH /api/conversations/:id/resolve
const resolveConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!conversation) return error(res, 'Conversation not found', 404);
  await conversation.update({ status: 'resolved', resolvedAt: new Date(), resolvedBy: 'agent' });
  emitToBot(conversation.botId, 'conversation:resolved', { conversationId: conversation.id });
  return success(res, { conversation }, 'Conversation resolved');
});

// PATCH /api/conversations/:id/handoff
const handoffConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!conversation) return error(res, 'Conversation not found', 404);
  await conversation.update({
    status: 'escalated',
    handedOffAt: new Date(),
    handedOffToId: req.user.id,
  });
  emitToBot(conversation.botId, 'conversation:handoff', { conversationId: conversation.id });
  return success(res, { conversation }, 'Escalated to agent');
});

// POST /api/conversations/:id/rate
const rateConversation = asyncHandler(async (req, res) => {
  const { score, note } = req.body;
  if (!score || score < 1 || score > 5) return error(res, 'Score must be 1-5', 400);
  const conversation = await Conversation.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!conversation) return error(res, 'Conversation not found', 404);
  await conversation.update({ satisfactionScore: score, satisfactionNote: note });
  return success(res, { conversation }, 'Rating saved');
});

// DELETE /api/conversations/:id
const deleteConversation = asyncHandler(async (req, res) => {
  const c = await Conversation.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!c) return error(res, 'Conversation not found', 404);
  await c.destroy();
  return success(res, {}, 'Conversation deleted');
});

module.exports = {
  getConversations, getConversation, agentReply,
  resolveConversation, handoffConversation, rateConversation, deleteConversation,
};
