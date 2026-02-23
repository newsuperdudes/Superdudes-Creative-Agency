
import React from 'react';
import { motion } from 'framer-motion';
import { assetStorage } from '../src/services/storage';

export const About: React.FC = () => {
  const [bgImage, setBgImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadBg = async () => {
      const saved = await assetStorage.getItem('sd_asset_manifest');
      if (saved) setBgImage(saved);
    };
    
    loadBg();
  }, []);

  return (
    <section id="about" className="min-h-screen w-full bg-black flex flex-col justify-center items-center px-6 text-center py-32 relative overflow-hidden">
      
      {/* Background Image Layer */}
      {bgImage && (
        <div className="absolute inset-0 z-0 opacity-[0.05] grayscale pointer-events-none">
          <img src={bgImage} className="w-full h-full object-cover" alt="" />
        </div>
      )}

      {/* Geometric Lines & Markers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-white/5"></div>
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-white/5"></div>
        
        <div className="absolute top-12 left-12 flex flex-col gap-2">
          <span className="text-[8px] font-medium uppercase tracking-[0.4em] text-white/20">Mission // Archive</span>
          <div className="h-[1px] w-8 bg-white/10"></div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl relative z-10"
      >
        <h2 className="text-[10vw] lg:text-[7vw] font-black leading-[0.9] tracking-[-0.05em] text-white uppercase mb-24">
          A creative & production gang that’s done it all.
        </h2>
        
        <div className="flex flex-col items-center gap-16">
          <div className="relative h-[1px] w-32 bg-white/20 overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-white/60"
            ></motion.div>
          </div>
          <p className="text-base sm:text-lg md:text-2xl text-white/40 uppercase tracking-[0.2em] leading-tight max-w-3xl">
            From stadium madness to kitchen talks, chaos-fueled parties to boardroom showdowns. We operate where real life creates real heat.
          </p>
        </div>
      </motion.div>
    </section>
  );
};
