'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function TechLoader() {
  const [text, setText] = useState("INITIALIZING FACTORY OS...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phrases = [
      "SELECTING PREMIUM CONE...",
      "APPLYING PRECISION FLAME...",
      "IGNITING...",
      "QUALITY CHECK: PERFECT BURN",
      "READY FOR SESSION."
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
        return prev + Math.random() * 4; // Slower, more realistic burn
      });
    }, 100);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  // Calculate the position of the burning edge
  const burnPosition = 100 - progress;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center font-mono overflow-hidden">
      
      {/* Background Tech Grid with a warm glow */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(245, 158, 11, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.03) 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             backgroundBlendMode: 'overlay'
           }}>
         <div className="absolute inset-0 bg-gradient-radial from-orange-900/20 via-transparent to-transparent" style={{ opacity: progress / 100 }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg p-8">
        
        {/* LOGO AREA */}
        <div className="relative w-28 h-28 mb-12 drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] animate-pulse">
           <Image src="/logo.webp" alt="Sol France" fill className="object-contain" />
        </div>

        {/* --- ULTRA-REALISTIC 3D BURNING CONE --- */}
        <div className="relative w-96 h-40 mb-16 flex items-center justify-center">
            
            {/* Wrapper to tilt the cone */}
            <div className="relative w-full h-full transform -rotate-[20deg] scale-110">
                
                {/* 1. THE FILTER TIP (Realistic, Metallic Band) */}
                <div className="absolute left-2 bottom-3 w-20 h-10 z-30 rounded-l-sm overflow-hidden shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),_2px_2px_5px_rgba(0,0,0,0.2)]"
                     style={{ 
                         clipPath: 'polygon(0% 15%, 100% 5%, 100% 95%, 0% 85%)',
                         background: 'linear-gradient(to bottom, #e0c3a3 0%, #c2a278 40%, #a38663 60%, #7d6548 100%)'
                     }}>
                     {/* Filter texture & branding band */}
                     <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #5a4630 1px, #5a4630 2px)' }}></div>
                     <div className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-r from-yellow-600/50 to-yellow-800/50 mix-blend-overlay"></div>
                     <div className="absolute right-1 top-1/2 -translate-y-1/2 h-[80%] w-[1px] bg-yellow-500/30"></div>
                </div>

                {/* 2. THE CONE BODY (Translucent, Textured Paper) */}
                <div className="absolute left-[84px] bottom-3 w-72 h-14 z-20 origin-left overflow-hidden"
                     style={{ 
                         clipPath: 'polygon(0% 22%, 100% 0%, 100% 100%, 0% 78%)',
                         filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.2))'
                     }}>
                    
                    {/* Paper Texture Base (Translucent) */}
                    <div className="absolute inset-0 bg-[#f8f5f0]" 
                         style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(243,240,235,0.8) 50%, rgba(220,220,220,0.9) 100%)' }}>
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>
                    </div>

                    {/* 🔥 THE BURNING EFFECT (Moving Wrapper) */}
                    <div className="absolute inset-0 z-30"
                         style={{ 
                             transform: `translateX(${burnPosition}%)`,
                             transition: 'transform 0.1s linear'
                         }}>
                        
                        {/* a) The Ash (Behind the flame) */}
                        <div className="absolute right-full top-0 bottom-0 w-full bg-[#2a2a2a]">
                            <div className="absolute inset-0 opacity-80" style={{ background: 'linear-gradient(to right, #1a1a1a, #3a3a3a, #1a1a1a)', filter: 'contrast(150%) brightness(80%)' }}>
                                 <div className="absolute inset-0" style={{ backgroundImage: 'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0px, transparent 2px)' }}></div>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-orange-900/80 to-transparent"></div>
                        </div>

                        {/* b) The Glowing Ember Line (The burning edge) */}
                        <div className="absolute left-0 top-[-10%] bottom-[-10%] w-3 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 blur-[2px] animate-pulse"></div>
                        <div className="absolute left-[-2px] top-[-15%] bottom-[-15%] w-6 bg-orange-500/60 blur-md mix-blend-overlay"></div>

                        {/* c) Realistic Flame & Sparks at the tip */}
                        {progress < 100 && (
                            <div className="absolute left-[-25px] top-[-40px] w-24 h-40 pointer-events-none mix-blend-screen">
                                {/* Main Flame Core */}
                                <div className="absolute bottom-12 left-6 w-8 h-12 bg-gradient-to-t from-orange-500 via-yellow-500 to-transparent rounded-[50%_50%_30%_30%] blur-[4px] animate-[flicker_0.1s_infinite_alternate] opacity-90"></div>
                                {/* Outer Flame Glow */}
                                <div className="absolute bottom-10 left-4 w-12 h-16 bg-orange-600/40 rounded-full blur-xl animate-[flicker_0.2s_infinite_alternate_reverse]"></div>
                                {/* Rising Sparks */}
                                <div className="absolute bottom-14 left-8 w-1 h-1 bg-yellow-200 rounded-full animate-[spark_1.5s_infinite]"></div>
                                <div className="absolute bottom-14 left-10 w-1.5 h-1.5 bg-orange-300 rounded-full animate-[spark_2s_infinite_0.3s]"></div>
                                <div className="absolute bottom-14 left-6 w-1 h-1 bg-red-300 rounded-full animate-[spark_1.8s_infinite_0.6s]"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. REALISTIC SMOKE (Rising from the burning edge) */}
                <div className="absolute z-40 pointer-events-none" 
                     style={{ 
                         left: `calc(84px + (288px * ${progress / 100}))`,
                         top: '-50px',
                         opacity: progress > 2 && progress < 98 ? 1 : 0, 
                         transition: 'opacity 0.5s, left 0.1s linear'
                     }}>
                    <div className="absolute -left-4 w-12 h-12 bg-gray-400/20 rounded-full blur-xl animate-[smoke_3s_infinite]"></div>
                    <div className="absolute -left-2 w-10 h-10 bg-gray-300/15 rounded-full blur-lg animate-[smoke_4s_infinite_1s]"></div>
                    <div className="absolute left-0 w-8 h-8 bg-white/10 rounded-full blur-md animate-[smoke_3.5s_infinite_0.5s]"></div>
                </div>

                {/* Cone shadow on the "ground" */}
                <div className="absolute left-4 bottom-0 w-80 h-4 bg-black/30 blur-md rounded-[50%] transform rotate-[5deg] translate-y-6"></div>

            </div>
        </div>

        {/* Text Status */}
        <h1 className="text-2xl font-bold tracking-[0.3em] text-white mb-4 text-shadow-glow relative z-50">
            SOL FRANCE
        </h1>
        
        {/* Progress Text */}
        <div className="w-72 flex justify-between text-[10px] font-bold text-amber-500/90 tracking-widest font-mono relative z-50">
            <span className="truncate mr-4">{text}</span>
            <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes flicker {
            0% { transform: scale(1) skewX(0deg); opacity: 0.9; }
            25% { transform: scale(1.05) skewX(2deg); opacity: 1; }
            50% { transform: scale(0.98) skewX(-1deg); opacity: 0.85; }
            75% { transform: scale(1.02) skewX(1deg); opacity: 0.95; }
            100% { transform: scale(1) skewX(0deg); opacity: 0.9; }
        }
        @keyframes spark {
            0% { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
            100% { transform: translateY(-60px) translateX(var(--tw-translate-x, 10px)) scale(0); opacity: 0; }
        }
        @keyframes smoke {
            0% { transform: translateY(0) translateX(0) scale(0.5) rotate(0deg); opacity: 0.1; }
            30% { opacity: 0.3; transform: translateY(-30px) translateX(5px) scale(1.2) rotate(10deg); }
            100% { transform: translateY(-100px) translateX(25px) scale(2.5) rotate(30deg); opacity: 0; }
        }
        .text-shadow-glow {
            text-shadow: 0 0 25px rgba(255, 255, 255, 0.6), 0 0 10px rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </div>
  );
}