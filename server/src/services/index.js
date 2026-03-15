'use strict';
// ── AI Service ─────────────────────────────────────
const logger = require('../utils/logger');
const knowledgeService = require('./knowledgeService');

function buildSystemPrompt(bot, chunks) {
  const toneMap = {
    friendly:     'You are warm, conversational, and use emoji occasionally.',
    professional: 'You are formal, precise, and avoid casual language.',
    playful:      'You are fun, energetic, and use light humor.',
    concise:      'You keep responses short and direct — 1-3 sentences max.',
  };
  const tone = toneMap[bot.personality] || toneMap.friendly;
  const context = chunks.length
    ? `\n\nKNOWLEDGE BASE:\n${chunks.map((c,i) => `[${i+1}] ${c}`).join('\n\n')}`
    : '';
  return `You are ${bot.name}, a WhatsApp AI assistant for ${bot.businessName || 'a business'}.\n${tone}\nOnly answer questions using the knowledge base below. If unsure, say you'll connect them to a human and include [HANDOFF_REQUESTED].${context}`;
}

async function generateReply(bot, history, userMessage) {
  const startTime = Date.now();
  const chunks = await knowledgeService.retrieveRelevantChunks(
    bot.id,
    userMessage,
    5
  );
  const systemPrompt =
    bot.systemPromptOverride || buildSystemPrompt(bot, chunks);

  const messages = history.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
  messages.push({ role: "user", content: userMessage });

  let reply = "",
    tokensUsed = 0;
  const model = bot.aiModel || "claude-3-5-sonnet-20241022";

  try {
    if (model.startsWith("claude")) {
      const Anthropic = require("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model,
        max_tokens: bot.maxTokens || 500,
        system: systemPrompt,
        messages,
        temperature: bot.temperature ?? 0.4,
      });
      reply = response.content[0].text;
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    } else if (model.startsWith("gpt")) {
      const OpenAI = require("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: bot.maxTokens || 500,
        temperature: bot.temperature ?? 0.4,
      });
      reply = response.choices[0].message.content;
      tokensUsed = response.usage.total_tokens;
    } else if (model.startsWith('groq-')) {
      const OpenAI = require('openai');
      const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      const groqModel = model.slice(5); // strips 'groq-' prefix → 'llama-3.3-70b-versatile'
      const response = await client.chat.completions.create({
        model: groqModel,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: bot.maxTokens || 500,
        temperature: bot.temperature ?? 0.4,
      });
      reply = response.choices[0].message.content;
      tokensUsed = response.usage.total_tokens;
    
    }
  } catch (err) {
    logger.error(`AI error [${model}]:`, err.message);
    reply = "I'm having trouble right now. Please try again in a moment.";
  }

  const handoffRequested = reply.includes('[HANDOFF_REQUESTED]');
  if (handoffRequested) reply = reply.replace('[HANDOFF_REQUESTED]', '').trim();
  const confidence = reply.length > 80 && !reply.toLowerCase().includes("i don't have") ? 0.85 : 0.55;

  return { reply, tokensUsed, confidence, handoffRequested, responseTimeMs: Date.now() - startTime, model };
}

// ── WhatsApp Service ───────────────────────────────
const axios = require('axios');
const BASE_URL    = 'https://graph.facebook.com';
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';

async function sendMessage(phoneNumberId, accessToken, to, text) {
  const url = `${BASE_URL}/${API_VERSION}/${phoneNumberId}/messages`;
  const response = await axios.post(url, {
    messaging_product: 'whatsapp', recipient_type: 'individual',
    to, type: 'text', text: { preview_url: false, body: text },
  }, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    timeout: 10000,
  });
  return response.data;
}

async function markAsRead(phoneNumberId, accessToken, messageId) {
  const url = `${BASE_URL}/${API_VERSION}/${phoneNumberId}/messages`;
  await axios.post(url, {
    messaging_product: 'whatsapp', status: 'read', message_id: messageId,
  }, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  }).catch(err => logger.warn('markAsRead failed:', err.message));
}

function verifyWebhook(query, verifyToken) {
  if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === verifyToken) {
    return query['hub.challenge'];
  }
  return null;
}

function parseWebhookPayload(body) {
  const results = [];
  try {
    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        for (const message of (value?.messages || [])) {
          if (message.type === 'text') {
            results.push({
              phoneNumberId, from: message.from, messageId: message.id,
              text: message.text?.body || '',
              timestamp: new Date(parseInt(message.timestamp) * 1000),
              profileName: value.contacts?.[0]?.profile?.name,
            });
          }
        }
      }
    }
  } catch (err) { logger.error('parseWebhookPayload:', err.message); }
  return results;
}

// ── Telegram Service ───────────────────────────────
const TELEGRAM_API = 'https://api.telegram.org';

async function sendTelegramMessage(botToken, chatId, text) {
  const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
  const response = await axios.post(url, {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  }, { timeout: 10000 });
  return response.data;
}

async function setTelegramWebhook(botToken, webhookUrl) {
  const url = `${TELEGRAM_API}/bot${botToken}/setWebhook`;
  const response = await axios.post(url, { url: webhookUrl }, { timeout: 10000 });
  return response.data;
}

async function deleteTelegramWebhook(botToken) {
  const url = `${TELEGRAM_API}/bot${botToken}/deleteWebhook`;
  const response = await axios.post(url, {}, { timeout: 10000 });
  return response.data;
}

async function getTelegramBotInfo(botToken) {
  const url = `${TELEGRAM_API}/bot${botToken}/getMe`;
  const response = await axios.get(url, { timeout: 10000 });
  return response.data.result;
}

function parseTelegramPayload(body) {
  try {
    const message = body?.message || body?.edited_message;
    if (!message || !message.text) return null;
    return {
      chatId:      message.chat.id,
      from:        String(message.chat.id),
      text:        message.text,
      messageId:   message.message_id,
      profileName: message.from?.first_name
        ? `${message.from.first_name} ${message.from.last_name || ''}`.trim()
        : 'Telegram User',
      username:    message.from?.username,
      timestamp:   new Date(message.date * 1000),
    };
  } catch { return null; }
}


let _io = null;
function initSocket(server) {
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');
  const allowedOrigins = [
    "http://localhost:3000",
    "https://bot-flow-ten.vercel.app",
    "https://bot-flow-coral.vercel.app",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  _io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.some((o) => origin.startsWith(o.replace(/\/$/, "")))
        ) {
          callback(null, true);
        } else {
          callback(new Error(`Socket CORS blocked: ${origin}`));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  _io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  _io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.on('join:bot',          (botId)    => socket.join(`bot:${botId}`));
    socket.on('join:conversation', (convId)   => socket.join(`conv:${convId}`));
  });
}

function emitToUser(userId, event, data) { _io?.to(`user:${userId}`).emit(event, data); }
function emitToBot(botId, event, data)   { _io?.to(`bot:${botId}`).emit(event, data); }
function getIO() { return _io; }

module.exports = {
  // AI
  generateReply,
  // WhatsApp
  sendMessage,
  markAsRead,
  verifyWebhook,
  parseWebhookPayload,
  // Telegram
  sendTelegramMessage,
  setTelegramWebhook,
  deleteTelegramWebhook,
  getTelegramBotInfo,
  parseTelegramPayload,
  // Socket
  initSocket,
  emitToUser,
  emitToBot,
  getIO,
};