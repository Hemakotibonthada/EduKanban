const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate a comprehensive course structure using OpenAI
   */
  async generateCourse({ courseTopic, knowledgeLevel, timeCommitment }) {
    try {
      console.log('🤖 Generating course with OpenAI...');
      console.log(`   Topic: ${courseTopic}`);
      console.log(`   Level: ${knowledgeLevel}`);
      console.log(`   Time: ${timeCommitment}`);

      const prompt = this.buildCoursePrompt(courseTopic, knowledgeLevel, timeCommitment);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
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
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      const courseData = JSON.parse(completion.choices[0].message.content);
      console.log('✅ Course generated successfully with OpenAI');

      return this.formatCourseData(courseData, courseTopic, knowledgeLevel, timeCommitment);

    } catch (error) {
      console.error('❌ OpenAI generation error:', error.message);
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
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
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
        max_tokens: 1000
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Error generating module content:', error);
      return `Content for ${moduleTitle}: This module covers important concepts and practical applications related to ${courseTopic}.`;
    }
  }

  /**
   * Check if OpenAI is properly configured
   */
  isConfigured() {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
  }
}

module.exports = new OpenAIService();
