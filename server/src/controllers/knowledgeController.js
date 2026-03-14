'use strict';
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { KnowledgeSource, Bot } = require('../models/index');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, error } = require('../utils/apiResponse');
const knowledgeService = require('../services/knowledgeService');
const logger = require('../utils/logger');

// ── Multer config ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads', req.user.id.toString());
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf','.txt','.docx','.doc','.csv'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error(`Accepted file types: ${allowed.join(', ')}`));
  },
}).single('file');

// GET /api/knowledge/:botId
const getSources = asyncHandler(async (req, res) => {
  const bot = await Bot.findOne({ where: { id: req.params.botId, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  const sources = await KnowledgeSource.findAll({
    where: { botId: bot.id },
    attributes: { exclude: ['chunksJson', 'rawText'] },
    order: [['createdAt', 'DESC']],
  });
  return success(res, { sources, count: sources.length });
});

// POST /api/knowledge/:botId/upload
const uploadFile = asyncHandler(async (req, res) => {
  const bot = await Bot.findOne({ where: { id: req.params.botId, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  return new Promise((resolve) => {
    upload(req, res, async (err) => {
      if (err) return resolve(error(res, err.message, 400));
      if (!req.file) return resolve(error(res, 'No file uploaded', 400));

      const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
      const source = await KnowledgeSource.create({
        botId:    bot.id,
        userId:   req.user.id,
        type:     ext,
        name:     req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status:   'pending',
      });

      knowledgeService.indexSource(source.id).catch(e => logger.error('indexSource error:', e.message));
      resolve(created(res, { source }, 'File uploaded — indexing in background'));
    });
  });
});

// POST /api/knowledge/:botId/text
const addText = asyncHandler(async (req, res) => {
  const { text, name } = req.body;
  if (!text || text.length < 20) return error(res, 'Text too short (min 20 chars)', 400);

  const bot = await Bot.findOne({ where: { id: req.params.botId, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  const source = await KnowledgeSource.create({
    botId: bot.id, userId: req.user.id,
    type: 'text', name: name || 'Pasted text',
    rawText: text, status: 'pending',
  });

  knowledgeService.indexSource(source.id).catch(e => logger.error('indexSource error:', e.message));
  return created(res, { source }, 'Text source added — indexing in background');
});

// POST /api/knowledge/:botId/url
const addUrl = asyncHandler(async (req, res) => {
  const { url, name } = req.body;
  if (!url) return error(res, 'URL required', 400);

  const bot = await Bot.findOne({ where: { id: req.params.botId, userId: req.user.id } });
  if (!bot) return error(res, 'Bot not found', 404);

  const source = await KnowledgeSource.create({
    botId: bot.id, userId: req.user.id,
    type: 'url', name: name || url,
    url, status: 'pending',
  });

  knowledgeService.indexSource(source.id).catch(e => logger.error('indexSource error:', e.message));
  return created(res, { source }, 'URL source added — scraping in background');
});

// DELETE /api/knowledge/:botId/:sourceId
const deleteSource = asyncHandler(async (req, res) => {
  const source = await KnowledgeSource.findOne({
    where: { id: req.params.sourceId, botId: req.params.botId, userId: req.user.id },
  });
  if (!source) return error(res, 'Source not found', 404);

  if (source.filePath && fs.existsSync(source.filePath)) {
    fs.unlinkSync(source.filePath);
  }
  await source.destroy();
  return success(res, {}, 'Source deleted');
});

// POST /api/knowledge/:botId/:sourceId/reindex
const reindexSource = asyncHandler(async (req, res) => {
  const source = await KnowledgeSource.findOne({
    where: { id: req.params.sourceId, botId: req.params.botId, userId: req.user.id },
  });
  if (!source) return error(res, 'Source not found', 404);

  await source.update({ status: 'pending' });
  knowledgeService.indexSource(source.id).catch(e => logger.error('reindex error:', e.message));
  return success(res, {}, 'Re-indexing started');
});

module.exports = { getSources, uploadFile, addText, addUrl, deleteSource, reindexSource };
