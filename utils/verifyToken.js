import jwt from "jsonwebtoken";
import { createError } from "./error.js";

// ✅ Verify token from Authorization header
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // No Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createError(401, "You are not authenticated!"));
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(createError(403, "Token is not valid!"));
    }

    req.user = user;
    next();
  });
};

// ✅ Verify user (same user or admin)
export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.role === "admin") {
      next();
    } else {
      return next(createError(403, "You are not authorized!"));
    }
  });
};

// ✅ Verify admin
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      next();
    } else {
      return next(createError(403, "Admin access only!"));
    }
  });
};
