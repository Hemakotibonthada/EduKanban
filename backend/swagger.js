const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduKanban API',
      version: '1.0.0',
      description: 'API documentation for EduKanban - AI-powered personalized learning platform',
      contact: {
        name: 'EduKanban Team',
        email: 'support@edukanban.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.edukanban.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
            role: { type: 'string', enum: ['student', 'teacher', 'admin'], example: 'student' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Introduction to JavaScript' },
            description: { type: 'string', example: 'Learn JavaScript from scratch' },
            category: { type: 'string', example: 'programming' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'beginner' },
            estimatedDuration: { type: 'string', example: '4 weeks' },
            status: { type: 'string', enum: ['active', 'completed', 'archived'], example: 'active' },
            progress: { type: 'number', example: 45.5 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Complete Chapter 1 exercises' },
            description: { type: 'string', example: 'Solve all problems in chapter 1' },
            type: { type: 'string', enum: ['reading', 'video', 'practice', 'quiz', 'project'], example: 'practice' },
            status: { type: 'string', enum: ['To Do', 'In Progress', 'Completed', 'Passed', 'Failed'], example: 'To Do' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' },
            dueDate: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' }
          }
        },
        Quiz: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            courseId: { type: 'string' },
            title: { type: 'string', example: 'JavaScript Basics Quiz' },
            description: { type: 'string' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            timeLimit: { type: 'number', example: 3600 },
            passingScore: { type: 'number', example: 70 },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  type: { type: 'string', enum: ['multiple-choice', 'true-false', 'short-answer'] },
                  options: { type: 'array', items: { type: 'string' } },
                  points: { type: 'number' }
                }
              }
            }
          }
        },
        Badge: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'first_course' },
            name: { type: 'string', example: 'First Steps' },
            description: { type: 'string', example: 'Complete your first course' },
            icon: { type: 'string', example: '🎓' },
            xp: { type: 'number', example: 100 },
            unlocked: { type: 'boolean', example: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errorId: { type: 'string', example: 'ERR-1234567890' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            limit: { type: 'number', example: 20 },
            offset: { type: 'number', example: 0 },
            hasMore: { type: 'boolean', example: true }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      },
      parameters: {
        limitParam: {
          name: 'limit',
          in: 'query',
          description: 'Maximum number of items to return (max: 100)',
          schema: { type: 'integer', default: 20, maximum: 100 }
        },
        offsetParam: {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          schema: { type: 'integer', default: 0 }
        },
        courseIdParam: {
          name: 'courseId',
          in: 'query',
          description: 'Filter by course ID',
          schema: { type: 'string' }
        },
        statusParam: {
          name: 'status',
          in: 'query',
          description: 'Filter by status',
          schema: { type: 'string' }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Courses', description: 'Course management endpoints' },
      { name: 'Tasks', description: 'Task management endpoints' },
      { name: 'Quizzes', description: 'Quiz and assessment endpoints' },
      { name: 'Analytics', description: 'Learning analytics endpoints' },
      { name: 'Gamification', description: 'Badges, achievements, and challenges' },
      { name: 'AI', description: 'AI-powered features' },
      { name: 'Chat', description: 'Messaging and communication' },
      { name: 'Social', description: 'Social features and networking' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Health', description: 'System health and monitoring' }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(options);

// Customize Swagger UI
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'EduKanban API Docs',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};
