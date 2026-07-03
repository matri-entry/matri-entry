'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

// ─── Token Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a short-lived JWT access token.
 *
 * @param {object} payload - Data to embed (id, role, username)
 * @returns {string} Signed JWT string
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

/**
 * Generate a long-lived JWT refresh token.
 *
 * @param {object} payload - Minimal payload (id only is fine)
 * @returns {string} Signed JWT string
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

/**
 * Verify and decode a JWT access token.
 *
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify and decode a JWT refresh token.
 *
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// ─── Password Helpers ─────────────────────────────────────────────────────────

/**
 * Hash a plain-text password using bcrypt.
 *
 * @param {string} password - Plain-text password
 * @returns {Promise<string>} bcrypt hash
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against its stored bcrypt hash.
 *
 * @param {string} password   - Plain-text password from the request
 * @param {string} hash       - Stored bcrypt hash
 * @returns {Promise<boolean>} True if the password matches
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// ─── Cookie Options ───────────────────────────────────────────────────────────

/**
 * Build cookie options for the refresh-token httpOnly cookie.
 *
 * @returns {import('express').CookieOptions}
 */
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  refreshCookieOptions,
};
