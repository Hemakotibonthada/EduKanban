const express = require('express');
const router = express.Router();
const RehabProgram = require('../models/RehabProgram');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// GET /api/rehab/programs - Get user's rehabilitation programs
router.get('/programs', async (req, res) => {
  try {
    const programs = await RehabProgram.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      programs
    });
  } catch (error) {
    console.error('Error fetching rehab programs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rehabilitation programs'
    });
  }
});

// GET /api/rehab/programs/:id - Get specific program
router.get('/programs/:id', async (req, res) => {
  try {
    const program = await RehabProgram.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    // Calculate current streak
    program.calculateCurrentStreak();
    await program.save();
    
    res.json({
      success: true,
      program
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch program'
    });
  }
});

// POST /api/rehab/programs - Create new rehabilitation program with AI
router.post('/programs', async (req, res) => {
  try {
    const {
      addictionType,
      specificAddiction,
      severity,
      primaryGoal,
      secondaryGoals,
      targetCompletionDate
    } = req.body;
    
    // Generate AI-powered recovery plan
    const recoveryPlan = await generateRecoveryPlan({
      addictionType,
      specificAddiction,
      severity,
      primaryGoal
    });
    
    // Create program
    const program = new RehabProgram({
      userId: req.userId,
      addictionType,
      specificAddiction,
      severity,
      primaryGoal,
      secondaryGoals: secondaryGoals?.map(g => ({ goal: g, completed: false })) || [],
      targetCompletionDate,
      recoveryPlan,
      crisisHotlines: getDefaultCrisisHotlines()
    });
    
    await program.save();
    
    res.json({
      success: true,
      program,
      message: 'Rehabilitation program created successfully'
    });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rehabilitation program',
      error: error.message
    });
  }
});

// POST /api/rehab/programs/:id/check-in - Daily check-in
router.post('/programs/:id/check-in', async (req, res) => {
  try {
    const {
      mood,
      cravingLevel,
      triggers,
      copingStrategies,
      notes,
      successfulResistance
    } = req.body;
    
    const program = await RehabProgram.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    // Add daily entry
    program.dailyEntries.push({
      mood,
      cravingLevel,
      triggers: triggers || [],
      copingStrategies: copingStrategies || [],
      notes,
      successfulResistance: successfulResistance !== false
    });
    
    // Update streak
    program.calculateCurrentStreak();
    
    // Check for milestones
    const newMilestones = checkMilestones(program);
    if (newMilestones.length > 0) {
      program.milestones.push(...newMilestones);
    }
    
    await program.save();
    
    res.json({
      success: true,
      program,
      newMilestones,
      message: 'Check-in recorded successfully'
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record check-in'
    });
  }
});

// POST /api/rehab/programs/:id/ai-support - Get AI support/guidance
router.post('/programs/:id/ai-support', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    const program = await RehabProgram.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    // Get AI response
    const aiResponse = await getAISupport({
      userMessage: message,
      programContext: {
        addictionType: program.addictionType,
        specificAddiction: program.specificAddiction,
        severity: program.severity,
        currentStreak: program.currentStreak,
        soberDays: program.soberDays,
        recentEntries: program.dailyEntries.slice(-7)
      },
      sessionContext: context
    });
    
    // Log support session
    program.supportSessions.push({
      sessionType: context === 'crisis' ? 'crisis' : 'ai_chat',
      duration: 0,
      summary: message.substring(0, 100),
      helpful: null
    });
    
    await program.save();
    
    res.json({
      success: true,
      response: aiResponse,
      message: 'AI support provided'
    });
  } catch (error) {
    console.error('Error getting AI support:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI support',
      error: error.message
    });
  }
});

// PATCH /api/rehab/programs/:id/phase/:phaseIndex - Mark phase as complete
router.patch('/programs/:id/phase/:phaseIndex', async (req, res) => {
  try {
    const program = await RehabProgram.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    const phaseIndex = parseInt(req.params.phaseIndex);
    if (program.recoveryPlan.phases[phaseIndex]) {
      program.recoveryPlan.phases[phaseIndex].completed = true;
    }
    
    await program.save();
    
    res.json({
      success: true,
      program,
      message: 'Phase completed successfully'
    });
  } catch (error) {
    console.error('Error updating phase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update phase'
    });
  }
});

// GET /api/rehab/programs/:id/stats - Get program statistics
router.get('/programs/:id/stats', async (req, res) => {
  try {
    const program = await RehabProgram.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    // Calculate statistics
    const stats = calculateProgramStats(program);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate statistics'
    });
  }
});

// Helper Functions

async function generateRecoveryPlan(programInfo) {
  try {
    const prompt = `As a compassionate addiction recovery specialist, create a personalized recovery plan for someone dealing with ${programInfo.addictionType} addiction (specifically ${programInfo.specificAddiction || 'general'}), with ${programInfo.severity} severity.

Their primary goal is: ${programInfo.primaryGoal}

Create a comprehensive recovery plan with:
1. 4 phases of recovery with specific goals and strategies for each
2. 10 practical coping strategies (categorized as immediate, short-term, long-term)
3. 5 common triggers and management strategies for each

Format the response as JSON with this structure:
{
  "phases": [
    {
      "phase": 1,
      "title": "Phase name",
      "duration": "timeframe",
      "goals": ["goal1", "goal2"],
      "strategies": ["strategy1", "strategy2"]
    }
  ],
  "copingStrategies": [
    {
      "strategy": "Strategy description",
      "category": "immediate|short_term|long_term"
    }
  ],
  "triggerManagement": [
    {
      "trigger": "Trigger description",
      "avoidanceStrategies": ["strategy1", "strategy2"],
      "copingMechanisms": ["mechanism1", "mechanism2"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a compassionate, evidence-based addiction recovery specialist. Provide supportive, practical, and scientifically-backed recovery plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback plan if AI fails
    return getDefaultRecoveryPlan(programInfo.addictionType);
  } catch (error) {
    console.error('Error generating recovery plan:', error);
    return getDefaultRecoveryPlan(programInfo.addictionType);
  }
}

async function getAISupport({ userMessage, programContext, sessionContext }) {
  try {
    const systemPrompt = sessionContext === 'crisis' 
      ? `You are a trained crisis counselor specializing in addiction recovery. The user is in crisis. Provide immediate, compassionate support. Remind them of crisis hotlines and emergency services. Keep responses concise and supportive.`
      : `You are a compassionate addiction recovery coach. The user is recovering from ${programContext.addictionType} addiction. They have been sober for ${programContext.soberDays} days with a current streak of ${programContext.currentStreak} days. Provide evidence-based support, encouragement, and practical coping strategies.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI support:', error);
    return "I'm here to support you. If you're in crisis, please reach out to a crisis hotline immediately. Remember, recovery is a journey, and every day is progress.";
  }
}

function checkMilestones(program) {
  const newMilestones = [];
  const existingMilestoneTypes = new Set(program.milestones.map(m => m.milestone));
  
  const milestones = [
    { days: 1, title: '24 Hours Strong', message: 'You made it through the first day!' },
    { days: 3, title: '3 Days Clean', message: 'The first 72 hours are the hardest. You did it!' },
    { days: 7, title: 'One Week Winner', message: 'A full week of recovery. Amazing progress!' },
    { days: 14, title: 'Two Weeks Triumph', message: 'Two weeks of strength and determination!' },
    { days: 30, title: 'One Month Milestone', message: 'A full month! You\'re building new habits!' },
    { days: 60, title: '60 Days Strong', message: 'Two months of recovery. Incredible dedication!' },
    { days: 90, title: '90 Days Free', message: 'Three months! Your life is transforming!' },
    { days: 180, title: 'Half Year Hero', message: 'Six months clean. You\'re an inspiration!' },
    { days: 365, title: 'One Year Anniversary', message: 'A full year of recovery! You\'ve proven your strength!' }
  ];
  
  for (const milestone of milestones) {
    if (program.currentStreak >= milestone.days && !existingMilestoneTypes.has(milestone.title)) {
      newMilestones.push({
        milestone: milestone.title,
        celebrationMessage: milestone.message
      });
    }
  }
  
  return newMilestones;
}

function calculateProgramStats(program) {
  const totalDays = Math.floor((Date.now() - program.startDate) / (1000 * 60 * 60 * 24));
  const successRate = totalDays > 0 ? (program.soberDays / totalDays) * 100 : 0;
  
  // Mood trends
  const recentEntries = program.dailyEntries.slice(-30);
  const moodScores = {
    'very_poor': 1,
    'poor': 2,
    'neutral': 3,
    'good': 4,
    'excellent': 5
  };
  
  const averageMood = recentEntries.length > 0
    ? recentEntries.reduce((sum, e) => sum + (moodScores[e.mood] || 3), 0) / recentEntries.length
    : 3;
  
  // Craving trends
  const averageCravingLevel = recentEntries.length > 0
    ? recentEntries.reduce((sum, e) => sum + (e.cravingLevel || 0), 0) / recentEntries.length
    : 0;
  
  // Most common triggers
  const triggerCounts = {};
  recentEntries.forEach(entry => {
    entry.triggers?.forEach(trigger => {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    });
  });
  
  const topTriggers = Object.entries(triggerCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([trigger, count]) => ({ trigger, count }));
  
  return {
    totalDays,
    soberDays: program.soberDays,
    currentStreak: program.currentStreak,
    longestStreak: program.longestStreak,
    successRate: Math.round(successRate),
    averageMood: Math.round(averageMood * 10) / 10,
    averageCravingLevel: Math.round(averageCravingLevel * 10) / 10,
    topTriggers,
    milestonesAchieved: program.milestones.length,
    checkInsCompleted: program.dailyEntries.length,
    supportSessionsCount: program.supportSessions.length
  };
}

function getDefaultCrisisHotlines() {
  return [
    {
      name: 'National Suicide Prevention Lifeline',
      phone: '988',
      available24_7: true
    },
    {
      name: 'Crisis Text Line',
      phone: 'Text HOME to 741741',
      available24_7: true
    },
    {
      name: 'SAMHSA National Helpline',
      phone: '1-800-662-4357',
      available24_7: true
    }
  ];
}

function getDefaultRecoveryPlan(addictionType) {
  return {
    phases: [
      {
        phase: 1,
        title: 'Recognition & Commitment',
        duration: '1-2 weeks',
        goals: [
          'Acknowledge the addiction',
          'Identify triggers',
          'Set clear recovery goals',
          'Build support network'
        ],
        strategies: [
          'Keep a daily journal',
          'Remove temptations from environment',
          'Share goals with trusted friend/family',
          'Join support community'
        ],
        completed: false
      },
      {
        phase: 2,
        title: 'Building New Habits',
        duration: '2-4 weeks',
        goals: [
          'Replace addictive behavior with healthy activities',
          'Develop coping mechanisms',
          'Establish routine',
          'Practice self-care'
        ],
        strategies: [
          'Start exercise routine',
          'Learn mindfulness/meditation',
          'Engage in hobbies',
          'Maintain sleep schedule'
        ],
        completed: false
      },
      {
        phase: 3,
        title: 'Strengthening Recovery',
        duration: '1-2 months',
        goals: [
          'Master trigger management',
          'Deepen support connections',
          'Address underlying issues',
          'Build confidence'
        ],
        strategies: [
          'Continue therapy/counseling',
          'Practice relapse prevention',
          'Help others in recovery',
          'Celebrate small wins'
        ],
        completed: false
      },
      {
        phase: 4,
        title: 'Maintaining Progress',
        duration: 'Ongoing',
        goals: [
          'Sustain healthy lifestyle',
          'Continue personal growth',
          'Give back to community',
          'Stay vigilant'
        ],
        strategies: [
          'Regular check-ins',
          'Ongoing support group participation',
          'Mentor others',
          'Review and adjust recovery plan'
        ],
        completed: false
      }
    ],
    copingStrategies: [
      { strategy: 'Deep breathing exercises (4-7-8 technique)', category: 'immediate' },
      { strategy: 'Call a support person', category: 'immediate' },
      { strategy: 'Take a walk or exercise', category: 'immediate' },
      { strategy: 'Practice the 5-4-3-2-1 grounding technique', category: 'immediate' },
      { strategy: 'Journaling thoughts and feelings', category: 'short_term' },
      { strategy: 'Engage in a hobby or creative activity', category: 'short_term' },
      { strategy: 'Attend support group meetings', category: 'short_term' },
      { strategy: 'Practice mindfulness meditation daily', category: 'long_term' },
      { strategy: 'Build meaningful relationships', category: 'long_term' },
      { strategy: 'Regular therapy/counseling', category: 'long_term' }
    ],
    triggerManagement: [
      {
        trigger: 'Stress and overwhelming emotions',
        avoidanceStrategies: [
          'Maintain work-life balance',
          'Learn to say no',
          'Delegate tasks when possible'
        ],
        copingMechanisms: [
          'Practice stress-reduction techniques',
          'Talk to therapist or counselor',
          'Use relaxation apps'
        ]
      },
      {
        trigger: 'Boredom and idle time',
        avoidanceStrategies: [
          'Plan activities in advance',
          'Keep a structured schedule',
          'Fill time with meaningful activities'
        ],
        copingMechanisms: [
          'Start a new hobby',
          'Volunteer in community',
          'Learn new skill'
        ]
      },
      {
        trigger: 'Social pressure and peer influence',
        avoidanceStrategies: [
          'Choose supportive friends',
          'Avoid high-risk situations',
          'Set boundaries'
        ],
        copingMechanisms: [
          'Practice assertiveness',
          'Have exit strategy',
          'Connect with recovery community'
        ]
      }
    ]
  };
}

module.exports = router;
