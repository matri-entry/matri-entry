'use strict';

const mongoose = require('mongoose');

/**
 * DataEntry schema.
 *
 * Each document represents one matrimonial profile entry assigned to a user.
 * Slots are pre-created as 'blank' when a user is created.
 * Users fill in the data and transition status: blank → draft → submitted.
 * Once submitted, users cannot edit the entry — only admin can.
 */
const dataEntrySchema = new mongoose.Schema(
  {
    /** 1-indexed slot position within the user's allocated slots */
    slotNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    /** Owning user */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── General Information ─────────────────────────────────────────────────

    /** Manually entered profile identifier — unique per user, not globally */
    profileId: {
      type: String,
      trim: true,
      // Removed default: null to prevent indexing conflicts
    },

    /** Date profile was posted (free-text as displayed in source document) */
    postedOn: { type: String, trim: true, default: null },

    /** Last update date (free-text as displayed in source document) */
    lastUpdatedOn: { type: String, trim: true, default: null },

    // ── Personal Information ────────────────────────────────────────────────

    name: { type: String, trim: true, default: null },

    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', null],
      default: null,
    },

    age: { type: Number, default: null, min: 0 },

    education: { type: String, trim: true, default: null },

    /** Additional detail about education qualification */
    educationDetail: { type: String, trim: true, default: null },

    occupation: { type: String, trim: true, default: null },

    maritalStatus: {
      type: String,
      enum: ['Single', 'UnMarried', 'Married', 'Divorced', 'Widowed', 'Awaiting Divorce', null],
      default: null,
    },

    religion: { type: String, trim: true, default: null },

    caste: { type: String, trim: true, default: null },

    subCaste: { type: String, trim: true, default: null },

    gothram: { type: String, trim: true, default: null },

    familyType: { type: String, trim: true, default: null },

    motherTongue: { type: String, trim: true, default: null },

    /** Birth star / Nakshatra */
    star: { type: String, trim: true, default: null },

    /** Rasi / Moon sign */
    rassi: { type: String, trim: true, default: null },

    /** Dhosham / Mangalik status */
    dhosham: { type: String, trim: true, default: null },

    /** Horoscope match preference */
    horoscopeMatch: { type: String, trim: true, default: null },

    height: { type: String, trim: true, default: null },

    weight: { type: String, trim: true, default: null },

    bodyType: { type: String, trim: true, default: null },

    physicalStatus: { type: String, trim: true, default: null },

    complexion: { type: String, trim: true, default: null },

    eatingHabit: { type: String, trim: true, default: null },

    smokeHabit: { type: String, trim: true, default: null },

    drinkHabit: { type: String, trim: true, default: null },

    citizenOf: { type: String, trim: true, default: null },

    countryLivingIn: { type: String, trim: true, default: null },

    /** State of origin / home state */
    homeState: { type: String, trim: true, default: null },

    familyValue: { type: String, trim: true, default: null },

    familyStatus: { type: String, trim: true, default: null },

    annualIncome: { type: String, trim: true, default: null },

    // ── Description Sections (free-text, long form) ─────────────────────────

    /** About the candidate's family */
    aboutFamily: { type: String, trim: true, default: null },

    /** More description / self-introduction */
    moreDescription: { type: String, trim: true, default: null },

    /** Partner expectations */
    expectations: { type: String, trim: true, default: null },

    // ── Legacy / Location Fields (kept for backward compatibility) ──────────

    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    mobileNumber: { type: String, trim: true, default: null },
    additionalNotes: { type: String, trim: true, default: null },

    // ── Workflow Status ────────────────────────────────────────────────────

    status: {
      type: String,
      enum: ['blank', 'draft', 'submitted'],
      default: 'blank',
    },

    submittedAt: { type: Date, default: null },
    lastEditedAt: { type: Date, default: null },

    /** True when an admin has modified this entry after user submission */
    editedByAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────

/**
 * Primary compound index: ensures slot numbers are unique per user.
 */
dataEntrySchema.index({ userId: 1, slotNumber: 1 }, { unique: true });

/**
 * Partial compound index: profileId must be unique per user, but ONLY
 * if profileId is explicitly provided as a string. 
 * This prevents Duplicate Key errors on blank slots.
 */
dataEntrySchema.index(
  { userId: 1, profileId: 1 },
  { unique: true, partialFilterExpression: { profileId: { $type: 'string' } } }
);

module.exports = mongoose.model('DataEntry', dataEntrySchema);
