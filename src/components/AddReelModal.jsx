import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { triggerGitHubDispatch, startPipelineSimulation } from '../githubService';
import { 
  X, Clipboard, Send, Play, Terminal as TerminalIcon, Sparkles, CheckCircle, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AddReelModal({ isOpen, onClose, onReelAdded }) {
  const [reelUrl, setReelUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [jobComplete, setJobComplete] = useState(false);
  const [newlyCreatedReel, setNewlyCreatedReel] = useState(null);
  const [processingError, setProcessingError] = useState('');
  
  // Local testing inputs to avoid dummy templates
  const [useCustomMetadata, setUseCustomMetadata] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Lifestyle');
  const [customSummary, setCustomSummary] = useState('');
  const [customTranscript, setCustomTranscript] = useState('');
  
  const [processingMode, setProcessingMode] = useState('simulation');
  const [gitToken, setGitToken] = useState('');
  const [gitRepo, setGitRepo] = useState('');
  const [gitOwner, setGitOwner] = useState('');

  // Reload configurations on modal open
  useEffect(() => {
    if (isOpen) {
      setProcessingMode(localStorage.getItem('rv_processing_mode') || 'simulation');
      setGitToken(localStorage.getItem('rv_github_token') || '');
      setGitRepo(localStorage.getItem('rv_github_repo') || '');
      setGitOwner(localStorage.getItem('rv_github_owner') || '');
    }
  }, [isOpen]);

  const terminalEndRef = useRef(null);
  const simulationRef = useRef(null);

  // Auto-Scroll Terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) simulationRef.current.cancel();
    };
  }, []);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.includes('instagram.com/')) {
        setReelUrl(text);
      } else {
        alert('Your clipboard does not contain a valid Instagram URL.');
      }
    } catch (err) {
      console.warn('Failed to read clipboard directly: ', err);
      alert('Could not read clipboard. Please paste manually.');
    }
  };

  const handleStartPipeline = async (e) => {
    e.preventDefault();
    if (!reelUrl.trim() || !reelUrl.includes('instagram.com/')) {
      setProcessingError('Please provide a valid Instagram Reel URL.');
      return;
    }

    setProcessingError('');
    setIsProcessing(true);
    setConsoleLogs([]);
    setJobComplete(false);
    setNewlyCreatedReel(null);

    const mode = localStorage.getItem('rv_processing_mode') || 'simulation';

    if (mode === 'simulation') {
      // 1. Simulation Engine Execution
      simulationRef.current = startPipelineSimulation(
        reelUrl,
        (text, type) => {
          setConsoleLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
        },
        async (reelData) => {
          try {
            // Apply custom metadata overrides if configured by user
            const finalizedData = useCustomMetadata ? {
              ...reelData,
              title: customTitle.trim() || 'Custom Tested Instagram Reel',
              category: customCategory,
              summary: customSummary.trim() || 'A beautiful custom summarized review created locally.',
              transcript: customTranscript.trim() || 'This transcript is custom authored by the local developer.',
              notes: 'Custom notes from local verification run.'
            } : reelData;

            // Write to local DB
            const id = await db.reels.add(finalizedData);
            const savedReel = { ...finalizedData, id };
            
            setNewlyCreatedReel(savedReel);
            setJobComplete(true);
            setIsProcessing(false);
            
            // Trigger Confetti
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#a78bfa', '#06b6d4', '#ec4899']
            });

            if (onReelAdded) onReelAdded();
          } catch (err) {
            setConsoleLogs(prev => [...prev, { text: `[Error] Failed to save database record: ${err.message}`, type: 'error' }]);
            setIsProcessing(false);
          }
        }
      );
    } else {
      // 2. Live GitHub Dispatch Action Execution
      const token = localStorage.getItem('rv_github_token');
      const repo = localStorage.getItem('rv_github_repo');
      const owner = localStorage.getItem('rv_github_owner');
      const eventType = localStorage.getItem('rv_github_event') || 'process-reel';

      setConsoleLogs([
        { text: '⚡ Connecting to GitHub Rest API v3...', type: 'info' },
        { text: `🐙 Target Repo: https://github.com/${owner}/${repo}`, type: 'info' }
      ]);

      if (!token || !repo || !owner) {
        setProcessingError('GitHub connection settings missing! Please complete configurations in the Settings panel.');
        setIsProcessing(false);
        return;
      }

      try {
        setConsoleLogs(prev => [...prev, { text: '⚙ Sending Repository Dispatch trigger event...', type: 'info' }]);
        
        await triggerGitHubDispatch({ owner, repo, token, eventType, reelUrl });
        
        setConsoleLogs(prev => [
          ...prev, 
          { text: '✔ Trigger Dispatched successfully!', type: 'success' },
          { text: `📦 Event Type: "${eventType}" registered.`, type: 'success' },
          { text: '💡 [Pipeline Background] yt-dlp, VideoPrism & Groq runner triggered!', type: 'info' },
          { text: '💾 Appending processing record to local library...', type: 'info' }
        ]);

        // Write a processing placeholder in IndexedDB
        const newReel = {
          url: reelUrl,
          title: `Processing Reel - ${new Date().toLocaleDateString()}`,
          caption: 'Ingestion pipeline is running on GitHub Actions...',
          summary: 'Pending pipeline completion. The VideoPrism categorizer and LLaMA summarizer are actively compiling insights on the cloud runner.',
          category: 'Lifestyle',
          transcript: 'Full transcript will sync once the GitHub Actions runner completes speech-to-text processing.',
          notes: 'Running on GitHub repository dispatch workflow.',
          createdAt: Date.now(),
          status: 'processing',
          isFavorite: 0
        };

        const id = await db.reels.add(newReel);
        setNewlyCreatedReel({ ...newReel, id });
        setJobComplete(true);
        setIsProcessing(false);
        
        confetti({ particleCount: 30, colors: ['#8b5cf6'] });
        if (onReelAdded) onReelAdded();

      } catch (err) {
        setConsoleLogs(prev => [
          ...prev, 
          { text: `✖ API Dispatch Failed: ${err.message}`, type: 'error' },
          { text: '💡 Tip: Confirm your GitHub Personal Access Token has write permissions to repository actions.', type: 'warning' }
        ]);
        setIsProcessing(false);
      }
    }
  };

  const handleCloseModal = () => {
    // Stop simulation if open
    if (simulationRef.current) {
      simulationRef.current.cancel();
      simulationRef.current = null;
    }
    // Clean states
    setReelUrl('');
    setIsProcessing(false);
    setConsoleLogs([]);
    setJobComplete(false);
    setNewlyCreatedReel(null);
    setProcessingError('');
    setUseCustomMetadata(false);
    setCustomTitle('');
    setCustomCategory('Lifestyle');
    setCustomSummary('');
    setCustomTranscript('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        onClick={isProcessing ? undefined : handleCloseModal} 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Main Drawer Glass Panel */}
      <div className="glass-panel w-full max-w-xl overflow-hidden shadow-2xl z-10 border border-white/10 animate-scale-up">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Ingest Instagram Reel
          </h3>
          <button 
            type="button" 
            disabled={isProcessing} 
            onClick={handleCloseModal} 
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-white/5 rounded-lg transition-all disabled:opacity-30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {processingError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
              {processingError}
            </div>
          )}

          {/* Input field */}
          {!isProcessing && !jobComplete && (
            processingMode === 'github' && (!gitToken || !gitRepo || !gitOwner) ? (
              <div className="text-center space-y-4 py-4 animate-scale-up">
                <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-400">
                  <TerminalIcon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">GitHub Action Credentials Required</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    You have selected "Live GitHub Actions" mode, but your settings are incomplete. ReelVault needs your Personal Access Token (PAT), Owner, and Repo parameters to trigger cloud pipelines.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('changeTab', { detail: 'settings' }));
                      onClose();
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all active:translate-y-px shadow-lg hover:shadow-purple-500/10"
                  >
                    Configure Keys in Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('rv_processing_mode', 'simulation');
                      setProcessingMode('simulation');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all border border-white/5"
                  >
                    Switch to Local Simulator (Try offline)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartPipeline} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Reel Share URL</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        required
                        placeholder="e.g. https://www.instagram.com/reel/..."
                        value={reelUrl}
                        onChange={(e) => setReelUrl(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 focus:border-purple-500/80 focus:glow-purple rounded-xl pl-3 pr-10 py-3 text-sm text-slate-200 placeholder:text-slate-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handlePaste}
                        title="Paste from Clipboard"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <Clipboard className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-purple-500/20 active:translate-y-px"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Paste the URL shared from Instagram to trigger the background AI pipeline.</p>
                </div>

                {/* Local Custom Metadata Input Toggles */}
                {processingMode !== 'github' && (
                  <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1 select-none">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                        ✍ Write Custom Verification Details
                      </label>
                      <input
                        type="checkbox"
                        checked={useCustomMetadata}
                        onChange={(e) => setUseCustomMetadata(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-white/10 bg-slate-950/60 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {useCustomMetadata 
                        ? 'Type details below. The pipeline simulation will run and output your exact details!'
                        : 'Enable this checkbox to type your own title, category, summary and verify they load exactly.'}
                    </p>
                    
                    {useCustomMetadata && (
                      <div className="space-y-3 pt-2 border-t border-white/5 animate-fade-in">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-300">Custom Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. My Custom Sourced Steak Recipe"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-purple-500/80 transition-colors"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-300">Custom Category</label>
                          <select
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-purple-500/80 transition-colors cursor-pointer"
                          >
                            <option value="Food">Food</option>
                            <option value="Travel">Travel</option>
                            <option value="Tech">Tech</option>
                            <option value="Comedy">Comedy</option>
                            <option value="Music">Music</option>
                            <option value="Lifestyle">Lifestyle</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-300">Custom Summary Takeaways</label>
                          <textarea
                            placeholder="Type bulleted key takeaways or summary..."
                            required
                            value={customSummary}
                            onChange={(e) => setCustomSummary(e.target.value)}
                            className="w-full h-16 bg-slate-950/80 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:border-purple-500/80 transition-colors resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-300">Custom Speech Transcript</label>
                          <textarea
                            placeholder="Type or paste the verbal speech log..."
                            required
                            value={customTranscript}
                            onChange={(e) => setCustomTranscript(e.target.value)}
                            className="w-full h-16 bg-slate-950/80 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:border-purple-500/80 transition-colors resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode indicator banner */}
                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <TerminalIcon className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Mode: {processingMode === 'github' ? 'GitHub Actions Pipeline' : 'Pipeline Simulation'}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {processingMode === 'github' ? 'Launches live GitHub Action workflow' : 'Fires local mock ingest pipeline'}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )
          )}

          {/* Active Terminal Logs Screen */}
          {(isProcessing || consoleLogs.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <TerminalIcon className="h-3.5 w-3.5 text-cyan-400" />
                  Workflow Dispatch Output Console
                </span>
                {isProcessing && (
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-300 font-semibold px-2 py-0.5 border border-cyan-500/20 rounded-full flex items-center gap-1">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" /> In Progress
                  </span>
                )}
              </div>

              <div className="terminal-logs h-60 overflow-y-auto space-y-1 scrollbar-thin">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="terminal-line flex gap-2">
                    <span className="text-slate-600 select-none text-[11px] font-medium">{log.time || 'INFO'}</span>
                    <span className={`text-[12px] flex-1 ${
                      log.type === 'success' ? 'terminal-success' :
                      log.type === 'error' ? 'terminal-error' :
                      log.type === 'warning' ? 'terminal-warning' : 'terminal-line'
                    }`}>
                      {log.text}
                    </span>
                  </div>
                ))}
                {isProcessing && (
                  <div className="terminal-line flex gap-2">
                    <span className="text-slate-600 select-none text-[11px] font-medium">&gt;</span>
                    <span className="text-cyan-400 text-[12px]">
                      Awaiting remote logs...<span className="terminal-cursor"></span>
                    </span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          {/* Complete Ingestion Showcase Screen */}
          {jobComplete && newlyCreatedReel && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center space-y-4 animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Reel Successfully Ingested!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {localStorage.getItem('rv_processing_mode') === 'github'
                    ? 'Your GitHub workflow run successfully completed. A queued record has been created in your local database.'
                    : `The Reel "${newlyCreatedReel.title}" has been structured and added to your categorized database library.`}
                </p>
              </div>

              {/* Mini Reel card view */}
              <div className={`p-4 rounded-xl border border-white/5 text-left bg-slate-950/50 flex gap-4 ${
                newlyCreatedReel.category === 'Food' ? 'cat-food' :
                newlyCreatedReel.category === 'Travel' ? 'cat-travel' :
                newlyCreatedReel.category === 'Tech' ? 'cat-tech' :
                newlyCreatedReel.category === 'Comedy' ? 'cat-comedy' :
                newlyCreatedReel.category === 'Music' ? 'cat-music' : 'cat-lifestyle'
              }`}>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-slate-200">
                      {newlyCreatedReel.category}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(newlyCreatedReel.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate max-w-xs">{newlyCreatedReel.title}</h5>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{newlyCreatedReel.summary}</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-6 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/10"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
