/**
 * Authentication Middleware
 */

const { verifyToken, secret: JWT_SECRET } = require("../config/jwt");
const prisma = require("../config/database");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login.",
    });
  }
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Requires one of: ${roles.join(", ")}`,
      });
    }
    next();
  };
}

async function loadUser(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        teacher: true,
        student: {
          include: {
            class: true,
          },
        },
      },
    });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    if (user.status !== "active") return res.status(403).json({ success: false, message: "Account is inactive" });
    req.dbUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireRole,
  loadUser,
  JWT_SECRET,
};
