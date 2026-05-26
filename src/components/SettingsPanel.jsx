import React, { useState, useEffect } from 'react';
import { db, seedDatabase } from '../db';
import { parseGitHubRepo } from '../githubService';
import { 
  Key, Database, RefreshCw, Trash2, Download, Upload, Check, AlertTriangle, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);


export default function SettingsPanel({ activeTab, onTabChange }) {
  const [gitToken, setGitToken] = useState('');
  const [gitRepo, setGitRepo] = useState('');
  const [gitOwner, setGitOwner] = useState('');
  const [gitEvent, setGitEvent] = useState('process-reel');
  const [processingMode, setProcessingMode] = useState('simulation');
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0 });
  const [actionStatus, setActionStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Load Settings on Mount
  useEffect(() => {
    const token = localStorage.getItem('rv_github_token') || '';
    const repo = localStorage.getItem('rv_github_repo') || '';
    const owner = localStorage.getItem('rv_github_owner') || '';
    const event = localStorage.getItem('rv_github_event') || 'process-reel';
    const mode = localStorage.getItem('rv_processing_mode') || 'simulation';

    setGitToken(token);
    setGitRepo(repo);
    setGitOwner(owner);
    setGitEvent(event);
    setProcessingMode(mode);

    loadDbStats();
  }, []);

  const loadDbStats = async () => {
    try {
      const total = await db.reels.count();
      const completed = await db.reels.where('status').equals('completed').count();
      const processing = await db.reels.where('status').equals('processing').count();
      setStats({ total, completed, processing });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    setActionStatus({ type: '', message: '' });

    try {
      localStorage.setItem('rv_github_token', gitToken);
      localStorage.setItem('rv_github_repo', gitRepo);
      localStorage.setItem('rv_github_owner', gitOwner);
      localStorage.setItem('rv_github_event', gitEvent);
      localStorage.setItem('rv_processing_mode', processingMode);

      setActionStatus({ type: 'success', message: 'Settings successfully saved!' });
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ['#8b5cf6', '#06b6d4'],
        origin: { y: 0.8 }
      });
    } catch (err) {
      setActionStatus({ type: 'error', message: 'Failed to save settings: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedMock = async () => {
    setIsLoading(true);
    setActionStatus({ type: '', message: '' });
    try {
      await seedDatabase();
      await loadDbStats();
      setActionStatus({ type: 'success', message: 'Seeded default library successfully!' });
      confetti({
        particleCount: 100,
        spread: 60,
        colors: ['#a78bfa', '#06b6d4', '#ec4899']
      });
    } catch (err) {
      setActionStatus({ type: 'error', message: 'Seeding failed: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDb = async () => {
    if (!window.confirm('Are you absolutely sure you want to clear your local library? This cannot be undone.')) return;
    
    setIsLoading(true);
    setActionStatus({ type: '', message: '' });
    try {
      await db.reels.clear();
      await loadDbStats();
      setActionStatus({ type: 'success', message: 'Local database cleared.' });
    } catch (err) {
      setActionStatus({ type: 'error', message: 'Clear failed: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDb = async () => {
    try {
      const items = await db.reels.toArray();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(items, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `ReelVault_Backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      setActionStatus({ type: 'error', message: 'Export failed: ' + err.message });
    }
  };

  const handleImportDb = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsedReels = JSON.parse(event.target.result);
        if (!Array.isArray(parsedReels)) {
          throw new Error('Invalid backup file. Root element must be an array.');
        }

        setIsLoading(true);
        // Clean out IDs so they auto-increment cleanly
        const sanitizedReels = parsedReels.map(r => {
          const { id, ...rest } = r;
          return { ...rest, status: r.status || 'completed', createdAt: r.createdAt || Date.now() };
        });

        await db.reels.bulkAdd(sanitizedReels);
        await loadDbStats();
        setActionStatus({ type: 'success', message: `Imported ${sanitizedReels.length} reels successfully!` });
        confetti({ particleCount: 60 });
      } catch (err) {
        setActionStatus({ type: 'error', message: 'Import failed: ' + err.message });
      } finally {
        setIsLoading(false);
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Control Center Settings
        </h2>
        <p className="text-slate-400 text-sm mt-1">Configure your GitHub Actions pipeline connections and manage local assets.</p>
      </div>

      {/* Action Notification Banner */}
      {actionStatus.message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
          actionStatus.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {actionStatus.type === 'success' ? <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />}
          <div>
            <p className="font-semibold text-sm capitalize">{actionStatus.type}</p>
            <p className="text-xs text-slate-300 mt-0.5">{actionStatus.message}</p>
          </div>
        </div>
      )}

      {/* Main Configurations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Column Left - Github Connection */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <GithubIcon className="h-5 w-5 text-purple-400" />
              GitHub Actions Pipeline Setup
            </h3>

            {/* Selection Selector for Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Processing Mode</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setProcessingMode('simulation')}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                    processingMode === 'simulation'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Run Simulator (No setup needed)
                </button>
                <button
                  type="button"
                  onClick={() => setProcessingMode('github')}
                  className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                    processingMode === 'github'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🐙 Live GitHub Actions
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">
                {processingMode === 'simulation'
                  ? 'Recommended for demonstration! Simulates terminal logs, yt-dlp downloading, and LLaMA/VideoPrism classifications.'
                  : 'Fires a live POST repository_dispatch to trigger your custom GitHub Actions video scraper/AI pipeline.'}
              </p>
            </div>

            {/* Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Key className="h-3 w-3 text-purple-400" /> Personal Access Token (PAT)
              </label>
              <input
                type="password"
                placeholder={processingMode === 'simulation' ? 'Required for Live Github (e.g. ghp_xxxxxxxx)' : 'Disabled in Simulator Mode'}
                value={gitToken}
                disabled={processingMode === 'simulation'}
                onChange={(e) => setGitToken(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-purple-500/80 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Owner */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Repo Owner</label>
                <input
                  type="text"
                  placeholder="e.g. Octocat"
                  value={gitOwner}
                  disabled={processingMode === 'simulation'}
                  onChange={(e) => setGitOwner(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-purple-500/80 transition-colors disabled:opacity-50"
                />
              </div>

              {/* Repo Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Repository Name</label>
                <input
                  type="text"
                  placeholder="e.g. ReelVault-Pipeline"
                  value={gitRepo}
                  disabled={processingMode === 'simulation'}
                  onChange={(e) => setGitRepo(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-purple-500/80 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Event Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Dispatch Event Type</label>
              <input
                type="text"
                placeholder="process-reel"
                value={gitEvent}
                disabled={processingMode === 'simulation'}
                onChange={(e) => setGitEvent(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-purple-500/80 transition-colors disabled:opacity-50"
              />
              <p className="text-[10px] text-slate-500">The event_type matching your workflow repository_dispatch trigger.</p>
            </div>

            {/* Save Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shadow-lg hover:shadow-purple-500/20 active:translate-y-px"
              >
                Save Connection Configurations
              </button>
            </div>
          </div>
        </div>

        {/* Database Management & Statistics */}
        <div className="space-y-6">
          {/* Library Stats card */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Database className="h-5 w-5 text-cyan-400" />
              Library Details
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5">
                <span className="text-2xl font-bold text-white block">{stats.total}</span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">Saved</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5">
                <span className="text-2xl font-bold text-cyan-400 block">{stats.completed}</span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">Ingested</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5">
                <span className="text-2xl font-bold text-yellow-400 block animate-pulse">{stats.processing}</span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">Queued</span>
              </div>
            </div>
          </div>

          {/* Database Operations */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Library Operations
            </h3>

            <div className="space-y-2">
              {/* Seed default */}
              <button
                type="button"
                onClick={handleSeedMock}
                className="w-full bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-800/40 hover:border-cyan-700/60 text-cyan-300 font-medium py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Seed Demo library
              </button>

              {/* Export backup */}
              <button
                type="button"
                onClick={handleExportDb}
                className="w-full bg-slate-950/60 hover:bg-slate-900/60 border border-white/10 text-slate-300 font-medium py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                Export Library (JSON)
              </button>

              {/* Import backup */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDb}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  className="w-full bg-slate-950/60 hover:bg-slate-900/60 border border-white/10 text-slate-300 font-medium py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import Library (JSON)
                </button>
              </div>

              {/* Clear DB */}
              <button
                type="button"
                onClick={handleClearDb}
                className="w-full bg-rose-950/20 hover:bg-rose-950/45 border border-rose-900/30 hover:border-rose-800/50 text-rose-400 font-medium py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Local Library
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
