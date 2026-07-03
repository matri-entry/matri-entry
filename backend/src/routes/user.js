'use strict';

const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const {
  getDashboard,
  getProfile,
  getUserEntries,
  getCurrentEntry,
  updateEntry,
  getProgress,
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication (any role)
router.use(requireAuth);

// ─── Validation ───────────────────────────────────────────────────────────────

const updateEntryValidation = [
  body('profileId').optional({ nullable: true }).trim(),
  body('name').optional({ nullable: true }).trim(),
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be a valid number between 0 and 150.'),
  body('gender')
    .optional({ nullable: true })
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other.'),
  body('maritalStatus')
    .optional({ nullable: true })
    .isIn(['Single', 'UnMarried', 'Married', 'Divorced', 'Widowed'])
    .withMessage('Invalid marital status.'),
  body('status')
    .optional()
    .isIn(['blank', 'draft', 'submitted'])
    .withMessage('Status must be blank, draft, or submitted.'),
  body('mobileNumber').optional({ nullable: true }).trim(),
  body('caste').optional({ nullable: true }).trim(),
  body('religion').optional({ nullable: true }).trim(),
  body('education').optional({ nullable: true }).trim(),
  body('occupation').optional({ nullable: true }).trim(),
  body('annualIncome').optional({ nullable: true }).trim(),
  body('city').optional({ nullable: true }).trim(),
  body('state').optional({ nullable: true }).trim(),
  body('height').optional({ nullable: true }).trim(),
  body('additionalNotes').optional({ nullable: true }).trim(),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/** GET /api/user/dashboard */
router.get('/dashboard', getDashboard);

/** GET /api/user/profile */
router.get('/profile', getProfile);

/**
 * GET /api/user/entries/current
 * IMPORTANT: must be before /entries/:id to avoid Express treating 'current' as an :id param.
 */
router.get('/entries/current', getCurrentEntry);

/** GET /api/user/entries/progress */
router.get('/entries/progress', getProgress);

/** GET /api/user/entries */
router.get('/entries', getUserEntries);

/** PUT /api/user/entries/:id */
router.put('/entries/:id', updateEntryValidation, updateEntry);

module.exports = router;
