
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { assetStorage } from '../src/services/storage';

interface Project {
  id: string;
  ref: string;
  title: string;
  client: string;
  year: string;
  category: string;
  images: string[];
  objective: string;
  materials: string[];
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "01",
    ref: "SD/24/ST-V",
    title: "STADIUM VOID",
    client: "GLOBAL ATHLETIC",
    year: "2024",
    category: "STADIA // PRODUCTION",
    images: [
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1905&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070&auto=format&fit=crop"
    ],
    objective: "Breaking digital walls with physical sound pressure.",
    materials: ["Concrete", "Sub-Bass", "Nylon"]
  },
  {
    id: "02",
    ref: "SD/23/CN-P",
    title: "CONCRETE PROT",
    client: "AVANT COUTURE",
    year: "2023",
    category: "EDITORIAL // FASHION",
    images: [
      "https://images.unsplash.com/photo-1485841890310-6a055c88698a?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2070&auto=format&fit=crop"
    ],
    objective: "Redefining the weight of the human silhouette.",
    materials: ["Latex", "Technical Vinyl"]
  },
  {
    id: "03",
    ref: "SD/24/SL-R",
    title: "SILENT RAVE",
    client: "TECH REBEL",
    year: "2024",
    category: "UNDERGROUND // EVENT",
    images: [
      "https://images.unsplash.com/photo-1514525253361-bee1a193b04c?q=80&w=1964&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop"
    ],
    objective: "Zero-signal communication in deep bunkers.",
    materials: ["Human Heat", "Low-light"]
  },
  {
    id: "04",
    ref: "SD/24/BR-A",
    title: "BRAND ASHES",
    client: "CULTURAL DEPT",
    year: "2024",
    category: "MANIFESTO // ART",
    images: [
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549492423-400259a2e574?q=80&w=1921&auto=format&fit=crop"
    ],
    objective: "The physical incineration of digital identities.",
    materials: ["Fire", "Ash", "Raw Iron"]
  },
  {
    id: "05",
    ref: "SD/24/PR-05",
    title: "EMPTY SLOT 05",
    client: "PENDING",
    year: "2024",
    category: "UNASSIGNED",
    images: [
      "https://picsum.photos/seed/sd05/1920/1080",
      "https://picsum.photos/seed/sd05b/1920/1080"
    ],
    objective: "Awaiting artifact deployment.",
    materials: ["Unknown"]
  },
  {
    id: "06",
    ref: "SD/24/PR-06",
    title: "EMPTY SLOT 06",
    client: "PENDING",
    year: "2024",
    category: "UNASSIGNED",
    images: [
      "https://picsum.photos/seed/sd06/1920/1080",
      "https://picsum.photos/seed/sd06b/1920/1080"
    ],
    objective: "Awaiting artifact deployment.",
    materials: ["Unknown"]
  }
];

const ProofCard: React.FC<{ project: Project; idx: number }> = ({ project, idx }) => {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev + 1) % project.images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev - 1 + project.images.length) % project.images.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05 }}
      className="group relative aspect-video bg-zinc-900 overflow-hidden border border-white/5"
    >
      <div className="absolute inset-0 w-full h-full opacity-40 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-0">
        {project.images.map((src, i) => (
          <motion.img
            key={src + i}
            src={src}
            alt={`${project.title} ${i + 1}`}
            initial={false}
            animate={{
              opacity: i === currentImgIdx ? 1 : 0,
              scale: i === currentImgIdx ? 1 : 1.05,
              zIndex: i === currentImgIdx ? 1 : 0
            }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
          />
        ))}
      </div>

      {/* Navigation Areas */}
      {project.images.length > 1 && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-1/2 z-30 cursor-w-resize"
            onClick={prevImg}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/2 z-30 cursor-e-resize"
            onClick={nextImg}
          />

          {/* Progress Indicator */}
          <div className="absolute top-4 left-4 z-40 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {project.images.map((_, i) => (
              <div
                key={i}
                className={`h-[1px] transition-all duration-300 ${i === currentImgIdx ? 'w-4 bg-white' : 'w-1 bg-white/20'}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        <span className="text-[8px] font-bold text-white/60 uppercase tracking-[0.4em]">{project.client}</span>
        <span className="text-[10px] font-black text-white uppercase tracking-widest">{project.title}</span>
      </div>

      {/* Technical Marker */}
      <div className="absolute top-4 right-4 text-[8px] font-mono text-white/20 group-hover:text-white/60 transition-colors pointer-events-none drop-shadow-sm">
        REF_{project.ref}
      </div>
    </motion.div>
  );
};

export const Proofs: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);

  useEffect(() => {
    const loadMerged = async () => {
      const merged = await Promise.all(DEFAULT_PROJECTS.map(async (p) => {
        const override: Partial<Project> = {};

        const title = await assetStorage.getItem(`sd_asset_project_${p.id}_meta_title`);
        const client = await assetStorage.getItem(`sd_asset_project_${p.id}_meta_client`);
        const ref = await assetStorage.getItem(`sd_asset_project_${p.id}_meta_ref`);
        const objective = await assetStorage.getItem(`sd_asset_project_${p.id}_meta_objective`);

        if (title) override.title = title;
        if (client) override.client = client;
        if (ref) override.ref = ref;
        if (objective) override.objective = objective;

        const images: string[] = [];
        for (let i = 0; i < 10; i++) {
          const img = await assetStorage.getItem(`sd_asset_project_${p.id}_img_${i}`);
          if (img) images.push(img);
        }
        if (images.length > 0) override.images = images;

        return { ...p, ...override };
      }));
      setProjects(merged);
    };

    loadMerged();
  }, []);

  return (
    <section id="proofs" className="py-32 md:py-64 bg-black border-t border-white/5 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-32">
          <div className="space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.8em] text-white/40 block">Proofs of Existence</span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] font-sans">
              Physical<br />Evidence.
            </h2>
          </div>
          <p className="text-sm md:text-lg font-medium text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
            Digital data is volatile. These artifacts are the only truth we recognize.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
          {projects.map((project, idx) => (
            <ProofCard key={project.id} project={project} idx={idx} />
          ))}
        </div>

        {/* Bottom Decor */}
        <div className="mt-32 flex items-center gap-8 opacity-10">
          <div className="h-[1px] flex-grow bg-white"></div>
          <span className="text-[10px] uppercase tracking-[1em] whitespace-nowrap">End of Archive</span>
          <div className="h-[1px] flex-grow bg-white"></div>
        </div>
      </div>
    </section>
  );
};
