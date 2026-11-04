/**
 * Request Validation Middleware
 */

const { BadRequestError } = require("../utils/errors");

function validateRequired(fields = [], source = "body") {
  return (req, res, next) => {
    const data = req[source] || {};
    const missing = [];

    for (const field of fields) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Field wajib diisi: ${missing.join(", ")}`,
        errors: missing.map(f => ({ field: f, message: `${f} wajib diisi` })),
      });
    }

    next();
  };
}

module.exports = {
  validateRequired,
};
