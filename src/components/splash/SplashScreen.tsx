import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fade out at 2.4s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2400);

    // Completely finish and route to login after 2.8s
    const exitTimer = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(exitTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-50 w-screen h-screen bg-white flex flex-col items-center justify-center transition-opacity duration-500 selection:bg-transparent ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Centered Animated Brand Logo Container */}
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm w-full">
        
        {/* Animated Custom Logo with Smooth Scale, Fade-in, and Floating Glow */}
        <div className="animate-splash-logo relative flex items-center justify-center">
          <img
            src="/krishi-mitra-logo.png"
            alt="Krishi Mitra Logo"
            className="w-52 sm:w-64 h-auto object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Minimal loading indicator dots at bottom */}
        <div className="mt-8 flex items-center gap-1.5 opacity-60">
          <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-forest-accent animate-pulse delay-150" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-300" />
        </div>

      </div>
    </div>
  );
};
