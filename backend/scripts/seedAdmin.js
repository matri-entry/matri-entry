'use strict';

/**
 * seedAdmin.js
 *
 * One-time script that creates the master admin account if it does not already
 * exist.  Run with:
 *   npm run seed
 *
 * Requires a .env file (or environment variables) with MONGODB_URI set.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const ADMIN_CREDENTIALS = {
  fullName: 'Master Admin',
  username: 'admin',
  password: 'Admin@123',
  role: 'admin',
  isActive: true,
  mobileNumber: '0000000000',
};

const SALT_ROUNDS = 12;

const seed = async () => {
  try {
    // ── Connect ──────────────────────────────────────────────────────────────
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[seed] Connected to MongoDB.');

    // ── Check if admin already exists ────────────────────────────────────────
    const existing = await User.findOne({
      username: ADMIN_CREDENTIALS.username,
      role: 'admin',
    });

    if (existing) {
      console.log('[seed] Admin account already exists. No changes made.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // ── Hash password ────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(ADMIN_CREDENTIALS.password, SALT_ROUNDS);

    // ── Create admin user ────────────────────────────────────────────────────
    await User.create({
      fullName: ADMIN_CREDENTIALS.fullName,
      username: ADMIN_CREDENTIALS.username,
      passwordHash,
      mobileNumber: ADMIN_CREDENTIALS.mobileNumber,
      role: ADMIN_CREDENTIALS.role,
      isActive: ADMIN_CREDENTIALS.isActive,
      assignedCount: 0,
    });

    console.log('────────────────────────────────────────');
    console.log('[seed] ✅  Master admin created successfully!');
    console.log(`        Username : ${ADMIN_CREDENTIALS.username}`);
    console.log(`        Password : ${ADMIN_CREDENTIALS.password}`);
    console.log('        ⚠️  Change the password after first login!');
    console.log('────────────────────────────────────────');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[seed] ❌ Error:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seed();
