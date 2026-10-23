import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ELEMENTS } from '../../data/elementsData';
import { ElementData, ElementCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { playSound, speakText } from '../../utils/audio';
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
  Volume2,
  Bookmark,
  Layers,
  Atom,
  Flame,
  Award,
  ExternalLink,
  Keyboard,
} from 'lucide-react';

const CATEGORIES: { label: string; value: ElementCategory | 'all' }[] = [
  { label: 'All Categories', value: 'all' },
  { label: 'Alkali Metals', value: 'alkali-metal' },
  { label: 'Alkaline Earth', value: 'alkaline-earth' },
  { label: 'Transition Metals', value: 'transition-metal' },
  { label: 'Metalloids', value: 'metalloid' },
  { label: 'Reactive Nonmetals', value: 'reactive-nonmetal' },
  { label: 'Noble Gases', value: 'noble-gas' },
  { label: 'Lanthanides', value: 'lanthanide' },
  { label: 'Actinides', value: 'actinide' },
];

type DeckType = 'all' | 'learning' | 'mastered' | 'starred';

export const FlashcardsView: React.FC = () => {
  const {
    bookmarks,
    toggleBookmark,
    masteredFlashcards: masteredIds,
    reviewFlashcards: reviewIds,
    markFlashcardMastered,
    markFlashcardReview,
    setSelectedElement,
    soundEnabled,
  } = useAppStore();

  const [activeDeck, setActiveDeck] = useState<DeckType>('all');
  const [categoryFilter, setCategoryFilter] = useState<ElementCategory | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Filter elements based on active deck and category
  const filteredElements = ELEMENTS.filter((el) => {
    // Category filter
    if (categoryFilter !== 'all' && el.category !== categoryFilter) {
      return false;
    }
    // Deck filter
    if (activeDeck === 'mastered') {
      return masteredIds.includes(el.atomicNumber);
    }
    if (activeDeck === 'learning') {
      return reviewIds.includes(el.atomicNumber) || !masteredIds.includes(el.atomicNumber);
    }
    if (activeDeck === 'starred') {
      return bookmarks.includes(el.atomicNumber);
    }
    return true;
  });

  const currentElement: ElementData | undefined =
    filteredElements[currentIndex] || filteredElements[0] || ELEMENTS[0];

  const handleNext = useCallback(() => {
    if (filteredElements.length === 0) return;
    playSound('flip', soundEnabled);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredElements.length);
  }, [filteredElements.length, soundEnabled]);

  const handlePrev = useCallback(() => {
    if (filteredElements.length === 0) return;
    playSound('flip', soundEnabled);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredElements.length - 1));
  }, [filteredElements.length, soundEnabled]);

  const handleShuffle = useCallback(() => {
    if (filteredElements.length <= 1) return;
    playSound('flip', soundEnabled);
    setIsFlipped(false);
    const randomIdx = Math.floor(Math.random() * filteredElements.length);
    setCurrentIndex(randomIdx);
  }, [filteredElements.length, soundEnabled]);

  const handleFlip = useCallback(() => {
    playSound('flip', soundEnabled);
    setIsFlipped((prev) => !prev);
  }, [soundEnabled]);

  const markMastered = useCallback(() => {
    if (!currentElement) return;
    playSound('correct', soundEnabled);
    markFlashcardMastered(currentElement.atomicNumber);
    handleNext();
  }, [currentElement, markFlashcardMastered, handleNext, soundEnabled]);

  const markNeedsPractice = useCallback(() => {
    if (!currentElement) return;
    playSound('toggle', soundEnabled);
    markFlashcardReview(currentElement.atomicNumber);
    handleNext();
  }, [currentElement, markFlashcardReview, handleNext, soundEnabled]);

  const handlePronounce = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentElement) return;
      speakText(`${currentElement.name}. Atomic number ${currentElement.atomicNumber}.`, soundEnabled);
    },
    [currentElement, soundEnabled]
  );

  const handleInspectElement = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentElement) return;
      setSelectedElement(currentElement);
    },
    [currentElement, setSelectedElement]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is in an input/textarea/select
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        markNeedsPractice();
      } else if (e.key === '2') {
        e.preventDefault();
        markMastered();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleShuffle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, markNeedsPractice, markMastered, handleShuffle]);

  const isMastered = currentElement ? masteredIds.includes(currentElement.atomicNumber) : false;
  const isBookmarked = currentElement ? bookmarks.includes(currentElement.atomicNumber) : false;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full px-2 sm:px-4">
      {/* DECK TABS & CONTROLS TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-3 sm:p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-3xl saturate-200">
        {/* Leitner Spaced-Repetition Deck Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => {
              setActiveDeck('all');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDeck === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-white/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            All Decks ({ELEMENTS.length})
          </button>
          <button
            onClick={() => {
              setActiveDeck('learning');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDeck === 'learning'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 border border-amber-400/40'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Needs Practice ({reviewIds.length > 0 ? reviewIds.length : ELEMENTS.length - masteredIds.length})
          </button>
          <button
            onClick={() => {
              setActiveDeck('mastered');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDeck === 'mastered'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-white/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Mastered ({masteredIds.length})
          </button>
          <button
            onClick={() => {
              setActiveDeck('starred');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeDeck === 'starred'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border border-white/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Starred ({bookmarks.length})
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as any);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="bg-black/20 text-purple-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer shadow-inner backdrop-blur-md"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CARD PROGRESS INDICATOR */}
      <div className="flex items-center justify-between px-2 text-xs text-white/50">
        <span className="font-mono">
          Card <strong className="text-white">{filteredElements.length > 0 ? currentIndex + 1 : 0}</strong> of{' '}
          <strong className="text-white">{filteredElements.length}</strong>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> {masteredIds.length} Mastered
          </span>
          <span className="text-white/40 font-mono">
            {Math.round((masteredIds.length / 118) * 100)}% Complete
          </span>
        </div>
      </div>

      {/* 3D PERSPECTIVE FLASHCARD CONTAINER */}
      <div className="flex justify-center py-2" style={{ perspective: '1200px' }}>
        {filteredElements.length === 0 ? (
          <div className="w-full max-w-lg min-h-[360px] rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-2xl backdrop-blur-3xl saturate-200">
            <div className="w-14 h-14 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-white/50 shadow-inner">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-white">No Elements in This Deck</h3>
            <p className="text-xs text-white/50 max-w-xs">
              {activeDeck === 'mastered'
                ? 'You haven’t mastered any elements yet. Practice cards and click "Mark Mastered" to add them here!'
                : activeDeck === 'starred'
                ? 'You have not starred any elements. Star elements on the periodic table to build a custom review deck.'
                : 'No elements match the current category filter.'}
            </p>
            <button
              onClick={() => {
                setActiveDeck('all');
                setCategoryFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/30 border border-white/20"
            >
              Reset Filters to All Cards
            </button>
          </div>
        ) : (
          <motion.div
            onClick={handleFlip}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full max-w-lg min-h-[420px] sm:min-h-[460px] relative cursor-pointer select-none"
          >
            {/* FRONT FACE OF CARD */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className={`absolute inset-0 rounded-3xl bg-black/60 backdrop-blur-3xl saturate-200 border-2 ${
                isMastered ? 'border-emerald-500/60 shadow-emerald-500/20' : 'border-purple-500/40 shadow-purple-500/20'
              } p-6 sm:p-7 flex flex-col justify-between shadow-2xl transition-all`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-lg text-xs shadow-inner">
                    Z = {currentElement.atomicNumber}
                  </span>
                  <span className="text-[11px] font-mono text-white/50">
                    Period {currentElement.period} · Group {currentElement.group}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePronounce}
                    title="Audio Pronunciation"
                    className="p-1.5 rounded-xl bg-black/30 hover:bg-white/10 text-cyan-400 border border-white/10 transition-all cursor-pointer shadow-inner"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(currentElement.atomicNumber);
                    }}
                    title={isBookmarked ? 'Remove Star' : 'Star Element'}
                    className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-inner ${
                      isBookmarked
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-black/30 text-white/40 border-white/10 hover:text-amber-400'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Center Content: Atomic Symbol, Name & Category */}
              <div className="text-center my-auto space-y-3">
                <div className="inline-block p-4 sm:p-5 rounded-3xl bg-black/40 border border-white/10 shadow-2xl relative group backdrop-blur-md">
                  <span className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 via-purple-300 to-indigo-300 drop-shadow-sm">
                    {currentElement.symbol}
                  </span>
                  {isMastered && (
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-full shadow-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentElement.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-semibold uppercase tracking-wider border border-purple-500/30 shadow-inner">
                      {currentElement.category.replace('-', ' ')}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/30 text-white/70 font-medium border border-white/10 shadow-inner">
                      {currentElement.state}
                    </span>
                  </div>
                </div>

                {/* Evocative Clue / Hook */}
                <p className="text-xs text-white/60 max-w-sm mx-auto line-clamp-2 italic px-2">
                  "{currentElement.summary}"
                </p>
              </div>

              {/* Footer Specs & Flip Cue */}
              <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
                <span className="font-mono text-[11px]">
                  Mass: <strong className="text-white/90">{currentElement.atomicMass.toFixed(2)} u</strong>
                </span>

                <span className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold">
                  <RotateCw className="w-3.5 h-3.5 animate-spin-slow" /> Tap to Flip
                </span>
              </div>
            </div>

            {/* BACK FACE OF CARD */}
            <div
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              className="absolute inset-0 rounded-3xl bg-black/70 backdrop-blur-3xl saturate-200 border-2 border-cyan-500/50 p-6 sm:p-7 flex flex-col justify-between shadow-2xl overflow-y-auto scrollbar-none"
            >
              {/* Back Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white">{currentElement.name}</span>
                  <span className="font-mono text-cyan-400 font-extrabold text-sm">
                    ({currentElement.symbol})
                  </span>
                </div>

                <button
                  onClick={handleInspectElement}
                  className="px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 flex items-center gap-1 transition-all cursor-pointer shadow-inner"
                  title="Open Full Element Explorer"
                >
                  <Atom className="w-3 h-3" /> Full View <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Back Content: Electronic & Chemical Specifications */}
              <div className="space-y-3 text-xs my-auto py-2">
                {/* Electron Config & Shells */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-black/30 p-3 rounded-2xl border border-white/10 shadow-inner">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">
                      Electron Configuration
                    </span>
                    <span className="font-mono text-cyan-300 font-bold break-all">
                      {currentElement.electronConfiguration}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">
                      Bohr Shells
                    </span>
                    <span className="font-mono text-purple-300 font-bold">
                      {currentElement.bohrShells.join(' · ')}
                    </span>
                  </div>
                </div>

                {/* Key Properties Matrix */}
                <div className="grid grid-cols-3 gap-2 text-[11px] text-center bg-black/20 p-2.5 rounded-2xl border border-white/10 font-mono shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 uppercase block font-sans">Electronegativity</span>
                    <span className="text-white font-bold">{currentElement.electronegativity ?? 'N/A'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 uppercase block font-sans">Ionization</span>
                    <span className="text-cyan-300 font-bold">
                      {currentElement.ionizationEnergy ? `${currentElement.ionizationEnergy} kJ` : 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 uppercase block font-sans">Density</span>
                    <span className="text-purple-300 font-bold">
                      {currentElement.density ? `${currentElement.density} g/cm³` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Practical Uses */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
                    Real-World Applications:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentElement.uses.slice(0, 3).map((use, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-purple-950/60 text-purple-200 px-2.5 py-0.5 rounded-lg border border-purple-500/20 font-medium shadow-inner"
                      >
                        {use}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Discovery Trivia */}
                <div className="text-[11px] text-white/50 bg-black/20 p-2 rounded-xl border border-white/10 shadow-inner">
                  <strong className="text-white/80">Discovered: </strong>
                  {currentElement.discoverer} ({currentElement.discoveryYear})
                </div>
              </div>

              {/* Back Footer */}
              <div className="text-center text-[10px] text-white/40 pt-2 border-t border-white/10">
                Click anywhere or press Space to flip back
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* PRIMARY RESPONSIVE ACTION CONTROLS */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
        <button
          onClick={handlePrev}
          disabled={filteredElements.length === 0}
          className="px-4 py-2.5 rounded-2xl bg-black/30 hover:bg-white/10 disabled:opacity-40 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-inner"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <button
          onClick={handleShuffle}
          disabled={filteredElements.length <= 1}
          className="px-3.5 py-2.5 rounded-2xl bg-black/30 hover:bg-white/10 disabled:opacity-40 text-purple-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-inner"
          title="Shuffle Deck (S)"
        >
          <Shuffle className="w-4 h-4" /> Shuffle
        </button>

        <button
          onClick={markNeedsPractice}
          disabled={filteredElements.length === 0}
          className="px-4 py-2.5 rounded-2xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-inner"
          title="Needs Review (Press 1)"
        >
          <XCircle className="w-4 h-4 text-amber-400" /> Review
        </button>

        <button
          onClick={markMastered}
          disabled={filteredElements.length === 0}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg ${
            isMastered
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 border border-white/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 border border-white/20'
          }`}
          title="Mastered (+15 XP) (Press 2)"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isMastered ? 'Mastered!' : 'Master (+15 XP)'}
        </button>

        <button
          onClick={handleNext}
          disabled={filteredElements.length === 0}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-black shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-white/20"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* KEYBOARD SHORTCUTS REFERENCE BAR */}
      <div className="hidden sm:flex items-center justify-center gap-4 text-[11px] text-white/40 font-mono pt-2">
        <span className="flex items-center gap-1">
          <Keyboard className="w-3.5 h-3.5 text-white/50" /> Shortcuts:
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/70 shadow-inner">Space</kbd> Flip
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/70 shadow-inner">←/→</kbd> Navigate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/70 shadow-inner">1</kbd> Review
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/70 shadow-inner">2</kbd> Master
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/70 shadow-inner">S</kbd> Shuffle
        </span>
      </div>
    </div>
  );
};
