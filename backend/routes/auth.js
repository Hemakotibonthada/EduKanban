const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuthLog = require('../models/AuthLog');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, and number
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Helper function to get device info
const getDeviceInfo = (req) => {
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  return {
    userAgent,
    ipAddress,
    device: userAgent.includes('Mobile') ? 'mobile' : 'desktop',
    platform: userAgent.includes('Windows') ? 'Windows' : 
              userAgent.includes('Mac') ? 'macOS' : 
              userAgent.includes('Linux') ? 'Linux' : 'Unknown',
    browser: userAgent.includes('Chrome') ? 'Chrome' :
             userAgent.includes('Firefox') ? 'Firefox' :
             userAgent.includes('Safari') ? 'Safari' : 'Unknown'
  };
};

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await AuthLog.create({
        email: req.body.email,
        action: 'register_failed',
        status: 'failed',
        failureReason: 'validation_error',
        deviceInfo: getDeviceInfo(req)
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, username, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      await AuthLog.create({
        email,
        action: 'register_failed',
        status: 'failed',
        failureReason: existingUser.email === email ? 'email_exists' : 'username_exists',
        deviceInfo: getDeviceInfo(req)
      });

      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      username,
      firstName,
      lastName
    });

    await user.save();

    // Generate session ID and JWT
    const sessionId = crypto.randomUUID();
    const token = jwt.sign(
      { userId: user._id, sessionId },
      process.env.JWT_SECRET || 'edukanban_secret_key',
      { expiresIn: '7d' }
    );

    // Log successful registration
    await AuthLog.create({
      userId: user._id,
      email,
      action: 'register_success',
      status: 'success',
      sessionInfo: { sessionId },
      deviceInfo: getDeviceInfo(req)
    });

    // Log user activity
    await ActivityLog.create({
      userId: user._id,
      sessionId,
      action: 'register',
      entity: { type: 'user', id: user._id },
      metadata: getDeviceInfo(req)
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profile: user.profile,
          preferences: user.preferences
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    await AuthLog.create({
      email: req.body.email,
      action: 'register_failed',
      status: 'failed',
      failureReason: 'system_error',
      deviceInfo: getDeviceInfo(req)
    });

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await AuthLog.create({
        email: req.body.email,
        action: 'login_failed',
        status: 'failed',
        failureReason: 'validation_error',
        deviceInfo: getDeviceInfo(req)
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      await AuthLog.create({
        email,
        action: 'login_failed',
        status: 'failed',
        failureReason: 'user_not_found',
        deviceInfo: getDeviceInfo(req)
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      await AuthLog.create({
        userId: user._id,
        email,
        action: 'login_failed',
        status: 'failed',
        failureReason: 'account_inactive',
        deviceInfo: getDeviceInfo(req)
      });

      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await AuthLog.create({
        userId: user._id,
        email,
        action: 'login_failed',
        status: 'failed',
        failureReason: 'invalid_credentials',
        deviceInfo: getDeviceInfo(req)
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate session ID and JWT
    const sessionId = crypto.randomUUID();
    const token = jwt.sign(
      { userId: user._id, sessionId },
      process.env.JWT_SECRET || 'edukanban_secret_key',
      { expiresIn: '7d' }
    );

    // Update user's last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await AuthLog.create({
      userId: user._id,
      email,
      action: 'login_success',
      status: 'success',
      sessionInfo: { sessionId },
      deviceInfo: getDeviceInfo(req)
    });

    // Log user activity
    await ActivityLog.create({
      userId: user._id,
      sessionId,
      action: 'login',
      entity: { type: 'user', id: user._id },
      metadata: getDeviceInfo(req)
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profile: user.profile,
          preferences: user.preferences,
          stats: user.stats,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    await AuthLog.create({
      email: req.body.email,
      action: 'login_failed',
      status: 'failed',
      failureReason: 'system_error',
      deviceInfo: getDeviceInfo(req)
    });

    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edukanban_secret_key');
      
      if (decoded.userId) {
        // Log logout activity
        await Promise.all([
          AuthLog.create({
            userId: decoded.userId,
            email: 'unknown', // We don't have email in token
            action: 'logout',
            status: 'success',
            sessionInfo: { sessionId: decoded.sessionId },
            deviceInfo: getDeviceInfo(req)
          }),
          ActivityLog.create({
            userId: decoded.userId,
            sessionId: decoded.sessionId,
            action: 'logout',
            entity: { type: 'user', id: decoded.userId },
            metadata: getDeviceInfo(req)
          })
        ]);
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edukanban_secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or inactive user'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profile: user.profile,
          preferences: user.preferences,
          stats: user.stats
        }
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token to user (expires in 1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Log the attempt
    await AuthLog.create({
      userId: user._id,
      email,
      action: 'password_reset_request',
      status: 'success',
      deviceInfo: getDeviceInfo(req)
    });

    // In a production app, you would send an email here
    // For now, we'll log the reset URL
    console.log('Password Reset URL:', resetUrl);
    console.log('Token (for testing):', resetToken);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In development, include the token
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken, 
        resetUrl,
        note: 'In production, this would be sent via email' 
      })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      await AuthLog.create({
        email: 'unknown',
        action: 'password_reset_success',
        status: 'failed',
        failureReason: 'invalid_token',
        deviceInfo: getDeviceInfo(req)
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Log successful password reset
    await AuthLog.create({
      userId: user._id,
      email: user.email,
      action: 'password_reset_success',
      status: 'success',
      deviceInfo: getDeviceInfo(req)
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

module.exports = router;