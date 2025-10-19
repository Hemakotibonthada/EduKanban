const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const FlashcardDeck = require('../models/FlashcardDeck');
const { body, validationResult } = require('express-validator');

// Get all decks for user
router.get('/decks', async (req, res) => {
  try {
    const decks = await FlashcardDeck.find({
      $or: [
        { userId: req.user.userId },
        { isPublic: true }
      ]
    }).sort({ createdAt: -1 });

    // Add card counts
    const decksWithCounts = await Promise.all(
      decks.map(async (deck) => {
        const cardCount = await Flashcard.countDocuments({ deckId: deck._id });
        const toReview = await Flashcard.countDocuments({
          deckId: deck._id,
          nextReview: { $lte: new Date() }
        });
        const mastered = await Flashcard.countDocuments({
          deckId: deck._id,
          easeFactor: { $gte: 2.5 },
          interval: { $gte: 21 }
        });

        return {
          ...deck.toObject(),
          cardCount,
          toReview,
          mastered
        };
      })
    );

    res.json({
      success: true,
      data: { decks: decksWithCounts }
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch decks'
    });
  }
});

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const totalDecks = await FlashcardDeck.countDocuments({ userId: req.user.userId });
    const totalCards = await Flashcard.countDocuments({
      deckId: { $in: await FlashcardDeck.find({ userId: req.user.userId }).distinct('_id') }
    });
    const cardsToReview = await Flashcard.countDocuments({
      deckId: { $in: await FlashcardDeck.find({ userId: req.user.userId }).distinct('_id') },
      nextReview: { $lte: new Date() }
    });
    const masteredCards = await Flashcard.countDocuments({
      deckId: { $in: await FlashcardDeck.find({ userId: req.user.userId }).distinct('_id') },
      easeFactor: { $gte: 2.5 },
      interval: { $gte: 21 }
    });

    // Calculate study streak
    const studyStreak = 0; // TODO: Implement streak calculation

    res.json({
      success: true,
      data: {
        stats: {
          totalDecks,
          totalCards,
          cardsToReview,
          masteredCards,
          studyStreak
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// Create a new deck
router.post('/decks', [
  body('name').trim().notEmpty().withMessage('Deck name is required'),
  body('description').optional().trim(),
  body('category').optional().trim(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const deck = new FlashcardDeck({
      userId: req.user.userId,
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category || 'general',
      isPublic: req.body.isPublic || false
    });

    await deck.save();

    res.json({
      success: true,
      data: { deck }
    });
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deck'
    });
  }
});

// Get cards in a deck
router.get('/decks/:deckId/cards', async (req, res) => {
  try {
    const cards = await Flashcard.find({ deckId: req.params.deckId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { cards }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cards'
    });
  }
});

// Add a card to deck
router.post('/decks/:deckId/cards', [
  body('front').trim().notEmpty().withMessage('Card front is required'),
  body('back').trim().notEmpty().withMessage('Card back is required'),
  body('tags').optional().isArray(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const card = new Flashcard({
      deckId: req.params.deckId,
      front: req.body.front,
      back: req.body.back,
      tags: req.body.tags || [],
      difficulty: req.body.difficulty || 'medium',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date()
    });

    await card.save();

    res.json({
      success: true,
      data: { card }
    });
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add card'
    });
  }
});

// Rate a card (SM-2 Algorithm)
router.post('/cards/:cardId/rate', [
  body('rating').isInt({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const card = await Flashcard.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    const rating = req.body.rating;

    // SM-2 Algorithm
    if (rating >= 3) {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions += 1;
    } else {
      card.repetitions = 0;
      card.interval = 1;
    }

    card.easeFactor = card.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (card.easeFactor < 1.3) {
      card.easeFactor = 1.3;
    }

    // Set next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + card.interval);
    card.nextReview = nextReview;

    await card.save();

    res.json({
      success: true,
      data: { card }
    });
  } catch (error) {
    console.error('Error rating card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate card'
    });
  }
});

// Generate AI flashcards
router.post('/generate', [
  body('deckId').notEmpty().withMessage('Deck ID is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('count').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { deckId, topic, count = 10 } = req.body;

    // TODO: Integrate with OpenAI to generate flashcards
    // For now, return a placeholder response
    const generatedCards = [];
    for (let i = 0; i < count; i++) {
      const card = new Flashcard({
        deckId,
        front: `AI Generated Question ${i + 1} about ${topic}`,
        back: `AI Generated Answer ${i + 1}`,
        tags: ['ai-generated', topic],
        difficulty: 'medium',
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date()
      });
      await card.save();
      generatedCards.push(card);
    }

    res.json({
      success: true,
      data: { cards: generatedCards },
      message: `Generated ${count} flashcards`
    });
  } catch (error) {
    console.error('Error generating AI cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI flashcards'
    });
  }
});

module.exports = router;
