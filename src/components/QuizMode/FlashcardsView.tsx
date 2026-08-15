import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ELEMENTS } from '../../data/elementsData';
import { ElementData, ElementCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Shuffle,
  Filter,
  Sparkles,
  BookOpen,
  Zap,
  Award,
  Layers,
} from 'lucide-react';

const CATEGORIES: { label: string; value: ElementCategory | 'all' }[] = [
  { label: 'All Elements', value: 'all' },
  { label: 'Alkali Metals', value: 'alkali-metal' },
  { label: 'Alkaline Earth', value: 'alkaline-earth' },
  { label: 'Transition Metals', value: 'transition-metal' },
  { label: 'Metalloids', value: 'metalloid' },
  { label: 'Reactive Nonmetals', value: 'reactive-nonmetal' },
  { label: 'Noble Gases', value: 'noble-gas' },
  { label: 'Lanthanides', value: 'lanthanide' },
  { label: 'Actinides', value: 'actinide' },
];

export const FlashcardsView: React.FC = () => {
  const { addXp, unlockAchievement } = useAppStore();

  const [categoryFilter, setCategoryFilter] = useState<ElementCategory | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);

  // Filter elements
  const filteredElements = ELEMENTS.filter(
    (el) => categoryFilter === 'all' || el.category === categoryFilter
  );

  const currentElement = filteredElements[currentIndex] || ELEMENTS[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredElements.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredElements.length - 1));
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomIdx = Math.floor(Math.random() * filteredElements.length);
    setCurrentIndex(randomIdx);
  };

  const toggleMastered = (atomicNumber: number) => {
    if (masteredIds.includes(atomicNumber)) {
      setMasteredIds((prev) => prev.filter((id) => id !== atomicNumber));
    } else {
      const updated = [...masteredIds, atomicNumber];
      setMasteredIds(updated);
      addXp(15);
      if (updated.length >= 10) {
        unlockAchievement('flashcard_master');
      }
    }
  };

  const isMastered = masteredIds.includes(currentElement.atomicNumber);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Filter & Progress Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as any);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="bg-slate-950 text-purple-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mastered Counter */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400">
            Card <strong className="text-white">{currentIndex + 1}</strong> of{' '}
            <strong className="text-white">{filteredElements.length}</strong>
          </span>
          <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mastered: {masteredIds.length} / 118</span>
          </div>
        </div>

      </div>

      {/* 3D Flashcard Container */}
      <div className="perspective-1000 flex justify-center py-4">
        <motion.div
          onClick={() => setIsFlipped(!isFlipped)}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
          className="w-full max-w-md h-[380px] relative cursor-pointer select-none"
        >
          {/* FRONT SIDE */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 ${
              isMastered ? 'border-emerald-500/60 shadow-emerald-500/10' : 'border-purple-500/40'
            } p-6 flex flex-col justify-between shadow-2xl transition-all`}
          >
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
              <span className="text-purple-400 font-bold">Z = {currentElement.atomicNumber}</span>
              <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-[10px]">
                <RotateCw className="w-3 h-3 text-cyan-400" /> Click to Flip
              </span>
            </div>

            <div className="text-center my-auto space-y-2">
              <div className="inline-block p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
                <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 via-purple-300 to-indigo-400 font-mono">
                  {currentElement.symbol}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">{currentElement.name}</h3>
              <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
                {currentElement.category}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
              <span>Mass: {currentElement.atomicMass.toFixed(2)} u</span>
              <span>State: {currentElement.state}</span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/40 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto scrollbar-none"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-sm font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" /> {currentElement.name} Details
              </span>
              <span className="text-xs text-cyan-400 font-mono">{currentElement.symbol}</span>
            </div>

            <div className="space-y-3 text-xs text-slate-300 my-auto py-2">
              <p className="leading-relaxed text-slate-300 italic">{currentElement.summary}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Electron Config:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {currentElement.electronConfiguration}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Shells:</span>
                  <span className="font-mono text-purple-300 font-bold">
                    {currentElement.bohrShells.join(', ')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Key Uses:</span>
                <div className="flex flex-wrap gap-1">
                  {currentElement.uses.slice(0, 3).map((use, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-purple-950/60 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
              Click anywhere to flip back
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls Bar: Prev, Next, Shuffle, Mastered Toggle */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={handlePrev}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={handleShuffle}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Shuffle className="w-4 h-4" /> Random Card
        </button>

        <button
          onClick={() => toggleMastered(currentElement.atomicNumber)}
          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
            isMastered
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              : 'bg-slate-900 hover:bg-emerald-950 text-slate-300 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isMastered ? 'Mastered! (+15 XP)' : 'Mark as Mastered'}
        </button>

        <button
          onClick={handleNext}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
