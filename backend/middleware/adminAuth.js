/**
 * Admin Authorization Middleware
 * Ensures that only users with admin role can access protected routes
 */

const adminAuth = (req, res, next) => {
  try {
    // Check if user is authenticated (should be called after auth middleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    // Support both role field and legacy email-based admin check
    const isAdmin = req.user.role === 'admin' || req.user.email === 'admin@circuvent.com';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        error: 'FORBIDDEN'
      });
    }

    // User is admin, proceed to next middleware/route
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization check'
    });
  }
};

module.exports = adminAuth;
