'use strict';

require('dotenv').config();

console.log(
  process.env.MONGODB_URI
    ? "✅ MongoDB URI Loaded"
    : "❌ MongoDB URI Missing"
);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const userRoutes = require('./src/routes/user');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
(async () => {
  await connectDB();
})();

// ─── Core Middleware ──────────────────────────────────────────────────────────

/**
 * CORS — allow requests only from the front-end dev server.
 * Credentials must be true so that the httpOnly refresh-token cookie
 * is sent/received correctly across origins.
 */
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse incoming JSON bodies (limit 10 kb to reduce abuse surface)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Parse cookies (needed for httpOnly refresh-token)
app.use(cookieParser());

// HTTP request logger — only in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Health-check endpoint
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `[server] Running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
    );
  });
}

module.exports = app;