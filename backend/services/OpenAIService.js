const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.initializationError = null;
  }

  /**
   * Initialize OpenAI client with lazy loading
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your-openai-api-key-here') {
        this.initializationError = 'OpenAI API key not configured. AI features will be disabled.';
        console.warn('⚠️ OpenAI API key not configured. AI features will be disabled.');
        this.initialized = true;
        return;
      }

      this.client = new OpenAI({
        apiKey: apiKey
      });

      this.initialized = true;
      console.log('✅ OpenAI service initialized successfully');
    } catch (error) {
      this.initializationError = `Failed to initialize OpenAI: ${error.message}`;
      console.error('❌ Failed to initialize OpenAI service:', error.message);
      this.initialized = true;
    }
  }

  /**
   * Check if OpenAI client is available
   */
  isAvailable() {
    this.initialize();
    return this.client !== null && !this.initializationError;
  }

  /**
   * Generate AI chat response
   */
  async generateChatResponse(messages, options = {}) {
    this.initialize();

    if (!this.isAvailable()) {
      throw new Error(this.initializationError || 'OpenAI service not available');
    }

    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      max_tokens = 1000,
      systemPrompt = 'You are a helpful AI learning assistant for EduKanban. Provide educational, encouraging, and practical responses to help users learn effectively.'
    } = options;

    try {
      const startTime = Date.now();

      // Prepare messages array with system prompt
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      console.log(`🤖 Generating AI response with model: ${model}`);

      const completion = await this.client.chat.completions.create({
        model: model,
        messages: chatMessages,
        temperature: temperature,
        max_completion_tokens: max_tokens,
        stream: false
      });

      const processingTime = Date.now() - startTime;
      const response = completion.choices[0].message.content;

      console.log(`✅ AI response generated in ${processingTime}ms`);

      return {
        content: response,
        metadata: {
          model: model,
          temperature: temperature,
          max_tokens: max_tokens,
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          processingTime: processingTime,
          requestId: completion.id,
          finishReason: completion.choices[0].finish_reason
        }
      };
    } catch (error) {
      console.error('❌ OpenAI chat completion error:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }

  /**
   * Generate a simple chat response for a single message
   */
  async generateSimpleResponse(message, context = {}) {
    const messages = [
      { role: 'user', content: message }
    ];

    // Add context if provided
    if (context.previousMessages && Array.isArray(context.previousMessages)) {
      messages.unshift(...context.previousMessages);
    }

    return this.generateChatResponse(messages, context.options);
  }

  /**
   * Stream AI chat response for real-time interaction
   */
  async *streamChat(messages, options = {}) {
    this.initialize();

    if (!this.isAvailable()) {
      throw new Error(this.initializationError || 'OpenAI service not available');
    }

    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      max_tokens = 1000,
      systemPrompt = 'You are a helpful AI learning assistant for EduKanban. Provide educational, encouraging, and practical responses to help users learn effectively.'
    } = options;

    try {
      // Prepare messages array with system prompt
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      console.log(`🤖 Streaming AI response with model: ${model}`);

      const stream = await this.client.chat.completions.create({
        model: model,
        messages: chatMessages,
        temperature: temperature,
        max_completion_tokens: max_tokens,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      console.log(`✅ AI streaming completed`);

    } catch (error) {
      console.error('❌ OpenAI streaming error:', error);
      throw new Error(`OpenAI Streaming Error: ${error.message}`);
    }
  }

  /**
   * Get initialization status
   */
  getStatus() {
    this.initialize();
    return {
      available: this.isAvailable(),
      error: this.initializationError,
      configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here'
    };
  }

  /**
   * Generate a comprehensive course structure using OpenAI
   */
  async generateCourse({ courseTopic, knowledgeLevel, timeCommitment }) {
    try {
      if (!this.isAvailable()) {
        throw new Error(this.initializationError || 'OpenAI service is not available');
      }

      console.log('🤖 Generating course with OpenAI...');
      console.log(`   Topic: ${courseTopic}`);
      console.log(`   Level: ${knowledgeLevel}`);
      console.log(`   Time: ${timeCommitment}`);

      const prompt = this.buildCoursePrompt(courseTopic, knowledgeLevel, timeCommitment);

      const completion = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Generate comprehensive, well-structured courses that are engaging and pedagogically sound. Return responses in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 16000, // Increased for comprehensive course content
        response_format: { type: 'json_object' }
      });

      const courseData = JSON.parse(completion.choices[0].message.content);
      console.log('✅ Course generated successfully with OpenAI');

      return this.formatCourseData(courseData, courseTopic, knowledgeLevel, timeCommitment);

    } catch (error) {
      console.error('❌ OpenAI generation error:', error.message);
      
      // If OpenAI fails, return a fallback course structure
      if (error.message.includes('OpenAI service is not available') || 
          error.message.includes('API key') || 
          error.message.includes('quota') || 
          error.message.includes('429') ||
          error.message.includes('rate limit') ||
          error.message.includes('Unsupported parameter') ||
          error.message.includes('400')) {
        console.log('🔄 Falling back to template course generation...');
        return this.generateFallbackCourse(courseTopic, knowledgeLevel, timeCommitment);
      }
      
      throw new Error(`Failed to generate course with AI: ${error.message}`);
    }
  }

  /**
   * Build the prompt for course generation
   */
  buildCoursePrompt(topic, level, timeCommitment) {
    return `Create a comprehensive learning course with the following specifications:

Topic: ${topic}
Knowledge Level: ${level}
Time Commitment: ${timeCommitment}

Generate a detailed course structure with 4-6 modules. Each module should contain:
- A clear, descriptive title
- Detailed description explaining what will be learned
- 3-5 learning objectives
- Rich educational content (200-400 words)
- 3-4 practical tasks/exercises
- Relevant resources

For each task, include:
- Title and detailed description
- Type: one of [reading, exercise, quiz, project, assignment]
- Estimated time in minutes
- Difficulty level: Easy, Medium, or Hard

Return the response as a JSON object with this exact structure:
{
  "title": "Course title",
  "description": "Course description (100-150 words)",
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Module title",
      "description": "Module description",
      "learningObjectives": ["objective 1", "objective 2", "objective 3"],
      "estimatedDuration": 2,
      "content": "Detailed educational content explaining concepts, examples, and practical applications",
      "tasks": [
        {
          "title": "Task title",
          "description": "Task description",
          "type": "reading",
          "estimatedTime": 30,
          "difficulty": "Easy",
          "instructions": "Step-by-step instructions",
          "order": 1
        }
      ],
      "resources": [
        {
          "type": "video",
          "title": "Resource title",
          "url": "https://example.com",
          "description": "Resource description"
        }
      ]
    }
  ],
  "learningOutcomes": ["outcome 1", "outcome 2", "outcome 3"],
  "prerequisites": ["prerequisite 1", "prerequisite 2"],
  "tags": ["tag1", "tag2", "tag3"]
}

Make the content practical, engaging, and appropriate for ${level} level learners. Include real-world examples and hands-on exercises.`;
  }

  /**
   * Format the AI-generated course data to match our schema
   */
  formatCourseData(aiData, topic, level, timeCommitment) {
    return {
      title: aiData.title || `Mastering ${topic}`,
      description: aiData.description || `A comprehensive course on ${topic}`,
      modules: aiData.modules.map((module, index) => ({
        moduleNumber: module.moduleNumber || index + 1,
        title: module.title,
        description: module.description,
        learningObjectives: module.learningObjectives || [],
        estimatedDuration: module.estimatedDuration || 2,
        content: module.content || '',
        tasks: module.tasks.map((task, taskIndex) => ({
          title: task.title,
          description: task.description,
          type: task.type || 'reading',
          estimatedTime: task.estimatedTime || 30,
          difficulty: task.difficulty || 'Medium',
          instructions: task.instructions || '',
          order: task.order || taskIndex + 1
        })),
        resources: module.resources || []
      })),
      learningOutcomes: aiData.learningOutcomes || [],
      prerequisites: aiData.prerequisites || [],
      tags: aiData.tags || [topic, level]
    };
  }

  /**
   * Generate module content using OpenAI
   */
  async generateModuleContent(moduleTitle, courseTopic) {
    try {
      if (!this.isAvailable()) {
        return this.generateFallbackModuleContent(moduleTitle, courseTopic);
      }

      const completion = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator creating detailed learning content.'
          },
          {
            role: 'user',
            content: `Create detailed educational content for a module titled "${moduleTitle}" in a course about ${courseTopic}. Include explanations, examples, and practical applications. Length: 300-500 words.`
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 1000
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Error generating module content:', error);
      return this.generateFallbackModuleContent(moduleTitle, courseTopic);
    }
  }

  /**
   * Generate fallback course when OpenAI is not available
   */
  generateFallbackCourse(topic, level, timeCommitment) {
    console.log('📝 Generating fallback course template...');
    
    const difficultyMap = {
      'Beginner': 'Easy',
      'Intermediate': 'Medium',
      'Advanced': 'Hard'
    };

    const difficulty = difficultyMap[level] || 'Medium';
    
    return {
      title: `Introduction to ${topic}`,
      description: `A comprehensive ${level.toLowerCase()} course covering the fundamentals and practical applications of ${topic}. This course is designed to provide hands-on experience and real-world knowledge.`,
      modules: [
        {
          moduleNumber: 1,
          title: `Getting Started with ${topic}`,
          description: `Learn the basics and fundamental concepts of ${topic}`,
          learningObjectives: [
            `Understand the core principles of ${topic}`,
            `Identify key concepts and terminology`,
            `Apply basic techniques and methods`
          ],
          estimatedDuration: 2,
          content: `This module introduces you to the world of ${topic}. We'll explore the fundamental concepts, understand why ${topic} is important in today's context, and learn the basic principles that govern this field. Through practical examples and hands-on exercises, you'll gain a solid foundation to build upon.`,
          tasks: [
            {
              title: `Introduction to ${topic} Concepts`,
              description: `Read and understand the fundamental concepts`,
              type: 'reading',
              estimatedTime: 30,
              difficulty: 'Easy',
              instructions: `Study the provided materials and take notes on key concepts`,
              order: 1
            },
            {
              title: `Basic ${topic} Exercise`,
              description: `Complete a simple practical exercise`,
              type: 'exercise',
              estimatedTime: 45,
              difficulty: difficulty,
              instructions: `Follow the step-by-step guide to complete your first ${topic} project`,
              order: 2
            }
          ],
          resources: [
            {
              type: 'article',
              title: `${topic} Fundamentals`,
              url: '#',
              description: `Essential reading about ${topic} basics`
            }
          ]
        },
        {
          moduleNumber: 2,
          title: `Practical Applications of ${topic}`,
          description: `Explore real-world applications and use cases`,
          learningObjectives: [
            `Apply ${topic} concepts to real-world scenarios`,
            `Develop practical skills and techniques`,
            `Create your own ${topic} project`
          ],
          estimatedDuration: 3,
          content: `In this module, we'll dive deeper into practical applications of ${topic}. You'll learn how to apply theoretical knowledge to solve real problems, explore industry best practices, and work on hands-on projects that demonstrate your understanding.`,
          tasks: [
            {
              title: `Case Study Analysis`,
              description: `Analyze real-world examples and applications`,
              type: 'assignment',
              estimatedTime: 60,
              difficulty: difficulty,
              instructions: `Review the provided case studies and submit your analysis`,
              order: 1
            },
            {
              title: `Practical Project`,
              description: `Create your own ${topic} project`,
              type: 'project',
              estimatedTime: 90,
              difficulty: difficulty,
              instructions: `Design and implement a project that demonstrates your ${topic} skills`,
              order: 2
            }
          ],
          resources: [
            {
              type: 'video',
              title: `${topic} in Practice`,
              url: '#',
              description: `Video demonstration of practical applications`
            }
          ]
        }
      ],
      learningOutcomes: [
        `Demonstrate understanding of ${topic} fundamentals`,
        `Apply ${topic} concepts to solve practical problems`,
        `Create and evaluate ${topic} solutions`
      ],
      prerequisites: level === 'Beginner' ? [] : [`Basic understanding of related concepts`],
      tags: [topic.toLowerCase(), level.toLowerCase(), 'practical', 'hands-on']
    };
  }

  /**
   * Generate fallback module content
   */
  generateFallbackModuleContent(moduleTitle, courseTopic) {
    return `
## ${moduleTitle}

Welcome to this important module in your ${courseTopic} learning journey. This section will provide you with essential knowledge and practical skills.

### Key Concepts

In this module, you'll explore the fundamental concepts related to ${moduleTitle}. We'll break down complex ideas into manageable pieces and provide clear explanations with real-world examples.

### Learning Approach

Our approach combines theoretical understanding with practical application. You'll engage with:
- Interactive exercises and hands-on activities
- Real-world case studies and examples  
- Step-by-step guidance and best practices
- Opportunities to apply what you've learned

### What You'll Achieve

By the end of this module, you'll have a solid understanding of the key principles and be able to apply them confidently in practical situations. The skills you develop here will serve as building blocks for more advanced topics.

### Next Steps

Take your time to work through the materials at your own pace. Don't hesitate to revisit concepts that need reinforcement, and make sure to complete all the practical exercises to maximize your learning experience.
    `.trim();
  }

  /**
   * Check if OpenAI is properly configured
   */
  isConfigured() {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
  }
}

module.exports = new OpenAIService();
