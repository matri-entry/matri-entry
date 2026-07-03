'use strict';

const mongoose = require('mongoose');

/**
 * User schema.
 *
 * Stores operator accounts.  Admins manage the system; users enter matrimonial data.
 * The password is NEVER stored in plain text — only the bcrypt hash is persisted.
 */
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true,
    },

    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /** bcrypt hash — never the raw password */
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
    },

    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required.'],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },

    /** Total number of DataEntry slots allocated to this user */
    assignedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /** Timestamp of the very first successful login */
    firstLoginAt: {
      type: Date,
      default: null,
    },

    /** Account / data-entry period expiry timestamp */
    expiryAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    // Never expose passwordHash in JSON responses
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
