const CourseTemplate = require('../models/CourseTemplate');
const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');

class CourseTemplateService {
  
  /**
   * Find existing course template or create new one
   */
  static async findOrCreateCourseTemplate(params) {
    const { courseTopic, knowledgeLevel, timeCommitment, userId } = params;
    
    // Generate template key for caching
    const templateKey = CourseTemplate.generateTemplateKey(courseTopic, knowledgeLevel, timeCommitment);
    
    // First, try to find exact match
    let template = await CourseTemplate.findOne({
      templateKey,
      status: 'active'
    }).populate('generatedBy', 'firstName lastName');
    
    if (template) {
      // Update usage statistics
      template.usageCount += 1;
      template.lastUsed = new Date();
      template.usedBy.push({
        userId,
        usedAt: new Date()
      });
      await template.save();
      
      // Log template reuse (wrapped in try-catch to not fail if logging fails)
      try {
        await ActivityLog.create({
          userId,
          sessionId: 'system',
          action: 'course_created', // Using valid enum value
          entity: { type: 'course', id: template._id },
          details: {
            templateKey,
            usageCount: template.usageCount,
            originalTopic: courseTopic,
            fromCache: true
          }
        });
      } catch (logError) {
        console.warn('Failed to log template reuse:', logError.message);
      }
      
      return {
        template,
        isNew: false,
        cacheHit: true
      };
    }
    
    // Try to find similar templates (fuzzy matching)
    const similarTemplates = await this.findSimilarTemplates(courseTopic, knowledgeLevel, timeCommitment);
    
    if (similarTemplates.length > 0) {
      // Use the most popular similar template as base
      const baseTemplate = similarTemplates[0];
      
      return {
        template: baseTemplate,
        isNew: false,
        cacheHit: false,
        isSimilar: true,
        similarityScore: baseTemplate.similarityScore
      };
    }
    
    return {
      template: null,
      isNew: true,
      cacheHit: false
    };
  }
  
  /**
   * Find similar course templates using fuzzy matching
   */
  static async findSimilarTemplates(courseTopic, knowledgeLevel, timeCommitment, limit = 3) {
    const topicWords = courseTopic.toLowerCase().split(/\s+/);
    const topicRegex = new RegExp(topicWords.join('|'), 'i');
    
    const similarTemplates = await CourseTemplate.find({
      status: 'active',
      $or: [
        { topic: topicRegex },
        { title: topicRegex },
        { tags: { $in: topicWords } }
      ],
      knowledgeLevel
    })
    .sort({ usageCount: -1, 'rating.average': -1 })
    .limit(limit)
    .lean();
    
    // Calculate similarity scores
    return similarTemplates.map(template => {
      const similarity = this.calculateSimilarity(courseTopic, template.topic);
      return {
        ...template,
        similarityScore: similarity
      };
    }).filter(t => t.similarityScore > 0.3) // Minimum similarity threshold
     .sort((a, b) => b.similarityScore - a.similarityScore);
  }
  
  /**
   * Calculate similarity between two course topics
   */
  static calculateSimilarity(topic1, topic2) {
    const words1 = new Set(topic1.toLowerCase().split(/\s+/));
    const words2 = new Set(topic2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }
  
  /**
   * Create new course template from AI-generated content
   */
  static async createCourseTemplate(aiGeneratedCourse, params) {
    const { courseTopic, knowledgeLevel, timeCommitment, userId } = params;
    
    const templateKey = CourseTemplate.generateTemplateKey(courseTopic, knowledgeLevel, timeCommitment);
    
    // Extract tags from topic
    const tags = this.extractTags(courseTopic);
    
    const template = new CourseTemplate({
      templateKey,
      title: aiGeneratedCourse.title,
      description: aiGeneratedCourse.description,
      topic: courseTopic,
      difficulty: aiGeneratedCourse.difficulty || knowledgeLevel,
      timeCommitment,
      knowledgeLevel,
      modules: aiGeneratedCourse.modules || [],
      originalPrompt: `Generate a ${knowledgeLevel} level course on ${courseTopic} with ${timeCommitment} time commitment`,
      generatedBy: userId,
      usageCount: 1,
      tags,
      usedBy: [{
        userId,
        usedAt: new Date()
      }]
    });
    
    await template.save();
    
    // Log template creation (wrapped in try-catch to not fail if logging fails)
    try {
      await ActivityLog.create({
        userId,
        sessionId: 'system',
        action: 'ai_generation_request', // Using valid enum value
        entity: { type: 'system' },
        details: {
          templateKey,
          topic: courseTopic,
          difficulty: knowledgeLevel,
          templateCreated: true
        }
      });
    } catch (logError) {
      console.warn('Failed to log template creation:', logError.message);
    }
    
    return template;
  }
  
  /**
   * Create personalized course from template
   */
  static async createPersonalizedCourse(template, userId, customizations = {}) {
    const personalizedCourse = new Course({
      title: customizations.title || template.title,
      description: customizations.description || template.description,
      topic: template.topic,
      userId,
      difficulty: template.difficulty,
      estimatedDuration: this.calculateTotalDuration(template.modules),
      timeCommitment: template.timeCommitment,
      currentKnowledgeLevel: template.knowledgeLevel,
      sourceTemplateId: template._id,
      modules: template.modules.map(module => ({
        ...module,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      progress: {
        totalModules: template.modules.length,
        totalTasks: this.countTotalTasks(template.modules)
      },
      tags: template.tags
    });
    
    await personalizedCourse.save();
    
    // Create tasks from template modules
    await this.createTasksFromTemplate(personalizedCourse._id, template.modules, userId);
    
    // Generate final exam for the course
    try {
      const exam = await this.generateCourseExam(personalizedCourse._id, userId);
      console.log(`✅ Generated exam for course: ${personalizedCourse.title} [${exam._id}]`);
    } catch (examError) {
      console.warn(`⚠️ Could not generate exam for course: ${examError.message}`);
      // Don't fail course creation if exam generation fails
    }
    
    return personalizedCourse;
  }
  
  /**
   * Update template with new content
   */
  static async updateTemplate(templateId, newContent, userId) {
    const template = await CourseTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Create new version if significant changes
    const hasSignificantChanges = this.hasSignificantChanges(template, newContent);
    
    if (hasSignificantChanges) {
      // Create new version
      const newVersion = new CourseTemplate({
        ...template.toObject(),
        _id: undefined,
        version: template.version + 1,
        previousVersionId: template._id,
        modules: newContent.modules,
        updatedAt: new Date(),
        usageCount: 0,
        usedBy: []
      });
      
      await newVersion.save();
      
      // Mark old version as deprecated
      template.status = 'deprecated';
      await template.save();
      
      return newVersion;
    } else {
      // Update existing template
      template.modules = newContent.modules;
      template.updatedAt = new Date();
      await template.save();
      
      return template;
    }
  }
  
  /**
   * Get template usage analytics
   */
  static async getTemplateAnalytics(templateId) {
    const template = await CourseTemplate.findById(templateId)
      .populate('usedBy.userId', 'firstName lastName email')
      .populate('feedback.userId', 'firstName lastName');
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    const userCourses = await Course.find({ sourceTemplateId: templateId });
    
    return {
      template,
      totalUsers: template.usedBy.length,
      totalCourses: userCourses.length,
      averageRating: template.rating.average,
      totalRatings: template.rating.count,
      recentUsage: template.usedBy.slice(-10),
      completionStats: this.calculateCompletionStats(userCourses)
    };
  }
  
  // Helper methods
  static extractTags(topic) {
    const commonTech = ['javascript', 'python', 'react', 'node', 'web', 'mobile', 'ai', 'ml', 'data', 'science'];
    const words = topic.toLowerCase().split(/\s+/);
    return words.filter(word => commonTech.includes(word) || word.length > 3);
  }
  
  static calculateTotalDuration(modules) {
    return modules.reduce((total, module) => total + (module.estimatedDuration || 2), 0);
  }
  
  static countTotalTasks(modules) {
    return modules.reduce((total, module) => total + (module.tasks?.length || 3), 0);
  }
  
  static async createTasksFromTemplate(courseId, modules, userId) {
    const Task = require('../models/Task');
    const Course = require('../models/Course');
    
    // Get the course to extract userId if not provided
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const userIdToUse = userId || course.userId;
    const createdTasks = [];
    
    // Map template task types to Task model types
    const typeMapping = {
      'reading': 'LEARN',
      'exercise': 'PRACTICE',
      'quiz': 'TEST',
      'project': 'PROJECT',
      'assignment': 'PROJECT'
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      const moduleNumber = module.moduleNumber || (moduleIndex + 1);
      
      // Calculate base date for this module (weekly progression)
      const moduleStartDate = new Date(today);
      moduleStartDate.setDate(moduleStartDate.getDate() + (moduleIndex * 7));
      
      // Check if module has predefined tasks
      if (module.tasks && module.tasks.length > 0) {
        // Use predefined tasks from template
        for (let i = 0; i < module.tasks.length; i++) {
          const taskData = module.tasks[i];
          const taskDueDate = new Date(moduleStartDate);
          taskDueDate.setDate(taskDueDate.getDate() + i);
          
          const task = await Task.create({
            title: taskData.title,
            description: taskData.description,
            courseId,
            moduleId: module._id || moduleNumber,
            userId: userIdToUse,
            type: typeMapping[taskData.type] || 'LEARN',
            estimatedDuration: taskData.estimatedTime || taskData.estimatedDuration || 30,
            order: taskData.order || (i + 1),
            status: 'todo',
            priority: taskData.priority || (moduleIndex === 0 ? 'high' : 'medium'),
            dueDate: taskDueDate
          });
          createdTasks.push(task);
        }
      } else {
        // Auto-generate tasks for modules without predefined tasks
        const moduleTasks = [];
        
        // 1. Study/Reading Task (📚)
        const studyDueDate = new Date(moduleStartDate);
        const studyTask = await Task.create({
          title: `📚 Study Module ${moduleNumber}: ${module.title}`,
          description: `Read and understand the content of ${module.title}. Review key concepts and take notes.`,
          courseId,
          moduleId: module._id || moduleNumber,
          userId: userIdToUse,
          type: 'LEARN',
          estimatedDuration: 120, // 2 hours
          order: 1,
          status: 'todo',
          priority: moduleIndex === 0 ? 'high' : 'medium',
          dueDate: studyDueDate
        });
        moduleTasks.push(studyTask);
        
        // 2. Practice/Exercise Task (✏️) - if module has lessons
        if (module.lessons && module.lessons.length > 0) {
          const practiceDueDate = new Date(moduleStartDate);
          practiceDueDate.setDate(practiceDueDate.getDate() + 3);
          
          const practiceTask = await Task.create({
            title: `✏️ Practice Module ${moduleNumber}: Exercises`,
            description: `Complete practice exercises and hands-on activities for ${module.title}. Apply what you've learned.`,
            courseId,
            moduleId: module._id || moduleNumber,
            userId: userIdToUse,
            type: 'PRACTICE',
            estimatedDuration: 90, // 1.5 hours
            order: 2,
            status: 'todo',
            priority: 'medium',
            dueDate: practiceDueDate
          });
          moduleTasks.push(practiceTask);
        }
        
        // 3. Quiz/Assessment Task (🎯)
        const quizDueDate = new Date(moduleStartDate);
        quizDueDate.setDate(quizDueDate.getDate() + 6);
        
        const quizTask = await Task.create({
          title: `🎯 Quiz: Module ${moduleNumber} Assessment`,
          description: `Test your understanding of ${module.title}. Complete the quiz to verify your knowledge.`,
          courseId,
          moduleId: module._id || moduleNumber,
          userId: userIdToUse,
          type: 'TEST',
          estimatedDuration: 30, // 30 minutes
          order: 3,
          status: 'todo',
          priority: 'high',
          dueDate: quizDueDate
        });
        moduleTasks.push(quizTask);
        
        createdTasks.push(...moduleTasks);
      }
    }
    
    // Add final project task for the entire course
    const finalProjectDate = new Date(today);
    finalProjectDate.setDate(finalProjectDate.getDate() + (modules.length * 7) + 7);
    
    const finalProject = await Task.create({
      title: `🚀 Final Project: ${course.title}`,
      description: `Complete the comprehensive final project for ${course.title}. Apply all concepts learned throughout the course.`,
      courseId,
      moduleId: null, // Course-level task
      userId: userIdToUse,
      type: 'PROJECT',
      estimatedDuration: 240, // 4 hours
      order: 999,
      status: 'todo',
      priority: 'urgent',
      dueDate: finalProjectDate
    });
    createdTasks.push(finalProject);
    
    console.log(`✅ Created ${createdTasks.length} tasks for course: ${course.title}`);
    return createdTasks;
  }
  
  /**
   * Generate final exam for a course
   */
  static async generateCourseExam(courseId, userId) {
    const Exam = require('../models/Exam');
    const Course = require('../models/Course');
    const OpenAIService = require('./OpenAIService');
    
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      
      console.log(`📝 Generating final exam for course: ${course.title}`);
      
      let examQuestions = [];
      
      // Try to generate questions with OpenAI if configured
      if (OpenAIService.isConfigured()) {
        try {
          examQuestions = await this.generateExamQuestionsWithAI(course);
        } catch (aiError) {
          console.warn('⚠️ AI exam generation failed, using template:', aiError.message);
          examQuestions = this.generateTemplateExamQuestions(course);
        }
      } else {
        examQuestions = this.generateTemplateExamQuestions(course);
      }
      
      // Create the exam
      const exam = await Exam.create({
        courseId: course._id,
        moduleId: null, // Final course exam
        title: `Final Exam: ${course.title}`,
        description: `Comprehensive assessment covering all modules of ${course.title}. You must score ${70}% or higher to pass and receive your certificate.`,
        questions: examQuestions,
        passingScore: 70,
        duration: Math.max(30, examQuestions.length * 2), // 2 minutes per question, minimum 30 minutes
        attemptsAllowed: 3,
        createdBy: userId,
        isActive: true
      });
      
      console.log(`✅ Created final exam with ${examQuestions.length} questions`);
      return exam;
    } catch (error) {
      console.error('❌ Error generating course exam:', error);
      throw error;
    }
  }
  
  /**
   * Generate exam questions using OpenAI
   */
  static async generateExamQuestionsWithAI(course) {
    const OpenAIService = require('./OpenAIService');
    
    // Build a comprehensive prompt
    const moduleTopics = course.modules.map(m => `- ${m.title}: ${m.description}`).join('\n');
    
    const prompt = `Create a comprehensive final exam for the course "${course.title}".

Course Description: ${course.description}

Course Modules:
${moduleTopics}

Generate 15-20 multiple-choice questions that test understanding across all modules. 

For each question, provide:
1. Question text that tests conceptual understanding
2. Four answer options (A, B, C, D)
3. The correct answer (letter only)
4. Brief explanation of why the answer is correct
5. Category (use the module title it relates to)

Return as JSON array with this structure:
[
  {
    "questionText": "What is...",
    "options": [
      {"text": "Option A", "isCorrect": false},
      {"text": "Option B", "isCorrect": true},
      {"text": "Option C", "isCorrect": false},
      {"text": "Option D", "isCorrect": false}
    ],
    "correctAnswer": "Option B",
    "explanation": "Because...",
    "category": "Module 1: Introduction",
    "points": 1
  }
]`;

    const completion = await OpenAIService.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator creating comprehensive course assessments. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response.questions || response;
  }
  
  /**
   * Generate template exam questions (fallback)
   */
  static generateTemplateExamQuestions(course) {
    const questions = [];
    const modules = course.modules || [];
    
    // Generate 2-3 questions per module
    modules.forEach((module, index) => {
      const moduleNumber = module.moduleNumber || index + 1;
      const category = `Module ${moduleNumber}: ${module.title}`;
      
      // Question 1: Understanding/Knowledge
      questions.push({
        questionText: `What is the main focus of ${module.title}?`,
        type: 'multiple-choice',
        options: [
          { text: module.description || 'Understanding core concepts', isCorrect: true },
          { text: 'Advanced techniques only', isCorrect: false },
          { text: 'Historical background', isCorrect: false },
          { text: 'Future predictions', isCorrect: false }
        ],
        correctAnswer: module.description || 'Understanding core concepts',
        explanation: `${module.title} focuses on ${module.description}`,
        category: category,
        points: 1
      });
      
      // Question 2: Application
      if (module.learningObjectives && module.learningObjectives.length > 0) {
        const objective = module.learningObjectives[0];
        questions.push({
          questionText: `Which of the following best describes a key learning objective of ${module.title}?`,
          type: 'multiple-choice',
          options: [
            { text: objective, isCorrect: true },
            { text: 'Memorizing terminology', isCorrect: false },
            { text: 'Passing the exam', isCorrect: false },
            { text: 'Reading all materials', isCorrect: false }
          ],
          correctAnswer: objective,
          explanation: `One of the main objectives is: ${objective}`,
          category: category,
          points: 1
        });
      }
    });
    
    // Add 3 general questions
    questions.push({
      questionText: `What is the overall goal of the "${course.title}" course?`,
      type: 'multiple-choice',
      options: [
        { text: course.description || 'Master the subject comprehensively', isCorrect: true },
        { text: 'Get a certificate quickly', isCorrect: false },
        { text: 'Learn basic terminology', isCorrect: false },
        { text: 'Complete assignments', isCorrect: false }
      ],
      correctAnswer: course.description || 'Master the subject comprehensively',
      explanation: `The course aims to: ${course.description}`,
      category: 'Course Overview',
      points: 1
    });
    
    return questions;
  }
  
  static hasSignificantChanges(oldTemplate, newContent) {
    // Simple heuristic: if modules count changed by more than 20% or content length changed significantly
    const oldModuleCount = oldTemplate.modules.length;
    const newModuleCount = newContent.modules?.length || 0;
    
    return Math.abs(oldModuleCount - newModuleCount) / oldModuleCount > 0.2;
  }
  
  static calculateCompletionStats(courses) {
    const completed = courses.filter(c => c.status === 'completed').length;
    const inProgress = courses.filter(c => c.status === 'active').length;
    const total = courses.length;
    
    return {
      completed,
      inProgress,
      total,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }
}

module.exports = CourseTemplateService;