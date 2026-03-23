'use strict';
const { Bot, Conversation, Message } = require('../models/index');
const {
  generateReply,
  sendMessage,
  markAsRead,
  verifyWebhook,
  parseWebhookPayload,
  emitToBot,
} = require("../services/index");
const logger = require("../utils/logger");

// ── GET /api/webhook/:verifyToken — Meta verification ──
const handleVerify = async (req, res) => {
  try {
    const bot = await Bot.findOne({
      where: { waVerifyToken: req.params.verifyToken },
    });
    if (!bot) return res.sendStatus(404);
    const challenge = verifyWebhook(req.query, bot.waVerifyToken);
    if (!challenge) return res.sendStatus(403);
    logger.info(`Webhook verified for bot: ${bot.name}`);
    return res.status(200).send(challenge);
  } catch (err) {
    logger.error("handleVerify error:", err.message);
    return res.sendStatus(500);
  }
};

// ── POST /api/webhook/:verifyToken — Incoming messages ──
const handleIncoming = async (req, res) => {
  res.sendStatus(200); // Always respond immediately to Meta

  try {
    const bot = await Bot.findOne({
      where: { waVerifyToken: req.params.verifyToken },
    });
    if (!bot) {
      logger.warn(`No bot found for token: ${req.params.verifyToken}`);
      return;
    }
    if (bot.status !== "active") {
      logger.warn(`Bot ${bot.name} is not active`);
      return;
    }

    const messages = parseWebhookPayload(req.body);
    if (!messages.length) return; // delivery receipts, status updates etc

    for (const msg of messages) {
      await processIncomingMessage(bot, msg).catch((err) =>
        logger.error(
          `processIncomingMessage failed [${bot.id}]: ${err.message}`
        )
      );
    }
  } catch (err) {
    logger.error("handleIncoming error:", err.message);
  }
};

async function processIncomingMessage(bot, msg) {
  const { from, text, messageId, profileName } = msg;
  if (!text?.trim()) return;

  // ── Find or create conversation ──
  // Only match active/escalated conversations — ignore resolved/abandoned
  const { Op } = require("sequelize");
  let conversation = await Conversation.findOne({
    where: {
      botId: bot.id,
      customerWaId: from,
      status: { [Op.in]: ["active", "escalated"] },
    },
    include: [
      { model: Message, as: "messages", order: [["createdAt", "ASC"]] },
    ],
  });

  if (!conversation) {
    conversation = await Conversation.create({
      botId: bot.id,
      userId: bot.userId,
      customerWaId: from,
      customerName: profileName,
      customerPhone: from,
      platform: "whatsapp",
      status: "active",
    });
    conversation.messages = [];
    logger.info(`New conversation created for ${from} on bot ${bot.name}`);
  }

  // ── Save user message ──
  const userMsg = await Message.create({
    conversationId: conversation.id,
    role: "user",
    content: text,
    whatsappMsgId: messageId,
  });

  await Conversation.update(
    {
      lastMessageAt: new Date(),
      messageCount: (conversation.messageCount || 0) + 1,
    },
    { where: { id: conversation.id } }
  );

  // ── Mark message as read ──
  if (bot.waPhoneNumberId && bot.waAccessToken) {
    await markAsRead(bot.waPhoneNumberId, bot.waAccessToken, messageId).catch(
      () => {}
    );
  }

  // ── Emit user message to dashboard in real time ──
  emitToBot(bot.id, "conversation:message", {
    conversationId: conversation.id,
    message: userMsg,
  });

  // ── If escalated — skip AI, wait for human agent ──
  if (conversation.status === "escalated") {
    logger.info(`Conversation ${conversation.id} is escalated — skipping AI`);
    return;
  }

  // ── Generate AI reply ──
  const history = (conversation.messages || []).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const ai = await generateReply(bot, history, text);
  logger.info(
    `AI reply for bot ${bot.name}: handoffRequested=${ai.handoffRequested}, humanHandoff=${bot.humanHandoff}`
  );

  // ── Guard against empty reply ──
  const replyText =
    ai.reply?.trim() ||
    "I'm having trouble right now. Please try again in a moment.";

  // ── Send via WhatsApp ──
  if (bot.waConnected && bot.waPhoneNumberId && bot.waAccessToken) {
    await sendMessage(
      bot.waPhoneNumberId,
      bot.waAccessToken,
      from,
      replyText
    ).catch((err) =>
      logger.error(`WhatsApp send failed [${bot.id}]: ${err.message}`)
    );
  } else {
    logger.warn(`WhatsApp not configured for bot ${bot.name}`);
  }

  // ── Save AI message ──
  const aiMsg = await Message.create({
    conversationId: conversation.id,
    role: "assistant",
    content: replyText,
    tokensUsed: ai.tokensUsed,
    responseTimeMs: ai.responseTimeMs,
    confidence: ai.confidence,
    model: ai.model,
  });

  // ── Handle handoff — ONLY trigger on explicit AI request, not confidence ──
  // bot.humanHandoff must be true AND AI must have included [HANDOFF_REQUESTED]
  const humanHandoffEnabled = bot.settings?.humanHandoff ?? true;
  const shouldHandoff = ai.handoffRequested && humanHandoffEnabled;

  if (shouldHandoff) {
    await Conversation.update(
      { status: "escalated", handedOffAt: new Date() },
      { where: { id: conversation.id } }
    );
    emitToBot(bot.id, "conversation:handoff", {
      conversationId: conversation.id,
    });

    // Notify agent via WhatsApp if configured
    if (
      process.env.AGENT_WHATSAPP_NUMBER &&
      bot.waPhoneNumberId &&
      bot.waAccessToken
    ) {
      await sendMessage(
        bot.waPhoneNumberId,
        bot.waAccessToken,
        process.env.AGENT_WHATSAPP_NUMBER,
        `🔔 *Handoff Required*\nCustomer: ${
          profileName || from
        }\nNumber: +${from}\nMessage: "${text}"\n\nLogin to BotFlow dashboard to respond.`
      ).catch(() => {});
    }

    logger.info(
      `Conversation ${conversation.id} escalated for bot ${bot.name}`
    );
  }

  // ── Emit AI reply to dashboard ──
  emitToBot(bot.id, "conversation:message", {
    conversationId: conversation.id,
    message: aiMsg,
  });

  logger.debug(`Bot ${bot.name} replied to ${from} in ${ai.responseTimeMs}ms`);
}

module.exports = { handleVerify, handleIncoming };