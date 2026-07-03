'use strict';

const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using the URI defined in .env.
 * Exits the process on connection failure so the issue is immediately visible.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 no longer needs useNewUrlParser / useUnifiedTopology
    });
    console.log(`[mongodb] Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[mongodb] Connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
