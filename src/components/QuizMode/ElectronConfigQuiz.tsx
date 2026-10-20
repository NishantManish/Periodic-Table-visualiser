import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ELEMENTS } from '../../data/elementsData';
import { ElementData } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Atom, CheckCircle2, XCircle, RefreshCw, Award, Zap, BookOpen } from 'lucide-react';

interface Question {
  element: ElementData;
  questionType: 'config-to-element' | 'element-to-config';
  questionText: string;
  options: string[];
  correctIndex: number;
}

export const ElectronConfigQuiz: React.FC = () => {
  const { addXp, unlockAchievement } = useAppStore();

  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const generateQuestion = () => {
    setSelectedIdx(null);
    const randomEl = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const qType: 'config-to-element' | 'element-to-config' =
      Math.random() > 0.5 ? 'config-to-element' : 'element-to-config';

    const distractors = ELEMENTS.filter((e) => e.atomicNumber !== randomEl.atomicNumber)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    if (qType === 'config-to-element') {
      const options = [randomEl.name, ...distractors.map((d) => d.name)].sort(() => 0.5 - Math.random());
      const correctIndex = options.indexOf(randomEl.name);

      setCurrentQ({
        element: randomEl,
        questionType: 'config-to-element',
        questionText: `Which element has the electron configuration: "${randomEl.electronConfiguration}"?`,
        options,
        correctIndex,
      });
    } else {
      const options = [
        randomEl.electronConfiguration,
        ...distractors.map((d) => d.electronConfiguration),
      ].sort(() => 0.5 - Math.random());
      const correctIndex = options.indexOf(randomEl.electronConfiguration);

      setCurrentQ({
        element: randomEl,
        questionType: 'element-to-config',
        questionText: `What is the correct ground-state electron configuration for ${randomEl.name} (${randomEl.symbol}, Z=${randomEl.atomicNumber})?`,
        options,
        correctIndex,
      });
    }
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null || !currentQ) return;
    setSelectedIdx(idx);
    setTotalAnswered((prev) => prev + 1);

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
      addXp(25);
      unlockAchievement('electron_master');
    }
  };

  if (!currentQ) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full px-2 sm:px-4">
      {/* Header */}
      <div className="bg-black/40 p-5 rounded-3xl border border-white/10 flex items-center justify-between gap-4 shadow-2xl backdrop-blur-3xl saturate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 border border-white/20">
            <Atom className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Electron Configuration Challenge</h3>
            <p className="text-xs text-white/50">Master subshell orbital notation (s, p, d, f)</p>
          </div>
        </div>

        <div className="bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-cyan-300 shadow-inner">
          Score: <strong className="text-white font-bold">{score} / {totalAnswered}</strong>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-black/40 rounded-3xl border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl backdrop-blur-3xl saturate-200">
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30 shadow-inner">
            Quantum & Orbital Structure
          </span>
          <h3 className="text-lg font-extrabold text-white leading-snug">
            {currentQ.questionText}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = 'bg-black/20 hover:bg-white/10 text-white/80 border-white/10 shadow-inner';
            if (selectedIdx !== null) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500';
              } else if (isSelected) {
                btnStyle = 'bg-rose-950/80 text-rose-300 border-rose-500 font-bold ring-1 ring-rose-500';
              } else {
                btnStyle = 'bg-black/10 text-white/30 border-white/5 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedIdx !== null}
                onClick={() => handleSelect(idx)}
                className={`w-full p-4 rounded-2xl border text-xs text-left font-mono transition-all flex items-center justify-between cursor-pointer backdrop-blur-md ${btnStyle}`}
              >
                <span>{opt}</span>
                {selectedIdx !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {selectedIdx !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {selectedIdx !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3 shadow-inner backdrop-blur-md"
          >
            <div className="text-xs text-white/70 leading-relaxed">
              <strong className="text-cyan-400 block mb-1">💡 Subshell Orbital Breakdown:</strong>
              {currentQ.element.name} ({currentQ.element.symbol}, Z={currentQ.element.atomicNumber}) has {currentQ.element.atomicNumber} electrons arranged in Bohr shells: [{currentQ.element.bohrShells.join(', ')}]. Its ground state configuration is <code className="text-cyan-300 font-mono font-bold">{currentQ.element.electronConfiguration}</code>.
            </div>

            <button
              onClick={generateQuestion}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Next Electron Configuration Question
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
