const jwt = require('jsonwebtoken');

// Verify JWT and attach user info to request
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded payload (id, role) to request
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based access control with role synonym mapping
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const userRole = req.user.role;

    // Admin has superuser access to all authorized endpoints
    if (userRole === 'Admin') {
      return next();
    }

    // Check direct role match or alias matches
    const hasPermission = roles.some((role) => {
      if (role === userRole) return true;
      if (role === 'Lab Analyst' && userRole === 'Lab Technician') return true;
      if (role === 'Lab Technician' && userRole === 'Lab Analyst') return true;
      if (role === 'Production Staff' && userRole === 'Production Manager') return true;
      if (role === 'Production Manager' && userRole === 'Production Staff') return true;
      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied: '${userRole}' role is not permitted for this action`
      });
    }

    next();
  };
};
