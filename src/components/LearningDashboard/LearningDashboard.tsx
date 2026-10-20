import React, { useState } from 'react';
import { GraduationCap, Award, BookOpen, Bookmark, CheckCircle, Flame, Sparkles, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ELEMENTS } from '../../data/elementsData';

export const LearningDashboard: React.FC = () => {
  const {
    gradeLevel,
    setGradeLevel,
    xp,
    level,
    streak,
    bookmarks,
    notes,
    achievements,
    setSelectedElement,
    setViewMode,
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'syllabus' | 'bookmarks' | 'notes' | 'achievements'>('syllabus');

  const bookmarkedElements = ELEMENTS.filter((el) => bookmarks.includes(el.atomicNumber));

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats Overview */}
      <div className="bg-black/40 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-6 backdrop-blur-3xl saturate-200">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white">Student Study Portal</h2>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              {gradeLevel}
            </span>
          </div>
          <p className="text-xs text-white/50">Track learning progress, bookmarks, personal study notes & achievements.</p>
        </div>

        {/* Level & Streak Stats Grid */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/10 shadow-inner">
            <Flame className="w-6 h-6 text-amber-400 fill-amber-400" />
            <div>
              <span className="text-xs text-white/50 block font-semibold">Streak</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{streak} Days</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/10 shadow-inner">
            <Trophy className="w-6 h-6 text-cyan-400" />
            <div>
              <span className="text-xs text-white/50 block font-semibold">Level {level}</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{xp} XP</span>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md shadow-inner">
        {[
          { id: 'syllabus', label: 'Curriculum & Syllabi', icon: <GraduationCap className="w-4 h-4" /> },
          { id: 'bookmarks', label: `Saved Bookmarks (${bookmarks.length})`, icon: <Bookmark className="w-4 h-4" /> },
          { id: 'notes', label: `Study Notes (${Object.keys(notes).length})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: CURRICULUM SYLLABUS */}
      {activeSubTab === 'syllabus' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4 backdrop-blur-3xl saturate-200">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> {gradeLevel} Chemistry Key Modules
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 space-y-1 shadow-inner">
                <span className="font-bold text-slate-100 block">1. Periodic Trends & Atomic Structure</span>
                <p className="text-white/50">Master atomic radii, ionization energy, electronegativity, and Bohr model orbital electron configurations.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 space-y-1 shadow-inner">
                <span className="font-bold text-slate-100 block">2. Chemical Bonding & Molecular Geometry</span>
                <p className="text-white/50">Understand ionic vs covalent bonds, VSEPR shapes, Lewis dot structures, and hybridization states.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 space-y-1 shadow-inner">
                <span className="font-bold text-slate-100 block">3. Stoichiometry & Chemical Reactions</span>
                <p className="text-white/50">Balance chemical equations, calculate molar masses, energy changes, and reaction catalysts.</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-black/40 border border-white/10 space-y-4 backdrop-blur-3xl saturate-200 shadow-xl">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Guided Practice Recommendation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on your study profile, we recommend practicing with 3D molecule building and taking a 5-question AI quiz on transition metals.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode('quiz')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md border border-white/10"
              >
                Start Practice Quiz
              </button>
              <button
                onClick={() => setViewMode('molecule-builder')}
                className="px-4 py-2.5 rounded-xl bg-black/20 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs shadow-inner"
              >
                Open 3D Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BOOKMARKS */}
      {activeSubTab === 'bookmarks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bookmarkedElements.length === 0 ? (
            <p className="text-xs text-white/50 col-span-full text-center py-12">
              No elements bookmarked yet! Click the bookmark icon on any element modal to save it here.
            </p>
          ) : (
            bookmarkedElements.map((el) => (
              <div
                key={el.atomicNumber}
                onClick={() => {
                  setSelectedElement(el);
                  setViewMode('table');
                }}
                className="p-4 rounded-3xl bg-black/40 border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all space-y-2 backdrop-blur-3xl saturate-200 shadow-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white/50">Z = {el.atomicNumber}</span>
                  <span className="text-xl font-extrabold text-cyan-400 drop-shadow-sm">{el.symbol}</span>
                </div>
                <h4 className="text-sm font-bold text-white drop-shadow-sm">{el.name}</h4>
                <p className="text-[11px] text-white/50 truncate">{el.category}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 3: NOTES */}
      {activeSubTab === 'notes' && (
        <div className="space-y-4">
          {Object.keys(notes).length === 0 ? (
            <p className="text-xs text-white/50 text-center py-12">
              No study notes written yet! Inspect an element and write custom notes in the "Study Notes" tab.
            </p>
          ) : (
            Object.entries(notes).map(([zStr, text]) => {
              const z = parseInt(zStr);
              const el = ELEMENTS.find((e) => e.atomicNumber === z);
              return (
                <div key={z} className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-2 backdrop-blur-3xl saturate-200 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 drop-shadow-sm">
                    <span>{el?.name || `Element Z=${z}`} ({el?.symbol})</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{text}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB 4: ACHIEVEMENTS */}
      {activeSubTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-3xl border transition-all flex items-start gap-3 backdrop-blur-3xl saturate-200 shadow-lg ${
                a.unlocked ? 'bg-black/40 border-cyan-500/50' : 'bg-black/20 border-white/5 opacity-50'
              }`}
            >
              <span className="text-3xl drop-shadow-md">{a.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-white drop-shadow-sm">{a.title}</h4>
                <p className="text-[11px] text-white/50 mt-0.5">{a.description}</p>
                {a.unlocked && <span className="text-[10px] text-emerald-400 font-bold block mt-1 drop-shadow-sm">Unlocked {a.unlockedAt}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
