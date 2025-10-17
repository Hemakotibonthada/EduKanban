import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Check } from 'lucide-react';
import { canInstall, showInstallPrompt, isPWA } from '../utils/serviceWorkerUtils';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isPWA()) {
      setIsInstalled(true);
      return;
    }

    // Check if install prompt is available
    const checkInstallability = setInterval(() => {
      if (canInstall()) {
        setShowPrompt(true);
        clearInterval(checkInstallability);
      }
    }, 1000);

    // Clean up
    return () => clearInterval(checkInstallability);
  }, []);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      setShowPrompt(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed or recently dismissed
  if (isInstalled || !showPrompt) {
    return null;
  }

  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-2xl shadow-2xl overflow-hidden border border-purple-400/30">
          <div className="p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Install EduKanban
                </h3>
                <p className="text-sm text-purple-100">
                  Get the full app experience with offline access
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <Check className="w-4 h-4 text-green-300" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <Check className="w-4 h-4 text-green-300" />
                <span>Fast loading</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <Check className="w-4 h-4 text-green-300" />
                <span>Home screen</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-100">
                <Check className="w-4 h-4 text-green-300" />
                <span>Push alerts</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-3 bg-white text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
              >
                Later
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-700 to-pink-700 px-6 py-3 flex items-center justify-center gap-2 text-xs text-purple-100">
            <Monitor className="w-4 h-4" />
            <span>Available on all devices</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
