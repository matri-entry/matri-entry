'use strict';

const { verifyAccessToken } = require('../utils/helpers');
const User = require('../models/User');

/**
 * requireAuth middleware
 *
 * Verifies the Bearer access token from the Authorization header.
 * Attaches the full user document to req.user on success.
 * Calls next(err) with a 401 error on failure.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('No access token provided.');
      err.statusCode = 401;
      return next(err);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch the user from DB to ensure they still exist and are still active
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 401;
      return next(err);
    }

    if (!user.isActive) {
      const err = new Error('Account is inactive. Contact administrator.');
      err.statusCode = 401;
      return next(err);
    }

    req.user = user;
    return next();
  } catch (err) {
    // JWT errors (expired, invalid) are handled by errorHandler
    return next(err);
  }
};

/**
 * requireAdmin middleware
 *
 * Must be used AFTER requireAuth.
 * Rejects the request with 403 if the authenticated user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const err = new Error('Access denied. Admins only.');
    err.statusCode = 403;
    return next(err);
  }
  return next();
};

module.exports = { requireAuth, requireAdmin };
