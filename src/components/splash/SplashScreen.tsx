import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onFinish }) => {
  const handleDone = onComplete || onFinish;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (handleDone) {
        handleDone();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login'; 
      }
    }, 3500); // 3.5 seconds total duration
    return () => clearTimeout(timer);
  }, [handleDone]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white overflow-hidden fixed inset-0 z-50 selection:bg-transparent">
      
      {/* 
        Animation Sequence:
        1. Fades in and slides up slightly (0s to 0.8s)
        2. Performs a gentle "Handshake" wobble (0.8s to 2.5s)
      */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotate: [0, -4, 4, -3, 3, -1, 1, 0] // The Handshake Wobble
        }}
        transition={{
          // Entry animation
          opacity: { duration: 0.8, ease: "easeOut" },
          y: { duration: 0.8, type: "spring", bounce: 0.4 },
          scale: { duration: 0.8, ease: "easeOut" },
          // Handshake animation (Starts after entry)
          rotate: { 
            delay: 0.8, 
            duration: 1.5, 
            ease: "easeInOut",
            repeat: 0
          }
        }}
        style={{ originX: 0.5, originY: 1 }} // Anchors the animation at the bottom (wrist)
        className="flex flex-col items-center"
      >
        <img 
          src="/krishi-mitra-logo.png" 
          alt="Krishi Mitra - Saathi Har Kisan Ka" 
          className="w-56 sm:w-64 h-auto drop-shadow-xl select-none"
          draggable={false}
        />
      </motion.div>

      {/* Animated Text appearing after logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="mt-8 text-center"
      >
        <p className="text-green-700 font-medium text-lg tracking-widest animate-pulse">
          Connecting...
        </p>
      </motion.div>
      
    </div>
  );
};

export default SplashScreen;
