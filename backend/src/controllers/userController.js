'use strict';

const { validationResult } = require('express-validator');
const DataEntry = require('../models/DataEntry');
const ActivityLog = require('../models/ActivityLog');

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Extract originating IP from the request.
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
 * GET /api/user/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [completedCount, pendingCount] = await Promise.all([
      DataEntry.countDocuments({ userId, status: 'submitted' }),
      DataEntry.countDocuments({ userId, status: { $in: ['blank', 'draft'] } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          fullName: req.user.fullName,
          username: req.user.username,
          role: req.user.role,
          assignedCount: req.user.assignedCount,
          firstLoginAt: req.user.firstLoginAt,
          expiryAt: req.user.expiryAt,
          isActive: req.user.isActive,
        },
        completedCount,
        pendingCount,
        assignedCount: req.user.assignedCount,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/user/profile
 */
const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: req.user });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/user/entries
 */
const getUserEntries = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [entries, total, currentSlot] = await Promise.all([
      DataEntry.find({ userId })
        .sort({ slotNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DataEntry.countDocuments({ userId }),
      DataEntry.findOne({ userId, status: { $in: ['blank', 'draft'] } })
        .sort({ slotNumber: 1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: entries,
      currentSlot: currentSlot || null,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/user/entries/current
 *
 * Returns the next slot that needs to be filled (first blank or draft entry).
 */
const getCurrentEntry = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const entry = await DataEntry.findOne({
      userId,
      status: { $in: ['blank', 'draft'] },
    })
      .sort({ slotNumber: 1 })
      .lean();

    if (!entry) {
      return res.status(200).json({
        success: true,
        message: 'All entries have been submitted.',
        data: null,
      });
    }

    return res.status(200).json({ success: true, data: entry });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/user/entries/:id
 *
 * User submits or saves a draft for one of their own entries.
 * Business rules:
 *  - Can only edit own entries
 *  - Submitted entries are LOCKED — user cannot edit them (403)
 *  - profileId must be unique per user (not globally)
 *  - On status='submitted': sets submittedAt
 *  - On status='draft': sets lastEditedAt
 */
const updateEntry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const userId = req.user._id;
    const { id } = req.params;

    // Confirm the entry belongs to this user
    const entry = await DataEntry.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found or does not belong to you.',
      });
    }

    // ── LOCK: users cannot modify a submitted entry ──────────────────────────
    // Only admin routes (adminUpdateEntry) are allowed to edit submitted data.
    if (entry.status === 'submitted') {
      return res.status(403).json({
        success: false,
        message: 'This record has been submitted and is now locked. Only an administrator can edit it.',
      });
    }

    const {
      // General
      profileId, postedOn, lastUpdatedOn,
      // Personal
      name, age, gender, education, educationDetail, occupation,
      maritalStatus, religion, caste, subCaste, gothram,
      familyType, motherTongue, star, rassi, dhosham, horoscopeMatch,
      height, weight, bodyType, physicalStatus, complexion,
      eatingHabit, smokeHabit, drinkHabit,
      citizenOf, countryLivingIn, homeState,
      familyValue, familyStatus, annualIncome,
      // Description
      aboutFamily, moreDescription, expectations,
      // Legacy / location
      city, state, mobileNumber, additionalNotes,
      // Workflow
      status,
    } = req.body;

    // ── profileId uniqueness check per user ──────────────────────────────────
    if (profileId && profileId !== entry.profileId) {
      const duplicate = await DataEntry.findOne({
        userId,
        profileId,
        _id: { $ne: entry._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Profile ID "${profileId}" is already used in another slot.`,
        });
      }
    }

    // ── Apply updates ────────────────────────────────────────────────────────
    const allowedFields = {
      // General
      profileId, postedOn, lastUpdatedOn,
      // Personal
      name, age, gender, education, educationDetail, occupation,
      maritalStatus, religion, caste, subCaste, gothram,
      familyType, motherTongue, star, rassi, dhosham, horoscopeMatch,
      height, weight, bodyType, physicalStatus, complexion,
      eatingHabit, smokeHabit, drinkHabit,
      citizenOf, countryLivingIn, homeState,
      familyValue, familyStatus, annualIncome,
      // Description
      aboutFamily, moreDescription, expectations,
      // Legacy / location
      city, state, mobileNumber, additionalNotes,
    };

    Object.keys(allowedFields).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        entry[key] = allowedFields[key];
      }
    });

    const newStatus = status || 'draft';
    entry.status = newStatus;
    entry.lastEditedAt = new Date();
    entry.updatedAt = new Date();

    if (newStatus === 'submitted') {
      entry.submittedAt = entry.submittedAt || new Date();
    }

    await entry.save();

    // ── Log activity ─────────────────────────────────────────────────────────
    const actionMap = { submitted: 'entry_submitted', draft: 'entry_draft' };
    const action = actionMap[newStatus] || 'entry_edited';

    await ActivityLog.create({
      userId,
      action,
      metadata: { entryId: entry._id, slotNumber: entry.slotNumber },
      ipAddress: getIP(req),
    }).catch(() => {}); // Non-critical

    return res.status(200).json({ success: true, data: entry });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/user/entries/progress
 */
const getProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [completed, pending] = await Promise.all([
      DataEntry.countDocuments({ userId, status: 'submitted' }),
      DataEntry.countDocuments({ userId, status: { $in: ['blank', 'draft'] } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        completed,
        pending,
        assigned: req.user.assignedCount,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  getUserEntries,
  getCurrentEntry,
  updateEntry,
  getProgress,
};
