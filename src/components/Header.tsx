import React, { useState, useEffect, useRef } from 'react';
import {
  Atom,
  Search,
  Boxes,
  Zap,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  Bookmark,
  Award,
  Settings,
  Flame,
  Layers,
  Menu,
  X,
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
    theme,
    toggleTheme,
    highContrast,
    toggleHighContrast,
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Desktop '/' shortcut to focus element search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'table', label: 'Periodic Table', icon: <Layers className="w-4 h-4" /> },
    { mode: '3d-atom', label: '3D Atoms', icon: <Atom className="w-4 h-4" /> },
    { mode: 'molecule-builder', label: 'Molecule Builder', icon: <Boxes className="w-4 h-4" /> },
    { mode: 'reaction-simulator', label: 'Reactions', icon: <Zap className="w-4 h-4" /> },
    { mode: 'trends', label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> },
    { mode: 'learning', label: 'Learning', icon: <GraduationCap className="w-4 h-4" /> },
    { mode: 'quiz', label: 'Quiz & Flashcards', icon: <Award className="w-4 h-4" /> },
    { mode: 'ai-tutor', label: 'AI Tutor', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
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
    <div className="sticky top-2 z-50 px-4 sm:px-6 lg:px-8 xl:px-10 mx-auto w-full max-w-[1800px]">
      <header className="glass-panel border border-white/10 shadow-2xl transition-all rounded-2xl relative z-50">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-3 shrink-0 cursor-pointer"
              onClick={() => setViewMode('table')}
            >
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 flex items-center justify-center shadow-lg border border-cyan-400/30 group backdrop-blur-md overflow-hidden">
                <Atom className="w-5 h-5 text-cyan-300 group-hover:rotate-90 transition-transform duration-700 ease-in-out" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">
                    Periodic<span className="text-cyan-400 font-black">Lab</span>
                  </span>
                  <span className="hidden sm:flex px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-md">
                    v3.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden xl:block font-medium">
                  Interactive Chemistry Workbench
                </p>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md relative items-center group">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-cyan-300 transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search element name, symbol, Z, block... (Press /)"
                className="w-full pl-10 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Search Dropdown */}
              {searchQuery.trim().length > 0 && viewMode !== 'table' && (
                <div className="absolute top-[115%] left-0 right-0 bg-slate-950/95 backdrop-blur-2xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {ELEMENTS.filter(
                    (el) =>
                      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      el.symbol.toLowerCase() === searchQuery.toLowerCase() ||
                      String(el.atomicNumber) === searchQuery
                  )
                    .slice(0, 10)
                    .map((el) => (
                      <button
                        key={el.atomicNumber}
                        onClick={() => {
                          setSelectedElement(el);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/80 text-left transition-colors border-b border-slate-800 last:border-0 cursor-pointer"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs border border-white/15"
                          style={{ backgroundColor: CATEGORY_COLORS[el.category]?.bg }}
                        >
                          {el.symbol}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{el.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Z = {el.atomicNumber} • {el.category.replace('-', ' ')}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Desktop Top Controls */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Heatmap Overlay Selector */}
              {viewMode === 'table' && (
                <select
                  value={heatmapProperty}
                  onChange={(e) => setHeatmapProperty(e.target.value as HeatmapProperty)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-100 focus:border-cyan-400 focus:outline-none cursor-pointer transition-all hover:bg-slate-800"
                >
                  {heatmapOptions.map((opt) => (
                    <option key={opt.key} value={opt.key} className="bg-slate-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Grade Level Selector */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 hover:bg-slate-800 transition-colors">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g} className="bg-slate-900 text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* User XP & Streak Badge */}
              <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{streak}d</span>
                </div>
                <div className="w-px h-3.5 bg-amber-500/30" />
                <div className="flex items-center gap-1.5 text-white font-bold font-mono">
                  <span className="text-cyan-300">Lvl {level}</span>
                  <span className="text-[11px] text-slate-300">({xp} XP)</span>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-300" />
                )}
              </button>

              {/* Accessibility / Settings Modal Trigger */}
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
                title="Settings & Accessibility"
              >
                <Settings className="w-4 h-4" />
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-2 scrollbar-none border-t border-white/10">
            {navItems.map((item) => {
              const active = viewMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => setViewMode(item.mode)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 border border-cyan-400'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
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
          <div className="lg:hidden bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 px-4 py-4 space-y-4 rounded-b-2xl">
            <div className="relative z-50">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search element name or atomic number..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              />
              {searchQuery.trim().length > 0 && viewMode !== 'table' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {ELEMENTS.filter(
                    (el) =>
                      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      el.symbol.toLowerCase() === searchQuery.toLowerCase() ||
                      String(el.atomicNumber) === searchQuery
                  )
                    .slice(0, 10)
                    .map((el) => (
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
                          <div className="text-[10px] text-slate-400">
                            Z = {el.atomicNumber} • {el.category}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Heatmap
                </label>
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
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Target Grade
                </label>
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
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings / Accessibility Drawer Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Settings & Accessibility</h3>
                  <p className="text-xs text-slate-400">
                    Customize learning experience & display preferences
                  </p>
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
                    className={`w-10 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
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
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
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

