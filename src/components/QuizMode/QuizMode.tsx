import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { FlashcardsView } from './FlashcardsView';
import { GuessElementQuiz } from './GuessElementQuiz';
import { ElectronConfigQuiz } from './ElectronConfigQuiz';
import { ReactionQuiz } from './ReactionQuiz';
import { TimedQuiz } from './TimedQuiz';
import { MultipleChoiceQuiz } from './MultipleChoiceQuiz';
import {
  Award,
  Flame,
  Zap,
  BookOpen,
  Atom,
  FlaskConical,
  HelpCircle,
  Sparkles,
  Trophy,
  CheckCircle2,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

export const QuizMode: React.FC = () => {
  const { xp, level, streak, achievements, gradeLevel, setGradeLevel } = useAppStore();

  // Sub-quiz active tab
  const [activeTab, setActiveTab] = useState<
    'flashcards' | 'multiple-choice' | 'guess-element' | 'electron-config' | 'reaction-predictor' | 'timed-blitz'
  >('multiple-choice');

  // Achievements Modal State
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Level Calculations
  const xpForCurrentLevel = (level - 1) * 200;
  const xpForNextLevel = level * 200;
  const currentLevelXp = xp - xpForCurrentLevel;
  const xpProgressPercent = Math.min(100, Math.max(0, (currentLevelXp / 200) * 100));

  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return 'Chemistry Novice';
    if (lvl === 2) return 'Lab Apprentice';
    if (lvl === 3) return 'Element Scholar';
    if (lvl === 4) return 'Quantum Chemist';
    if (lvl === 5) return 'Master Synthesizer';
    return 'Nobel Laureate';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* GAMIFICATION HUD HEADER */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Level & XP Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex flex-col items-center justify-center text-white shadow-xl shadow-purple-600/30 font-black">
              <span className="text-[10px] uppercase text-purple-200">Level</span>
              <span className="text-xl leading-none">{level}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  {getLevelTitle(level)}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  {xp} Total XP
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="w-48 sm:w-64 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${xpProgressPercent}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {currentLevelXp} / 200 XP to Level {level + 1}
              </p>
            </div>
          </div>

          {/* Streak & Achievements Drawer Button */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Streak</span>
                <span className="text-xs font-black text-white">{streak} Days 🔥</span>
              </div>
            </div>

            <button
              onClick={() => setShowAchievementsModal(true)}
              className="bg-slate-950 hover:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-800 text-amber-400 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              Achievements ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
            </button>
          </div>

        </div>
      </div>

      {/* TABS NAVIGATION TOOLBAR */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        {[
          { id: 'multiple-choice', label: 'AI Multiple Choice', icon: Sparkles },
          { id: 'flashcards', label: '3D Flashcards', icon: BookOpen },
          { id: 'guess-element', label: 'Guess Element', icon: HelpCircle },
          { id: 'electron-config', label: 'Electron Config', icon: Atom },
          { id: 'reaction-predictor', label: 'Reaction Simulator', icon: FlaskConical },
          { id: 'timed-blitz', label: 'Timed Blitz ⚡', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ACTIVE SUB-QUIZ VIEW */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'multiple-choice' && <MultipleChoiceQuiz />}
          {activeTab === 'flashcards' && <FlashcardsView />}
          {activeTab === 'guess-element' && <GuessElementQuiz />}
          {activeTab === 'electron-config' && <ElectronConfigQuiz />}
          {activeTab === 'reaction-predictor' && <ReactionQuiz />}
          {activeTab === 'timed-blitz' && <TimedQuiz />}
        </motion.div>
      </AnimatePresence>

      {/* ACHIEVEMENTS MODAL */}
      <AnimatePresence>
        {showAchievementsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Chemistry Badges & Achievements
                </h3>
                <button
                  onClick={() => setShowAchievementsModal(false)}
                  className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-none pr-1">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl border flex items-center gap-4 ${
                      ach.unlocked
                        ? 'bg-slate-950 border-purple-500/40'
                        : 'bg-slate-950/40 border-slate-800 opacity-50'
                    }`}
                  >
                    <div className="text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{ach.title}</span>
                        {ach.unlocked && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowAchievementsModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-lg cursor-pointer"
                >
                  Close Badges Drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
