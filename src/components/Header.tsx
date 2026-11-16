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
    reducedMotion,
    toggleReducedMotion,
    fontSizeScale,
    setFontSizeScale,
    soundEnabled,
    toggleSound,
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
    { mode: 'molecule-visualizer', label: 'Molecule Visualizer', icon: <Boxes className="w-4 h-4" /> },
    { mode: 'reaction-simulator', label: 'Reactions', icon: <Zap className="w-4 h-4" /> },
    { mode: 'trends', label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> },
    { mode: 'learning', label: 'Learning', icon: <GraduationCap className="w-4 h-4" /> },
    { mode: 'ai-tutor', label: 'AI Tutor', icon: <Sparkles className="w-4 h-4 text-sky-500 dark:text-cyan-400" /> },
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
      <header className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-2xl transition-all rounded-2xl relative z-50">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-15 gap-4">
            {/* Brand Wordmark */}
            <div
              className="flex items-center gap-2.5 shrink-0 cursor-pointer"
              onClick={() => setViewMode('table')}
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-cyan-500/15 flex items-center justify-center border border-sky-500/25 dark:border-cyan-400/30">
                <Atom className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight whitespace-nowrap shrink-0">
                Periodic<span className="text-sky-600 dark:text-cyan-400">Lab</span>
              </span>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md relative items-center group">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-sky-600 dark:group-focus-within:text-cyan-400 transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search element name, symbol, Z, block... (Press /)"
                className="w-full pl-10 pr-8 py-1.5 text-xs font-medium rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Search Dropdown */}
              {searchQuery.trim().length > 0 && viewMode !== 'table' && (
                <div className="absolute top-[115%] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs border ${CATEGORY_COLORS[el.category]?.bg}`}
                        >
                          {el.symbol}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{el.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            Z = {el.atomicNumber} · {el.category.replace('-', ' ')}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Desktop Top Controls */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Heatmap Overlay Selector */}
              {viewMode === 'table' && (
                <select
                  value={heatmapProperty}
                  onChange={(e) => setHeatmapProperty(e.target.value as HeatmapProperty)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:outline-none cursor-pointer transition-all"
                >
                  {heatmapOptions.map((opt) => (
                    <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Grade Level Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-colors">
                <GraduationCap className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* User XP & Streak Telemetry */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono tabular-nums">
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {streak}d
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-bold text-sky-600 dark:text-cyan-400">Lvl {level}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">({xp} XP)</span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer text-xs font-semibold whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden xl:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="hidden xl:inline">Dark</span>
                  </>
                )}
              </button>

              {/* Accessibility / Settings Modal Trigger */}
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                title="Settings & Accessibility"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Primary Navigation Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 pt-1.5 scrollbar-none border-t border-slate-200/80 dark:border-slate-800">
            {navItems.map((item) => {
              const active = viewMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => setViewMode(item.mode)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
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
          <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-4 rounded-b-2xl">
            <div className="relative z-50">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search element name or atomic number..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                  Heatmap
                </label>
                <select
                  value={heatmapProperty}
                  onChange={(e) => setHeatmapProperty(e.target.value as HeatmapProperty)}
                  className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                >
                  {heatmapOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                  Curriculum Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Settings / Accessibility Drawer Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-sky-600 dark:text-cyan-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Display & Accessibility
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customize color theme, contrast, and study preferences
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Color Theme
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Switch between Clinical Light and Obsidian Dark
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      High Contrast Mode
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enhance structural borders and text legibility
                    </p>
                  </div>
                  <button
                    onClick={toggleHighContrast}
                    className={`w-10 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                      highContrast ? 'bg-sky-600 dark:bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        highContrast ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Reduced Motion
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Minimize CSS transitions and UI animations
                    </p>
                  </div>
                  <button
                    onClick={toggleReducedMotion}
                    aria-label="Toggle Reduced Motion"
                    className={`w-10 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                      reducedMotion ? 'bg-sky-600 dark:bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        reducedMotion ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Sound Effects
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Web Audio synthesizer cues for interactions & AI Tutor
                    </p>
                  </div>
                  <button
                    onClick={toggleSound}
                    aria-label="Toggle Sound Effects"
                    className={`w-10 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                      soundEnabled ? 'bg-sky-600 dark:bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      Font Size Scale
                    </p>
                    <span className="text-[11px] font-mono text-sky-600 dark:text-cyan-400 uppercase font-bold">
                      {fontSizeScale}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'normal', label: 'Default (100%)' },
                        { id: 'large', label: 'Large (110%)' },
                        { id: 'xlarge', label: 'X-Large (120%)' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFontSizeScale(opt.id)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          fontSizeScale === opt.id
                            ? 'bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-sky-600 dark:border-cyan-400'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    Saved Study Bookmarks
                  </p>
                  <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-cyan-400 font-bold">
                    <Bookmark className="w-4 h-4" />
                    <span>{bookmarks.length} elements bookmarked</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};
