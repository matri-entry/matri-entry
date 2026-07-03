'use strict';

/**
 * Global error handler middleware.
 *
 * Must be registered AFTER all routes (Express identifies it by its 4-argument
 * signature).  Catches every error passed via next(err).
 *
 * @param {Error}  err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log full stack in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error('[errorHandler]', err);
  } else {
    // In production only log the message to avoid leaking stack details
    console.error('[errorHandler]', err.message);
  }

  // ── Mongoose validation errors ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: messages,
    });
  }

  // ── Mongoose duplicate key error ──────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}. Please use a unique value.`,
    });
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token has expired.' });
  }

  // ── Mongoose CastError (bad ObjectId) ────────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field '${err.path}'.`,
    });
  }

  // ── Custom application errors (attach statusCode & message to err) ────────
  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message || 'An internal server error occurred.';

  return res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
