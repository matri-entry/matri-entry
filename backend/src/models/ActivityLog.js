'use strict';

const mongoose = require('mongoose');

/**
 * ActivityLog schema.
 *
 * Immutable audit trail — documents are only ever created, never updated.
 * Automatically expires after 90 days via TTL index (optional; remove if you
 * need to keep logs forever).
 */
const activityLogSchema = new mongoose.Schema(
  {
    /** The user who performed the action (nullable for system actions) */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    /**
     * Action identifier:
     *  'login' | 'logout' | 'entry_submitted' | 'entry_edited' | 'entry_draft'
     */
    action: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'entry_submitted', 'entry_edited', 'entry_draft'],
    },

    /** Arbitrary key-value pairs providing context for the action */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /** Originating IP address */
    ipAddress: {
      type: String,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Disable updatedAt — logs are append-only
    timestamps: false,
    // Optimise storage by not adding __v
    versionKey: false,
  }
);

// TTL index: automatically remove logs older than 90 days.
// Comment this out if you need permanent audit trails.
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
