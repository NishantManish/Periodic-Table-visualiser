import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ELEMENTS } from '../../data/elementsData';
import { ElementData } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { playSound } from '../../utils/audio';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Award,
  Lightbulb,
  Zap,
  Atom,
  ExternalLink,
} from 'lucide-react';

export const GuessElementQuiz: React.FC = () => {
  const { addXp, unlockAchievement, soundEnabled, setSelectedElement: setGlobalSelectedElement } =
    useAppStore();

  const [mysteryElement, setMysteryElement] = useState<ElementData>(ELEMENTS[0]);
  const [options, setOptions] = useState<ElementData[]>([]);
  const [cluesRevealed, setCluesRevealed] = useState<number>(1);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);

  // Initialize a new game
  const startNewGame = () => {
    playSound('flip', soundEnabled);
    const randomEl = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const distractors = ELEMENTS.filter((e) => e.atomicNumber !== randomEl.atomicNumber)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allOpts = [randomEl, ...distractors].sort(() => 0.5 - Math.random());

    setMysteryElement(randomEl);
    setOptions(allOpts);
    setCluesRevealed(1);
    setSelectedElement(null);
    setIsCorrect(null);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const handleGuess = (el: ElementData) => {
    if (selectedElement !== null) return;
    setSelectedElement(el);

    if (el.atomicNumber === mysteryElement.atomicNumber) {
      playSound('correct', soundEnabled);
      setIsCorrect(true);
      // Award XP based on clues used
      const xpEarned = Math.max(25, 125 - cluesRevealed * 25);
      addXp(xpEarned);
      setScore((prev) => prev + xpEarned);
      setStreakCount((prev) => prev + 1);

      if (cluesRevealed === 1) {
        unlockAchievement('element_detective');
      }
    } else {
      playSound('wrong', soundEnabled);
      setIsCorrect(false);
      setStreakCount(0);
    }
  };

  const handleRevealClue = () => {
    if (cluesRevealed < 4) {
      playSound('open', soundEnabled);
      setCluesRevealed((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full px-2 sm:px-4">
      {/* Game Header */}
      <div className="bg-black/40 p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-3xl saturate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0 border border-white/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Guess the Mystery Element</h3>
            <p className="text-xs text-white/50">
              Deduce the secret element using the fewest clues possible
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-auto">
          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-white/70 shadow-inner">
            Points: <strong className="text-amber-400 font-bold">{score} XP</strong>
          </div>
          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-white/70 flex items-center gap-1 shadow-inner">
            Streak: <strong className="text-orange-400 font-bold">🔥 {streakCount}</strong>
          </div>
        </div>
      </div>

      {/* Mystery Element Card & Progressive Clues */}
      <div className="bg-black/40 rounded-3xl border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl backdrop-blur-3xl saturate-200">
        {/* Mystery Tile Placeholder */}
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-3xl bg-black/50 backdrop-blur-xl border-2 border-amber-500/40 p-4 flex flex-col items-center justify-center shadow-2xl relative shadow-amber-500/10">
            {selectedElement !== null ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <span className="text-4xl font-black text-amber-400 font-mono">
                  {mysteryElement.symbol}
                </span>
                <p className="text-xs font-bold text-white mt-1">{mysteryElement.name}</p>
                <p className="text-[10px] text-white/50 font-mono">Z = {mysteryElement.atomicNumber}</p>
              </motion.div>
            ) : (
              <div className="text-center space-y-1">
                <span className="text-4xl font-extrabold text-amber-500/60 animate-pulse font-mono">
                  ?
                </span>
                <p className="text-[10px] text-white/40 font-mono">Mystery #??</p>
              </div>
            )}
          </div>
        </div>

        {/* Clues Box */}
        <div className="space-y-3 bg-black/30 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-inner backdrop-blur-md">
          <div className="flex justify-between items-center text-xs font-bold border-b border-white/10 pb-2">
            <span className="text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" /> Progressive Hints ({cluesRevealed}/4)
            </span>
            <span className="text-white/50 text-[11px]">
              Potential reward: <strong className="text-emerald-400">{125 - cluesRevealed * 25} XP</strong>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Clue 1 */}
            <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-white/80 shadow-inner">
              <strong className="text-amber-400">Clue 1 (Position):</strong> Period {mysteryElement.period}, Group {mysteryElement.group}, Block {mysteryElement.block.toUpperCase()}, State at STP: {mysteryElement.state}.
            </div>

            {/* Clue 2 */}
            {cluesRevealed >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-black/20 border border-white/10 text-white/80 shadow-inner"
              >
                <strong className="text-amber-400">Clue 2 (Category & Mass):</strong> Family: {mysteryElement.category.replace('-', ' ')} | Electronegativity: {mysteryElement.electronegativity ?? 'N/A'} | Atomic Mass: ~{Math.round(mysteryElement.atomicMass)} u.
              </motion.div>
            )}

            {/* Clue 3 */}
            {cluesRevealed >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-black/20 border border-white/10 text-white/80 shadow-inner"
              >
                <strong className="text-amber-400">Clue 3 (Electron Configuration):</strong> Electron configuration is <code className="text-cyan-300 font-mono">{mysteryElement.electronConfiguration}</code>.
              </motion.div>
            )}

            {/* Clue 4 */}
            {cluesRevealed >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-black/20 border border-white/10 text-white/80 shadow-inner"
              >
                <strong className="text-amber-400">Clue 4 (Uses & Facts):</strong> {mysteryElement.uses[0] || mysteryElement.interestingFacts[0]}.
              </motion.div>
            )}
          </div>

          {cluesRevealed < 4 && selectedElement === null && (
            <button
              onClick={handleRevealClue}
              className="mt-2 w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-inner"
            >
              <Eye className="w-3.5 h-3.5" /> Reveal Next Hint (-25 XP potential)
            </button>
          )}
        </div>

        {/* Options Deck (Responsive grid) */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-white/50 block">Select the correct element:</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt) => {
              const isSelected = selectedElement?.atomicNumber === opt.atomicNumber;
              const isCorrectOption = opt.atomicNumber === mysteryElement.atomicNumber;

              let btnStyle = 'bg-black/20 hover:bg-white/10 text-white/80 border-white/10 shadow-inner';
              if (selectedElement !== null) {
                if (isCorrectOption) {
                  btnStyle =
                    'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/80 text-rose-300 border-rose-500 font-bold ring-1 ring-rose-500';
                } else {
                  btnStyle = 'bg-black/10 text-white/30 border-white/5 opacity-50';
                }
              }

              return (
                <button
                  key={opt.atomicNumber}
                  disabled={selectedElement !== null}
                  onClick={() => handleGuess(opt)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 backdrop-blur-md ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black/30 font-mono font-bold text-xs flex items-center justify-center text-amber-400 shrink-0 border border-white/10 shadow-inner">
                      {opt.symbol}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">{opt.name}</div>
                      <div className="text-[10px] text-white/40 font-mono">Z = {opt.atomicNumber}</div>
                    </div>
                  </div>

                  {selectedElement !== null && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {selectedElement !== null && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback & Action Controls */}
        {selectedElement !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3 text-center shadow-inner backdrop-blur-md"
          >
            {isCorrect ? (
              <div className="text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Correct! You deduced {mysteryElement.name} ({mysteryElement.symbol})!
              </div>
            ) : (
              <div className="text-rose-400 font-extrabold text-sm flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" /> Incorrect! It was {mysteryElement.name} ({mysteryElement.symbol}).
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setGlobalSelectedElement(mysteryElement)}
                className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-white/10 text-cyan-300 font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer shadow-inner"
              >
                <Atom className="w-4 h-4" /> Inspect {mysteryElement.name} in 3D <ExternalLink className="w-3 h-3" />
              </button>

              <button
                onClick={startNewGame}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 border border-white/20"
              >
                <RefreshCw className="w-4 h-4" /> Next Mystery Element
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
