'use strict';

const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { Parser } = require('json2csv');

const User = require('../models/User');
const DataEntry = require('../models/DataEntry');
const ActivityLog = require('../models/ActivityLog');
const { hashPassword } = require('../utils/helpers');

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Create N blank DataEntry slots for a user, starting from nextSlot.
 *
 * @param {mongoose.Types.ObjectId} userId
 * @param {number} nextSlot - The 1-indexed slot to start from
 * @param {number} count    - How many slots to create
 * @returns {Promise<void>}
 */
const createBlankSlots = async (userId, nextSlot, count) => {
  if (count <= 0) return;
  const docs = Array.from({ length: count }, (_, i) => ({
    userId,
    slotNumber: nextSlot + i,
    status: 'blank',
  }));
  await DataEntry.insertMany(docs, { ordered: false });
};

/**
 * Compute completedCount and pendingCount mathematically based on assignedCount.
 * Pending = Assigned - Completed (never queried from blank/draft status)
 *
 * @param {mongoose.Types.ObjectId|string} userId
 * @param {number} assignedCount - The user's total assigned slot count
 * @returns {Promise<{ completedCount: number, pendingCount: number }>}
 */
const getUserStats = async (userId, assignedCount) => {
  const completedCount = await DataEntry.countDocuments({ userId, status: 'submitted' });
  
  // Enforce strict mathematics. Use Math.max to prevent negative pending 
  // counts in edge cases where a manual DB deletion occurs.
  const pendingCount = Math.max(0, (assignedCount || 0) - completedCount);
  
  return { completedCount, pendingCount };
};

/**
 * Validate request body and throw 422 if any express-validator errors exist.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {boolean} true if there were errors (response already sent)
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

// ─── User Management ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 *
 * Returns all non-admin users with aggregated entry stats.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).lean().sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const stats = await getUserStats(u._id, u.assignedCount);
        return { ...u, ...stats };
      })
    );

    return res.status(200).json({ success: true, data: usersWithStats });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/admin/users
 *
 * Creates a new data-entry user and pre-populates N blank DataEntry slots.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createUser = async (req, res, next) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { fullName, username, password, mobileNumber, email, assignedCount } = req.body;

    // Check for duplicate username
    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Username already taken.' });
    }

    const passwordHash = await hashPassword(password);
    const count = Number(assignedCount) || 0;

    // Create user with assignedCount=0 first; we'll update it after slots are created.
    // This prevents a mismatch if insertMany partially fails (duplicate key errors
    // on retry), which would leave assignedCount higher than actual slot count.
    const user = await User.create({
      fullName,
      username: username.toLowerCase().trim(),
      passwordHash,
      mobileNumber,
      email: email || null,
      assignedCount: 0,
      role: 'user',
    });

    // Pre-create blank DataEntry slots
    if (count > 0) {
      await createBlankSlots(user._id, 1, count);
    }

    // ── CRITICAL FIX: recalculate assignedCount from actual DB rows ──────────
    // insertMany with { ordered: false } silently skips duplicate-key failures.
    // Counting actual documents ensures assignedCount always matches reality.
    const actualCount = await DataEntry.countDocuments({ userId: user._id });
    user.assignedCount = actualCount;
    await user.save();

    return res.status(201).json({
      success: true,
      message: `User created with ${actualCount} blank data entry slots.`,
      data: user,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/users/:id
 *
 * Returns a single user plus entry stats.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const stats = await getUserStats(user._id, user.assignedCount);
    return res.status(200).json({ success: true, data: { ...user, ...stats } });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/users/:id
 *
 * Updates editable user profile fields.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateUser = async (req, res, next) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { fullName, mobileNumber, email } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'user' },
      { fullName, mobileNumber, email: email || null, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 *
 * Deletes a user and all their DataEntry records.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'user' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await Promise.all([
      DataEntry.deleteMany({ userId: user._id }),
      ActivityLog.deleteMany({ userId: user._id }),
      user.deleteOne(),
    ]);

    return res.status(200).json({ success: true, message: 'User and all associated data deleted.' });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/admin/users/:id/reset-password
 *
 * Admin-initiated password reset for a user.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resetPassword = async (req, res, next) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { newPassword } = req.body;
    const passwordHash = await hashPassword(newPassword);

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'user' },
      { passwordHash, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/users/:id/extend-expiry
 *
 * Adds N days to the user's expiryAt date.
 * If expiryAt is null (first login not done yet), extends from now.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const extendExpiry = async (req, res, next) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const days = Number(req.body.days);
    if (!days || days < 1) {
      return res.status(400).json({ success: false, message: 'days must be a positive integer.' });
    }

    const user = await User.findOne({ _id: req.params.id, role: 'user' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const base = user.expiryAt ? new Date(user.expiryAt) : new Date();
    base.setDate(base.getDate() + days);
    user.expiryAt = base;
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Expiry extended by ${days} day(s).`,
      expiryAt: user.expiryAt,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/users/:id/toggle-active
 *
 * Toggles the isActive flag for a user.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const toggleActive = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'user' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: user.isActive,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/users/:id/assigned-count
 *
 * Changes the total number of DataEntry slots for a user.
 *  - If newCount > current: creates additional blank slots
 *  - If newCount < current: removes trailing blank slots (only blank ones)
 *  - If newCount === current: no-op
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateAssignedCount = async (req, res, next) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const newCount = Number(req.body.newCount);
    if (isNaN(newCount) || newCount < 0) {
      return res.status(400).json({ success: false, message: 'newCount must be a non-negative integer.' });
    }

    const user = await User.findOne({ _id: req.params.id, role: 'user' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const currentCount = user.assignedCount;

    if (newCount > currentCount) {
      // Add new blank slots from currentCount+1 to newCount
      await createBlankSlots(user._id, currentCount + 1, newCount - currentCount);
    } else if (newCount < currentCount) {
      // Remove trailing blank slots (highest slot numbers first, only blank)
      const toRemove = currentCount - newCount;
      const trailingBlank = await DataEntry.find({
        userId: user._id,
        status: 'blank',
      })
        .sort({ slotNumber: -1 })
        .limit(toRemove)
        .select('_id');

      if (trailingBlank.length > 0) {
        await DataEntry.deleteMany({ _id: { $in: trailingBlank.map((e) => e._id) } });
      }
    }

    // Recalculate the actual count from DB to keep assignedCount accurate
    const actualCount = await DataEntry.countDocuments({ userId: user._id });
    user.assignedCount = actualCount;
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Assigned count updated to ${user.assignedCount}.`,
      assignedCount: user.assignedCount,
    });
  } catch (err) {
    return next(err);
  }
};

// ─── Entry Management ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/entries
 *
 * Returns paginated DataEntry records with optional filters.
 * Query params: search, status, userId, page (default 1), limit (default 50)
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const listEntries = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId.' });
      }
      filter.userId = req.query.userId;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: regex },
        { profileId: regex },
        { mobileNumber: regex },
        { city: regex },
        { caste: regex },
      ];
    }

    const [entries, total] = await Promise.all([
      DataEntry.find(filter)
        .populate('userId', 'fullName username')
        .sort({
      status: -1,
      submittedAt: -1,
      slotNumber: 1,
    })
        .skip(skip)
        .limit(limit)
        .lean(),
      DataEntry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/entries/:id
 *
 * Admin edits any entry (sets editedByAdmin=true, lastEditedAt=now).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const adminUpdateEntry = async (req, res, next) => {
  try {
    const allowedFields = [
      // General
      'profileId', 'postedOn', 'lastUpdatedOn',
      // Personal
      'name', 'gender', 'age', 'education', 'educationDetail', 'occupation',
      'maritalStatus', 'religion', 'caste', 'subCaste', 'gothram',
      'familyType', 'motherTongue', 'star', 'rassi', 'dhosham', 'horoscopeMatch',
      'height', 'weight', 'bodyType', 'physicalStatus', 'complexion',
      'eatingHabit', 'smokeHabit', 'drinkHabit',
      'citizenOf', 'countryLivingIn', 'homeState',
      'familyValue', 'familyStatus', 'annualIncome',
      // Description
      'aboutFamily', 'moreDescription', 'expectations',
      // Legacy / location
      'city', 'state', 'mobileNumber', 'additionalNotes',
      // Workflow
      'status',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    updates.editedByAdmin = true;
    updates.lastEditedAt = new Date();
    updates.updatedAt = new Date();

    if (updates.status === 'submitted' && !updates.submittedAt) {
      updates.submittedAt = new Date();
    }

    const entry = await DataEntry.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    return res.status(200).json({ success: true, data: entry });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/admin/entries/:id
 *
 * Resets an entry back to blank (does not physically delete the slot so the
 * user's slot count remains intact).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const adminDeleteEntry = async (req, res, next) => {
  try {
    const entry = await DataEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    // Reset all data fields back to blank defaults
    const resetFields = {
      // General
      profileId: null, postedOn: null, lastUpdatedOn: null,
      // Personal
      name: null, gender: null, age: null,
      education: null, educationDetail: null, occupation: null,
      maritalStatus: null, religion: null, caste: null,
      subCaste: null, gothram: null, familyType: null, motherTongue: null,
      star: null, rassi: null, dhosham: null, horoscopeMatch: null,
      height: null, weight: null, bodyType: null, physicalStatus: null,
      complexion: null, eatingHabit: null, smokeHabit: null, drinkHabit: null,
      citizenOf: null, countryLivingIn: null, homeState: null,
      familyValue: null, familyStatus: null, annualIncome: null,
      // Description
      aboutFamily: null, moreDescription: null, expectations: null,
      // Legacy
      city: null, state: null, mobileNumber: null, additionalNotes: null,
      // Workflow
      status: 'blank', submittedAt: null, lastEditedAt: null,
      editedByAdmin: false, updatedAt: new Date(),
    };

    Object.assign(entry, resetFields);
    await entry.save();

    return res.status(200).json({ success: true, message: 'Entry reset to blank.', data: entry });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/entries/export
 *
 * Streams a CSV file containing all submitted entries.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const exportEntries = async (req, res, next) => {
  try {
    const entries = await DataEntry.find({ status: 'submitted' })
      .populate('userId', 'fullName username')
      .lean();

    if (entries.length === 0) {
      return res.status(200).json({ success: true, message: 'No submitted entries to export.' });
    }

    const fields = [
      { label: 'Slot Number', value: 'slotNumber' },
      { label: 'Operator Name', value: (row) => row.userId?.fullName || '' },
      { label: 'Operator Username', value: (row) => row.userId?.username || '' },
      { label: 'Profile ID', value: 'profileId' },
      { label: 'Posted On', value: 'postedOn' },
      { label: 'Last Updated On', value: 'lastUpdatedOn' },
      { label: 'Name', value: 'name' },
      { label: 'Gender', value: 'gender' },
      { label: 'Age', value: 'age' },
      { label: 'Education', value: 'education' },
      { label: 'Education Detail', value: 'educationDetail' },
      { label: 'Occupation', value: 'occupation' },
      { label: 'Marital Status', value: 'maritalStatus' },
      { label: 'Religion', value: 'religion' },
      { label: 'Caste', value: 'caste' },
      { label: 'Sub Caste', value: 'subCaste' },
      { label: 'Gothram', value: 'gothram' },
      { label: 'Family Type', value: 'familyType' },
      { label: 'Mother Tongue', value: 'motherTongue' },
      { label: 'Star', value: 'star' },
      { label: 'Rassi / Moon Sign', value: 'rassi' },
      { label: 'Dhosham / Mangalik', value: 'dhosham' },
      { label: 'Horoscope Match', value: 'horoscopeMatch' },
      { label: 'Height', value: 'height' },
      { label: 'Weight', value: 'weight' },
      { label: 'Body Type', value: 'bodyType' },
      { label: 'Physical Status', value: 'physicalStatus' },
      { label: 'Complexion', value: 'complexion' },
      { label: 'Eating Habit', value: 'eatingHabit' },
      { label: 'Smoke Habit', value: 'smokeHabit' },
      { label: 'Drink Habit', value: 'drinkHabit' },
      { label: 'Citizen Of', value: 'citizenOf' },
      { label: 'Country Living In', value: 'countryLivingIn' },
      { label: 'Home State', value: 'homeState' },
      { label: 'Family Value', value: 'familyValue' },
      { label: 'Family Status', value: 'familyStatus' },
      { label: 'Annual Income', value: 'annualIncome' },
      { label: 'About Family', value: 'aboutFamily' },
      { label: 'More Description', value: 'moreDescription' },
      { label: 'Expectations', value: 'expectations' },
      { label: 'City', value: 'city' },
      { label: 'State', value: 'state' },
      { label: 'Mobile Number', value: 'mobileNumber' },
      { label: 'Additional Notes', value: 'additionalNotes' },
      { label: 'Status', value: 'status' },
      { label: 'Submitted At', value: 'submittedAt' },
      { label: 'Edited By Admin', value: 'editedByAdmin' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(entries);

    const filename = `entries_export_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
};

// ─── Monitoring & Dashboard ───────────────────────────────────────────────────

/**
 * GET /api/admin/monitoring
 *
 * Returns per-user summary metrics for the monitoring board.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getMonitoring = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).lean().sort({ createdAt: -1 });

    const data = await Promise.all(
      users.map(async (u) => {
        const stats = await getUserStats(u._id, u.assignedCount);
        return {
          userId: u._id,
          fullName: u.fullName,
          username: u.username,
          assignedCount: u.assignedCount,
          completedCount: stats.completedCount,
          pendingCount: stats.pendingCount,
          firstLoginAt: u.firstLoginAt,
          expiryAt: u.expiryAt,
          isActive: u.isActive,
        };
      })
    );

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/dashboard
 *
 * Returns aggregate system-level stats.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      activeUsers,
      expiredUsers,
      totalEntries,
      submittedEntries,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ role: 'user', expiryAt: { $lt: now } }),
      DataEntry.countDocuments({}),
      DataEntry.countDocuments({ status: 'submitted' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        expiredUsers,
        totalEntries,
        submittedEntries,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  // User management
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  resetPassword,
  extendExpiry,
  toggleActive,
  updateAssignedCount,
  // Entry management
  listEntries,
  adminUpdateEntry,
  adminDeleteEntry,
  exportEntries,
  // Monitoring
  getMonitoring,
  getDashboard,
};
