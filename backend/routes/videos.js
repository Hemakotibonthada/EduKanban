const express = require('express');
const axios = require('axios');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Search YouTube videos for learning content
const searchYouTubeVideos = async (query, maxResults = 5) => {
  try {
    // In production, use YouTube Data API v3
    // For now, return mock data
    const mockVideos = [
      {
        id: '1',
        title: `${query} - Complete Tutorial`,
        description: `Learn ${query} from beginner to advanced level`,
        url: `https://www.youtube.com/watch?v=mock1`,
        thumbnail: 'https://i.ytimg.com/vi/mock1/mqdefault.jpg',
        duration: '45:32',
        views: '125,000',
        likes: '3,200'
      },
      {
        id: '2',
        title: `${query} Best Practices`,
        description: `Industry best practices for ${query}`,
        url: `https://www.youtube.com/watch?v=mock2`,
        thumbnail: 'https://i.ytimg.com/vi/mock2/mqdefault.jpg',
        duration: '32:15',
        views: '89,000',
        likes: '2,100'
      },
      {
        id: '3',
        title: `${query} Crash Course`,
        description: `Quick crash course in ${query}`,
        url: `https://www.youtube.com/watch?v=mock3`,
        thumbnail: 'https://i.ytimg.com/vi/mock3/mqdefault.jpg',
        duration: '28:45',
        views: '156,000',
        likes: '4,500'
      }
    ];

    return mockVideos.slice(0, maxResults);
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
};

// GET /api/videos/search
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const videos = await searchYouTubeVideos(query, parseInt(limit));

    // Log video search
    await ActivityLog.create({
      userId: req.userId,
      sessionId: req.sessionId,
      action: 'video_search',
      entity: { type: 'system' },
      details: {
        searchQuery: query,
        resultsFound: videos.length,
        limit: parseInt(limit)
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      data: {
        query,
        videos,
        totalResults: videos.length
      }
    });

  } catch (error) {
    console.error('Video search error:', error);
    res.status(500).json({
      success: false,
      message: 'Video search failed'
    });
  }
});

// GET /api/videos/recommendations/:moduleId
router.get('/recommendations/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    // In a real implementation, this would:
    // 1. Get the module details
    // 2. Generate search queries based on module content
    // 3. Search for relevant videos
    // 4. Filter by quality metrics
    
    const mockRecommendations = [
      {
        id: 'rec1',
        title: 'Recommended Tutorial for This Module',
        description: 'High-quality tutorial matching your learning objectives',
        url: 'https://www.youtube.com/watch?v=rec1',
        thumbnail: 'https://i.ytimg.com/vi/rec1/mqdefault.jpg',
        duration: '25:30',
        views: '234,000',
        likes: '8,900',
        relevanceScore: 95
      },
      {
        id: 'rec2',
        title: 'Alternative Explanation',
        description: 'Different perspective on the same concepts',
        url: 'https://www.youtube.com/watch?v=rec2',
        thumbnail: 'https://i.ytimg.com/vi/rec2/mqdefault.jpg',
        duration: '18:45',
        views: '156,000',
        likes: '5,200',
        relevanceScore: 87
      }
    ];

    res.json({
      success: true,
      data: {
        moduleId,
        recommendations: mockRecommendations
      }
    });

  } catch (error) {
    console.error('Video recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video recommendations'
    });
  }
});

module.exports = router;