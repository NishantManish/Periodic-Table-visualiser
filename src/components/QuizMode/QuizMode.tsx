import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { FlashcardsView } from './FlashcardsView';
import { GuessElementQuiz } from './GuessElementQuiz';
import { ElectronConfigQuiz } from './ElectronConfigQuiz';
import { ReactionQuiz } from './ReactionQuiz';
import { TimedQuiz } from './TimedQuiz';
import { MultipleChoiceQuiz } from './MultipleChoiceQuiz';
import { GradeLevel } from '../../types';
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
  GraduationCap,
  Volume2,
  VolumeX,
} from 'lucide-react';

const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  'Grade 5': 'Grade 5 (Elem)',
  'Grade 8': 'Grade 8 (Middle)',
  'Grade 10': 'Grade 10 (Secondary)',
  'CBSE/ICSE': 'CBSE / ICSE Board',
  'JEE/NEET': 'JEE / NEET Prep',
  'University': 'University / Research',
};

export const QuizMode: React.FC = () => {
  const {
    xp,
    level,
    streak,
    achievements,
    gradeLevel,
    setGradeLevel,
    soundEnabled,
    toggleSound,
  } = useAppStore();

  // Sub-quiz active tab
  const [activeTab, setActiveTab] = useState<
    'multiple-choice' | 'flashcards' | 'guess-element' | 'electron-config' | 'reaction-predictor' | 'timed-blitz'
  >('multiple-choice');

  // Achievements Modal State
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Level Calculations
  const xpForCurrentLevel = (level - 1) * 200;
  const currentLevelXp = Math.max(0, xp - xpForCurrentLevel);
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
    <div className="space-y-6 max-w-6xl mx-auto w-full px-2 sm:px-4">
      {/* GAMIFICATION HUD HEADER */}
      <div className="bg-black/40 rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl backdrop-blur-3xl saturate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Level & XP Info */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex flex-col items-center justify-center text-white shadow-xl shadow-purple-600/30 font-black shrink-0 border border-white/10">
              <span className="text-[9px] sm:text-[10px] uppercase text-purple-200 leading-none mb-0.5">Lvl</span>
              <span className="text-lg sm:text-xl leading-none">{level}</span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  {getLevelTitle(level)}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 shadow-inner">
                  {xp} XP
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="w-40 sm:w-56 md:w-64 bg-black/30 h-2 sm:h-2.5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                <div
                  style={{ width: `${xpProgressPercent}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500 shadow-sm"
                />
              </div>
              <p className="text-[10px] text-white/50 font-mono">
                {currentLevelXp} / 200 XP to Lvl {level + 1}
              </p>
            </div>
          </div>

          {/* Controls: Streak, Sound, Curriculum, & Achievements */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Curriculum selector */}
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-2xl border border-white/10 text-xs shadow-inner backdrop-blur-md">
              <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="bg-transparent text-cyan-300 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {Object.entries(GRADE_LEVEL_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="bg-slate-900 text-white">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Streak Counter */}
            <div className="bg-black/20 px-3.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2 shadow-inner">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse shrink-0" />
              <div>
                <span className="text-[9px] uppercase font-bold text-white/40 block leading-tight">Streak</span>
                <span className="text-xs font-black text-white">{streak} Days 🔥</span>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-2xl border transition-all cursor-pointer shadow-inner ${
                soundEnabled
                  ? 'bg-purple-600/20 hover:bg-purple-600/30 text-cyan-300 border-purple-500/30'
                  : 'bg-black/20 text-white/40 border-white/10'
              }`}
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Achievements Modal Trigger */}
            <button
              onClick={() => setShowAchievementsModal(true)}
              className="bg-black/20 hover:bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-amber-400 font-extrabold text-xs flex items-center gap-1.5 shadow-inner transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Badges</span> ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
            </button>
          </div>
        </div>
      </div>

      {/* SUB-QUIZ TABS NAVIGATION TOOLBAR */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none bg-black/20 p-1.5 sm:p-2 rounded-2xl border border-white/10 shadow-inner backdrop-blur-md">
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
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-white/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
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

      {/* ACHIEVEMENTS DRAWER / MODAL */}
      <AnimatePresence>
        {showAchievementsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-black/60 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 backdrop-blur-3xl saturate-200"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Chemistry Badges & Achievements
                </h3>
                <button
                  onClick={() => setShowAchievementsModal(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer transition-all border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-none pr-1">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                      ach.unlocked
                        ? 'bg-black/40 border-purple-500/40 shadow-inner'
                        : 'bg-black/20 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="text-3xl p-2 rounded-2xl bg-black/30 border border-white/10 shrink-0 shadow-inner">
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{ach.title}</span>
                        {ach.unlocked && (
                          <span className="text-[10px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" /> Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowAchievementsModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 cursor-pointer hover:opacity-90 transition-all border border-white/10"
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
