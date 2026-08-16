'use strict';
const { Bot, Conversation, Message } = require('../models/index');
const { generateReply, sendTelegramMessage, parseTelegramPayload, emitToBot } = require('../services/index');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const handleTelegramIncoming = async (req, res) => {
  res.sendStatus(200);
  console.log('=== TELEGRAM WEBHOOK HIT ===');
  console.log('Body:', JSON.stringify(req.body));

  try {
    const { botToken } = req.params;
    console.log('Looking for bot with token:', botToken.substring(0, 10) + '...');

    const bot = await Bot.findOne({ where: { tgBotToken: botToken, tgConnected: true } });
    console.log('Bot found:', bot ? bot.name : 'NOT FOUND');
    console.log('Bot status:', bot?.status);

    if (!bot || bot.status !== 'active') return;

    const msg = parseTelegramPayload(req.body);
    console.log('Parsed message:', JSON.stringify(msg));
    if (!msg) { console.log('ERROR: Could not parse message'); return; }

    console.log('Generating AI reply with model:', bot.aiModel);
    await processTelegramMessage(bot, msg);
  } catch (err) {
    console.log('ERROR:', err.message, err.stack);
  }
};

async function processTelegramMessage(bot, msg) {
  const { chatId, from, text, profileName } = msg;
  if (!text?.trim()) return;

  console.log('Step 1: Finding conversation...');
  let conversation = await Conversation.findOne({
    where: {
      botId: bot.id,
      customerWaId: `tg:${from}`,
      status: { [Op.in]: ['active', 'escalated'] },
    },
    include: [{ model: Message, as: 'messages', order: [['createdAt','ASC']] }],
  });

  console.log('Step 2: Conversation found:', conversation ? conversation.id : 'none, creating...');
  if (!conversation) {
    conversation = await Conversation.create({
      botId: bot.id, userId: bot.userId,
      customerWaId: `tg:${from}`, customerName: profileName,
      customerPhone: null, platform: 'telegram', status: 'active',
    });
    conversation.messages = [];
    console.log('Step 3: Conversation created:', conversation.id);
  }

  console.log('Step 4: Saving user message...');
  await Message.create({ conversationId: conversation.id, role: 'user', content: text });
  console.log('Step 5: Updating conversation...');
await Conversation.update(
  { lastMessageAt: new Date(), messageCount: (conversation.messageCount||0)+1 },
  { where: { id: conversation.id } }
);
console.log('Step 5 done');

console.log('Step 5b: Checking escalated status:', conversation.status);
if (conversation.status === 'escalated') {
  console.log('Step 5b: Escalated - skipping AI');
  return;
}

console.log('Step 5c: Building history...');
const history = (conversation.messages||[]).map(m => ({ role: m.role, content: m.content }));
console.log('Step 5d: History length:', history.length);

console.log('Step 6: Calling generateReply...');
const ai = await generateReply(bot, history, text);
console.log('Step 7: AI reply received:', ai.reply);

  console.log('Sending Telegram message to chatId:', chatId);
  await sendTelegramMessage(bot.tgBotToken, chatId, ai.reply)
    .then(() => console.log('Telegram sent successfully!'))
    .catch(err => console.log('Telegram send ERROR:', err.message, err.response?.data));

  await Message.create({
    conversationId: conversation.id, role: 'assistant', content: ai.reply,
    tokensUsed: ai.tokensUsed, responseTimeMs: ai.responseTimeMs, model: ai.model,
  });

  const humanHandoffEnabled = bot.settings?.humanHandoff ?? true;
  if (ai.handoffRequested && humanHandoffEnabled) {
    await conversation.update({ status: 'escalated', handedOffAt: new Date() });
    emitToBot(bot.id, 'conversation:handoff', { conversationId: conversation.id });
    console.log(`Conversation ${conversation.id} escalated for bot ${bot.name}`);
  }

  console.log(`Telegram bot ${bot.name} replied to ${from} in ${ai.responseTimeMs}ms`);
}

module.exports = { handleTelegramIncoming };
