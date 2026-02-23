
import React from 'react';

const hubs = [
  { city: "LONDON", ref: "HUB_LDN", address: "10 YORK RD, SE1 7ND" },
  { city: "BARCELONA", ref: "HUB_BCN", address: "CARRER ARAGÓ 241" },
  { city: "BELGRADE", ref: "HUB_BEG", address: "KNEZA MIHAILA 33, 11158" },
  { city: "DUBAI", ref: "HUB_DXB", address: "THE MEYDAN HOTEL, MEYDAN RD" }
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-black pt-32 pb-16 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Hubs Section */}
        <div className="mb-48">
          <div className="flex flex-col gap-4 mb-24">
            <span className="text-[10px] font-medium uppercase tracking-[0.6em] text-black/20">Active Strategic Hubs</span>
            <div className="h-[1px] w-16 bg-black/10"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24">
            {hubs.map((hub, idx) => (
              <div key={idx} className="space-y-8 group">
                <span className="text-[10px] font-medium text-black/20 block group-hover:text-black transition-colors">[{hub.ref}]</span>
                <h3 className="font-bold text-4xl leading-none uppercase tracking-tight">{hub.city}</h3>
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-[0.4em] text-black/40 max-w-[200px]">
                   {hub.address}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Inquiry Statement */}
        <div className="mb-48 pt-32 border-t border-black/5">
           <div className="flex flex-col gap-4 mb-16">
              <span className="text-[10px] font-medium uppercase tracking-[0.6em] text-black/20">Initiate Communication</span>
              <div className="h-[1px] w-12 bg-black/10"></div>
           </div>
            <a 
              href="mailto:new@superdudes.agency" 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[6vw] font-black hover:opacity-40 transition-all leading-[0.85] tracking-[-0.05em] block uppercase break-words"
            >
              <span className="inline-block">new@</span>
              <span className="inline-block">superdudes.agency</span>
            </a>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-24 border-t border-black/5 flex flex-col lg:flex-row justify-between items-end gap-16">
          <div className="space-y-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.6em] text-black/20">Anti-Digital Propaganda Unit. v4.2</p>
          </div>
          
          <div className="text-[10px] font-medium uppercase tracking-[1em] text-black/10 text-center max-w-sm hidden md:block">
            © {new Date().getFullYear()} — Reality is our only currency.
          </div>
          
          <div className="flex gap-16 items-center">
            <a href="https://www.instagram.com/superdudes.agency" target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium uppercase tracking-[0.4em] text-black/40 hover:text-black transition-all border-b border-black/10 pb-1">Instagram</a>
            <a href="https://www.linkedin.com/company/101257231/admin/dashboard/" target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium uppercase tracking-[0.4em] text-black/40 hover:text-black transition-all border-b border-black/10 pb-1">LinkedIn</a>
          </div>
        </div>
      </div>

      {/* Aesthetic Background Element */}
      <div className="absolute -bottom-24 -right-24 opacity-[0.02] pointer-events-none select-none">
          <span className="text-[30rem] font-black leading-none uppercase">SD</span>
      </div>
    </footer>
  );
};
