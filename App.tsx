
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Philosophy } from './components/Philosophy';
import { Services } from './components/Services';
import { Team } from './components/Team';
import { Proofs } from './components/Proofs';
import { Footer } from './components/Footer';
import { Navigation } from './components/Navigation';
import { AssetManager } from './components/AssetManager';

const App: React.FC = () => {
  const [showAssetManager, setShowAssetManager] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax effect for Hero content
  const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
  const heroOpacity = useTransform(scrollY, [0, 800], [1, 0]);
  const scrollProgress = useTransform(scrollY, [0, 2000], [0, 1]); // Adjust range as needed or use useScroll target

  // Better way to get full page scroll progress
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'U') {
        setShowAssetManager(prev => !prev);
      }
    };

    // Intersection Observer for Scroll Reveals
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-white selection:text-black">
      <Navigation />
      
      {/* Elegant Scroll Progress Line */}
      <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 h-48 w-[1px] bg-white/5 z-[100] hidden md:block">
        <motion.div 
          style={{ scaleY: scrollYProgress }}
          className="w-full h-full bg-white origin-top"
        />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/20 uppercase tracking-widest">
          Scroll
        </div>
      </div>

      <main className="flex-grow">
        {/* Hero Section with Parallax */}
        <div className="relative h-screen w-full overflow-hidden border-b border-white/5">
          <motion.div 
            style={{ 
              y: heroY,
              opacity: heroOpacity
            }}
            className="h-full w-full"
          >
            <Hero />
          </motion.div>
        </div>

        {/* Main Content Flow */}
        <div className="relative z-10 bg-black">
          <div className="reveal"><About /></div>
          <div className="reveal"><Services /></div>
          <div className="reveal"><Team /></div>
          
          <div className="reveal"><Proofs /></div>
          <div className="reveal"><Philosophy /></div>
        </div>
      </main>

      <Footer />

      {/* Asset Manager Trigger */}
      <button 
        onClick={() => setShowAssetManager(true)}
        className="fixed bottom-6 right-6 z-[100] w-10 h-10 rounded-full border border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-center group hover:border-white transition-all"
      >
        <div className="w-1 h-1 rounded-full bg-white/40 group-hover:bg-white transition-colors"></div>
      </button>

      {showAssetManager && <AssetManager onClose={() => setShowAssetManager(false)} />}
    </div>
  );
};

export default App;
