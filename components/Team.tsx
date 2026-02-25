
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { assetStorage } from '../src/services/storage';

const defaultImages = [
  "https://images.unsplash.com/photo-1549492423-400259a2e574?q=80&w=1921&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522158634409-4c62b38a7f85?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531050171669-01c4f08849ff?q=80&w=2070&auto=format&fit=crop"
];

export const Team: React.FC = () => {
  const [images, setImages] = useState(defaultImages);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadImages = async () => {
      const savedImages: string[] = [];
      for (let i = 0; i < 10; i++) {
        const saved = await assetStorage.getItem(`sd_asset_team_${i}`);
        if (saved) savedImages.push(saved);
      }

      if (savedImages.length > 0) {
        setImages(savedImages);
      }
    };

    loadImages();
  }, []);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="py-32 md:py-64 px-6 md:px-12 bg-white border-t border-black/5 overflow-hidden relative">

      {/* Geometric Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/5"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center relative z-10">
        <div className="order-2 md:order-1 reveal">
          <div className="flex flex-col gap-4 mb-24">
            <span className="text-[10px] font-medium uppercase tracking-[0.8em] text-black/20">The Unit</span>
            <div className="h-[1px] w-12 bg-black/10"></div>
          </div>

          <div className="space-y-24">
            <div className="reveal" style={{ transitionDelay: '0.2s' }}>
              <span className="text-[25vw] md:text-[15vw] xl:text-[12rem] font-black text-black block leading-[0.8] tracking-[-0.05em] uppercase">70</span>
              <p className="text-lg sm:text-xl md:text-2xl font-medium uppercase tracking-[0.4em] text-black/60 mt-8">top-tier dudes</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-black/20 mt-4">
                (the real dude has no gender)
              </p>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.4s' }}>
              <span className="text-3xl sm:text-4xl md:text-6xl font-black text-black block leading-none tracking-[-0.03em] uppercase">2,500+ yrs</span>
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-black/30 max-w-xs mt-8 leading-relaxed">
                Cumulative experience chewing through industry absurdity to deliver results.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 relative group overflow-hidden shadow-sm reveal" style={{ transitionDelay: '0.3s' }}>
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
            <div style={{ position: 'absolute', opacity: 0.01, pointerEvents: 'none', width: '1px', height: '1px', overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
              {images.map((src, idx) => (
                <img key={`preload-${idx}`} src={src} alt="preload" />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt={`Gang Aesthetic ${currentIndex + 1}`}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
              />
            </AnimatePresence>

            {/* Gallery Controls */}
            <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={prevImage}
                className="w-12 h-12 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
              >
                <span className="text-xl">←</span>
              </button>
              <button
                onClick={nextImage}
                className="w-12 h-12 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
              >
                <span className="text-xl">→</span>
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-6 right-12 flex gap-2">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/20'}`}
                ></div>
              ))}
            </div>

            <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
            <div className="absolute bottom-12 left-12 pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Human Collective</h3>
              <p className="text-[10px] font-medium uppercase tracking-[0.6em] text-white/40">Anti-Digital Unit</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
