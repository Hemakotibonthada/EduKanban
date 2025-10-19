import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  Edit,
  Trash2,
  Play,
  RotateCcw,
  Check,
  X,
  BookOpen,
  TrendingUp,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * FlashcardSystem Component
 * Spaced repetition learning system with AI-generated flashcards
 * Features:
 * - Create custom flashcard decks
 * - AI-generated flashcards from course content
 * - Spaced repetition algorithm (SM-2)
 * - Study modes: Learn, Review, Test
 * - Progress tracking and statistics
 */
const FlashcardSystem = ({ user, token }) => {
  const [view, setView] = useState('decks'); // 'decks', 'create', 'study'
  const [decks, setDecks] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState('learn'); // 'learn', 'review', 'test'
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    cardsToReview: 0,
    masteredCards: 0,
    studyStreak: 0
  });

  // Flashcard state for new card creation
  const [newCard, setNewCard] = useState({
    front: '',
    back: '',
    tags: [],
    difficulty: 'medium'
  });

  // Deck state for new deck creation
  const [newDeck, setNewDeck] = useState({
    name: '',
    description: '',
    category: 'general',
    isPublic: false
  });

  useEffect(() => {
    fetchDecks();
    fetchStats();
  }, []);

  const fetchDecks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/decks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDecks(data.data.decks);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast.error('Failed to load flashcard decks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCards = async (deckId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/decks/${deckId}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCards(data.data.cards);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error('Failed to load flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const createDeck = async () => {
    if (!newDeck.name.trim()) {
      toast.error('Please enter a deck name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDeck)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Deck created successfully!');
        fetchDecks();
        setNewDeck({ name: '', description: '', category: 'general', isPublic: false });
        setView('decks');
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      toast.error('Failed to create deck');
    }
  };

  const addCard = async (deckId) => {
    if (!newCard.front.trim() || !newCard.back.trim()) {
      toast.error('Please fill in both front and back of the card');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/decks/${deckId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCard)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Card added successfully!');
        fetchCards(deckId);
        setNewCard({ front: '', back: '', tags: [], difficulty: 'medium' });
      }
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add card');
    }
  };

  const generateAICards = async (deckId, topic, count = 10) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deckId, topic, count })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Generated ${count} AI flashcards!`);
        fetchCards(deckId);
      }
    } catch (error) {
      console.error('Error generating AI cards:', error);
      toast.error('Failed to generate AI flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const rateCard = async (cardId, rating) => {
    // SM-2 Algorithm: rating 0-5 (0=again, 1=hard, 2=good, 3=easy, 4=perfect)
    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/cards/${cardId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });

      const data = await response.json();
      if (data.success) {
        // Move to next card
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1);
          setShowAnswer(false);
        } else {
          toast.success('Study session complete!');
          setView('decks');
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Error rating card:', error);
      toast.error('Failed to save rating');
    }
  };

  const startStudySession = (deck, mode) => {
    setCurrentDeck(deck);
    setStudyMode(mode);
    fetchCards(deck._id);
    setView('study');
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Flashcard System
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Master concepts with spaced repetition
              </p>
            </div>
          </div>

          {view === 'decks' && (
            <button
              onClick={() => setView('create')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-shadow"
            >
              <Plus className="w-5 h-5" />
              <span>New Deck</span>
            </button>
          )}

          {view !== 'decks' && (
            <button
              onClick={() => setView('decks')}
              className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Decks</span>
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        {view === 'decks' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <StatCard
              icon={BookOpen}
              label="Total Decks"
              value={stats.totalDecks}
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={Brain}
              label="Total Cards"
              value={stats.totalCards}
              color="from-purple-500 to-pink-500"
            />
            <StatCard
              icon={Target}
              label="To Review"
              value={stats.cardsToReview}
              color="from-orange-500 to-red-500"
            />
            <StatCard
              icon={Check}
              label="Mastered"
              value={stats.masteredCards}
              color="from-green-500 to-teal-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Study Streak"
              value={`${stats.studyStreak} days`}
              color="from-yellow-500 to-orange-500"
            />
          </div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {view === 'decks' && (
            <motion.div
              key="decks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {isLoading ? (
                <div className="col-span-full flex justify-center items-center h-64">
                  <div className="w-12 h-12 border-4 border-purple-600 dark:border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : decks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Brain className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No flashcard decks yet. Create your first deck!
                  </p>
                </div>
              ) : (
                decks.map(deck => (
                  <DeckCard
                    key={deck._id}
                    deck={deck}
                    onStudy={startStudySession}
                  />
                ))
              )}
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Create New Deck
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deck Name
                  </label>
                  <input
                    type="text"
                    value={newDeck.name}
                    onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., JavaScript Fundamentals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newDeck.description}
                    onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="What will you learn with this deck?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newDeck.category}
                    onChange={(e) => setNewDeck({ ...newDeck, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="general">General</option>
                    <option value="programming">Programming</option>
                    <option value="languages">Languages</option>
                    <option value="science">Science</option>
                    <option value="math">Mathematics</option>
                    <option value="history">History</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newDeck.isPublic}
                    onChange={(e) => setNewDeck({ ...newDeck, isPublic: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this deck public (others can use it)
                  </label>
                </div>

                <button
                  onClick={createDeck}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Create Deck
                </button>
              </div>
            </motion.div>
          )}

          {view === 'study' && currentCard && (
            <motion.div
              key="study"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Study Header */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentDeck.name}
                  </h2>
                  <button
                    onClick={shuffleCards}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Shuffle cards"
                  >
                    <Shuffle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Card {currentCardIndex + 1} of {cards.length}
                  </span>
                  <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                      style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Flashcard */}
              <motion.div
                key={currentCardIndex}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: showAnswer ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                className="relative h-96 cursor-pointer perspective-1000"
                onClick={() => setShowAnswer(!showAnswer)}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front of card */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-12 flex items-center justify-center backface-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-white/70 text-sm mb-4 flex items-center justify-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Click to reveal answer</span>
                    </div>
                    <p className="text-white text-3xl font-bold">
                      {currentCard.front}
                    </p>
                  </div>
                </div>

                {/* Back of card */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl p-12 flex items-center justify-center backface-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: showAnswer ? 'rotateY(0deg)' : 'rotateY(-180deg)'
                  }}
                >
                  <p className="text-white text-2xl font-semibold text-center">
                    {currentCard.back}
                  </p>
                </div>
              </motion.div>

              {/* Rating Buttons (only show when answer is revealed) */}
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <RatingButton
                    label="Again"
                    color="from-red-500 to-red-600"
                    onClick={() => rateCard(currentCard._id, 0)}
                    icon={X}
                  />
                  <RatingButton
                    label="Hard"
                    color="from-orange-500 to-orange-600"
                    onClick={() => rateCard(currentCard._id, 1)}
                  />
                  <RatingButton
                    label="Good"
                    color="from-blue-500 to-blue-600"
                    onClick={() => rateCard(currentCard._id, 2)}
                  />
                  <RatingButton
                    label="Easy"
                    color="from-green-500 to-green-600"
                    onClick={() => rateCard(currentCard._id, 3)}
                    icon={Check}
                  />
                </motion.div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => {
                    if (currentCardIndex > 0) {
                      setCurrentCardIndex(currentCardIndex - 1);
                      setShowAnswer(false);
                    }
                  }}
                  disabled={currentCardIndex === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => {
                    if (currentCardIndex < cards.length - 1) {
                      setCurrentCardIndex(currentCardIndex + 1);
                      setShowAnswer(false);
                    }
                  }}
                  disabled={currentCardIndex === cards.length - 1}
                  className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center mb-3`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

// Deck Card Component
const DeckCard = ({ deck, onStudy }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        {deck.name}
      </h3>
      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
        {deck.cardCount || 0} cards
      </span>
    </div>

    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2">
      {deck.description}
    </p>

    <div className="flex space-x-2">
      <button
        onClick={() => onStudy(deck, 'learn')}
        className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow"
      >
        <Play className="w-4 h-4 inline mr-2" />
        Study
      </button>
      <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        <Edit className="w-4 h-4" />
      </button>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          To review: <span className="font-semibold text-orange-600">{deck.toReview || 0}</span>
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          Mastered: <span className="font-semibold text-green-600">{deck.mastered || 0}</span>
        </span>
      </div>
    </div>
  </motion.div>
);

// Rating Button Component
const RatingButton = ({ label, color, onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`py-4 bg-gradient-to-r ${color} text-white rounded-xl font-semibold hover:shadow-lg transition-shadow`}
  >
    {Icon && <Icon className="w-5 h-5 inline mr-2" />}
    {label}
  </button>
);

export default FlashcardSystem;
