const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edukanban_secret_key');
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive.'
      });
    }

    // Add user and session info to request
    req.user = user;
    req.userId = user._id;
    req.sessionId = decoded.sessionId;

    // Log API access
    await ActivityLog.create({
      userId: user._id,
      sessionId: req.sessionId,
      action: 'page_visit',
      entity: {
        type: 'system'
      },
      details: {
        endpoint: req.originalUrl,
        method: req.method,
        params: req.params,
        query: req.query
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

module.exports = authMiddleware;