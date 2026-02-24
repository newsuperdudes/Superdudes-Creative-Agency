
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { assetStorage } from '../src/services/storage';

interface AssetSlot {
  key: string;
  label: string;
  description: string;
  count?: number;
}

const GLOBAL_SLOTS: AssetSlot[] = [
  { key: 'team', label: 'Unit Collective', description: 'Group/Studio representation for the Unit block.', count: 10 },
];

const PROJECT_IDS = ["01", "02", "03", "04", "05", "06"];

export const AssetManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'global' | string>('global');
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [metadata, setMetadata] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  const ADMIN_PASSWORD = "SD_ADMIN_2024";

  useEffect(() => {
    const isAuth = sessionStorage.getItem('sd_admin_auth') === 'true';
    if (isAuth) setIsAuthenticated(true);

    const loadData = async () => {
      // Migration from localStorage to Server
      const lsKeys = Object.keys(localStorage);
      for (const key of lsKeys) {
        if (key.startsWith('sd_asset_')) {
          const val = localStorage.getItem(key);
          if (val) {
            await assetStorage.setItem(key, val);
            localStorage.removeItem(key);
          }
        }
      }

      // Migration from IndexedDB to Server
      try {
        const DB_NAME = 'SuperdudesStorage';
        const STORE_NAME = 'assets';
        const request = indexedDB.open(DB_NAME);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (db.objectStoreNames.contains(STORE_NAME)) {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const getAllRequest = store.getAll();
            const getAllKeysRequest = store.getAllKeys();
            
            getAllRequest.onsuccess = async () => {
              const values = getAllRequest.result;
              const keys = getAllKeysRequest.result;
              for (let i = 0; i < keys.length; i++) {
                const key = keys[i] as string;
                const val = values[i] as string;
                await assetStorage.setItem(key, val);
              }
              // Clear IndexedDB after migration
              const deleteTransaction = db.transaction(STORE_NAME, 'readwrite');
              deleteTransaction.objectStore(STORE_NAME).clear();
            };
          }
        };
      } catch (e) {
        console.error("IndexedDB migration failed", e);
      }

      const loadedPreviews: { [key: string]: string } = {};
      const loadedMeta: { [key: string]: string } = {};
      
      // Load global slots
      for (const slot of GLOBAL_SLOTS) {
        if (slot.count) {
          for (let i = 0; i < slot.count; i++) {
            const key = `${slot.key}_${i}`;
            const val = await assetStorage.getItem(`sd_asset_${key}`);
            if (val) loadedPreviews[key] = val;
          }
        } else {
          const val = await assetStorage.getItem(`sd_asset_${slot.key}`);
          if (val) loadedPreviews[slot.key] = val;
        }
      }

      // Load project data
      for (const pid of PROJECT_IDS) {
        // Images
        for (let i = 0; i < 10; i++) {
          const key = `project_${pid}_img_${i}`;
          const val = await assetStorage.getItem(`sd_asset_${key}`);
          if (val) loadedPreviews[key] = val;
        }
        // Metadata
        for (const field of ['title', 'client', 'objective', 'materials', 'ref', 'year', 'category']) {
          const key = `project_${pid}_meta_${field}`;
          const val = await assetStorage.getItem(`sd_asset_${key}`);
          if (val) loadedMeta[key] = val;
        }
      }

      setPreviews(loadedPreviews);
      setMetadata(loadedMeta);
    };

    loadData();
  }, []);

  const handleMetaChange = async (pid: string, field: string, value: string) => {
    const key = `project_${pid}_meta_${field}`;
    await assetStorage.setItem(`sd_asset_${key}`, value);
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('sd_admin_auth', 'true');
      setError(null);
    } else {
      setError("Access Denied: Invalid Protocol Key");
      setPassword('');
    }
  };

  const onUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("File too large. Maximum size is 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          await assetStorage.setItem(`sd_asset_${key}`, result);
          setPreviews(prev => ({ ...prev, [key]: result }));
        } catch (err) {
          setError("Storage limit exceeded. Try clearing other assets.");
        }
      };
      reader.onerror = () => setError("Read error.");
      reader.readAsDataURL(file);
    }
  };

  const deleteAsset = async (key: string) => {
    await assetStorage.removeItem(`sd_asset_${key}`);
    const next = { ...previews };
    delete next[key];
    setPreviews(next);
  };

  const hardReset = async () => {
    if (window.confirm("Erase all custom assets? This will reset the site to defaults.")) {
      await assetStorage.clear();
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDeploy = () => {
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-12 border border-white/10 bg-zinc-950 flex flex-col gap-8 shadow-2xl"
        >
          <div className="flex flex-col gap-4">
            <div className="w-8 h-1 bg-white"></div>
            <h2 className="text-xs font-bold uppercase tracking-[0.8em] text-white">Security Protocol</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
              Unauthorized access to the Superdudes Asset Management System is strictly prohibited. Enter decryption key to proceed.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="space-y-2">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="DECRYPTION KEY"
                className="w-full bg-white/5 border border-white/10 px-4 py-4 text-white text-[10px] tracking-[0.5em] focus:border-white outline-none transition-all placeholder:text-white/10"
                autoFocus
              />
              {error && <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest">{error}</p>}
            </div>
            <div className="flex justify-between items-center">
              <button type="button" onClick={onClose} className="text-[9px] text-white/20 hover:text-white uppercase tracking-widest transition-colors">Abort</button>
              <button type="submit" className="bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/80 transition-all">Authorize</button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-black border border-white/10 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/50">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-white animate-pulse"></div>
            <h2 className="text-xs font-bold uppercase tracking-[0.8em] text-white">Asset Control Protocol v2.0</h2>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-[9px] text-white/20 uppercase tracking-widest hidden md:block">Status: Authorized // System: Online</span>
            <button onClick={onClose} className="text-white/40 hover:text-white uppercase text-[10px] tracking-widest transition-colors">[ Exit Console ]</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 overflow-x-auto custom-scrollbar bg-white/[0.02]">
          <button 
            onClick={() => setActiveTab('global')}
            className={`px-8 py-4 text-[10px] uppercase tracking-widest transition-all border-r border-white/5 whitespace-nowrap ${activeTab === 'global' ? 'bg-white text-black font-bold' : 'text-white/40 hover:text-white'}`}
          >
            Team & General
          </button>
          {PROJECT_IDS.map(pid => {
            const title = metadata[`project_${pid}_meta_title`] || `Project ${pid}`;
            return (
              <button 
                key={pid}
                onClick={() => setActiveTab(pid)}
                className={`px-8 py-4 text-[10px] uppercase tracking-widest transition-all border-r border-white/5 whitespace-nowrap ${activeTab === pid ? 'bg-white text-black font-bold' : 'text-white/40 hover:text-white'}`}
              >
                {title.length > 15 ? title.substring(0, 12) + '...' : title}
              </button>
            );
          })}
        </div>

        {/* Error Bar */}
        {error && (
          <div className="bg-red-600 text-white p-4 text-center text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">
            Critical Error: {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'global' ? (
            <div className="space-y-16">
              {/* Project Quick Access */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-white/60">Project Management</h3>
                  <div className="h-[1px] flex-grow bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PROJECT_IDS.map(pid => {
                    const title = metadata[`project_${pid}_meta_title`] || `Project ${pid}`;
                    const img = previews[`project_${pid}_img_0`];
                    return (
                      <button 
                        key={pid}
                        onClick={() => setActiveTab(pid)}
                        className="bg-white/5 border border-white/10 p-4 hover:border-white/40 transition-all text-left group"
                      >
                        <div className="aspect-video bg-black mb-4 overflow-hidden">
                          {img ? (
                            <img src={img} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-all" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-white/10 uppercase tracking-widest">No Image</div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">{title}</span>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">Edit Case Data →</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {GLOBAL_SLOTS.map(slot => (
                <div key={slot.key} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.4em] text-white/60">{slot.label}</h3>
                    <div className="h-[1px] flex-grow bg-white/5"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {slot.count ? (
                      Array.from({ length: slot.count }).map((_, i) => {
                        const key = `${slot.key}_${i}`;
                        return (
                          <AssetCard 
                            key={key} 
                            slot={{ ...slot, label: `${slot.label} #${i + 1}` }} 
                            preview={previews[key]} 
                            onUpload={(e) => onUpload(key, e)} 
                            onDelete={() => deleteAsset(key)} 
                            compact
                          />
                        );
                      })
                    ) : (
                      <div className="lg:col-span-2">
                        <AssetCard 
                          slot={slot} 
                          preview={previews[slot.key]} 
                          onUpload={(e) => onUpload(slot.key, e)} 
                          onDelete={() => deleteAsset(slot.key)} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {/* Metadata Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Project {activeTab} Configuration</h3>
                  <div className="h-[1px] flex-grow bg-white/10"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <MetaInput 
                    label="Project Title" 
                    value={metadata[`project_${activeTab}_meta_title`] || ''} 
                    onChange={(val) => handleMetaChange(activeTab, 'title', val)} 
                  />
                  <MetaInput 
                    label="Client Name" 
                    value={metadata[`project_${activeTab}_meta_client`] || ''} 
                    onChange={(val) => handleMetaChange(activeTab, 'client', val)} 
                  />
                  <MetaInput 
                    label="Reference ID" 
                    value={metadata[`project_${activeTab}_meta_ref`] || ''} 
                    onChange={(val) => handleMetaChange(activeTab, 'ref', val)} 
                  />
                  <MetaInput 
                    label="Year" 
                    value={metadata[`project_${activeTab}_meta_year`] || ''} 
                    onChange={(val) => handleMetaChange(activeTab, 'year', val)} 
                  />
                  <MetaInput 
                    label="Category" 
                    value={metadata[`project_${activeTab}_meta_category`] || ''} 
                    onChange={(val) => handleMetaChange(activeTab, 'category', val)} 
                  />
                  <div className="md:col-span-2">
                    <MetaInput 
                      label="Objective / Description" 
                      value={metadata[`project_${activeTab}_meta_objective`] || ''} 
                      onChange={(val) => handleMetaChange(activeTab, 'objective', val)} 
                    />
                  </div>
                  <MetaInput 
                    label="Materials (comma separated)" 
                    value={metadata[`project_${activeTab}_meta_materials`] || ''} 
                    onChange={(val) => handleMetaChange(activeTab, 'materials', val)} 
                  />
                </div>
              </div>

              {/* Gallery Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Visual Artifacts</h3>
                  <div className="h-[1px] flex-grow bg-white/10"></div>
                  <span className="text-[10px] text-white/20 uppercase tracking-widest">10 Slots</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const key = `project_${activeTab}_img_${i}`;
                    return (
                      <AssetCard 
                        key={key}
                        slot={{ key, label: `Image ${i + 1}`, description: `Project ${activeTab} slot ${i + 1}` }}
                        preview={previews[key]}
                        onUpload={(e) => onUpload(key, e)}
                        onDelete={() => deleteAsset(key)}
                        compact
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-black/50">
          <div className="flex flex-col gap-2">
            <button 
              onClick={hardReset}
              className="text-red-500/40 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors text-left"
            >
              [ Wipe All System Data ]
            </button>
            <p className="text-[8px] text-white/20 uppercase tracking-widest">Warning: This action is irreversible.</p>
          </div>
          <button 
            onClick={handleDeploy}
            className="px-24 py-6 bg-white text-black font-black uppercase text-[11px] tracking-[0.8em] hover:bg-white/80 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            Commit & Deploy
          </button>
        </div>
      </div>
    </div>
  );
};

const MetaInput: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/40">{label}</label>
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/5 border border-white/10 p-3 text-white text-[10px] tracking-widest focus:border-white outline-none transition-all"
    />
  </div>
);

const AssetCard: React.FC<{ 
  slot: AssetSlot; 
  preview?: string; 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onDelete: () => void;
  compact?: boolean;
}> = ({ slot, preview, onUpload, onDelete, compact }) => (
  <div className={`bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-all flex flex-col group/card ${compact ? 'p-4' : 'p-6'}`}>
    <div className="flex justify-between items-start mb-4 gap-2">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 truncate">{slot.label}</span>
        {!compact && <span className="text-[8px] text-white/20 uppercase tracking-widest truncate">{slot.key.toUpperCase()}</span>}
      </div>
      {preview && (
        <button 
          onClick={onDelete} 
          className="text-red-500/20 hover:text-red-500 text-[8px] uppercase font-bold transition-colors p-1 shrink-0"
        >
          [ Remove ]
        </button>
      )}
    </div>
    
    <div className={`relative bg-black border border-white/5 overflow-hidden group aspect-video`}>
      {preview ? (
        <img src={preview} className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 transition-all duration-700" alt="Preview" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
          <div className="w-4 h-4 border border-white/40 rotate-45 animate-pulse"></div>
          <span className="text-[8px] uppercase tracking-[0.4em] text-white/20">Empty Slot</span>
        </div>
      )}
      <label className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-all duration-300 ${preview ? 'bg-white/5 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]' : 'bg-white/5 opacity-100'}`}>
        <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
        <div className={`px-6 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${preview ? 'bg-white text-black hover:scale-105' : 'bg-white/10 text-white hover:bg-white hover:text-black border border-white/20'}`}>
          {preview ? 'Replace' : 'Upload Image'}
        </div>
      </label>
    </div>
    {!compact && (
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-[9px] font-medium uppercase tracking-tight text-white/30 leading-relaxed">
          {slot.description}
        </p>
      </div>
    )}
  </div>
);
