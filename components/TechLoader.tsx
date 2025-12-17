'use client';

import { useEffect, useState } from 'react';

export default function TechLoader() {
  const [text, setText] = useState("INITIALIZING...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phrases = [
      "ESTABLISHING SECURE UPLINK...",
      "SYNCING PRODUCTION NODES...",
      "VERIFYING BIOMETRICS...",
      "DECRYPTING WORKSPACE...",
      "ACCESS GRANTED."
    ];
    
    let currentPhrase = 0;
    const textInterval = setInterval(() => {
      if (currentPhrase < phrases.length) {
        setText(phrases[currentPhrase]);
        currentPhrase++;
      }
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 10, 100));
    }, 200);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#000510] flex flex-col items-center justify-center font-mono text-cyan-500 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8">
        
        {/* Holographic Circle */}
        <div className="relative w-32 h-32 mb-8">
           <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite]" />
           <div className="absolute inset-2 border-2 border-cyan-400/50 rounded-full border-t-transparent animate-[spin_2s_linear_infinite_reverse]" />
           <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black tracking-tighter animate-pulse text-white">SF</span>
           </div>
        </div>

        {/* Text Glitch Effect */}
        <h1 className="text-2xl font-bold tracking-[0.2em] text-white mb-2 animate-pulse">
            SOL FRANCE
        </h1>
        <div className="h-6 mb-8 text-xs font-bold text-cyan-400 tracking-widest">
            {text}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden relative">
            <div 
                className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-all duration-200"
                style={{ width: `${progress}%` }}
            />
        </div>
        <div className="mt-2 text-[10px] text-cyan-600 w-full flex justify-between">
            <span>SYSTEM_V.2.5</span>
            <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}