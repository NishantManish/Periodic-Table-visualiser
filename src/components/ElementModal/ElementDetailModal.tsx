import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../data/elementsData';
import { MOLECULES_LIBRARY } from '../../data/moleculesData';
import {
  X,
  Bookmark,
  Sparkles,
  Atom,
  Briefcase,
  ShieldAlert,
  HeartPulse,
  Send,
  Loader2,
  BookOpen,
  Info,
  Layers,
  FlaskConical,
  BarChart3,
  Box,
  ArrowUpRight,
  Orbit,
} from 'lucide-react';
import { AbundanceChart } from './AbundanceChart';
import { IsotopeCalculator } from './IsotopeCalculator';
import { useToast } from '../ui/Toast';
import { FormattedChemMarkdown } from '../ui/FormattedChemMarkdown';

const CrystalLatticeView = React.lazy(() =>
  import('../Atom3D/CrystalLatticeView').then((m) => ({ default: m.CrystalLatticeView }))
);

export const ElementDetailModal: React.FC = () => {
  const {
    selectedElement,
    isElementModalOpen,
    setSelectedElement,
    bookmarks,
    toggleBookmark,
    notes,
    saveNote,
    gradeLevel,
    openElementInAtom3D,
    openMoleculeInVisualizer,
  } = useAppStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'bohr' | 'crystal' | 'applications' | 'ai-tutor' | 'notes'
  >('overview');

  // AI Tutor State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [noteText, setNoteText] = useState(selectedElement ? notes[selectedElement.atomicNumber] || '' : '');

  const relatedMolecules = useMemo(() => {
    if (!selectedElement) return [];
    return MOLECULES_LIBRARY.filter((mol) =>
      mol.atoms.some((atom) => atom.symbol === selectedElement.symbol)
    );
  }, [selectedElement]);

  React.useEffect(() => {
    if (selectedElement) {
      setNoteText(notes[selectedElement.atomicNumber] || '');
    }
  }, [selectedElement, notes]);

  React.useEffect(() => {
    setAiResponse(null);
    setAiPrompt('');
  }, [selectedElement?.atomicNumber]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedElement && isElementModalOpen) {
        setSelectedElement(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, isElementModalOpen, setSelectedElement]);

  if (!selectedElement || !isElementModalOpen) return null;

  const isBookmarked = bookmarks.includes(selectedElement.atomicNumber);
  const categoryStyle = CATEGORY_COLORS[selectedElement.category] || CATEGORY_COLORS.unknown;

  const handleFetchAiExplanation = async (mode = 'normal', customQuery = '') => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const prompt = customQuery || `Explain ${selectedElement.name} (${selectedElement.symbol}), Z=${selectedElement.atomicNumber}. Mention its atomic configuration, bonding behavior, real-world uses, and why it is unique.`;
      
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, gradeLevel, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiResponse(data.error || 'Failed to generate AI explanation.');
        return;
      }
      setAiResponse(data.result || 'No response returned.');
    } catch {
      setAiResponse('Failed to connect to AI Tutor. Please check your network connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveNote = () => {
    saveNote(selectedElement.atomicNumber, noteText);
    toast(
      `Study Note Saved (${selectedElement.symbol})`,
      `Your personal chemistry notes for ${selectedElement.name} have been persisted.`,
      'success'
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedElement(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Side Panel Drawer Optimized for PC */}
        <motion.div
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className={`fixed inset-y-0 right-0 w-full ${
            activeTab === 'crystal' ? 'max-w-4xl lg:max-w-6xl' : 'max-w-2xl lg:max-w-3xl'
          } bg-white/95 dark:bg-slate-950/90 border-l border-slate-200 dark:border-white/15 shadow-2xl flex flex-col z-10 backdrop-blur-3xl overflow-hidden transition-[max-width] duration-200`}
        >
          {/* Header Banner */}
          <div className="p-6 border-b border-slate-200 dark:border-white/10 relative overflow-hidden">
            {/* Background element glow */}
            <div className={`absolute inset-0 opacity-20 ${categoryStyle.bg}`} />
            
            <div className="flex items-start justify-between gap-4 relative z-10">
              
              <div className="flex items-center gap-5">
                {/* Symbol Tile */}
                <motion.div
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`w-20 h-20 sm:w-22 sm:h-22 rounded-3xl flex flex-col items-center justify-center border shadow-lg shrink-0 ${categoryStyle.bg}`}
                >
                  <span className="text-[11px] font-mono font-bold opacity-80 self-start pl-2.5 pt-1 tabular-nums">
                    {selectedElement.atomicNumber}
                  </span>
                  <span className="text-3xl font-black tracking-tight">
                    {selectedElement.symbol}
                  </span>
                  <span className="text-[10px] font-mono font-bold opacity-80 pb-1 tabular-nums">
                    {selectedElement.atomicMass.toFixed(2)}
                  </span>
                </motion.div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedElement.name}
                    </h2>
                    <span className={`px-3 py-1 text-xs font-extrabold rounded-md border shadow-sm ${categoryStyle.bg} uppercase tracking-wider`}>
                      {CATEGORY_LABELS[selectedElement.category]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-white/80 mt-2 max-w-md leading-relaxed font-medium">
                    {selectedElement.summary}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleBookmark(selectedElement.atomicNumber)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                    isBookmarked
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-500/50'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white'
                  }`}
                  title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Element'}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-500 dark:fill-amber-400' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedElement(null)}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-white/10 transition-all cursor-pointer shadow-sm"
                  title="Close Side Panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            </div>

            {/* Quick Badges Row */}
            <div className="flex flex-wrap items-center gap-3 mt-6 text-[11px] font-mono text-slate-700 dark:text-white/80 font-semibold uppercase tracking-wider relative z-10">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/25 border border-slate-200 dark:border-white/10 shadow-sm">
                Group: <strong className="text-sky-700 dark:text-cyan-300">{selectedElement.group}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/25 border border-slate-200 dark:border-white/10 shadow-sm">
                Period: <strong className="text-sky-700 dark:text-cyan-300">{selectedElement.period}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/25 border border-slate-200 dark:border-white/10 shadow-sm">
                Block: <strong className="text-sky-700 dark:text-cyan-300">{selectedElement.block}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/25 border border-slate-200 dark:border-white/10 shadow-sm">
                State: <strong className="text-emerald-700 dark:text-emerald-300">{selectedElement.state}</strong>
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-white/5 overflow-x-auto scrollbar-none bg-slate-50 dark:bg-black/20 shrink-0">
            {[
              { id: 'overview', label: 'Properties', icon: <Layers className="w-4 h-4" /> },
              { id: 'bohr', label: 'Bohr Model', icon: <Atom className="w-4 h-4" /> },
              { id: 'crystal', label: 'Crystal Lattice', icon: <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
              { id: 'applications', label: 'Uses & Safety', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'ai-tutor', label: 'AI Tutor', icon: <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
              { id: 'notes', label: 'Study Notes', icon: <BookOpen className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-bold rounded-t-2xl transition-all whitespace-nowrap cursor-pointer relative ${
                  activeTab === tab.id
                    ? 'text-slate-950 dark:text-white bg-white dark:bg-white/10 border-t border-l border-r border-slate-200 dark:border-white/10'
                    : 'text-slate-600 dark:text-white/55 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-600 dark:bg-cyan-400"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Panel Scrollable Content Area */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">

            {/* TAB 1: OVERVIEW & ALL REQUIRED PROPERTIES */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Launch 3D & Molecular Labs Cross-Navigation Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Orbit className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                      Launch 3D &amp; Molecular Labs
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Jump directly into interactive simulations for {selectedElement.symbol}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => openElementInAtom3D(selectedElement, 'orbitals')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Atom className="w-4 h-4" />
                      <span>3D Quantum Orbitals</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                    </button>

                    <button
                      onClick={() => openElementInAtom3D(selectedElement, 'crystal')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Box className="w-4 h-4" />
                      <span>
                        3D Crystal Lattice ({selectedElement.crystalStructure || 'Unit Cell'})
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  </div>

                  {relatedMolecules.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Molecules Containing {selectedElement.symbol} ({relatedMolecules.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedMolecules.slice(0, 8).map((mol) => (
                          <button
                            key={mol.id}
                            onClick={() => openMoleculeInVisualizer(mol.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span className="font-mono font-bold text-sky-700 dark:text-cyan-300">
                              {mol.formula}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span>{mol.name}</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Core Physical & Chemical Parameters Grid */}
                <div>
                  <h3 className="text-[13px] font-black text-slate-700 dark:text-white/75 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-sky-600 dark:text-cyan-400" /> Essential Physical & Chemical Metrics
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    
                    {/* Atomic Number */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Atomic Number (Z)</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{selectedElement.atomicNumber}</span>
                    </div>

                    {/* Atomic Mass */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Atomic Mass</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{selectedElement.atomicMass.toFixed(3)} u</span>
                    </div>

                    {/* Category */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Category</span>
                      <span className="text-sm font-bold text-sky-700 dark:text-cyan-300">{CATEGORY_LABELS[selectedElement.category]}</span>
                    </div>

                    {/* Group / Period / Block */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Group / Period / Block</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        G{selectedElement.group} • P{selectedElement.period} • {selectedElement.block.toUpperCase()}-block
                      </span>
                    </div>

                    {/* State */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Standard State</span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 capitalize">{selectedElement.state}</span>
                    </div>

                    {/* Electron Config */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Electron Configuration</span>
                      <span className="text-sm font-mono font-bold text-sky-700 dark:text-cyan-300">{selectedElement.electronConfiguration}</span>
                    </div>

                    {/* Density */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Density</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {selectedElement.density !== null ? `${selectedElement.density} g/cm³` : 'N/A'}
                      </span>
                    </div>

                    {/* Melting Point */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Melting Point</span>
                      <span className="text-sm font-mono font-bold text-amber-700 dark:text-amber-300">
                        {selectedElement.meltingPoint !== null ? `${selectedElement.meltingPoint} K (${(selectedElement.meltingPoint - 273.15).toFixed(1)} °C)` : 'N/A'}
                      </span>
                    </div>

                    {/* Boiling Point */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Boiling Point</span>
                      <span className="text-sm font-mono font-bold text-rose-700 dark:text-rose-400">
                        {selectedElement.boilingPoint !== null ? `${selectedElement.boilingPoint} K (${(selectedElement.boilingPoint - 273.15).toFixed(1)} °C)` : 'N/A'}
                      </span>
                    </div>

                    {/* Electronegativity */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Electronegativity</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {selectedElement.electronegativity !== null ? `${selectedElement.electronegativity} Pauling` : 'N/A'}
                      </span>
                    </div>

                    {/* Electron Affinity */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Electron Affinity</span>
                      <span className="text-sm font-mono font-bold text-pink-700 dark:text-pink-400">
                        {selectedElement.electronAffinity !== null ? `${selectedElement.electronAffinity} kJ/mol` : 'N/A'}
                      </span>
                    </div>

                    {/* Ionization Energy */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">First Ionization Energy</span>
                      <span className="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {selectedElement.ionizationEnergy !== null ? `${selectedElement.ionizationEnergy} kJ/mol` : 'N/A'}
                      </span>
                    </div>

                    {/* Oxidation States */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Oxidation States</span>
                      <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {selectedElement.oxidationStates && selectedElement.oxidationStates.length > 0
                          ? selectedElement.oxidationStates.map(s => (s > 0 ? `+${s}` : `${s}`)).join(', ')
                          : 'N/A'}
                      </span>
                    </div>

                    {/* Crystal Structure */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Crystal Structure</span>
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300 capitalize">{selectedElement.crystalStructure}</span>
                    </div>

                    {/* Abundance Earth */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 block mb-1">Crust Abundance</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {selectedElement.abundanceEarth !== null ? `${selectedElement.abundanceEarth} mg/kg` : 'Trace'}
                      </span>
                    </div>

                  </div>
                </div>
                
                {/* 1.5 Isotope Abundance Chart & Weighted Mass Calculator */}
                <div className="mt-8 space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Natural Isotope Abundance
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                      Verified CIAAW / IUPAC natural isotopic distribution of {selectedElement.name}.
                    </p>
                    <AbundanceChart element={selectedElement} />
                  </div>

                  <IsotopeCalculator element={selectedElement} />
                </div>

                {/* 2. Discovery Section */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md space-y-2">
                  <h4 className="text-xs font-bold text-sky-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4" /> Discovery & History
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Discovered in <strong className="text-slate-900 dark:text-white font-bold">{selectedElement.discoveryYear}</strong> by{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">{selectedElement.discoverer}</strong>. Natural occurrence:{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedElement.occurrence}</strong>.
                  </p>
                </div>

              </motion.div>
            )}

            {/* TAB 2: BOHR & LEWIS MODEL */}
            {activeTab === 'bohr' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  
                  {/* 2D Bohr Orbit Model */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-col items-center justify-center space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">2D Bohr Shell Model</h4>
                    
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      {/* Central Nucleus */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-extrabold text-white text-xs shadow-lg shadow-rose-500/30 z-10">
                        {selectedElement.symbol}
                      </div>

                      {/* Electron Concentric Rings */}
                      {selectedElement.bohrShells.map((count, sIdx) => {
                        const radius = 32 + sIdx * 18;
                        return (
                          <div
                            key={sIdx}
                            className="absolute rounded-full border border-sky-500/40 dark:border-cyan-500/30 animate-spin"
                            style={{
                              width: `${radius * 2}px`,
                              height: `${radius * 2}px`,
                              animationDuration: `${12 + sIdx * 4}s`,
                            }}
                          >
                            {Array.from({ length: count }).map((_, eIdx) => {
                              const angle = (eIdx / count) * 360;
                              return (
                                <div
                                  key={eIdx}
                                  className="absolute w-2.5 h-2.5 rounded-full bg-sky-500 dark:bg-cyan-400 shadow-sm shadow-cyan-400/80 -translate-x-1/2 -translate-y-1/2"
                                  style={{
                                    top: `${50 + 50 * Math.sin((angle * Math.PI) / 180)}%`,
                                    left: `${50 + 50 * Math.cos((angle * Math.PI) / 180)}%`,
                                  }}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono text-center">
                      Shell Counts: [{selectedElement.bohrShells.join(', ')}]<br />Valence = {selectedElement.valenceElectrons}
                    </p>
                  </div>

                  {/* Lewis Dot Structure */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-col items-center justify-center space-y-4">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">Lewis Dot Structure</h4>
                    {(() => {
                      const isMainGroup =
                        selectedElement.block === 's' || selectedElement.block === 'p';
                      const outerDots =
                        selectedElement.outerValenceElectrons ??
                        (isMainGroup
                          ? Math.min(selectedElement.valenceElectrons, 8)
                          : selectedElement.bohrShells[selectedElement.bohrShells.length - 1] || 2);
                      const positions = [
                        'top-2 left-1/2 -translate-x-2',
                        'right-2 top-1/2 -translate-y-2',
                        'bottom-2 left-1/2 -translate-x-2',
                        'left-2 top-1/2 -translate-y-2',
                        'top-2 left-1/2 translate-x-1',
                        'right-2 top-1/2 translate-y-1',
                        'bottom-2 left-1/2 translate-x-1',
                        'left-2 top-1/2 translate-y-1',
                      ];
                      return (
                        <>
                          <div className="relative w-28 h-28 flex items-center justify-center bg-white dark:bg-black/25 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                              {selectedElement.symbol}
                            </span>

                            {Array.from({ length: Math.min(outerDots, 8) }).map((_, i) => (
                              <div
                                key={i}
                                className={`absolute w-3 h-3 rounded-full bg-purple-600 dark:bg-purple-400 shadow-sm shadow-purple-400/80 ${positions[i]}`}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                            {isMainGroup ? (
                              <>
                                Shows <strong className="text-purple-700 dark:text-purple-300">{outerDots}</strong> outer s/p
                                valence electrons responsible for main-group bonding.
                              </>
                            ) : (
                              <>
                                Shows <strong className="text-purple-700 dark:text-purple-300">{outerDots}</strong> outer ns
                                electron(s) ({selectedElement.valenceElectrons} total{' '}
                                {selectedElement.block}-block valence e⁻; participates in variable
                                oxidation states [{selectedElement.oxidationStates.map((s) => (s > 0 ? `+${s}` : `${s}`)).join(', ')}]).
                              </>
                            )}
                          </p>
                        </>
                      );
                    })()}
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 2.5: 3D CRYSTAL LATTICE & MILLER PLANES */}
            {activeTab === 'crystal' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <React.Suspense
                  fallback={
                    <div className="flex items-center justify-center h-80 text-slate-400 text-xs gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>Initializing 3D Crystal Lattice Stage…</span>
                    </div>
                  }
                >
                  <CrystalLatticeView element={selectedElement} />
                </React.Suspense>
              </motion.div>
            )}

            {/* TAB 3: APPLICATIONS, USES & INTERESTING FACTS */}
            {activeTab === 'applications' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Real-World Uses */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md space-y-3">
                  <h4 className="text-xs font-bold text-sky-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Primary Real-World Uses
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedElement.uses.map((use, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-black/25 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-cyan-400 shrink-0" />
                        <span>{use}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Biological & Safety */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md space-y-2">
                    <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                      <HeartPulse className="w-4 h-4" /> Biological Importance
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedElement.biologicalImportance}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md space-y-2">
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Safety & Handling
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selectedElement.safety}</p>
                  </div>
                </div>

                {/* Interesting Facts */}
                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-slate-900/70 border border-purple-200 dark:border-purple-500/30 shadow-sm backdrop-blur-md space-y-3">
                  <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Interesting Chemistry Facts
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {selectedElement.interestingFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* TAB 4: AI TUTOR */}
            {activeTab === 'ai-tutor' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /> AI Chemistry Tutor ({gradeLevel})
                      </h4>
                      <p className="text-xs text-purple-700 dark:text-purple-300/80">
                        Tailored explanations and mnemonic memory tricks for {selectedElement.name}.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFetchAiExplanation('simple')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        Explain Simply
                      </button>
                      <button
                        onClick={() => handleFetchAiExplanation('mnemonic')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        Mnemonic
                      </button>
                    </div>
                  </div>

                  {/* Custom Prompt */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={`Ask AI about ${selectedElement.name}...`}
                      className="flex-1 px-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchAiExplanation('normal', aiPrompt)}
                    />
                    <button
                      onClick={() => handleFetchAiExplanation('normal', aiPrompt)}
                      disabled={aiLoading}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Ask
                    </button>
                  </div>
                </div>

                {/* AI Response Box (XSS-Safe Formatted Markdown + Chemistry Subscripts) */}
                {aiResponse && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-500/40 shadow-sm">
                    <FormattedChemMarkdown text={aiResponse} variant="adaptive" />
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 5: STUDY NOTES */}
            {activeTab === 'notes' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-sky-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Personal Notes on {selectedElement.name}
                  </h4>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={`Write personal study notes, lab observations, or exam reminders for ${selectedElement.name}...`}
                    className="w-full h-40 p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="px-4 py-2 bg-sky-600 dark:bg-cyan-600 hover:bg-sky-500 dark:hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </motion.div>
            )}

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

