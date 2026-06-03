/**
 * api/index.js — Vercel function root shim
 *
 * Vercel looks for API functions in the root /api/ directory.
 * This shim re-exports the backend API handler so Vercel can find it
 * while keeping all server logic in backend/.
 *
 * See backend/api/index.js for the full dual-mode documentation
 * (proxy mode vs. serverless fallback mode).
 */
module.exports = require('../backend/api/index.js');
