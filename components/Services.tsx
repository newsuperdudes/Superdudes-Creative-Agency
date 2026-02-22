
import React from 'react';

const tags = [
  "Events", "Special Projects", "Brand Activations", 
  "Parties", "Dinner Shows", "Love", "Theatre", 
  "Connections", "Hugs", "Chaos Control", "Stage Design",
  "Kitchen Talks", "Street Culture", "Pop-Up Spaces"
];

export const Services: React.FC = () => {
  return (
    <section id="services" className="min-h-screen w-full bg-white flex flex-col justify-center items-center py-32 px-6 border-t border-black/5 relative overflow-hidden">
      
      {/* Geometric Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-full h-[1px] bg-black/5"></div>
        <div className="absolute top-2/3 left-0 w-full h-[1px] bg-black/5"></div>
      </div>

      <div className="max-w-7xl mx-auto reveal text-center relative z-10">
        <div className="flex flex-col items-center gap-4 mb-32">
          <span className="text-[10px] font-medium uppercase tracking-[0.6em] text-black/20">Expertise</span>
          <div className="h-16 w-[1px] bg-black/10"></div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-8 md:gap-y-4 max-w-4xl">
          {tags.map((tag, idx) => (
            <div 
              key={idx} 
              className="group cursor-default"
            >
              <span className="text-3xl sm:text-3xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-black/10 hover:text-black transition-all duration-500">
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
