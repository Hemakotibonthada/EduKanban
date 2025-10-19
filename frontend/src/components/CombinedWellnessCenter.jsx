import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, ArrowRight } from 'lucide-react';
import EnhancedWellnessCenter from './EnhancedWellnessCenter';
import EnhancedRehabilitationCenter from './EnhancedRehabilitationCenter';

const CombinedWellnessCenter = ({ user, token }) => {
  const [activeMode, setActiveMode] = useState(null);

  if (activeMode === 'wellness') {
    return (
      <div>
        <button
          onClick={() => setActiveMode(null)}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to Wellness Center</span>
        </button>
        <EnhancedWellnessCenter user={user} token={token} />
      </div>
    );
  }

  if (activeMode === 'rehabilitation') {
    return (
      <div>
        <button
          onClick={() => setActiveMode(null)}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to Wellness Center</span>
        </button>
        <EnhancedRehabilitationCenter user={user} token={token} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-teal-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Wellness & Recovery Center</h1>
          <p className="text-white/90 text-lg">
            Choose your path to better mental health and wellbeing
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wellness Center Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
          onClick={() => setActiveMode('wellness')}
        >
          <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-8 text-white">
            <Heart className="w-16 h-16 mb-4" />
            <h2 className="text-3xl font-bold mb-3">Wellness Center</h2>
            <p className="text-white/90 text-lg">
              Daily practices for mental health, mindfulness, and self-care
            </p>
          </div>

          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-3">What's Included:</h3>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Guided breathing exercises</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Meditation timer</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Daily mood tracking</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Quick wellness exercises</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Mental health resources</span>
              </li>
            </ul>

            <button className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2">
              <span>Start Wellness Journey</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Rehabilitation Center Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
          onClick={() => setActiveMode('rehabilitation')}
        >
          <div className="bg-gradient-to-br from-teal-500 to-green-500 p-8 text-white">
            <Shield className="w-16 h-16 mb-4" />
            <h2 className="text-3xl font-bold mb-3">Rehabilitation Center</h2>
            <p className="text-white/90 text-lg">
              Structured programs for recovery, habit formation, and lasting change
            </p>
          </div>

          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-3">What's Included:</h3>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>6 guided rehabilitation programs</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Custom program creator</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Daily check-ins & progress tracking</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Goal setting & accountability</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Resource library</span>
              </li>
            </ul>

            <button className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2">
              <span>Browse Programs</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border-2 border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Not Sure Which to Choose?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Choose Wellness Center if:</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• You want daily mindfulness practices</li>
              <li>• You're looking for quick stress relief</li>
              <li>• You want to track your mood</li>
              <li>• You need immediate support tools</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Choose Rehabilitation Center if:</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• You want structured recovery programs</li>
              <li>• You're working on specific habits</li>
              <li>• You need long-term progress tracking</li>
              <li>• You want accountability and goals</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-gray-600 text-center">
          You can access both centers anytime and use them together for comprehensive support! 💚
        </p>
      </div>
    </div>
  );
};

export default CombinedWellnessCenter;
