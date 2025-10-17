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
    
    // Map template task types to Task model types
    const typeMapping = {
      'reading': 'LEARN',
      'exercise': 'PRACTICE',
      'quiz': 'TEST',
      'project': 'PROJECT',
      'assignment': 'PROJECT'
    };
    
    for (const module of modules) {
      if (module.tasks && module.tasks.length > 0) {
        for (let i = 0; i < module.tasks.length; i++) {
          const taskData = module.tasks[i];
          await Task.create({
            title: taskData.title,
            description: taskData.description,
            courseId,
            moduleId: module._id || module.moduleNumber,
            userId: userIdToUse,
            type: typeMapping[taskData.type] || 'LEARN',
            estimatedDuration: taskData.estimatedTime || taskData.estimatedDuration || 30,
            order: taskData.order || (i + 1),
            status: 'To Do'
          });
        }
      }
    }
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