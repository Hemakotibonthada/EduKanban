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
          maxTokensPerRequest: 4000
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

module.exports = router;