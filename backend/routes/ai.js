const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const CourseTemplate = require('../models/CourseTemplate');
const CourseTemplateService = require('../services/CourseTemplateService');
const OpenAIService = require('../services/OpenAIService');
const AIConversation = require('../models/AIConversation');
const AIMessage = require('../models/AIMessage');
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

/**
 * @swagger
 * /ai/generate-course:
 *   post:
 *     summary: Generate a personalized course using AI
 *     description: Create a full course with modules and tasks based on user input. Uses template caching for efficiency.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseTopic
 *               - timeCommitment
 *               - knowledgeLevel
 *             properties:
 *               courseTopic:
 *                 type: string
 *                 example: "Machine Learning Fundamentals"
 *               timeCommitment:
 *                 type: string
 *                 example: "2 hours per week"
 *               knowledgeLevel:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced, Expert]
 *                 example: "Beginner"
 *     responses:
 *       200:
 *         description: Course generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 fromCache:
 *                   type: boolean
 *                 course:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

// POST /api/ai/chat - AI Chat Assistant
router.post('/chat', [
  body('message').notEmpty().trim().withMessage('Message is required')
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

    const { message } = req.body;
    const userId = req.userId;

    console.log(`💬 AI Chat request from user ${userId}: "${message}"`);

    // Try to use OpenAI if available
    let aiResponse;
    try {
      if (OpenAIService && typeof OpenAIService.generateCourseContent === 'function') {
        // Use OpenAI if available (would need to add a chat method to OpenAIService)
        throw new Error('OpenAI chat not yet implemented');
      } else {
        throw new Error('OpenAI not configured');
      }
    } catch (openaiError) {
      console.warn('OpenAI not available, using fallback responses:', openaiError.message);
      
      // Fallback AI responses based on keywords
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('help') || lowerMessage.includes('how to')) {
        aiResponse = "I'm here to help! I can assist you with:\n\n📚 **Understanding Topics** - Ask me to explain any concept you're learning\n💡 **Study Tips** - I can share effective learning strategies\n🎓 **Course Guidance** - Get advice on how to approach your courses\n🗺️ **Learning Paths** - I'll help you plan your educational journey\n\nWhat would you like to know more about?";
      } else if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
        aiResponse = "Great question about learning! Here are some proven study techniques:\n\n1. **Active Recall** - Test yourself regularly instead of just re-reading\n2. **Spaced Repetition** - Review material at increasing intervals\n3. **Pomodoro Technique** - Study in 25-minute focused sessions\n4. **Teach Others** - Explaining concepts solidifies your understanding\n5. **Take Breaks** - Your brain needs rest to consolidate information\n\nWould you like me to elaborate on any of these techniques?";
      } else if (lowerMessage.includes('course') || lowerMessage.includes('topic')) {
        aiResponse = "I'd be happy to help you with your course! To provide the best guidance, could you tell me:\n\n- What subject or topic are you studying?\n- What's your current level (beginner, intermediate, advanced)?\n- What specific aspect are you finding challenging?\n- What are your learning goals?\n\nThis will help me give you personalized advice!";
      } else if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
        aiResponse = "Career planning is exciting! Here's my advice:\n\n**For Tech Careers:**\n- Build a strong foundation in programming fundamentals\n- Create a portfolio of projects showcasing your skills\n- Contribute to open-source projects\n- Network with professionals in your field\n- Stay updated with industry trends\n\n**General Career Tips:**\n- Focus on continuous learning\n- Develop both technical and soft skills\n- Seek mentorship and guidance\n- Don't be afraid to start small and grow\n\nWhat specific career path interests you?";
      } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
        aiResponse = "I'd love to explain that concept to you! However, I need a bit more detail about what you'd like me to explain.\n\nYou can ask me about:\n- Programming concepts (variables, functions, OOP, etc.)\n- Web development (HTML, CSS, JavaScript, frameworks)\n- Data structures and algorithms\n- Machine learning basics\n- Software engineering principles\n- And much more!\n\nWhat specific topic would you like me to break down for you?";
      } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        aiResponse = "You're very welcome! 😊 I'm always here to help you learn and grow.\n\nRemember:\n- Keep practicing consistently\n- Don't be afraid to ask questions\n- Learn from mistakes - they're part of the journey\n- Celebrate small wins along the way\n\nFeel free to ask me anything else whenever you need assistance. Happy learning! 🎓";
      } else {
        aiResponse = `That's an interesting question! Let me help you with that.\n\n${message.includes('?') ? 'To provide a thorough answer' : 'To best assist you'}, I'd recommend:\n\n1. **Break it down** - Start with the fundamentals\n2. **Practice actively** - Apply what you learn through exercises\n3. **Use multiple resources** - Different perspectives enhance understanding\n4. **Ask specific questions** - The more specific, the better I can help\n\nWould you like me to dive deeper into any particular aspect? I'm here to guide your learning journey! 🚀`;
      }
    }

    // Optionally log the chat interaction (simplified - no validation issues)
    console.log(`✅ AI Chat completed for user ${userId} - Message length: ${message.length}, Response length: ${aiResponse.length}`);

    res.json({
      success: true,
      message: 'AI response generated',
      data: {
        response: aiResponse,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'AI Guide is temporarily unavailable. Please try again shortly.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// AI CONVERSATION ENDPOINTS
// ===============================

// GET /api/ai/conversations - Get user's AI conversations
router.get('/conversations', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20, sortBy = 'lastActivity' } = req.query;
    
    const conversations = await AIConversation.findByUser(req.userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: -1
    });

    res.json({
      success: true,
      data: {
        conversations,
        page: parseInt(page),
        hasMore: conversations.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get AI conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/ai/conversations - Create new AI conversation
router.post('/conversations', [
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('initialMessage').optional().trim().isLength({ max: 8000 }).withMessage('Initial message too long')
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

    const { title, initialMessage, metadata } = req.body;

    // Create conversation
    const conversation = await AIConversation.createNew(req.userId, {
      title: title || 'AI Assistant Chat',
      metadata: metadata || {}
    });

    let messages = [];

    // Add initial message if provided
    if (initialMessage) {
      const userMessage = await AIMessage.createUserMessage(
        conversation._id,
        req.userId,
        initialMessage
      );

      // Generate AI response
      let aiResponse;
      try {
        if (OpenAIService.isAvailable()) {
          const response = await OpenAIService.generateSimpleResponse(initialMessage, {
            options: conversation.settings
          });
          
          aiResponse = await AIMessage.createAIMessage(
            conversation._id,
            response.content,
            response.metadata
          );
        } else {
          // Fallback response
          aiResponse = await AIMessage.createAIMessage(
            conversation._id,
            "Hello! I'm your AI learning assistant. I'm here to help you with your studies and answer any questions you have. How can I assist you today?"
          );
        }
      } catch (aiError) {
        console.error('AI response error:', aiError);
        aiResponse = await AIMessage.createAIMessage(
          conversation._id,
          "Hello! I'm your AI learning assistant. I'm ready to help you learn and grow. What would you like to explore today?"
        );
      }

      messages = [userMessage, aiResponse];
      
      // Update conversation
      conversation.lastMessage = aiResponse._id;
      conversation.messageCount = 2;
      await conversation.save();
    }

    res.status(201).json({
      success: true,
      data: {
        conversation,
        messages
      }
    });
  } catch (error) {
    console.error('Create AI conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai/conversations/:id/messages - Get messages in a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversationId = req.params.id;

    // Check if conversation exists and belongs to user
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: req.userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages
    const messages = await AIMessage.findByConversation(conversationId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'createdAt',
      sortOrder: 1
    });

    res.json({
      success: true,
      data: {
        conversation,
        messages,
        page: parseInt(page),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get AI messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// NOTE: This route auto-generates AI responses, which causes duplicates when using streaming.
// Commented out in favor of the simpler save-only route below.
/*
// POST /api/ai/conversations/:id/messages - Send message in conversation
router.post('/conversations/:id/messages', [
  body('content').notEmpty().trim().isLength({ max: 8000 }).withMessage('Message content is required and must be less than 8000 characters'),
  body('role').optional().isIn(['user', 'assistant']).withMessage('Invalid role')
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

    const { content, role = 'user' } = req.body;
    const conversationId = req.params.id;

    // Check if conversation exists and belongs to user
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: req.userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create user message
    const userMessage = await AIMessage.createUserMessage(
      conversationId,
      req.userId,
      content
    );

    // Get recent messages for context (last 10 messages)
    const recentMessages = await AIMessage.findByConversation(conversationId, {
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: -1
    });

    // Reverse to get chronological order and prepare for AI
    const contextMessages = recentMessages
      .reverse()
      .slice(-9) // Take last 9 messages (excluding the one we just added)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Add the new message
    contextMessages.push({
      role: 'user',
      content: content
    });

    // Generate AI response
    let aiMessage;
    try {
      if (OpenAIService.isAvailable()) {
        const response = await OpenAIService.generateChatResponse(contextMessages, {
          ...conversation.settings,
          systemPrompt: conversation.settings.systemPrompt || 
            `You are a helpful AI learning assistant for EduKanban. The user's name is available in their profile. Provide educational, encouraging, and practical responses. Keep responses conversational and helpful.`
        });
        
        aiMessage = await AIMessage.createAIMessage(
          conversationId,
          response.content,
          response.metadata
        );
      } else {
        // Enhanced fallback responses based on content analysis
        let fallbackResponse = generateEnhancedFallbackResponse(content);
        
        aiMessage = await AIMessage.createAIMessage(
          conversationId,
          fallbackResponse,
          {
            aiModel: 'fallback',
            processingTime: 50
          }
        );
      }
    } catch (aiError) {
      console.error('AI response generation error:', aiError);
      
      // Check if it's a quota/rate limit error
      if (aiError.message.includes('quota') || aiError.message.includes('429') || aiError.message.includes('rate limit')) {
        aiMessage = await AIMessage.createAIMessage(
          conversationId,
          `I apologize, but I'm currently experiencing high demand and have reached my API usage limit. However, I can still help you!\n\n${generateEnhancedFallbackResponse(content)}\n\n💡 **Tip**: While I'm in basic mode, I can still provide study guidance, learning strategies, and helpful advice based on common educational principles.`,
          {
            aiModel: 'fallback-quota-exceeded',
            processingTime: 10
          }
        );
      } else {
        // Create error recovery message for other errors
        aiMessage = await AIMessage.createAIMessage(
          conversationId,
          "I'm having a bit of trouble processing that right now. Could you try rephrasing your question or let me know what specific topic you'd like help with?",
          {
            aiModel: 'fallback-error',
            processingTime: 10
          }
        );
      }
    }

    // Update conversation
    conversation.lastMessage = aiMessage._id;
    await conversation.incrementMessageCount();
    await conversation.incrementMessageCount(); // Once for user, once for AI

    res.json({
      success: true,
      data: {
        userMessage,
        aiMessage,
        conversation: {
          id: conversation._id,
          messageCount: conversation.messageCount,
          lastActivity: conversation.lastActivity
        }
      }
    });
  } catch (error) {
    console.error('Send AI message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
*/

// DELETE /api/ai/conversations/:id/messages/:messageId - Delete a message
router.delete('/conversations/:id/messages/:messageId', async (req, res) => {
  try {
    const { id: conversationId, messageId } = req.params;

    // Check if conversation belongs to user
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: req.userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Find and delete message
    const message = await AIMessage.findOne({
      _id: messageId,
      conversation: conversationId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Soft delete the message
    await message.softDelete(req.userId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete AI message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai/capabilities - Get AI service capabilities
router.get('/capabilities', (req, res) => {
  try {
    const isOpenAIAvailable = OpenAIService.isAvailable();
    
    res.json({
      success: true,
      data: {
        openai: {
          available: isOpenAIAvailable,
          models: isOpenAIAvailable ? ['gpt-3.5-turbo', 'gpt-4'] : [],
          error: !isOpenAIAvailable ? OpenAIService.initializationError : null
        },
        features: [
          'chat',
          'conversation-persistence',
          'context-awareness',
          'learning-assistance',
          'course-help',
          'code-assistance'
        ],
        limits: {
          maxMessageLength: 8000,
          maxConversationHistory: 50,
          maxTokensPerRequest: 16000 // Increased for comprehensive course generation
        },
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
      }
    });
  } catch (error) {
    console.error('Get AI capabilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get capabilities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function for enhanced fallback responses
function generateEnhancedFallbackResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // More sophisticated fallback responses
  if (lowerMessage.includes('help') || lowerMessage.includes('how to')) {
    return `I'd be happy to help you with that! While I'm currently running in basic mode, I can still provide guidance on:\n\n📚 **Study Strategies** - Effective learning techniques\n💡 **Problem Solving** - Breaking down complex topics\n🎯 **Goal Setting** - Planning your learning journey\n📝 **Note Taking** - Better retention methods\n\nWhat specific area would you like assistance with?`;
  } else if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
    return `Great question about programming! Even in basic mode, I can help with:\n\n🔧 **Debugging Approach** - Systematic problem-solving steps\n📖 **Learning Resources** - Where to find reliable documentation\n💭 **Code Review** - General best practices to consider\n🏗️ **Project Structure** - Organizing your code effectively\n\nCould you tell me more about what specific programming challenge you're facing?`;
  } else if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
    return `Learning effectively is a skill in itself! Here are some proven strategies:\n\n⏰ **Spaced Repetition** - Review material at increasing intervals\n🎯 **Active Learning** - Engage with material, don't just read\n🔄 **Practice Testing** - Quiz yourself regularly\n🧠 **Elaborative Interrogation** - Ask yourself 'why' and 'how'\n📊 **Progress Tracking** - Monitor your improvement\n\nWhat subject or skill are you currently working on?`;
  } else if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
    return `Career development is exciting! Here's my advice for building a strong foundation:\n\n🎯 **Skill Building** - Focus on both technical and soft skills\n🌐 **Network Building** - Connect with professionals in your field\n📁 **Portfolio Development** - Showcase your best work\n📈 **Continuous Learning** - Stay updated with industry trends\n🎖️ **Certification** - Consider relevant credentials\n\nWhat career path are you most interested in exploring?`;
  } else {
    return `That's an interesting point! While I'm currently in basic mode, I'm still here to help you learn and grow.\n\n**I can assist with:**\n• Study strategies and learning techniques\n• Breaking down complex topics\n• Programming and technical concepts\n• Career guidance and skill development\n• Course planning and goal setting\n\nTo give you the most helpful response, could you tell me more about what you're trying to learn or accomplish? The more specific you are, the better I can guide you! 🚀`;
  }
}

// POST /api/ai/generate-course-progressive - Generate course with progressive module creation
router.post('/generate-course-progressive', courseGenerationValidation, async (req, res) => {
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

    // Set up SSE (Server-Sent Events) for real-time progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendProgress = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Step 1: Send initial status
      sendProgress({
        type: 'status',
        message: 'Initializing course generation...',
        progress: 0
      });

      // Step 2: Check for template or generate course structure
      sendProgress({
        type: 'status',
        message: 'Analyzing course requirements...',
        progress: 10
      });

      const templateResult = await CourseTemplateService.findOrCreateCourseTemplate({
        courseTopic,
        knowledgeLevel,
        timeCommitment,
        userId
      });

      let courseData;
      let totalModules = 10; // Default module count
      let useTemplate = false;
      
      if (templateResult.cacheHit || templateResult.isSimilar) {
        // Use existing template
        sendProgress({
          type: 'status',
          message: 'Found existing course structure...',
          progress: 20
        });
        
        courseData = templateResult.template.courseStructure;
        // Validate template structure
        if (courseData && courseData.modules && Array.isArray(courseData.modules) && courseData.modules.length > 0) {
          totalModules = courseData.modules.length;
          useTemplate = true;
          console.log(`✅ Using cached template with ${totalModules} modules`);
        } else {
          console.warn('⚠️ Template structure invalid, regenerating course...');
          sendProgress({
            type: 'status',
            message: 'Template invalid, generating fresh course...',
            progress: 20
          });
          useTemplate = false;
        }
      }
      
      if (!useTemplate) {
        // Generate new course structure
        sendProgress({
          type: 'status',
          message: 'Generating course structure with AI...',
          progress: 20
        });

        if (OpenAIService.isConfigured()) {
          courseData = await OpenAIService.generateCourse({
            courseTopic,
            timeCommitment,
            knowledgeLevel
          });
        } else {
          courseData = await generateCourseContent({
            courseTopic,
            timeCommitment,
            knowledgeLevel
          });
        }
        
        // Validate courseData structure
        if (!courseData || !courseData.modules || !Array.isArray(courseData.modules)) {
          throw new Error('Invalid course data structure generated');
        }
        
        totalModules = courseData.modules.length;
      }

      // Step 3: Create the course document
      sendProgress({
        type: 'status',
        message: 'Creating course document...',
        progress: 30
      });

      const course = new Course({
        title: courseData.title,
        description: courseData.description,
        topic: courseTopic,
        userId: userId,
        instructor: userId,
        difficulty: knowledgeLevel,
        currentKnowledgeLevel: knowledgeLevel,
        estimatedDuration: parseInt(timeCommitment) || 5, // Convert to number (hours per week)
        timeCommitment: timeCommitment,
        aiGenerated: true,
        modules: [],
        enrolledStudents: [userId],
        progress: { totalModules: totalModules, completedModules: 0 }
      });

      await course.save();

      sendProgress({
        type: 'course_created',
        courseId: course._id,
        title: course.title,
        totalModules: totalModules,
        progress: 35
      });

      // Step 4: Create modules progressively
      const createdModules = [];
      const progressPerModule = 60 / totalModules; // 60% for all modules

      for (let i = 0; i < totalModules; i++) {
        const moduleData = courseData.modules[i];
        
        if (!moduleData) {
          console.error(`Module ${i + 1} data is missing`);
          continue;
        }
        
        const moduleNumber = i + 1;

        sendProgress({
          type: 'module_creating',
          moduleNumber,
          totalModules,
          title: moduleData.title,
          progress: Math.round(35 + (i * progressPerModule))
        });

        // Simulate progressive creation delay (in production, this would be actual AI generation)
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
          // Create the module with all required fields
          const module = new Module({
            title: moduleData.title,
            description: moduleData.description,
            moduleNumber,
            courseId: course._id, // Changed from 'course' to 'courseId'
            difficulty: knowledgeLevel, // Added required field
            estimatedDuration: moduleData.estimatedDuration || 120,
            content: await generateModuleContent(moduleData.title, courseTopic),
            order: moduleNumber,
            status: moduleNumber === 1 ? 'available' : 'locked', // Changed from isLocked
            learningObjectives: moduleData.learningObjectives || []
          });

          await module.save();
          createdModules.push(module);

          // Create tasks for this module
          let tasks = [];
          if (moduleData.tasks && moduleData.tasks.length > 0) {
            tasks = await CourseTemplateService.createTasksFromArray(
              moduleData.tasks,
              course._id,
              module._id,
              userId
            );
          }

          sendProgress({
            type: 'module_created',
            moduleNumber,
            moduleId: module._id,
            title: module.title,
            tasksCount: tasks.length,
            progress: Math.round(35 + ((i + 1) * progressPerModule))
          });
        } catch (moduleError) {
          console.error(`Error creating module ${moduleNumber}:`, moduleError);
          sendProgress({
            type: 'error',
            message: `Failed to create module ${moduleNumber}: ${moduleError.message}`,
            progress: Math.round(35 + (i * progressPerModule))
          });
          // Continue with next module instead of failing completely
        }
      }

      // Step 5: Update course with module subdocuments
      // Map resource types to match Course schema enums
      const resourceTypeMapping = {
        'documentation': 'article',
        'tutorial': 'article',
        'guide': 'article',
        'video': 'video',
        'article': 'article',
        'book': 'book',
        'tool': 'tool',
        'exercise': 'exercise'
      };

      course.modules = createdModules.map(m => ({
        moduleNumber: m.moduleNumber,
        title: m.title,
        description: m.description,
        learningObjectives: m.learningObjectives || [],
        estimatedDuration: Math.ceil(m.estimatedDuration / 60) || 2, // Convert minutes to hours
        content: m.content?.textContent || '',
        videoUrl: m.content?.videoUrls?.[0]?.url || '',
        resources: (m.content?.resources || []).map(r => ({
          type: resourceTypeMapping[r.type?.toLowerCase()] || 'article',
          title: r.title,
          url: r.url,
          description: r.description
        }))
      }));
      
      await course.save();

      sendProgress({
        type: 'status',
        message: 'Finalizing course setup...',
        progress: 95
      });

      // Step 6: Save as template if new
      if (!templateResult.cacheHit && !templateResult.isSimilar) {
        await CourseTemplateService.createCourseTemplate(courseData, {
          courseTopic,
          knowledgeLevel,
          timeCommitment,
          userId
        });
      }

      // Step 7: Send completion
      sendProgress({
        type: 'completed',
        message: 'Course created successfully!',
        progress: 100,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          modules: createdModules.map(m => ({
            _id: m._id,
            title: m.title,
            description: m.description,
            moduleNumber: m.moduleNumber,
            estimatedDuration: m.estimatedDuration
          })),
          totalModules: totalModules,
          difficulty: course.difficulty
        }
      });

      res.end();

    } catch (innerError) {
      console.error('Progressive generation error:', innerError);
      sendProgress({
        type: 'error',
        message: innerError.message || 'Failed to generate course',
        progress: 0
      });
      res.end();
    }

  } catch (error) {
    console.error('Course progressive generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize progressive generation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/ai/chat-stream - Streaming chat with AI
router.post('/chat-stream', [
  body('message').notEmpty().trim().withMessage('Message is required')
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

    const { message, conversationId } = req.body;
    const userId = req.userId;

    console.log(`💬 AI Streaming Chat request from user ${userId}: "${message}"`);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Try OpenAI first if configured
      if (OpenAIService.isConfigured()) {
        console.log('🤖 Using OpenAI for streaming response...');
        
        try {
          // Get conversation history if conversationId is provided
          let messageHistory = [];
          if (conversationId) {
            const conversation = await AIConversation.findById(conversationId);
            if (conversation) {
              const messages = await AIMessage.find({ conversation: conversationId })
                .sort({ createdAt: 1 })
                .limit(10); // Last 10 messages for context
              
              messageHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
              }));
            }
          }
          
          // Add current message
          messageHistory.push({
            role: 'user',
            content: message
          });

          // Stream using OpenAI
          const stream = OpenAIService.streamChat(messageHistory, {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            max_tokens: 1000
          });

          sendEvent('start', { timestamp: new Date().toISOString() });

          let fullResponse = '';
          
          // Stream the response
          for await (const chunk of stream) {
            if (chunk) {
              fullResponse += chunk;
              sendEvent('token', { content: chunk });
            }
          }

          sendEvent('done', { 
            timestamp: new Date().toISOString(),
            response: fullResponse
          });

        } catch (openaiError) {
          console.warn('OpenAI streaming failed, falling back:', openaiError.message);
          throw openaiError; // Fall through to fallback
        }
      } else {
        throw new Error('OpenAI not configured');
      }
    } catch (fallbackError) {
      console.log('📝 Using fallback streaming response...');
      
      // Generate fallback response
      const lowerMessage = message.toLowerCase();
      let fullResponse = '';
      
      // Check for specific code requests first
      if (lowerMessage.includes('hello world') && lowerMessage.includes('python')) {
        fullResponse = "# Python Hello World 🐍\n\nHere's the simplest Python program:\n\n```python\nprint(\"Hello, World!\")\n```\n\n## How to Run It:\n\n1. **Save** the code to a file: `hello.py`\n2. **Open terminal** in the file's directory\n3. **Run** the command: `python hello.py`\n\n## Output:\n```\nHello, World!\n```\n\n## More Examples:\n\n### With User Input\n```python\nname = input(\"Enter your name: \")\nprint(f\"Hello, {name}!\")\n```\n\n### In a Function\n```python\ndef greet(name=\"World\"):\n    return f\"Hello, {name}!\"\n\nprint(greet())        # Hello, World!\nprint(greet(\"Alice\")) # Hello, Alice!\n```\n\n### Object-Oriented\n```python\nclass Greeter:\n    def __init__(self, name):\n        self.name = name\n    \n    def say_hello(self):\n        print(f\"Hello, {self.name}!\")\n\ngreeter = Greeter(\"World\")\ngreeter.say_hello()  # Hello, World!\n```\n\nWant to learn more Python basics? Just ask! 🚀";
      } else if ((lowerMessage.includes('code') || lowerMessage.includes('example')) && lowerMessage.includes('python')) {
        fullResponse = "# Python Code Examples 🐍\n\nHere are some fundamental Python examples:\n\n## Basic Syntax\n```python\n# Variables and data types\nname = \"Alice\"\nage = 25\nis_student = True\nheight = 5.6\n\nprint(f\"{name} is {age} years old\")\n```\n\n## Functions\n```python\ndef calculate_sum(a, b):\n    \"\"\"Returns the sum of two numbers\"\"\"\n    return a + b\n\nresult = calculate_sum(10, 20)\nprint(f\"Sum: {result}\")  # Sum: 30\n```\n\n## Lists and Loops\n```python\nfruits = [\"apple\", \"banana\", \"orange\"]\n\n# For loop\nfor fruit in fruits:\n    print(f\"I like {fruit}\")\n\n# List comprehension\nsquares = [x**2 for x in range(1, 6)]\nprint(squares)  # [1, 4, 9, 16, 25]\n```\n\n## Conditionals\n```python\nscore = 85\n\nif score >= 90:\n    grade = \"A\"\nelif score >= 80:\n    grade = \"B\"\nelif score >= 70:\n    grade = \"C\"\nelse:\n    grade = \"F\"\n\nprint(f\"Grade: {grade}\")  # Grade: B\n```\n\n## Dictionary\n```python\nstudent = {\n    \"name\": \"Bob\",\n    \"age\": 20,\n    \"courses\": [\"Math\", \"CS\", \"Physics\"]\n}\n\nprint(student[\"name\"])  # Bob\nprint(student.get(\"age\"))  # 20\n```\n\nWhat specific Python topic would you like to explore? 🎯";
      } else if (lowerMessage.includes('c#') || lowerMessage.includes('csharp')) {
        fullResponse = "# C# Learning Path 🎯\n\nHere's a comprehensive roadmap for mastering C#:\n\n## Phase 1: Fundamentals (2-4 weeks)\n\n### 1. Basic Syntax\n```csharp\n// Hello World\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(\"Hello, C#!\");\n    }\n}\n```\n\n**Learn:**\n- Variables & data types\n- Operators\n- Control structures (if/else, switch)\n- Loops (for, while, foreach)\n\n### 2. Methods & Functions\n```csharp\nint Add(int a, int b) {\n    return a + b;\n}\n\nstring Greet(string name = \"World\") {\n    return $\"Hello, {name}!\";\n}\n```\n\n## Phase 2: Object-Oriented Programming (3-5 weeks)\n\n### Classes & Objects\n```csharp\npublic class Student {\n    public string Name { get; set; }\n    public int Age { get; set; }\n    \n    public Student(string name, int age) {\n        Name = name;\n        Age = age;\n    }\n    \n    public void Introduce() {\n        Console.WriteLine($\"I'm {Name}, {Age} years old\");\n    }\n}\n```\n\n**Learn:**\n- Classes and objects\n- Inheritance\n- Polymorphism\n- Encapsulation\n- Interfaces & abstract classes\n\n## Phase 3: Advanced Concepts (4-6 weeks)\n\n### LINQ\n```csharp\nvar numbers = new[] { 1, 2, 3, 4, 5 };\nvar evenNumbers = numbers.Where(n => n % 2 == 0);\nvar squared = numbers.Select(n => n * n);\n```\n\n### Async/Await\n```csharp\nasync Task<string> FetchDataAsync() {\n    await Task.Delay(1000);\n    return \"Data loaded!\";\n}\n```\n\n**Learn:**\n- Collections (List, Dictionary, etc.)\n- LINQ queries\n- Exception handling\n- Async programming\n- Delegates & events\n\n## Phase 4: Practical Application (Ongoing)\n\n### Project Ideas:\n1. **Console Calculator**\n2. **To-Do List App**\n3. **Simple REST API** (ASP.NET Core)\n4. **Desktop App** (WPF/WinForms)\n5. **Game** (Unity with C#)\n\n## Resources:\n- **Microsoft Learn** (free, official)\n- **C# Documentation** (docs.microsoft.com)\n- **YouTube:** Bro Code, Programming with Mosh\n- **Practice:** LeetCode, HackerRank\n\nWhat aspect of C# would you like to start with? 🚀";
      } else if (lowerMessage.includes('learning path') || lowerMessage.includes('roadmap')) {
        fullResponse = "# Learning Path Guide 🗺️\n\nLet me create a structured learning path for you!\n\n## How to Build Your Learning Path:\n\n### 1. Define Your Goal 🎯\n```javascript\nconst goal = {\n  what: 'Web Development',\n  why: 'Career change',\n  timeline: '6 months',\n  level: 'Beginner'\n};\n```\n\n### 2. Break Into Phases 📊\n\n**Phase 1: Foundation** (Weeks 1-4)\n- Core concepts\n- Basic syntax\n- Fundamental principles\n\n**Phase 2: Intermediate** (Weeks 5-12)\n- Apply concepts\n- Build small projects\n- Learn best practices\n\n**Phase 3: Advanced** (Weeks 13-20)\n- Complex projects\n- Performance optimization\n- Design patterns\n\n**Phase 4: Mastery** (Weeks 21+)\n- Portfolio projects\n- Open source contributions\n- Teaching others\n\n### 3. Daily Schedule ⏰\n```\n📅 Weekday (2-3 hours):\n- 45 min: Study new concept\n- 60 min: Hands-on practice\n- 30 min: Review & document\n\n📅 Weekend (4-5 hours):\n- 90 min: Work on project\n- 60 min: Learn from others' code\n- 60 min: Practice problems\n```\n\n## Sample Learning Paths:\n\n### Web Development Path\n```\nHTML/CSS (2 weeks)\n  ↓\nJavaScript Basics (3 weeks)\n  ↓\nReact/Vue/Angular (4 weeks)\n  ↓\nBackend (Node.js/Django) (4 weeks)\n  ↓\nFull-Stack Project (ongoing)\n```\n\n### Python/Data Science Path\n```\nPython Fundamentals (3 weeks)\n  ↓\nData Structures (2 weeks)\n  ↓\nNumPy/Pandas (3 weeks)\n  ↓\nVisualization (Matplotlib) (2 weeks)\n  ↓\nMachine Learning Basics (4 weeks)\n```\n\n### Mobile Development Path\n```\nProgramming Basics (2 weeks)\n  ↓\nJavaScript/Kotlin (3 weeks)\n  ↓\nReact Native/Flutter (5 weeks)\n  ↓\nState Management (2 weeks)\n  ↓\nAPI Integration (2 weeks)\n```\n\n**What technology or field would you like a personalized learning path for?** Let me know and I'll create a detailed roadmap! 🚀";
      } else if (lowerMessage.includes('help') || lowerMessage.includes('how to')) {
        fullResponse = "I'm here to help! I can assist you with:\n\n**📚 Understanding Topics**\nAsk me to explain any concept you're learning, and I'll break it down step by step.\n\n**💡 Study Tips**\nI can share effective learning strategies like active recall, spaced repetition, and the Pomodoro technique.\n\n**🎓 Course Guidance**\nGet personalized advice on how to approach your courses and stay motivated.\n\n**🗺️ Learning Paths**\nI'll help you plan your educational journey and set achievable goals.\n\n**📝 Practice & Quizzes**\nNeed practice questions? I can help you test your knowledge.\n\nWhat would you like to know more about?";
      } else if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
        fullResponse = "# Effective Study Techniques\n\nGreat question about learning! Here are some **proven study techniques** backed by research:\n\n## 1. Active Recall 🧠\nTest yourself regularly instead of just re-reading. Try to retrieve information from memory without looking at your notes.\n\n## 2. Spaced Repetition 📅\nReview material at increasing intervals (1 day, 3 days, 1 week, 2 weeks). This dramatically improves long-term retention.\n\n## 3. Pomodoro Technique ⏰\n- Study for **25 minutes** with full focus\n- Take a **5-minute break**\n- After 4 sessions, take a longer **15-30 minute break**\n\n## 4. Teach Others 👥\nExplaining concepts to someone else solidifies your understanding. If no one's available, teach an imaginary student or rubber duck!\n\n## 5. Interleaving 🔄\nMix different topics or problem types in one study session instead of blocking similar items together.\n\n## 6. Elaborative Interrogation ❓\nAsk yourself \"why?\" and \"how?\" questions about the material to create deeper connections.\n\n## 7. Take Strategic Breaks 🌟\nYour brain needs rest to consolidate information. Regular breaks improve focus and retention.\n\n**Pro Tip:** Combine multiple techniques for best results! For example, use active recall during spaced repetition sessions.\n\nWould you like me to elaborate on any of these techniques?";
      } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
        fullResponse = "## Let me explain that for you! 📖\n\nI'd love to break down that concept, but I need a bit more detail about what you'd like me to explain.\n\n### Topics I can help with:\n\n**Programming Fundamentals**\n- Variables, functions, loops, conditionals\n- Object-oriented programming (OOP)\n- Data structures (arrays, lists, trees, graphs)\n- Algorithms and complexity\n\n**Web Development**\n- HTML5 semantic markup\n- CSS (Flexbox, Grid, animations)\n- JavaScript (ES6+, async/await, promises)\n- React, Vue, Angular frameworks\n- Node.js and Express\n\n**Computer Science**\n- Big O notation and algorithm analysis\n- Design patterns (Singleton, Factory, Observer, etc.)\n- Database design and SQL\n- RESTful APIs and HTTP\n\n**Machine Learning Basics**\n- Supervised vs unsupervised learning\n- Neural networks fundamentals\n- Common algorithms (regression, classification)\n\n**Software Engineering**\n- SOLID principles\n- Testing (unit, integration, E2E)\n- Version control with Git\n- Agile methodologies\n\n**And much more!**\n\nWhat specific topic would you like me to break down for you? The more specific your question, the better I can tailor my explanation to your needs! 🎯";
      } else if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
        fullResponse = "# Programming Help 💻\n\nI'd be happy to help with your code! To provide the best assistance, please share:\n\n## For Debugging\n```\n1. The code you're working with\n2. Expected behavior\n3. Actual behavior (error messages, wrong output)\n4. What you've already tried\n```\n\n## For Learning\n- **What language** are you learning?\n- **What concept** are you struggling with?\n- **Your current level** (beginner, intermediate, advanced)\n\n## Best Practices I Can Help With:\n\n### Clean Code 🧹\n- Meaningful variable names\n- DRY principle (Don't Repeat Yourself)\n- Single Responsibility Principle\n- Proper code commenting\n\n### Debugging Strategies 🐛\n- console.log/print debugging\n- Rubber duck debugging\n- Using debugger tools\n- Reading error messages effectively\n\n### Problem-Solving Approach 🎯\n```javascript\n// 1. Understand the problem\n// 2. Break it into smaller parts\n// 3. Solve each part\n// 4. Test thoroughly\n// 5. Refactor for clarity\n```\n\n### Quick Tips:\n- Start simple, then add complexity\n- Test frequently as you code\n- Read documentation carefully\n- Practice regularly\n- Don't be afraid to experiment!\n\nWhat specific programming challenge are you facing?";
      } else if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
        fullResponse = "# Career Planning Guide 🚀\n\nCareer planning is exciting! Here's comprehensive advice for building your path:\n\n## For Tech Careers 💼\n\n### Build Strong Foundations\n```\n1. Master programming fundamentals\n2. Learn data structures & algorithms\n3. Understand system design basics\n4. Practice problem-solving regularly\n```\n\n### Create Your Portfolio 🎨\n- **Personal Website**: Showcase your skills and projects\n- **GitHub Profile**: Keep it active and well-organized\n- **4-6 Quality Projects**: Better than 20 mediocre ones\n- **Write Documentation**: Shows communication skills\n\n### Project Ideas\n```javascript\nconst projectTypes = [\n  'Full-stack web application',\n  'Mobile app (React Native/Flutter)',\n  'API service with good documentation',\n  'Open-source contribution',\n  'Technical blog sharing your learnings'\n];\n```\n\n### Network Actively 🤝\n- Attend tech meetups and conferences\n- Join online communities (Discord, Reddit, Stack Overflow)\n- Connect with professionals on LinkedIn\n- Participate in hackathons\n- Find a mentor\n\n### Stay Current 📚\n- Follow industry blogs and podcasts\n- Learn trending technologies\n- Get certifications (AWS, Azure, etc.)\n- Practice on platforms (LeetCode, HackerRank)\n\n## General Career Tips 🌟\n\n### Develop Soft Skills\n- **Communication**: Explain technical concepts clearly\n- **Teamwork**: Collaborate effectively\n- **Problem-Solving**: Think critically\n- **Adaptability**: Embrace change\n- **Time Management**: Meet deadlines\n\n### Job Search Strategy\n1. Tailor resume for each application\n2. Write compelling cover letters\n3. Prepare for technical interviews\n4. Practice behavioral questions\n5. Follow up after interviews\n\n### Interview Preparation\n```python\nprep_topics = [\n    'Data Structures',\n    'Algorithms',\n    'System Design',\n    'Behavioral Questions',\n    'Your Projects (STAR method)'\n]\n```\n\n### Growth Mindset 🌱\n- Start with internships or junior roles\n- Learn continuously\n- Seek feedback and act on it\n- Take on challenging projects\n- Don't compare your Chapter 1 to someone's Chapter 20!\n\nWhat specific career path or role interests you? I can provide more targeted advice!";
      } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        fullResponse = "# You're Very Welcome! 😊\n\nI'm always here to help you learn and grow!\n\n## Remember These Key Points:\n\n### 🎯 Keep Practicing Consistently\nSmall, daily efforts compound into massive results over time.\n\n### ❓ Never Hesitate to Ask Questions\nEvery expert was once a beginner. Asking questions is how we learn!\n\n### 💪 Learn From Mistakes\nMistakes aren't failures—they're learning opportunities. Each error teaches you something valuable.\n\n### 🎉 Celebrate Small Wins\nRecognize your progress, no matter how small. You're improving every day!\n\n### 🚀 Stay Curious\nThe moment you stop learning is the moment you stop growing.\n\n---\n\n## Quick Resources:\n\n- 📚 **Documentation**: Your best friend\n- 💬 **Community**: Stack Overflow, Reddit, Discord\n- 🎓 **Courses**: freeCodeCamp, Coursera, Udemy\n- 🔨 **Practice**: Build projects, solve problems\n- 📖 **Read Code**: GitHub is full of great examples\n\n---\n\nFeel free to ask me **anything else** whenever you need assistance. I'm here 24/7 to support your learning journey!\n\n**Happy Learning!** 🎓✨";
      } else {
        fullResponse = `# Let's Explore: ${message} 🔍\n\nThat's an interesting question! Let me help you understand this better.\n\n## Getting Started\n\nTo ${message.includes('?') ? 'answer your question thoroughly' : 'best assist you'}, I recommend this approach:\n\n### 1. Break It Down 🧩\nStart with the fundamentals. Understanding the basics creates a solid foundation for advanced concepts.\n\n### 2. Practice Actively 💪\nDon't just read or watch—**do**! Apply what you learn through:\n- Hands-on exercises\n- Small projects\n- Code-along tutorials\n- Teaching others\n\n### 3. Use Multiple Resources 📚\nDifferent perspectives enhance understanding:\n- **Official documentation** (most accurate)\n- **Video tutorials** (visual learners)\n- **Written guides** (step-by-step)\n- **Interactive platforms** (practice)\n\n### 4. Ask Specific Questions ❓\nThe more specific your question, the better I can help! Instead of \"How do I learn X?\", try:\n- \"What's the difference between X and Y?\"\n- \"How do I implement X in Y context?\"\n- \"Why does X work this way?\"\n\n## Next Steps 🎯\n\n\`\`\`javascript\n// Your learning roadmap\nconst steps = [\n  'Identify what you want to learn',\n  'Break it into smaller topics',\n  'Learn one topic at a time',\n  'Practice immediately',\n  'Build something with it'\n];\n\nsteps.forEach(step => console.log('✓', step));\n\`\`\`\n\nWould you like me to:\n- Dive deeper into any particular aspect?\n- Provide specific examples?\n- Suggest learning resources?\n- Create a study plan?\n\nI'm here to guide your learning journey! 🚀`;
      }

      // Stream the response character by character for effect
      sendEvent('start', { timestamp: new Date().toISOString() });

      // Split into words and stream them
      const words = fullResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const content = i === 0 ? word : ' ' + word;
        sendEvent('token', { content });
        
        // Small delay to simulate typing
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      sendEvent('done', { 
        timestamp: new Date().toISOString(),
        fullResponse,
        messageId: `msg-${Date.now()}`
      });
    }

    res.end();

  } catch (error) {
    console.error('AI streaming chat error:', error);
    
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({
        message: 'AI Guide is temporarily unavailable. Please try again shortly.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })}\n\n`);
    } catch (writeError) {
      console.error('Error writing error response:', writeError);
    }
    
    res.end();
  }
});

// ============================================
// AI CONVERSATION MANAGEMENT ROUTES
// ============================================

// GET /api/ai/conversations - List all conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const {
      status = 'active',
      limit = 20,
      page = 1,
      sortBy = 'lastActivity',
      category,
      search
    } = req.query;

    // Build query
    const query = { user: userId };
    
    if (status !== 'all') {
      query.status = status;
    } else {
      query.status = { $ne: 'deleted' };
    }

    if (category) {
      query['metadata.category'] = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'metadata.topic': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const conversations = await AIConversation.find(query)
      .populate('lastMessage', 'content createdAt role')
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await AIConversation.countDocuments(query);

    res.json({
      success: true,
      conversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/ai/conversations - Create new conversation
router.post('/conversations', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const { title, description, topic, category, tags, difficulty } = req.body;

    const conversation = await AIConversation.createNew(userId, {
      title,
      description,
      topic,
      category,
      tags,
      difficulty
    });

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversation
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai/conversations/:id - Get specific conversation with messages
router.get('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const { limit = 50, page = 1, includeDeleted = false } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Get conversation
    const conversation = await AIConversation.findOne({
      _id: id,
      user: userId,
      status: { $ne: 'deleted' }
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages for this conversation
    const messages = await AIMessage.findByConversation(id, {
      includeDeleted: includeDeleted === 'true',
      limit: parseInt(limit),
      page: parseInt(page)
    });

    // Get total message count
    const totalMessages = await AIMessage.countDocuments({
      conversation: id,
      isDeleted: includeDeleted === 'true' ? undefined : false
    });

    res.json({
      success: true,
      conversation,
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / parseInt(limit)),
        totalItems: totalMessages,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/ai/conversations/:id/messages - Add message to conversation
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const { role, content, metadata = {} } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify conversation exists and belongs to user
    const conversation = await AIConversation.findOne({
      _id: id,
      user: userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Create message based on role
    let message;
    if (role === 'user') {
      message = await AIMessage.createUserMessage(id, userId, content, metadata);
    } else if (role === 'assistant') {
      message = await AIMessage.createAIMessage(id, content, metadata);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid message role. Must be "user" or "assistant"'
      });
    }

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.messageCount += 1;
    conversation.lastActivity = new Date();
    
    // Auto-generate title from first user message if still default
    if (conversation.messageCount === 1 && conversation.title === 'AI Assistant Chat' && role === 'user') {
      // Use first 50 chars of message as title
      conversation.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: message,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        messageCount: conversation.messageCount
      }
    });

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/ai/conversations/:id - Update conversation metadata
router.put('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const { title, description, category, tags, difficulty, topic } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const conversation = await AIConversation.findOne({
      _id: id,
      user: userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Update fields if provided
    if (title !== undefined) conversation.title = title;
    if (description !== undefined) conversation.description = description;
    if (category !== undefined) conversation.metadata.category = category;
    if (tags !== undefined) conversation.metadata.tags = tags;
    if (difficulty !== undefined) conversation.metadata.difficulty = difficulty;
    if (topic !== undefined) conversation.metadata.topic = topic;

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation updated successfully',
      conversation
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/ai/conversations/:id/archive - Archive/unarchive conversation
router.put('/conversations/:id/archive', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const { archive = true } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const conversation = await AIConversation.findOne({
      _id: id,
      user: userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (archive) {
      await conversation.archive();
    } else {
      await conversation.restore();
    }

    res.json({
      success: true,
      message: `Conversation ${archive ? 'archived' : 'restored'} successfully`,
      conversation
    });

  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/ai/conversations/:id - Soft delete conversation
router.delete('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    const conversation = await AIConversation.findOne({
      _id: id,
      user: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.status = 'deleted';
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai/conversations/:id/stats - Get conversation statistics
router.get('/conversations/:id/stats', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Verify conversation belongs to user
    const conversation = await AIConversation.findOne({
      _id: id,
      user: userId,
      status: { $ne: 'deleted' }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get message statistics
    const stats = await AIMessage.getConversationStats(id);

    res.json({
      success: true,
      stats,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        messageCount: conversation.messageCount,
        lastActivity: conversation.lastActivity
      }
    });

  } catch (error) {
    console.error('Error fetching conversation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;