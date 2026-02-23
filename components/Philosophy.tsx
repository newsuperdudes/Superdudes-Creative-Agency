
import React, { useState, useEffect } from 'react';
import { assetStorage } from '../src/services/storage';

export const Philosophy: React.FC = () => {
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    const loadBg = async () => {
      const saved = await assetStorage.getItem('sd_asset_philosophy');
      if (saved) setBgImage(saved);
    };
    
    loadBg();
  }, []);

  return (
    <section className="bg-white text-black py-32 md:py-64 px-6 md:px-24 relative border-t border-black/5" id="about">
      
      {/* Background Image Layer */}
      {bgImage && (
        <div className="absolute inset-0 z-0 opacity-[0.03] grayscale pointer-events-none">
          <img src={bgImage} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      {/* Background Text */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
        <div className="flex justify-between w-full text-[16vw] font-black text-black/[0.02] leading-none uppercase tracking-tighter">
          <span>P</span><span>H</span><span>Y</span><span>S</span><span>I</span><span>C</span><span>A</span><span>L</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 reveal">
        <div className="flex flex-col gap-4 mb-24">
          <span className="text-black/20 text-[10px] uppercase tracking-[1em] font-black">Our Philosophy</span>
          <div className="h-[1px] w-12 bg-black/10"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-24 items-start">
          <div>
            <h2 className="text-[12vw] lg:text-[8vw] font-black tracking-[-0.06em] leading-[0.85] mb-12 uppercase">
              Offline<br/>
              <span className="inline-flex items-baseline">
                Only
                <span className="inline-block w-[0.15em] h-[0.15em] bg-black rounded-full ml-[0.15em] animate-[blink_1s_infinite]"></span>
              </span>
            </h2>
            <div className="h-2 w-32 bg-black"></div>
          </div>
          
          <div className="space-y-12 md:space-y-16 pt-0 lg:pt-12">
            <p className="text-2xl md:text-4xl xl:text-5xl font-bold leading-tight text-black/90 uppercase tracking-tight">
              We solve cool communication tasks by looking people in the eye. 
            </p>
            <p className="text-sm md:text-lg font-medium text-black/40 leading-relaxed uppercase tracking-[0.1em] max-w-xl">
              Digital world is broken. We bring the weight, the smell, the sound, and the pulse of physical existence back to brand experiences. If it's not physical, it's not us.
            </p>
            
            <div className="flex items-center gap-12">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-black/20">Protocol</span>
                <span className="text-xs font-bold uppercase text-black">Reality.v1</span>
              </div>
              <div className="w-[1px] h-8 bg-black/10"></div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-black/20">Status</span>
                <span className="text-xs font-bold uppercase text-black">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
