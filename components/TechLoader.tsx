'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function TechLoader() {
  const [text, setText] = useState("INITIALIZING FACTORY OS...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phrases = [
      "LOADING ASSETS...",
      "CALIBRATING SENSORS...",
      "IGNITING ENGINE...",
      "QUALITY CHECK: PASSED",
      "READY FOR LAUNCH."
    ];
    
    let currentPhrase = 0;
    const textInterval = setInterval(() => {
      if (currentPhrase < phrases.length) {
        setText(phrases[currentPhrase]);
        currentPhrase++;
      }
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 8;
      });
    }, 150);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#000510] flex flex-col items-center justify-center font-mono text-amber-500 overflow-hidden">
      {/* Tech Grid Background */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(245, 158, 11, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8">
        
        {/* LOGO AREA */}
        <div className="relative w-24 h-24 mb-6 animate-pulse">
           <Image src="/logo.webp" alt="Sol France" fill className="object-contain" />
        </div>

        {/* BURNING CONE ANIMATION */}
        <div className="relative w-16 h-40 mb-8">
            {/* The Cone Outline (Unlit) */}
            <div className="absolute inset-0 bg-slate-800 clip-triangle" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
            
            {/* The Fire Fill (Animates from bottom up - inverted triangle logic) */}
            {/* Note: Standard cones are wider at top, but for "firing up" visual, filling a V shape looks like filling a cone. 
                If your cone is point-down (V shape): polygon(50% 100%, 0 0, 100% 0) 
                If your cone is point-up (A shape): polygon(50% 0%, 0% 100%, 100% 100%) 
                Assuming standard pre-rolled cone (V shape usually held upright):
            */}
            <div className="absolute inset-0 w-full h-full clip-triangle flex items-end justify-center overflow-hidden" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}>
                <div 
                    className="w-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.8)] transition-all duration-200 ease-out"
                    style={{ height: `${progress}%` }}
                />
            </div>
            
            {/* Glow Effect behind */}
            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" style={{ opacity: progress / 100 }}></div>
        </div>

        {/* Text Status */}
        <h1 className="text-xl font-bold tracking-[0.2em] text-white mb-2">
            SOL FRANCE
        </h1>
        <div className="h-6 text-xs font-bold text-amber-500 tracking-widest flex justify-between w-64">
            <span>{text}</span>
            <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}