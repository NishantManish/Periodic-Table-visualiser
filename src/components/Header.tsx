import React, { useState } from 'react';
import {
  Atom,
  Search,
  BookOpen,
  Boxes,
  Zap,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Bookmark,
  Award,
  Settings,
  Flame,
  Layers,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GradeLevel, ViewMode, HeatmapProperty } from '../types';
import { ELEMENTS, CATEGORY_COLORS } from '../data/elementsData';

export const Header: React.FC = () => {
  const {
    viewMode,
    setSelectedElement,
    setViewMode,
    searchQuery,
    setSearchQuery,
    heatmapProperty,
    setHeatmapProperty,
    gradeLevel,
    setGradeLevel,
    xp,
    level,
    streak,
    bookmarks,
    soundEnabled,
    toggleSound,
    theme,
    toggleTheme,
    highContrast,
    toggleHighContrast,
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'table', label: 'Periodic Table', icon: <Layers className="w-4 h-4" /> },
    { mode: '3d-atom', label: '3D Atoms', icon: <Atom className="w-4 h-4" /> },
    { mode: 'molecule-builder', label: 'Molecule Builder', icon: <Boxes className="w-4 h-4" /> },
    { mode: 'reaction-simulator', label: 'Reactions', icon: <Zap className="w-4 h-4" /> },
    { mode: 'trends', label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> },
    { mode: 'learning', label: 'Learning', icon: <GraduationCap className="w-4 h-4" /> },
    { mode: 'quiz', label: 'Quiz & Flashcards', icon: <Award className="w-4 h-4" /> },
    { mode: 'ai-tutor', label: 'AI Tutor', icon: <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> },
  ];

  const gradeOptions: GradeLevel[] = [
    'Grade 5',
    'Grade 8',
    'Grade 10',
    'CBSE/ICSE',
    'JEE/NEET',
    'University',
  ];

  const heatmapOptions: { key: HeatmapProperty; label: string }[] = [
    { key: 'none', label: 'Standard Category View' },
    { key: 'electronegativity', label: 'Electronegativity Heatmap' },
    { key: 'atomicRadius', label: 'Atomic Radius' },
    { key: 'density', label: 'Density' },
    { key: 'meltingPoint', label: 'Melting Point' },
    { key: 'boilingPoint', label: 'Boiling Point' },
    { key: 'ionizationEnergy', label: 'Ionization Energy' },
    { key: 'electronAffinity', label: 'Electron Affinity' },
  ];

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
      <header className="bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-xl border border-slate-700/50 dark:border-slate-800/80 rounded-2xl shadow-2xl transition-colors">
        <div className="px-4 sm:px-6 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setViewMode('table')}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group">
              <Atom className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-700" />
              <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md group-hover:blur-lg transition-all" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 dark:text-slate-100 tracking-tight">
                  Periodic<span className="text-cyan-400 font-extrabold">Lab</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                  v3.0 3D
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 hidden sm:block">Interactive Chemistry & AI Tutor</p>
            </div>
          </div>

                    {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm relative items-center group">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search elements by name, symbol, Z (1-118)..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/60 dark:border-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                ×
              </button>
            )}
            
            {/* Search Dropdown */}
            {searchQuery.trim().length > 0 && viewMode !== 'table' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {ELEMENTS.filter(el => 
                  el.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  el.symbol.toLowerCase() === searchQuery.toLowerCase() ||
                  String(el.atomicNumber) === searchQuery
                ).slice(0, 10).map(el => (
                  <button 
                    key={el.atomicNumber}
                    onClick={() => {
                      setSelectedElement(el);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-800 text-left transition-colors border-b border-slate-800/50 last:border-0"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xs"
                      style={{ backgroundColor: CATEGORY_COLORS[el.category]?.bg }}
                    >
                      {el.symbol}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{el.name}</div>
                      <div className="text-[10px] text-slate-400">Z = {el.atomicNumber} • {el.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Top Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Heatmap Overlay Selector */}
            {viewMode === 'table' && (
              <select
                value={heatmapProperty}
                onChange={(e) => setHeatmapProperty(e.target.value as HeatmapProperty)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 dark:bg-slate-900 border border-slate-700 text-slate-200 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                {heatmapOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {/* Grade Level Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/70 dark:bg-slate-900/70 border border-slate-700/60 rounded-lg px-2 py-1">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
              >
                {gradeOptions.map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-slate-200">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* User XP & Streak Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-lg px-2.5 py-1 text-xs">
              <div className="flex items-center gap-1 font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{streak}d</span>
              </div>
              <div className="w-px h-3 bg-amber-500/30" />
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <span className="text-cyan-400">Lvl {level}</span>
                <span className="text-[10px] text-slate-400">({xp} XP)</span>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              className="p-1.5 rounded-lg bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-1.5 rounded-lg bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Accessibility / Settings Modal Trigger */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-1.5 rounded-lg bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Settings & Accessibility"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-2">
          {navItems.map((item) => {
            const active = viewMode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-4">
                    <div className="relative z-50">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search element name or atomic number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
            />
            {/* Mobile Search Dropdown */}
            {searchQuery.trim().length > 0 && viewMode !== 'table' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {ELEMENTS.filter(el => 
                  el.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  el.symbol.toLowerCase() === searchQuery.toLowerCase() ||
                  String(el.atomicNumber) === searchQuery
                ).slice(0, 10).map(el => (
                  <button 
                    key={el.atomicNumber}
                    onClick={() => {
                      setSelectedElement(el);
                      setSearchQuery('');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-left transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xs"
                      style={{ backgroundColor: CATEGORY_COLORS[el.category]?.bg }}
                    >
                      {el.symbol}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{el.name}</div>
                      <div className="text-[10px] text-slate-400">Z = {el.atomicNumber} • {el.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Heatmap</label>
              <select
                value={heatmapProperty}
                onChange={(e) => setHeatmapProperty(e.target.value as HeatmapProperty)}
                className="w-full p-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              >
                {heatmapOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Target Grade</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full p-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              >
                {gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSound} className="p-2 rounded-lg bg-slate-800 text-slate-300">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-800 text-slate-300">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings / Accessibility Drawer Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="font-bold text-slate-100 text-base">Settings & Accessibility</h3>
                <p className="text-xs text-slate-400">Customize learning experience & UI preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <div>
                  <p className="text-xs font-semibold text-slate-200">High Contrast Mode</p>
                  <p className="text-[11px] text-slate-400">Enhance borders and text clarity</p>
                </div>
                <button
                  onClick={toggleHighContrast}
                  className={`w-10 h-6 rounded-full transition-colors relative p-1 ${
                    highContrast ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      highContrast ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Audio Micro-Interactions</p>
                  <p className="text-[11px] text-slate-400">Synthesized audio for clicks and quiz scores</p>
                </div>
                <button
                  onClick={toggleSound}
                  className={`w-10 h-6 rounded-full transition-colors relative p-1 ${
                    soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-200">Bookmarks Count</p>
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold">
                  <Bookmark className="w-4 h-4" />
                  <span>{bookmarks.length} elements saved to study list</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all"
            >
              Done & Save
            </button>
          </div>
        </div>
      )}
    </header>
    </div>
  );
};
