'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { login, refresh, logout } = require('../controllers/authController');

const router = express.Router();

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
/**
 * Limit login attempts to 10 per 15 minutes per IP to mitigate brute-force.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ─── Validation Rules ─────────────────────────────────────────────────────────
const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ max: 50 }).withMessage('Username too long.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/** POST /api/auth/login */
router.post('/login', loginLimiter, loginValidation, login);

/** POST /api/auth/refresh */
router.post('/refresh', refresh);

/** POST /api/auth/logout */
router.post('/logout', logout);

module.exports = router;
