import React, { useState, useEffect } from 'react';
import { db, seedDatabase } from './db';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import AddReelModal from './components/AddReelModal';
import ReelDetailModal from './components/ReelDetailModal';
import { 
  Sparkles, Grid, Settings, Plus, Layers, ShieldCheck, Heart, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Initial Seeding Check & Clipboard Share Intent Boot Checks
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Seed database if empty so user is immediately wowed
        await seedDatabase();
        setRefreshTrigger(prev => prev + 1);

        // Check for Web Share Target URL query parameter
        // (Standard pattern when Android Share Intent routes to PWAs)
        const params = new URLSearchParams(window.location.search);
        const sharedUrl = params.get('text') || params.get('url') || params.get('title');
        
        if (sharedUrl && sharedUrl.includes('instagram.com/')) {
          // Open Modal automatically and prompt to process!
          setIsAddModalOpen(true);
          // Set custom window event to feed URL to AddReelModal
          setTimeout(() => {
            const urlInput = document.querySelector('input[type="url"]');
            if (urlInput) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
              nativeInputValueSetter.call(urlInput, sharedUrl);
              urlInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }, 400);
        }

        // 2. Capacitor Android Native Share Target plugin listeners
        if (window.Capacitor) {
          console.log('Capacitor Native Bridge active!');
          // Custom listener for native Android Intent dispatches
          window.addEventListener('sendIntentReceived', (e) => {
            const intentUrl = e.detail?.url || e.detail?.text;
            if (intentUrl && intentUrl.includes('instagram.com/')) {
              setIsAddModalOpen(true);
              // Find and inject url input
              setTimeout(() => {
                const urlInput = document.querySelector('input[type="url"]');
                if (urlInput) {
                  urlInput.value = intentUrl;
                  urlInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }, 400);
            }
          });
        }

      } catch (err) {
        console.error('Boot initialization error:', err);
      }
    };

    initializeApp();
  }, []);

  const triggerDashboardRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSelectReel = (id) => {
    setSelectedReelId(id);
  };

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    triggerDashboardRefresh();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Immersive Top Glass Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white border border-purple-400/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-sans leading-none">
                Reel<span className="text-purple-400 font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Vault</span>
              </h1>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest font-semibold block mt-0.5">SMART LIBRARY v1.0</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            
            {/* Dashboard Link */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                activeTab === 'dashboard'
                  ? 'bg-purple-600/10 border-purple-500/30 text-purple-300'
                  : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="h-4 w-4" />
              Library
            </button>

            {/* Settings Link */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                activeTab === 'settings'
                  ? 'bg-purple-600/10 border-purple-500/30 text-purple-300'
                  : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>

            {/* Main Action Button - Ingest Reel */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 transition-all active:translate-y-px"
            >
              <Plus className="h-4 w-4" />
              Ingest Reel
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Workspace Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 relative">
        
        {/* Dynamic Transition Components */}
        {activeTab === 'dashboard' ? (
          <Dashboard 
            onSelectReel={handleSelectReel} 
            triggerRefresh={refreshTrigger}
          />
        ) : (
          <SettingsPanel 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
          />
        )}

      </main>

      {/* Futuristic Bottom Glass Footer */}
      <footer className="bg-slate-950/40 border-t border-white/5 py-4 mt-8 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-2.5">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
            <span>Local-first secure sandbox storage. Processing powered by GitHub Actions.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer flex items-center gap-1 select-none">
              <Heart className="h-3 w-3 text-rose-500 fill-current" /> Build with Love
            </span>
            <span>Developer Center</span>
          </div>
        </div>
      </footer>

      {/* Add Reel Capture Drawer / Modal */}
      <AddReelModal 
        isOpen={isAddModalOpen} 
        onClose={handleAddModalClose} 
        onReelAdded={triggerDashboardRefresh}
      />

      {/* Reel Detail Immersive Focus Modal */}
      <ReelDetailModal 
        isOpen={selectedReelId !== null} 
        reelId={selectedReelId} 
        onClose={() => setSelectedReelId(null)}
        onReelDeleted={triggerDashboardRefresh}
        onReelUpdated={triggerDashboardRefresh}
      />

    </div>
  );
}
