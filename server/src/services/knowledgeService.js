'use strict';
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { KnowledgeSource } = require('../models/index');

async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === '.txt')  return fs.readFileSync(filePath, 'utf8');
    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fs.readFileSync(filePath));
      return data.text;
    }
    if (ext === '.docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    if (ext === '.csv') {
      return new Promise((resolve, reject) => {
        const csv = require('csv-parser');
        const rows = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', row => rows.push(Object.values(row).join(' | ')))
          .on('end', () => resolve(rows.join('\n')))
          .on('error', reject);
      });
    }
    return '';
  } catch (err) {
    logger.error('Text extraction failed:', err.message);
    throw new Error(`Failed to extract text: ${err.message}`);
  }
}

async function scrapeUrl(url) {
  const axios = require('axios');
  const cheerio = require('cheerio');
  const { data } = await axios.get(url, {
    timeout: 15000, headers: { 'User-Agent': 'BotFlow/1.0' },
  });
  const $ = cheerio.load(data);
  $('script, style, nav, footer, header').remove();
  return $('body').text().replace(/\s+/g, ' ').trim().substring(0, 50000);
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 30) chunks.push(chunk.trim());
    i += chunkSize - overlap;
  }
  return chunks;
}

async function indexSource(sourceId) {
  const source = await KnowledgeSource.findByPk(sourceId);
  if (!source) throw new Error('Knowledge source not found');

  await source.update({ status: 'processing' });

  try {
    let rawText = '';
    if (source.type === 'url')          rawText = await scrapeUrl(source.url);
    else if (source.type === 'text')    rawText = source.rawText || '';
    else if (source.filePath)           rawText = await extractText(source.filePath, source.mimeType);

    if (!rawText || rawText.trim().length < 10) throw new Error('No content extracted');

    const chunkTexts = chunkText(rawText);
    const chunks = chunkTexts.map(text => ({
      text,
      tokens: Math.ceil(text.split(/\s+/).length * 1.3),
      metadata: { sourceId: source.id, sourceName: source.name },
    }));

    await source.update({
      rawText:    rawText.substring(0, 100000),
      chunksJson: JSON.stringify(chunks),
      chunkCount: chunks.length,
      totalTokens: chunks.reduce((s, c) => s + (c.tokens || 0), 0),
      status:     'indexed',
      indexedAt:  new Date(),
    });

    logger.info(`Indexed source "${source.name}": ${chunks.length} chunks`);
    return source;
  } catch (err) {
    await source.update({ status: 'failed', errorMessage: err.message });
    logger.error('Indexing failed:', err.message);
    throw err;
  }
}

async function retrieveRelevantChunks(botId, query, topK = 5) {
  try {
    const sources = await KnowledgeSource.findAll({
      where: { botId, status: 'indexed' },
    });
    if (!sources.length) return [];

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = [];

    for (const source of sources) {
      const chunks = source.getChunks();
      for (const chunk of chunks) {
        const text = chunk.text.toLowerCase();
        let score = 0;
        for (const word of queryWords) {
          score += (text.match(new RegExp(word, 'g')) || []).length;
        }
        if (score > 0) scored.push({ text: chunk.text, score });
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, topK).map(s => s.text);
  } catch (err) {
    logger.error('Chunk retrieval failed:', err.message);
    return [];
  }
}

module.exports = { extractText, scrapeUrl, chunkText, indexSource, retrieveRelevantChunks };
