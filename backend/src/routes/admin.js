'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  resetPassword,
  extendExpiry,
  toggleActive,
  updateAssignedCount,
  listEntries,
  adminUpdateEntry,
  adminDeleteEntry,
  exportEntries,
  getMonitoring,
  getDashboard,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createUserValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isAlphanumeric().withMessage('Username must be alphanumeric.')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required.'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email address.'),
  body('assignedCount')
    .optional()
    .isInt({ min: 0 }).withMessage('assignedCount must be a non-negative integer.'),
];

const updateUserValidation = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty.'),
  body('mobileNumber').optional().trim().notEmpty().withMessage('Mobile number cannot be empty.'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Invalid email address.'),
];

const resetPasswordValidation = [
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const extendExpiryValidation = [
  body('days')
    .isInt({ min: 1 }).withMessage('days must be a positive integer.'),
];

const assignedCountValidation = [
  body('newCount')
    .isInt({ min: 0 }).withMessage('newCount must be a non-negative integer.'),
];

// ─── User Management Routes ───────────────────────────────────────────────────

/** GET /api/admin/users */
router.get('/users', listUsers);

/** POST /api/admin/users */
router.post('/users', createUserValidation, createUser);

/** GET /api/admin/users/:id */
router.get('/users/:id', getUser);

/** PUT /api/admin/users/:id */
router.put('/users/:id', updateUserValidation, updateUser);

/** DELETE /api/admin/users/:id */
router.delete('/users/:id', deleteUser);

/** POST /api/admin/users/:id/reset-password */
router.post('/users/:id/reset-password', resetPasswordValidation, resetPassword);

/** PUT /api/admin/users/:id/extend-expiry */
router.put('/users/:id/extend-expiry', extendExpiryValidation, extendExpiry);

/** PUT /api/admin/users/:id/toggle-active */
router.put('/users/:id/toggle-active', toggleActive);

/** PUT /api/admin/users/:id/assigned-count */
router.put('/users/:id/assigned-count', assignedCountValidation, updateAssignedCount);

// ─── Entry Management Routes ──────────────────────────────────────────────────

/**
 * GET /api/admin/entries/export
 * IMPORTANT: must be declared BEFORE /entries/:id to avoid route shadowing.
 */
router.get('/entries/export', exportEntries);

/** GET /api/admin/entries */
router.get('/entries', listEntries);

/** PUT /api/admin/entries/:id */
router.put('/entries/:id', adminUpdateEntry);

/** DELETE /api/admin/entries/:id */
router.delete('/entries/:id', adminDeleteEntry);

// ─── Monitoring & Dashboard Routes ───────────────────────────────────────────

/** GET /api/admin/monitoring */
router.get('/monitoring', getMonitoring);

/** GET /api/admin/dashboard */
router.get('/dashboard', getDashboard);

module.exports = router;
