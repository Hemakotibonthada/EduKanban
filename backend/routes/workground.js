const express = require('express');
const { body, validationResult } = require('express-validator');
const Workground = require('../models/Workground');

const router = express.Router();

/**
 * @route   POST /api/workground/save
 * @desc    Save workground session
 * @access  Private
 */
router.post('/save', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('language').notEmpty().withMessage('Language is required'),
  body('files').isArray().withMessage('Files must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.id || req.user?._id;
    const { name, language, files, description, tags } = req.body;

    // Create or update workground
    const workground = await Workground.create({
      user: userId,
      name,
      language,
      files,
      description,
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: 'Workground saved successfully',
      workground
    });

  } catch (error) {
    console.error('Error saving workground:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save workground',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/workground
 * @desc    Get all workgrounds for user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { page = 1, limit = 20, language } = req.query;

    const query = { user: userId };
    if (language) {
      query.language = language;
    }

    const workgrounds = await Workground.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Workground.countDocuments(query);

    res.json({
      success: true,
      workgrounds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching workgrounds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workgrounds'
    });
  }
});

/**
 * @route   GET /api/workground/:id
 * @desc    Get specific workground
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    const workground = await Workground.findOne({
      _id: id,
      user: userId
    });

    if (!workground) {
      return res.status(404).json({
        success: false,
        message: 'Workground not found'
      });
    }

    res.json({
      success: true,
      workground
    });

  } catch (error) {
    console.error('Error fetching workground:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workground'
    });
  }
});

/**
 * @route   PUT /api/workground/:id
 * @desc    Update workground
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const updates = req.body;

    const workground = await Workground.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!workground) {
      return res.status(404).json({
        success: false,
        message: 'Workground not found'
      });
    }

    res.json({
      success: true,
      message: 'Workground updated successfully',
      workground
    });

  } catch (error) {
    console.error('Error updating workground:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workground'
    });
  }
});

/**
 * @route   DELETE /api/workground/:id
 * @desc    Delete workground
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    const workground = await Workground.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!workground) {
      return res.status(404).json({
        success: false,
        message: 'Workground not found'
      });
    }

    res.json({
      success: true,
      message: 'Workground deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting workground:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workground'
    });
  }
});

/**
 * @route   POST /api/workground/execute
 * @desc    Execute code (for server-side languages)
 * @access  Private
 */
router.post('/execute', [
  body('code').notEmpty().withMessage('Code is required'),
  body('language').notEmpty().withMessage('Language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { code, language } = req.body;

    // Note: In production, use a sandboxed execution environment
    // This is a placeholder that returns a message
    const output = `Code execution for ${language} is not yet configured on the server.\nFor now, JavaScript can be executed client-side.\n\nSubmitted code:\n${code.substring(0, 100)}...`;

    res.json({
      success: true,
      output,
      executionTime: 0
    });

  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({
      success: false,
      message: 'Code execution failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
