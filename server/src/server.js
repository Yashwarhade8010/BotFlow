'use strict';
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { initSocket } = require('./services/index');
require('./models/index'); // register all models + associations

const {
  authRouter, botRouter, knowledgeRouter, convRouter,
  analyticsRouter, userRouter, webhookRouter, telegramRouter,
} = require('./routes/index');

// ── Express App ───────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 15 });

// Raw body for webhooks (signature verification)

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

// Health check
app.get('/health', (req, res) =>
  res.json({ success: true, status: 'healthy', db: 'mysql', timestamp: new Date() })
);

// Routes
app.use('/api/auth',          authLimiter, authRouter);
app.use('/api/users',         limiter, userRouter);
app.use('/api/bots',          limiter, botRouter);
app.use('/api/knowledge',     limiter, knowledgeRouter);
app.use('/api/conversations', limiter, convRouter);
app.use('/api/analytics',     limiter, analyticsRouter);
app.use('/api/webhook',       webhookRouter);
app.use('/api/telegram',      telegramRouter);

// In production, serve React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
  );
}

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Start Server ──────────────────────────────────
async function start() {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);

  // Cron jobs
  if (process.env.NODE_ENV !== 'test') {
    const cron = require('node-cron');
    const { Bot, Conversation } = require('./models/index');
    const { Op } = require('sequelize');

    // Reset monthly usage (1st of month midnight)
    cron.schedule('0 0 1 * *', async () => {
      await require('./models/index').User.update(
        { conversationsThisMonth: 0, messagesThisMonth: 0, usageResetAt: new Date() },
        { where: {} }
      );
      logger.info('Monthly usage reset completed');
    });

    // Abandon stale conversations (3am daily)
    cron.schedule('0 3 * * *', async () => {
      const cutoff = new Date(); cutoff.setHours(cutoff.getHours() - 24);
      await Conversation.update(
        { status: 'abandoned' },
        { where: { status: 'active', lastMessageAt: { [Op.lt]: cutoff } } }
      );
    });

    // Update bot stats (every 30min)
    cron.schedule('*/30 * * * *', async () => {
      const bots = await Bot.findAll({ attributes: ['id'] });
      for (const bot of bots) {
        const [total, resolved, escalated] = await Promise.all([
          Conversation.count({ where: { botId: bot.id } }),
          Conversation.count({ where: { botId: bot.id, status: 'resolved' } }),
          Conversation.count({ where: { botId: bot.id, status: 'escalated' } }),
        ]);
        await bot.update({
          statsTotalConversations: total,
          statsResolutionRate: total > 0 ? Math.round((resolved/total)*100) : 0,
          statsHandoffRate: total > 0 ? Math.round((escalated/total)*100) : 0,
        });
      }
    });
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => logger.info(`🚀 BotFlow API on http://localhost:${PORT}`));

  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT',  () => server.close(() => process.exit(0)));
}

start().catch(err => { logger.error('Startup failed:', err); process.exit(1); });
