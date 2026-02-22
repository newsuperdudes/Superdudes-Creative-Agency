
import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const PLACEHOLDER = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";

export const Hero: React.FC = () => {
  const { scrollY } = useScroll();
  const indicatorOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  return (
    <section className="relative h-screen w-full bg-black flex flex-col justify-center items-start overflow-hidden px-6 md:px-24">
      
      {/* Subtle Vertical Anchor Line */}
      <div className="absolute left-6 md:left-16 top-0 w-[1px] h-full bg-white/10 z-10 animate-draw-y"></div>

      {/* Main Content Stack - Unified & Cohesive */}
      <div className="relative z-20 flex flex-col items-start text-left w-full max-w-6xl">
        
        {/* Unified Branding & Manifesto Block */}
        <div className="flex flex-col items-start gap-0 fade-in">
          
          {/* Top Status (Now part of the main block) */}
          <div className="mb-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/40">
              Operational // SD-01
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-[15vw] lg:text-[12vw] font-black leading-[0.75] tracking-[-0.06em] text-white uppercase mb-2">
            Superdudes
          </h1>

          {/* Subtitle & Manifesto - Tightly Coupled */}
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
            <div className="flex flex-col items-start">
              <h2 className="text-lg sm:text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-white">
                Creative Agency
              </h2>
              <div className="h-[2px] w-full bg-white mt-2"></div>
            </div>
            
            <p className="text-sm md:text-lg font-bold text-white/60 uppercase tracking-[0.2em] leading-tight max-w-md pb-1">
              Offline-First <span className="text-white/20 mx-1">/</span> Punk-Smart <span className="text-white/20 mx-1">/</span> Culture Driven
            </p>
          </div>
        </div>

      </div>

      {/* Subtle Bottom Meta */}
      <div className="absolute bottom-8 md:bottom-12 left-6 md:left-24 fade-in [animation-delay:0.6s] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
        <span className="text-[8px] sm:text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">51.5237° N, 0.1585° W</span>
        <div className="hidden sm:block h-[1px] w-12 bg-white/10"></div>
        <span className="text-[8px] sm:text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Protocol: Reality</span>
      </div>

    </section>
  );
};
