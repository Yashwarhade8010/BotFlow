'use strict';
const express = require('express');
const { protect } = require('../middleware/auth');

// ── Auth Routes ───────────────────────────────────
const authRouter = express.Router();
const auth = require('../controllers/authController');
authRouter.post('/register',          auth.register);
authRouter.post('/login',             auth.login);
authRouter.post('/refresh',           auth.refresh);
authRouter.post('/forgot-password',   auth.forgotPassword);
authRouter.post('/reset-password/:token', auth.resetPassword);
authRouter.get('/me',                 protect, auth.getMe);
module.exports.authRouter = authRouter;

// ── Bot Routes ────────────────────────────────────
const botRouter = express.Router();
const bots = require('../controllers/botController');
botRouter.use(protect);
botRouter.get('/',              bots.getBots);
botRouter.post('/',             bots.createBot);
botRouter.get('/:id',           bots.getBot);
botRouter.put('/:id',           bots.updateBot);
botRouter.delete('/:id',        bots.deleteBot);
botRouter.patch('/:id/status',  bots.updateBotStatus);
botRouter.post('/:id/whatsapp/connect', bots.connectWhatsApp);
botRouter.post('/:id/telegram/connect',    bots.connectTelegram);
botRouter.post('/:id/telegram/disconnect', bots.disconnectTelegram);
botRouter.get('/:id/stats',     bots.getBotStats);
module.exports.botRouter = botRouter;

// ── Knowledge Routes ──────────────────────────────
const knowledgeRouter = express.Router();
const knowledge = require('../controllers/knowledgeController');
knowledgeRouter.use(protect);
knowledgeRouter.get('/:botId',                    knowledge.getSources);
knowledgeRouter.post('/:botId/upload',            knowledge.uploadFile);
knowledgeRouter.post('/:botId/text',              knowledge.addText);
knowledgeRouter.post('/:botId/url',               knowledge.addUrl);
knowledgeRouter.delete('/:botId/:sourceId',       knowledge.deleteSource);
knowledgeRouter.post('/:botId/:sourceId/reindex', knowledge.reindexSource);
module.exports.knowledgeRouter = knowledgeRouter;

// ── Conversation Routes ───────────────────────────
const convRouter = express.Router();
const convs = require('../controllers/conversationController');
convRouter.use(protect);
convRouter.get('/',              convs.getConversations);
convRouter.get('/:id',           convs.getConversation);
convRouter.post('/:id/reply',    convs.agentReply);
convRouter.patch('/:id/resolve', convs.resolveConversation);
convRouter.patch('/:id/handoff', convs.handoffConversation);
convRouter.post('/:id/rate',     convs.rateConversation);
convRouter.delete('/:id',        convs.deleteConversation);
module.exports.convRouter = convRouter;

// ── Analytics Routes ──────────────────────────────
const analyticsRouter = express.Router();
const analytics = require('../controllers/analyticsController');
analyticsRouter.use(protect);
analyticsRouter.get('/overview',                analytics.getOverview);
analyticsRouter.get('/bot/:botId',              analytics.getBotAnalytics);
analyticsRouter.get('/conversations/volume',    analytics.getVolumeChart);
analyticsRouter.get('/languages',               analytics.getLanguageStats);
module.exports.analyticsRouter = analyticsRouter;

// ── User Routes ───────────────────────────────────
const userRouter = express.Router();
userRouter.use(protect);
userRouter.get('/profile', async (req, res) => {
  const { User } = require('../models/index');
  const user = await User.findByPk(req.user.id);
  res.json({ success: true, data: { user: user.toPublic() } });
});
userRouter.put('/profile', async (req, res) => {
  const allowed = ['firstName','lastName','businessName','phone'];
  const updates = {};
  for (const f of allowed) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  await req.user.update(updates);
  res.json({ success: true, data: { user: req.user.toPublic() } });
});
userRouter.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { User } = require('../models/index');
  const user = await User.findByPk(req.user.id);
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password incorrect' });
  }
  await user.update({ password: newPassword });
  res.json({ success: true, message: 'Password updated' });
});
userRouter.get('/usage', async (req, res) => {
  const limits = req.user.getPlanLimits();
  res.json({ success: true, data: {
    plan: req.user.plan, limits,
    used: { conversations: req.user.conversationsThisMonth, messages: req.user.messagesThisMonth },
  }});
});
module.exports.userRouter = userRouter;

// ── Webhook Routes ────────────────────────────────
const webhookRouter = express.Router();
const webhook = require('../controllers/webhookController');
webhookRouter.get('/:verifyToken',  webhook.handleVerify);
webhookRouter.post('/:verifyToken', webhook.handleIncoming);
module.exports.webhookRouter = webhookRouter;

// ── Telegram Webhook Routes ───────────────────────
const telegramRouter = express.Router();
const telegram = require('../controllers/telegramController');
telegramRouter.post('/:botToken', telegram.handleTelegramIncoming);
module.exports.telegramRouter = telegramRouter;
