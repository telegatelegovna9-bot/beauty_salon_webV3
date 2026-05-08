/**
 * RBAC (Role-Based Access Control) Middleware
 */

const ROLES = {
  ADMIN: 'admin',
  MASTER: 'master',
  CLIENT: 'client'
};

const ROLE_HIERARCHY = {
  admin: 3,
  master: 2,
  client: 1
};

/**
 * Require specific role(s)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
}

/**
 * Require minimum role level
 */
function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: minRole,
        current: req.user.role
      });
    }

    next();
  };
}

/**
 * Admin only
 */
const adminOnly = requireRole(ROLES.ADMIN);

/**
 * Admin or Master
 */
const masterOrAdmin = requireRole(ROLES.ADMIN, ROLES.MASTER);

/**
 * Any authenticated user
 */
function authenticated(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Check if user is admin or owns the resource
 */
function adminOrOwner(getOwnerId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    try {
      const ownerId = await getOwnerId(req);
      if (ownerId && String(ownerId) === String(req.user.id)) {
        return next();
      }
      return res.status(403).json({ error: 'Access denied' });
    } catch (error) {
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

module.exports = {
  ROLES,
  requireRole,
  requireMinRole,
  adminOnly,
  masterOrAdmin,
  authenticated,
  adminOrOwner
};
