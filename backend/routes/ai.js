const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const CourseTemplate = require('../models/CourseTemplate');
const CourseTemplateService = require('../services/CourseTemplateService');
const OpenAIService = require('../services/OpenAIService');
const axios = require('axios');

const router = express.Router();

// Validation middleware for course generation
const courseGenerationValidation = [
  body('courseTopic').notEmpty().trim().withMessage('Course topic is required'),
  body('timeCommitment').notEmpty().withMessage('Time commitment is required'),
  body('knowledgeLevel').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid knowledge level')
];

// Mock AI service (in production, this would call OpenAI, Claude, or another AI service)
const generateCourseContent = async (prompt) => {
  // Simulate AI API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock course generation based on the topic
  const mockCourseData = {
    title: `Mastering ${prompt.courseTopic}`,
    description: `A comprehensive ${prompt.knowledgeLevel.toLowerCase()}-level course designed to take you from basics to mastery in ${prompt.courseTopic}. Tailored for ${prompt.timeCommitment} learning commitment.`,
    modules: [
      {
        moduleNumber: 1,
        title: "Foundation & Setup",
        description: `Learn the fundamentals of ${prompt.courseTopic} and set up your development environment.`,
        estimatedDuration: 120, // minutes
        tasks: [
          {
            title: "Introduction to Core Concepts",
            description: `Understand the basic principles and terminology of ${prompt.courseTopic}.`,
            type: "reading",
            estimatedDuration: 45,
            order: 1
          },
          {
            title: "Environment Setup",
            description: "Set up your development environment and tools.",
            type: "exercise",
            estimatedDuration: 30,
            order: 2
          },
          {
            title: "Foundation Knowledge Test",
            description: "Test your understanding of the foundational concepts.",
            type: "quiz",
            estimatedDuration: 15,
            order: 3,
            assessment: {
              questions: [
                {
                  question: `What is the primary purpose of ${prompt.courseTopic}?`,
                  options: [
                    { text: "To solve complex problems efficiently", isCorrect: true },
                    { text: "To make development harder", isCorrect: false },
                    { text: "To replace all other technologies", isCorrect: false },
                    { text: "None of the above", isCorrect: false }
                  ],
                  explanation: `${prompt.courseTopic} is designed to solve complex problems efficiently and improve development workflows.`,
                  points: 1
                }
              ],
              passingScore: 70,
              maxAttempts: 3
            }
          }
        ]
      },
      {
        moduleNumber: 2,
        title: "Core Implementation",
        description: `Dive deep into the core concepts and practical implementation of ${prompt.courseTopic}.`,
        estimatedDuration: 180,
        tasks: [
          {
            title: "Core Concepts Deep Dive",
            description: "Explore advanced concepts and best practices.",
            type: "reading",
            estimatedDuration: 60,
            order: 1
          },
          {
            title: "Hands-on Project",
            description: "Build your first practical project.",
            type: "exercise",
            estimatedDuration: 90,
            order: 2
          },
          {
            title: "Implementation Skills Test",
            description: "Demonstrate your implementation skills.",
            type: "quiz",
            estimatedDuration: 30,
            order: 3,
            assessment: {
              questions: [
                {
                  question: "Which approach is considered best practice?",
                  options: [
                    { text: "Following established patterns", isCorrect: true },
                    { text: "Creating custom solutions for everything", isCorrect: false },
                    { text: "Ignoring documentation", isCorrect: false },
                    { text: "Using deprecated methods", isCorrect: false }
                  ],
                  explanation: "Following established patterns ensures maintainable and scalable code.",
                  points: 1
                }
              ],
              passingScore: 70,
              maxAttempts: 3
            }
          }
        ]
      },
      {
        moduleNumber: 3,
        title: "Advanced Techniques",
        description: "Master advanced techniques and optimization strategies.",
        estimatedDuration: 240,
        tasks: [
          {
            title: "Advanced Patterns & Techniques",
            description: "Learn sophisticated patterns and advanced techniques.",
            type: "reading",
            estimatedDuration: 90,
            order: 1
          },
          {
            title: "Complex Project Implementation",
            description: "Build a complex, real-world project.",
            type: "exercise",
            estimatedDuration: 120,
            order: 2
          },
          {
            title: "Advanced Skills Assessment",
            description: "Prove your mastery of advanced concepts.",
            type: "quiz",
            estimatedDuration: 30,
            order: 3,
            assessment: {
              questions: [
                {
                  question: "When optimizing for performance, which factor is most important?",
                  options: [
                    { text: "Understanding the specific use case", isCorrect: true },
                    { text: "Using the newest technology", isCorrect: false },
                    { text: "Writing the shortest code possible", isCorrect: false },
                    { text: "Avoiding all external dependencies", isCorrect: false }
                  ],
                  explanation: "Performance optimization should always be based on the specific use case and requirements.",
                  points: 1
                }
              ],
              passingScore: 80,
              maxAttempts: 3
            }
          }
        ]
      },
      {
        moduleNumber: 4,
        title: "Mastery & Real-World Application",
        description: "Apply your knowledge to real-world scenarios and build a portfolio project.",
        estimatedDuration: 300,
        tasks: [
          {
            title: "Industry Best Practices",
            description: "Learn industry standards and professional practices.",
            type: "reading",
            estimatedDuration: 60,
            order: 1
          },
          {
            title: "Portfolio Project",
            description: "Create a comprehensive portfolio project demonstrating your skills.",
            type: "project",
            estimatedDuration: 180,
            order: 2
          },
          {
            title: "Final Mastery Exam",
            description: "Comprehensive assessment of all learned concepts.",
            type: "quiz",
            estimatedDuration: 60,
            order: 3,
            assessment: {
              questions: [
                {
                  question: `What makes a ${prompt.courseTopic} expert?`,
                  options: [
                    { text: "Deep understanding + practical experience + continuous learning", isCorrect: true },
                    { text: "Memorizing all documentation", isCorrect: false },
                    { text: "Using only the latest features", isCorrect: false },
                    { text: "Working alone without collaboration", isCorrect: false }
                  ],
                  explanation: "True expertise comes from combining deep understanding with practical experience and a commitment to continuous learning.",
                  points: 2
                }
              ],
              passingScore: 85,
              maxAttempts: 2
            }
          }
        ]
      }
    ]
  };

  return mockCourseData;
};

// Generate course content
const generateModuleContent = async (moduleTitle, courseTopic) => {
  // Mock content generation
  const content = {
    textContent: `
# ${moduleTitle}

## Overview
This module focuses on ${moduleTitle.toLowerCase()} in the context of ${courseTopic}. You'll learn the essential concepts, practical applications, and best practices.

## Key Learning Objectives
- Understand the fundamental concepts
- Apply knowledge through practical exercises
- Master the essential skills for this topic

## Content Structure

### Introduction
${courseTopic} is a powerful approach that enables developers to build robust, scalable solutions. In this module, we'll explore how ${moduleTitle.toLowerCase()} fits into the bigger picture.

### Core Concepts
The main concepts you need to understand include:
1. **Fundamental Principles**: The basic building blocks
2. **Best Practices**: Industry-standard approaches
3. **Common Patterns**: Reusable solutions to common problems

### Practical Application
Through hands-on exercises, you'll:
- Implement core functionality
- Debug common issues
- Optimize for performance
- Follow industry standards

### Summary
By the end of this module, you'll have a solid understanding of ${moduleTitle.toLowerCase()} and be ready to apply these concepts in real-world scenarios.

## Next Steps
Continue to the practical exercises to reinforce your learning, then take the assessment to test your understanding.
    `,
    videoUrls: [], // Will be populated by video search
    resources: [
      {
        title: `Official ${courseTopic} Documentation`,
        url: `https://docs.example.com/${courseTopic.toLowerCase()}`,
        type: 'documentation'
      },
      {
        title: `${moduleTitle} Best Practices Guide`,
        url: `https://bestpractices.example.com/${moduleTitle.toLowerCase()}`,
        type: 'article'
      }
    ],
    codeExamples: []
  };

  return content;
};

// POST /api/ai/generate-course
router.post('/generate-course', courseGenerationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseTopic, timeCommitment, knowledgeLevel } = req.body;
    const userId = req.userId;

    // Step 1: Check for existing template or similar courses
    const templateResult = await CourseTemplateService.findOrCreateCourseTemplate({
      courseTopic,
      knowledgeLevel,
      timeCommitment,
      userId
    });

    let course;
    let responseData = {
      success: true,
      message: '',
      fromCache: false,
      similarity: null
    };

    if (templateResult.cacheHit) {
      // Exact match found - create personalized course from template
      course = await CourseTemplateService.createPersonalizedCourse(
        templateResult.template,
        userId
      );
      
      responseData.fromCache = true;
      responseData.message = 'Course created from existing template';
      responseData.templateUsageCount = templateResult.template.usageCount;
      
    } else if (templateResult.isSimilar) {
      // Similar template found - use as base but may need AI enhancement
      course = await CourseTemplateService.createPersonalizedCourse(
        templateResult.template,
        userId,
        { title: `${courseTopic} - Personalized Course` }
      );
      
      responseData.fromCache = true;
      responseData.message = 'Course created from similar template';
      responseData.similarity = templateResult.similarityScore;
      
    } else {
      // No suitable template found - generate new course with AI
      
      // Log AI generation request
      try {
        await ActivityLog.create({
          userId,
          sessionId: req.sessionId || 'system',
          action: 'ai_generation_request',
          entity: { type: 'system' },
          details: {
            requestType: 'course_generation',
            courseTopic,
            timeCommitment,
            knowledgeLevel
          },
          metadata: {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
          }
        });
      } catch (logError) {
        console.warn('Failed to log AI request:', logError.message);
      }

      // Check if OpenAI is configured
      let courseData;
      if (OpenAIService.isConfigured()) {
        console.log('🤖 Using OpenAI to generate course...');
        courseData = await OpenAIService.generateCourse({
          courseTopic,
          timeCommitment,
          knowledgeLevel
        });
      } else {
        console.log('⚠️  OpenAI not configured, using mock data');
        courseData = await generateCourseContent({
          courseTopic,
          timeCommitment,
          knowledgeLevel
        });
      }

      // Create course template for future reuse
      const template = await CourseTemplateService.createCourseTemplate(courseData, {
        courseTopic,
        knowledgeLevel,
        timeCommitment,
        userId
      });

      // Create personalized course from new template
      course = await CourseTemplateService.createPersonalizedCourse(template, userId);
      
      responseData.message = OpenAIService.isConfigured() 
        ? 'New course generated with AI and saved as template'
        : 'Course created from template';
      responseData.templateId = template._id;
      responseData.generatedWithAI = OpenAIService.isConfigured();
    }

    // Return response with course data
    res.json({
      ...responseData,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          modules: course.modules,
          progress: course.progress,
          difficulty: course.difficulty,
          estimatedDuration: course.estimatedDuration
        }
      }
    });

  } catch (error) {
    console.error('❌ Course generation error:');
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.error('   Request body:', req.body);
    console.error('   User ID:', req.userId);
    
    // Try to log error but don't fail if logging fails
    try {
      await ActivityLog.create({
        userId: req.userId,
        sessionId: req.sessionId || 'unknown',
        action: 'ai_generation_request', // Use valid enum value
        entity: { type: 'system' },
        details: {
          error: error.message,
          stack: error.stack,
          courseTopic: req.body.courseTopic,
          failed: true
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError.message);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/ai/regenerate-course - Force regenerate course (bypass cache)
router.post('/regenerate-course', courseGenerationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseTopic, timeCommitment, knowledgeLevel } = req.body;
    const userId = req.userId;

    console.log('🔄 Regenerating course (bypassing cache)...');

    // Check if OpenAI is configured
    let courseData;
    if (OpenAIService.isConfigured()) {
      console.log('🤖 Using OpenAI to generate fresh course...');
      courseData = await OpenAIService.generateCourse({
        courseTopic,
        timeCommitment,
        knowledgeLevel
      });
    } else {
      console.log('⚠️  OpenAI not configured, using mock data');
      courseData = await generateCourseContent({
        courseTopic,
        timeCommitment,
        knowledgeLevel
      });
    }

    // Create new course template
    const template = await CourseTemplateService.createCourseTemplate(courseData, {
      courseTopic,
      knowledgeLevel,
      timeCommitment,
      userId
    });

    // Create personalized course from new template
    const course = await CourseTemplateService.createPersonalizedCourse(template, userId);
    
    res.json({
      success: true,
      message: 'Course regenerated successfully',
      fromCache: false,
      generatedWithAI: OpenAIService.isConfigured(),
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          modules: course.modules,
          progress: course.progress,
          difficulty: course.difficulty,
          estimatedDuration: course.estimatedDuration
        }
      }
    });

  } catch (error) {
    console.error('❌ Course regeneration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Legacy route - keep for compatibility but redirect to template-aware version
router.post('/generate-course-legacy', courseGenerationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }



  } catch (error) {
    console.error('Course generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate course. Please try again.'
    });
  }
});

// POST /api/ai/generate-content
router.post('/generate-content', async (req, res) => {
  try {
    const { moduleId, contentType = 'lesson' } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: 'Module ID is required'
      });
    }

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const course = await Course.findById(module.courseId);
    if (!course || course.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate additional content based on type
    let generatedContent = {};

    if (contentType === 'quiz') {
      generatedContent = {
        questions: [
          {
            question: `What is the key concept in ${module.title}?`,
            options: [
              { text: "Understanding the fundamentals", isCorrect: true },
              { text: "Memorizing syntax", isCorrect: false },
              { text: "Avoiding practice", isCorrect: false },
              { text: "Skipping theory", isCorrect: false }
            ],
            explanation: "Understanding fundamentals is crucial for building a strong foundation.",
            points: 1
          }
        ],
        passingScore: 70,
        maxAttempts: 3
      };
    } else {
      generatedContent = {
        additionalContent: `
## Deep Dive: ${module.title}

This advanced content explores the nuances of ${module.title} and provides additional insights for mastery.

### Advanced Concepts
- Detailed explanations of complex topics
- Real-world applications and case studies
- Performance considerations and optimization techniques

### Practical Examples
Here are some practical examples that demonstrate the concepts in action:

1. **Example 1**: Basic implementation
2. **Example 2**: Advanced pattern usage
3. **Example 3**: Error handling and edge cases

### Common Pitfalls
- Avoid these common mistakes
- Best practices for production environments
- Testing and debugging strategies
        `
      };
    }

    // Log content generation
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'content_generated',
      entity: { type: 'module', id: moduleId, title: module.title },
      details: {
        contentType,
        courseId: course._id
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Content generated successfully',
      data: generatedContent
    });

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content. Please try again.'
    });
  }
});

module.exports = router;