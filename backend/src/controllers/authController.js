'use strict';

const { validationResult } = require('express-validator');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require('../utils/helpers');

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Extract the originating IP address from the request,
 * accounting for reverse-proxy headers.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
const getIP = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'unknown';

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Authenticates a user with username + password.
 * Business rules:
 *  - isActive=false → 401
 *  - expiryAt in the past (non-admin) → 401 + set isActive=false
 *  - First login → set firstLoginAt + expiryAt (now + 24 days)
 *  - Subsequent logins do NOT overwrite firstLoginAt / expiryAt
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const login = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { username, password } = req.body;
    const cleanedUsername = (username || '').trim().toLowerCase().replace(/^@/, '');

    // ── Find user ────────────────────────────────────────────────────────────
    const user = await User.findOne({ username: cleanedUsername });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // ── Verify password ──────────────────────────────────────────────────────
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // ── isActive check ───────────────────────────────────────────────────────
    if (!user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'Account is inactive. Contact administrator.' });
    }

    // ── Expiry check (non-admin accounts only) ───────────────────────────────
    if (user.role !== 'admin' && user.expiryAt && new Date() > new Date(user.expiryAt)) {
      // Automatically deactivate the expired account
      user.isActive = false;
      await user.save();
      return res.status(401).json({
        success: false,
        message:
          'Your data entry period has expired. Please contact administrator.',
      });
    }

    // ── First-login initialisation ───────────────────────────────────────────
    if (!user.firstLoginAt) {
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 24); // 24 days from first login

      user.firstLoginAt = now;
      user.expiryAt = expiryDate;
      await user.save();
    }

    // ── Generate tokens ──────────────────────────────────────────────────────
    const tokenPayload = { id: user._id, role: user.role, username: user.username };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user._id });

    // ── Set refresh token as httpOnly cookie ─────────────────────────────────
    res.cookie('refreshToken', refreshToken, refreshCookieOptions());

    // ── Log activity ─────────────────────────────────────────────────────────
    await ActivityLog.create({
      userId: user._id,
      action: 'login',
      metadata: { username: user.username },
      ipAddress: getIP(req),
    });

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        assignedCount: user.assignedCount,
        firstLoginAt: user.firstLoginAt,
        expiryAt: user.expiryAt,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/refresh
 *
 * Reads the httpOnly refreshToken cookie, verifies it, and issues a new
 * short-lived access token.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    // Validate user still exists and is active
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'Account is inactive. Contact administrator.' });
    }

    const accessToken = generateAccessToken({
      id: user._id,
      role: user.role,
      username: user.username,
    });

    return res.status(200).json({ success: true, accessToken });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/logout
 *
 * Clears the refresh-token cookie and logs the activity.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const logout = async (req, res, next) => {
  try {
    // Attempt to read userId from the refresh token cookie for the activity log
    let userId = null;
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        const decoded = verifyRefreshToken(token);
        userId = decoded.id;
      }
    } catch {
      // Token may already be expired — still clear the cookie
    }

    // Clear the cookie regardless
    res.clearCookie('refreshToken', { path: '/' });

    // Log the logout action if we could identify the user
    if (userId) {
      await ActivityLog.create({
        userId,
        action: 'logout',
        metadata: {},
        ipAddress: getIP(req),
      }).catch(() => {}); // Non-critical — don't fail the response
    }

    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, refresh, logout };
