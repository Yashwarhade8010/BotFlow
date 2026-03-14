'use strict';
const success  = (res, data, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

const created  = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

const error    = (res, message = 'Error', status = 400, errors = null) =>
  res.status(status).json({ success: false, message, errors });

const paginated = (res, rows, total, page, limit) =>
  res.status(200).json({
    success: true, data: rows, pagination: {
      total, page: Number(page), limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  });

module.exports = { success, created, error, paginated };
