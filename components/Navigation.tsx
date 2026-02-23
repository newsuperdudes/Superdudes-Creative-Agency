
import React from 'react';

export const Navigation: React.FC = () => {
  return (
    <nav 
      className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 h-24 flex justify-between items-center bg-transparent pointer-events-none"
    >
      <div className="flex gap-12 items-center pointer-events-auto ml-auto">
        <div className="hidden sm:flex gap-12 text-right">
          <a href="#proofs" className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors">Proofs</a>
          <a href="#about" className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors">Logic</a>
        </div>
        <a 
          href="mailto:new@superdudes.agency" 
          className="text-[10px] font-medium uppercase tracking-[0.4em] text-white hover:opacity-40 transition-all"
        >
          Contact
        </a>
      </div>
    </nav>
  );
};
