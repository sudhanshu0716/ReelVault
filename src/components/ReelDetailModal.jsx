import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { 
  X, ExternalLink, Trash2, Calendar, Clipboard, Check, Heart, HelpCircle, Save, Loader
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReelDetailModal({ isOpen, reelId, onClose, onReelDeleted, onReelUpdated }) {
  const [reel, setReel] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (isOpen && reelId) {
      loadReelDetails();
    }
  }, [isOpen, reelId]);

  const loadReelDetails = async () => {
    try {
      const data = await db.reels.get(reelId);
      if (data) {
        setReel(data);
        setNotesText(data.notes || '');
      }
    } catch (err) {
      console.error('Failed to load reel details:', err);
    }
  };

  if (!isOpen || !reel) return null;

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(reel.transcript || '');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const nextFavState = reel.isFavorite === 1 ? 0 : 1;
      await db.reels.update(reel.id, { isFavorite: nextFavState });
      setReel(prev => ({ ...prev, isFavorite: nextFavState }));
      
      if (nextFavState === 1) {
        confetti({
          particleCount: 30,
          spread: 30,
          colors: ['#ec4899', '#f43f5e'],
          origin: { y: 0.6 }
        });
      }

      if (onReelUpdated) onReelUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await db.reels.update(reel.id, { notes: notesText });
      setReel(prev => ({ ...prev, notes: notesText }));
      
      // Flash save
      setTimeout(() => {
        setIsSavingNotes(false);
        if (onReelUpdated) onReelUpdated();
      }, 400);
    } catch (err) {
      console.error(err);
      setIsSavingNotes(false);
    }
  };

  const handleDeleteReel = async () => {
    if (!window.confirm('Are you sure you want to delete this reel from your library?')) return;
    
    try {
      await db.reels.delete(reel.id);
      if (onReelDeleted) onReelDeleted();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Detail Overlay Panel */}
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10 border border-white/10 animate-scale-up">
        
        {/* Aesthetic Category Hero Header */}
        <div className={`p-6 relative border-b border-white/5 flex items-start justify-between ${
          reel.category === 'Food' ? 'cat-food' :
          reel.category === 'Travel' ? 'cat-travel' :
          reel.category === 'Tech' ? 'cat-tech' :
          reel.category === 'Comedy' ? 'cat-comedy' :
          reel.category === 'Music' ? 'cat-music' : 'cat-lifestyle'
        }`}>
          {/* Overlay glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none"></div>

          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/15 border border-white/15 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-slate-200">
                {reel.category}
              </span>
              {reel.status === 'processing' && (
                <span className="text-[9px] bg-yellow-500/10 text-yellow-300 font-semibold px-2 py-0.5 border border-yellow-500/25 rounded-full animate-pulse">
                  Processing Pipeline
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white leading-snug max-w-xl md:max-w-2xl">{reel.title}</h3>
          </div>

          <div className="flex gap-1.5 z-10">
            <button
              onClick={handleToggleFavorite}
              title={reel.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
              className={`p-2 rounded-xl transition-all border border-white/5 ${
                reel.isFavorite === 1 
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' 
                  : 'bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-white/10'
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${reel.isFavorite === 1 ? 'fill-current' : ''}`} />
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-slate-300 hover:text-white p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column - Summaries & Transcripts */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Detailed Summary Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Ingestion Summary</h4>
                <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl space-y-3 leading-relaxed text-sm text-slate-200">
                  <p>{reel.summary}</p>
                  {reel.caption && (
                    <div className="border-t border-white/5 pt-3 mt-3">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">RAW CAPTION</span>
                      <p className="text-xs text-slate-400 font-serif italic line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                        "{reel.caption}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transcript Drawer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Speech-to-Text Transcript</h4>
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    disabled={reel.status === 'processing'}
                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-purple-500/10 transition-all disabled:opacity-40"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-3 w-3" /> Copy Transcript
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950/80 border border-white/5 p-4 rounded-xl h-44 overflow-y-auto scrollbar-thin text-xs text-slate-300 leading-relaxed font-mono select-text selection:bg-purple-600">
                  {reel.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                      <Loader className="h-5 w-5 animate-spin text-purple-400" />
                      <span>Speech transcription is running on GitHub Actions...</span>
                    </div>
                  ) : (
                    reel.transcript
                  )}
                </div>
              </div>

            </div>

            {/* Right Column - Side Details, Note Taking, and Actions */}
            <div className="space-y-6">
              
              {/* Meta information */}
              <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl space-y-3.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Properties</h4>
                
                <div className="flex items-center gap-2.5 text-xs">
                  <Calendar className="h-4 w-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Added On</span>
                    <span className="text-slate-300 font-medium">{new Date(reel.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs pt-1 border-t border-white/5">
                  <Heart className={`h-4.5 w-4.5 shrink-0 ${reel.isFavorite ? 'text-rose-400 fill-current' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Favorites List</span>
                    <span className="text-slate-300 font-medium">{reel.isFavorite ? 'Yes, Starred' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* User Notes Notebook (Auto Saving when clicked out or saved) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notebook / Tags</h4>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-cyan-500/10 transition-all"
                  >
                    {isSavingNotes ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-3 w-3" /> Save Notes
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  placeholder="Paste travel coordinates, ingredients checklist, tech repository code, or custom user tags here. Auto-saved."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full h-36 bg-slate-950/60 border border-white/10 focus:border-cyan-500/80 rounded-xl p-3.5 text-xs text-slate-200 placeholder:text-slate-600 resize-none transition-all leading-normal"
                />
              </div>

              {/* Action Buttons panel */}
              <div className="space-y-2.5">
                <a
                  href={reel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/10 active:translate-y-px"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Instagram
                </a>

                <button
                  type="button"
                  onClick={handleDeleteReel}
                  className="w-full bg-rose-950/15 hover:bg-rose-950/35 border border-rose-900/30 hover:border-rose-800/50 text-rose-400 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Ingestion
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
