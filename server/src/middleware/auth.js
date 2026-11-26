import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { db } from '../db/database.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && req.cookies) {
    token = req.cookies.vistaro_token || req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = db.findById('users', decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organisation_id: user.organisation_id,
      title: user.title,
      phone: user.phone
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && req.cookies) {
    token = req.cookies.vistaro_token || req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = db.findById('users', decoded.id);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organisation_id: user.organisation_id,
        title: user.title,
        phone: user.phone
      };
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'admin') {
      return next(); // Admins have oversight across domains
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access restricted. Your role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
};

export const logAudit = (actorId, actorName, action, entityType, entityId, metadata = {}) => {
  try {
    db.insert('audit_logs', {
      actor_id: actorId,
      actor_name: actorName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Audit logging error:', err);
  }
};
