import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ELEMENTS } from '../../data/elementsData';
import { ElementData } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Zap, Timer, Flame, Award, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

export const TimedQuiz: React.FC = () => {
  const { addXp, unlockAchievement } = useAppStore();

  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [totalAttempted, setTotalAttempted] = useState<number>(0);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  // Generate a rapid-fire question
  const generateQuestion = (): Question => {
    const randomEl = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const qType = Math.floor(Math.random() * 3);

    const distractors = ELEMENTS.filter((e) => e.atomicNumber !== randomEl.atomicNumber)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    if (qType === 0) {
      // Symbol question
      const options = [randomEl.symbol, ...distractors.map((d) => d.symbol)].sort(() => 0.5 - Math.random());
      return {
        text: `What is the chemical symbol for ${randomEl.name}?`,
        options,
        correctIndex: options.indexOf(randomEl.symbol),
      };
    } else if (qType === 1) {
      // Atomic Number question
      const options = [
        `Z = ${randomEl.atomicNumber}`,
        ...distractors.map((d) => `Z = ${d.atomicNumber}`),
      ].sort(() => 0.5 - Math.random());
      return {
        text: `What is the atomic number of ${randomEl.name}?`,
        options,
        correctIndex: options.indexOf(`Z = ${randomEl.atomicNumber}`),
      };
    } else {
      // Category question
      const options = [randomEl.name, ...distractors.map((d) => d.name)].sort(() => 0.5 - Math.random());
      return {
        text: `Which of these elements is a ${randomEl.category}?`,
        options,
        correctIndex: options.indexOf(randomEl.name),
      };
    }
  };

  const handleStart = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTotalAttempted(0);
    setEarnedXp(0);
    setTimeRemaining(60);
    setIsFinished(false);
    setIsActive(true);
    setCurrentQ(generateQuestion());
  };

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeRemaining === 0) {
      setIsActive(false);
      setIsFinished(true);
      if (score >= 5) {
        unlockAchievement('speed_demon');
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining, score]);

  const handleSelect = (idx: number) => {
    if (!currentQ || !isActive) return;

    setTotalAttempted((prev) => prev + 1);

    if (idx === currentQ.correctIndex) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      const points = 10 + newCombo * 5;
      setScore((prev) => prev + 1);
      setEarnedXp((prev) => prev + points);
      addXp(points);
    } else {
      setCombo(0);
    }

    setCurrentQ(generateQuestion());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full px-2 sm:px-4">
      {/* Top Banner */}
      <div className="bg-black/40 p-5 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-2xl backdrop-blur-3xl saturate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-yellow-500/30 border border-white/20">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Rapid-Fire Blitz Quiz</h3>
            <p className="text-xs text-white/50">Answer as many chemistry questions as possible in 60s</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 text-yellow-300 font-bold flex items-center gap-1.5 shadow-inner">
            <Timer className="w-4 h-4 text-amber-400" /> {timeRemaining}s
          </div>
          <div className="bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 text-orange-400 font-bold flex items-center gap-1 shadow-inner">
            <Flame className="w-4 h-4" /> Combo: {combo}x
          </div>
        </div>
      </div>

      {/* Main Blitz Box */}
      <div className="bg-black/40 rounded-3xl border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl backdrop-blur-3xl saturate-200 relative overflow-hidden">
        {/* Timer Progress Line */}
        {isActive && (
          <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(timeRemaining / 60) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
            />
          </div>
        )}

        {!isActive && !isFinished ? (
          <div className="text-center py-10 space-y-4">
            <Zap className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-black text-white">Are you ready for the Blitz?</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
              60 Seconds on the clock. Build up combo streaks to multiply your XP gains!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-yellow-500/30 transition-all cursor-pointer inline-flex items-center gap-2 border border-white/20 active:scale-95"
            >
              <Zap className="w-4 h-4" /> Start 60s Blitz Mode
            </button>
          </div>
        ) : isFinished ? (
          <div className="text-center py-8 space-y-5">
            <Award className="w-16 h-16 text-amber-400 mx-auto" />
            <h3 className="text-2xl font-black text-white">Time's Up!</h3>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs">
              <div className="bg-black/30 p-3 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-white/40 block">Score</span>
                <span className="text-lg font-black text-white">{score} / {totalAttempted}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-white/40 block">Max Combo</span>
                <span className="text-lg font-black text-orange-400">🔥 {maxCombo}x</span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-white/40 block">XP Earned</span>
                <span className="text-lg font-black text-amber-400">+{earnedXp} XP</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs shadow-lg cursor-pointer inline-flex items-center gap-2 border border-white/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Play Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-white text-center">
              {currentQ?.text}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {currentQ?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className="p-4 rounded-2xl bg-black/20 hover:bg-white/10 text-white font-mono font-bold text-xs border border-white/10 transition-all cursor-pointer text-center shadow-inner backdrop-blur-md active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
