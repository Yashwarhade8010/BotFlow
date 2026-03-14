'use strict';
const { Bot, Conversation, Message } = require('../models/index');
const { generateReply, sendMessage, markAsRead, verifyWebhook, parseWebhookPayload, emitToBot } = require('../services/index');
const logger = require('../utils/logger');

const handleVerify = async (req, res) => {
  const bot = await Bot.findOne({ where: { waVerifyToken: req.params.verifyToken } });
  if (!bot) return res.sendStatus(404);
  const challenge = verifyWebhook(req.query, bot.waVerifyToken);
  if (!challenge) return res.sendStatus(403);
  return res.status(200).send(challenge);
};

const handleIncoming = async (req, res) => {
  res.sendStatus(200);
  console.log('=== WEBHOOK HIT ===');
  console.log('Body:', JSON.stringify(req.body));

  const bot = await Bot.findOne({ where: { waVerifyToken: req.params.verifyToken } });
  console.log('Bot found:', bot ? bot.name : 'NOT FOUND');
  if (!bot || bot.status !== 'active') return;

  const messages = parseWebhookPayload(req.body);
  console.log('Parsed messages:', JSON.stringify(messages));
  if (!messages.length) { console.log('No messages parsed'); return; }

  for (const msg of messages) {
    await processIncomingMessage(bot, msg).catch(err => console.log('ERROR:', err.message, err.stack));
  }
};

async function processIncomingMessage(bot, msg) {
  const { from, text, messageId, profileName } = msg;
  console.log('Processing:', { from, text });
  if (!text?.trim()) return;

  let conversation = await Conversation.findOne({
    where: { botId: bot.id, customerWaId: from },
    include: [{ model: Message, as: 'messages', order: [['createdAt','ASC']] }],
  });

  if (!conversation) {
    conversation = await Conversation.create({
      botId: bot.id, userId: bot.userId,
      customerWaId: from, customerName: profileName, customerPhone: from, status: 'active',
    });
    conversation.messages = [];
  }

  await Message.create({ conversationId: conversation.id, role: 'user', content: text, whatsappMsgId: messageId });
  await conversation.update({ lastMessageAt: new Date(), messageCount: (conversation.messageCount||0)+1 });

  if (conversation.status === 'escalated') return;

  console.log('Generating AI reply with model:', bot.aiModel);
  const history = (conversation.messages||[]).map(m => ({ role: m.role, content: m.content }));
  const ai = await generateReply(bot, history, text);
  console.log('AI reply:', ai.reply);
  console.log('AI error check - reply length:', ai.reply.length);

  if (bot.waConnected && bot.waPhoneNumberId && bot.waAccessToken) {
    console.log('Sending WhatsApp message to:', from);
    await sendMessage(bot.waPhoneNumberId, bot.waAccessToken, from, ai.reply)
      .then(() => console.log('WhatsApp sent successfully!'))
      .catch(err => console.log('WhatsApp send ERROR:', err.message, err.response?.data));
  } else {
    console.log('WhatsApp not configured:', { waConnected: bot.waConnected, hasPhoneId: !!bot.waPhoneNumberId, hasToken: !!bot.waAccessToken });
  }

  await Message.create({
    conversationId: conversation.id, role: 'assistant', content: ai.reply,
    tokensUsed: ai.tokensUsed, responseTimeMs: ai.responseTimeMs, model: ai.model,
  });
}

module.exports = { handleVerify, handleIncoming };