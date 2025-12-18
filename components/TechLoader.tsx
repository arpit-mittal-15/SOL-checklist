'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function TechLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Progress Logic (Simulate Loading)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Non-linear speed: Fast at start, slows down at end for realism
        const increment = Math.max(0.5, (100 - prev) / 20); 
        return prev + increment;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000000_100%)] opacity-80"></div>
         {/* Subtle Smoke Fog in Background */}
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://raw.githubusercontent.com/PlayLikeLoki/assets/main/noise.png')] opacity-[0.03] animate-pulse"></div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl transform scale-75 md:scale-100 transition-transform duration-500">
        
        {/* LOGO (Floating) */}
        <div className="relative w-32 h-32 mb-16 animate-[float_6s_ease-in-out_infinite]">
           <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full animate-pulse"></div>
           <Image src="/logo.webp" alt="Sol France" fill className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        </div>

        {/* --- 3D BURNING CONE ASSEMBLY --- */}
        {/* We rotate the entire assembly to give a 3D perspective view */}
        <div className="relative w-[500px] h-[100px] flex items-center transform -rotate-6 perspective-1000">
            
            {/* 1. FILTER TIP (The base) */}
            <div className="relative w-[120px] h-[50px] z-20">
                {/* 3D Cylinder Shape for Filter */}
                <div className="absolute inset-0 rounded-l-md border-r border-yellow-900/30 overflow-hidden"
                     style={{
                         background: 'linear-gradient(180deg, #dcbfa6 0%, #8b6c4e 40%, #e8d0ba 50%, #8b6c4e 60%, #5e4630 100%)',
                         boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                     }}>
                     {/* W Pattern Texture */}
                     <div className="absolute inset-0 opacity-20" 
                          style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 2px, #3e2b18 3px)' }}>
                     </div>
                     <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/20 blur-[1px]"></div>
                </div>
                {/* End Cap of Filter (3D effect) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-[50px] bg-[#5e4630] rounded-[50%] z-10 brightness-50"></div>
            </div>

            {/* 2. CONE BODY (The Paper) */}
            {/* This uses a conical gradient and 3D lighting simulation */}
            <div className="relative w-[380px] h-[70px] -ml-1 z-10 origin-left">
                
                {/* The Paper Shape (Trapezoid) */}
                <div className="absolute inset-0 overflow-hidden"
                     style={{ 
                         clipPath: 'polygon(0% 15%, 100% 0%, 100% 100%, 0% 85%)', // Tapered Cone Shape
                     }}>
                    
                    {/* A. Paper Texture & Volume */}
                    <div className="absolute inset-0 w-full h-full"
                         style={{
                             background: 'linear-gradient(180deg, #e6e6e6 0%, #ffffff 45%, #ffffff 55%, #b3b3b3 100%)', // 3D Cylinder Lighting
                         }}>
                         {/* Subtle Paper Fiber Texture */}
                         <div className="absolute inset-0 opacity-[0.07]" 
                              style={{ filter: 'contrast(200%)', backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}>
                         </div>
                    </div>

                    {/* B. Branding Text (Optional - Projected on 3D surface) */}
                    <div className="absolute top-1/2 left-10 -translate-y-1/2 text-[40px] font-black text-black/5 opacity-30 tracking-tighter scale-y-150 select-none">
                        SOLFRANCE
                    </div>

                    {/* C. THE BURN MASK (This handles the "loading") */}
                    <div className="absolute inset-0 z-20"
                         style={{
                             background: `linear-gradient(to right, transparent ${progress}%, #111 ${progress + 5}%)`
                         }}>
                    </div>

                    {/* D. THE GLOWING EMBER LINE (At the burn edge) */}
                    <div className="absolute inset-0 z-30 opacity-100 will-change-transform"
                         style={{ 
                             transform: `translateX(${progress}%)`,
                             width: '100%' 
                         }}>
                         {/* The bright orange burn line */}
                         <div className="absolute left-[-5px] top-0 bottom-0 w-[10px] bg-red-600 blur-[4px] mix-blend-color-dodge animate-pulse"></div>
                         <div className="absolute left-[-2px] top-0 bottom-0 w-[4px] bg-yellow-300 blur-[2px] mix-blend-screen"></div>
                    </div>
                </div>

                {/* 3. PARTICLE SYSTEM (Fire & Smoke) */}
                {/* Attached to the progress position */}
                <div className="absolute top-1/2 z-50 pointer-events-none"
                     style={{ 
                         left: `${(progress / 100) * 380}px`,
                         transform: 'translateY(-50%)' 
                     }}>
                     
                     {/* Flame Core */}
                     <div className="relative -top-8 -left-4">
                        {/* Layered Flames for Realism */}
                        <div className="absolute w-12 h-24 bg-orange-500 rounded-full blur-xl opacity-40 animate-[flame_0.1s_infinite_alternate] mix-blend-screen origin-bottom"></div>
                        <div className="absolute w-8 h-16 bg-yellow-500 rounded-full blur-lg opacity-60 animate-[flame_0.15s_infinite_alternate-reverse] mix-blend-screen origin-bottom ml-2 mt-4"></div>
                        <div className="absolute w-4 h-10 bg-white rounded-full blur-md opacity-80 animate-[flame_0.2s_infinite_alternate] mix-blend-screen origin-bottom ml-4 mt-8"></div>
                        
                        {/* Flying Sparks */}
                        <div className="spark-1 absolute w-1 h-1 bg-yellow-200 rounded-full animate-[spark_1s_linear_infinite]"></div>
                        <div className="spark-2 absolute w-1 h-1 bg-orange-300 rounded-full animate-[spark_1.2s_linear_infinite_0.2s]"></div>
                        <div className="spark-3 absolute w-1 h-1 bg-white rounded-full animate-[spark_0.8s_linear_infinite_0.5s]"></div>
                     </div>

                     {/* Smoke Plume */}
                     <div className="absolute -top-12 -left-2 w-20 h-40 opacity-30 mix-blend-overlay">
                        <div className="absolute w-10 h-10 bg-gray-500 rounded-full blur-xl animate-[smoke_2s_linear_infinite]"></div>
                        <div className="absolute w-12 h-12 bg-gray-400 rounded-full blur-xl animate-[smoke_2.5s_linear_infinite_0.5s]"></div>
                     </div>
                </div>

            </div>
        </div>

        {/* --- LOADING TEXT --- */}
        <div className="mt-20 text-center">
            <h2 className="text-xl font-bold tracking-[0.5em] text-white/90 animate-pulse">LOADING</h2>
            <div className="text-[10px] text-orange-500/80 font-mono mt-2 tracking-widest">
                ASSEMBLING PRODUCTION LINE... {Math.round(progress)}%
            </div>
        </div>

      </div>

      {/* --- ANIMATIONS --- */}
      <style jsx>{`
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes flame {
            0% { transform: scaleY(1) skewX(0deg); }
            100% { transform: scaleY(1.1) skewX(2deg); }
        }
        @keyframes spark {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(20px, -50px) scale(0); opacity: 0; }
        }
        @keyframes smoke {
            0% { transform: translate(0, 0) scale(1); opacity: 0; }
            20% { opacity: 0.5; }
            100% { transform: translate(30px, -100px) scale(3); opacity: 0; }
        }
        .perspective-1000 {
            perspective: 1000px;
        }
      `}</style>
    </div>
  );
}