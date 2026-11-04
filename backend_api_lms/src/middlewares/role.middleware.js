/**
 * Role Authorization Middleware
 */

const { requireRole, requireAdmin } = require("./auth.middleware");

module.exports = {
  requireRole,
  requireAdmin,
};
