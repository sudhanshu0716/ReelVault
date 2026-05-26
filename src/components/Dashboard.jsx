import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { fetchWorkflowRuns } from '../githubService';
import { 
  Search, Grid, List, Heart, ExternalLink, Calendar, Filter, Eye, AlertCircle, RefreshCw, Layers, Info
} from 'lucide-react';

export default function Dashboard({ onSelectReel, triggerRefresh }) {
  const [reels, setReels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [activeJobs, setActiveJobs] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  // Library Statistics
  const [stats, setStats] = useState({ total: 0, favorites: 0, processing: 0 });

  // Load Library Data
  useEffect(() => {
    loadLibraryData();
  }, [searchQuery, selectedCategory, sortBy, triggerRefresh]);

  // Poll Active GitHub Workflows if configured
  useEffect(() => {
    const isGit = localStorage.getItem('rv_processing_mode') === 'github';
    const token = localStorage.getItem('rv_github_token');
    const repo = localStorage.getItem('rv_github_repo');
    const owner = localStorage.getItem('rv_github_owner');

    if (isGit && token && repo && owner) {
      const interval = setInterval(async () => {
        const runs = await fetchWorkflowRuns({ owner, repo, token });
        // filter active runs (queued, in_progress)
        const activeRuns = runs.filter(r => ['queued', 'in_progress'].includes(r.status));
        setActiveJobs(activeRuns);
        
        // If there are running jobs, let's refresh our library to capture any syncs!
        if (activeRuns.length > 0) {
          loadLibraryData();
        }
      }, 7000);

      return () => clearInterval(interval);
    }
  }, [triggerRefresh]);

  const loadLibraryData = async () => {
    try {
      let query = db.reels;
      let items = await query.toArray();

      // Calculate Stats
      const total = items.length;
      const favorites = items.filter(r => r.isFavorite === 1).count || items.filter(r => r.isFavorite === 1).length;
      const processing = items.filter(r => r.status === 'processing').length;
      setStats({ total, favorites, processing });

      // Apply Local Filters
      if (selectedCategory !== 'All') {
        items = items.filter(r => r.category === selectedCategory);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter(r => 
          r.title.toLowerCase().includes(q) || 
          r.summary.toLowerCase().includes(q) || 
          (r.caption && r.caption.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q)
        );
      }

      // Apply Sorting
      items.sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'oldest') return a.createdAt - b.createdAt;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });

      setReels(items);
    } catch (err) {
      console.error('Error fetching reels:', err);
    }
  };

  const categories = ['All', 'Food', 'Travel', 'Tech', 'Comedy', 'Music', 'Lifestyle'];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Ingestion */}
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Reels Library</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{stats.total}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* Favorite reels */}
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Starred Reels</span>
            <span className="text-3xl font-extrabold text-rose-400 mt-1 block">{stats.favorites}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-600/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
            <Heart className="h-5 w-5 fill-current" />
          </div>
        </div>

        {/* Active Ingest Pipelines */}
        <div className="glass-panel p-4 flex items-center justify-between md:col-span-2">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Active cloud Ingestions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-cyan-400">{stats.processing || activeJobs.length}</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                {stats.processing > 0 ? 'RUNNING PIPELINE' : 'IDLE'}
              </span>
            </div>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            stats.processing > 0 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 animate-pulse pulse-cyan' 
              : 'bg-slate-800 text-slate-500 border border-white/5'
          }`}>
            <RefreshCw className={`h-5 w-5 ${stats.processing > 0 ? 'animate-spin' : ''}`} />
          </div>
        </div>
      </div>

      {/* Simulation Mode Notice Banner */}
      {localStorage.getItem('rv_processing_mode') !== 'github' && (
        <div className="glass-panel p-4 border-purple-500/20 bg-purple-950/10 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/25 border border-purple-500/35 flex items-center justify-center text-purple-400 shrink-0 animate-pulse">
              <Info className="h-4.5 w-4.5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                ⚡ Local Ingestion Simulator Active
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xl leading-normal">
                ReelVault is operating in offline-first Simulation Mode. Paste any Reel link to simulate the pipeline and test custom cards. To trigger actual cloud downloads and VideoPrism/LLaMA AI processing, configure your private connection in the Settings tab.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('changeTab', { detail: 'settings' }));
            }}
            className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-all shrink-0 active:translate-y-px"
          >
            Configure GitHub Action
          </button>
        </div>
      )}

      {/* GitHub Workflow Job Alert list if active */}
      {activeJobs.length > 0 && (
        <div className="glass-panel p-4 border-cyan-500/20 bg-cyan-950/5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">GitHub Action Workflow running in cloud...</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Scraping video and executing VideoPrism analysis.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeJobs.map((job, idx) => (
              <a
                key={idx}
                href={job.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-semibold"
              >
                Monitor Run #{job.run_number} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search Header Bar, category selector and view layout */}
      <div className="glass-panel p-4 space-y-4">
        
        {/* Row 1 - Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search inputs */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search captions, summaries, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:border-purple-500/80 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Sorter and Views */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-slate-950/40 border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-slate-200 cursor-pointer pr-1 focus:ring-0"
              >
                <option value="newest" className="bg-slate-950 text-slate-200">Newest Ingest</option>
                <option value="oldest" className="bg-slate-950 text-slate-200">Oldest Ingest</option>
                <option value="title" className="bg-slate-950 text-slate-200">Alphabetical</option>
                <option value="category" className="bg-slate-950 text-slate-200">Category Group</option>
              </select>
            </div>

            {/* Layout view buttons */}
            <div className="flex bg-slate-950/40 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-600/80 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-600/80 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 - Scrolling horizontal category pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none border-t border-white/5 pt-3">
          <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold tracking-wide transition-all shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/10'
                    : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main Grid display of cards */}
      {reels.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600 mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">No Ingested Reels Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn't find any reels matching your criteria. Try adding a new Reel URL or seeds some default data.
            </p>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {reels.map((reel) => {
            const isProcessing = reel.status === 'processing';
            return (
              <div
                key={reel.id}
                onClick={() => onSelectReel(reel.id)}
                className={`glass-card p-5 cursor-pointer relative flex flex-col justify-between ${
                  viewMode === 'list' ? 'flex-row items-center gap-4' : 'h-64'
                } ${
                  reel.category === 'Food' ? 'cat-food' :
                  reel.category === 'Travel' ? 'cat-travel' :
                  reel.category === 'Tech' ? 'cat-tech' :
                  reel.category === 'Comedy' ? 'cat-comedy' :
                  reel.category === 'Music' ? 'cat-music' : 'cat-lifestyle'
                }`}
              >
                {/* Favorites Ribbon / heart icon */}
                {reel.isFavorite === 1 && (
                  <div className="absolute top-4 right-4 z-10 text-rose-500">
                    <Heart className="h-4.5 w-4.5 fill-current" />
                  </div>
                )}

                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-slate-300">
                      {reel.category}
                    </span>
                    {isProcessing && (
                      <span className="text-[8px] bg-cyan-500/10 text-cyan-300 font-semibold px-2 py-0.5 border border-cyan-500/20 rounded-full animate-pulse flex items-center gap-1">
                        <RefreshCw className="h-2 w-2 animate-spin" /> Ingestion Pipeline
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                      {reel.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Ingested {new Date(reel.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 select-none">
                    {reel.summary}
                  </p>
                </div>

                {/* Footer and Actions */}
                <div className={`flex items-center justify-between border-t border-white/5 pt-3.5 mt-4 shrink-0 ${
                  viewMode === 'list' ? 'border-t-0 pt-0 mt-0 flex-col gap-2 shrink' : ''
                }`}>
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                    {reel.url.replace('https://www.instagram.com/reel/', '').substring(0, 12)}...
                  </span>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectReel(reel.id);
                      }}
                      className="text-[10px] bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/20 hover:border-purple-400/40 text-purple-400 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-semibold"
                    >
                      <Eye className="h-3 w-3" /> Details
                    </button>
                    
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Launch Instagram"
                      className="text-[10px] bg-slate-950/60 hover:bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white p-1 rounded-lg transition-all flex items-center justify-center shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
