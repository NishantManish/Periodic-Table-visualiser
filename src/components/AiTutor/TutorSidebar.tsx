import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Search,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  Layers,
  Atom,
  ChevronDown,
  Compass,
  Zap,
} from 'lucide-react';
import { ElementData, GradeLevel } from '../../types';
import { ELEMENTS } from '../../data/elementsData';
import { playSound } from '../../utils/audio';

interface TutorSidebarProps {
  activeElement: ElementData;
  onSelectElement: (element: ElementData) => void;
  gradeLevel: GradeLevel;
  onGradeLevelChange: (level: GradeLevel) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onQuickPrompt: (promptText: string, mode?: string) => void;
  onExportNotes: () => void;
  onClearChat: () => void;
  providerBadge?: string;
  modelBadge?: string;
}

const GRADE_LEVELS: GradeLevel[] = [
  'Grade 5',
  'Grade 8',
  'Grade 10',
  'CBSE/ICSE',
  'JEE/NEET',
  'University',
];

const CURATED_TOPICS = [
  {
    category: '⚛️ Quantum & Orbitals',
    prompts: [
      'Explain orbital hybridization (sp, sp2, sp3) with clear geometry examples',
      'Why does 4s subshell fill before 3d, but ionize first?',
      'Hund rule of maximum multiplicity and Pauli exclusion principle',
    ],
  },
  {
    category: '📊 Periodic Trends & Anomalies',
    prompts: [
      'Why is the Electron Affinity of Chlorine greater than Fluorine?',
      'Explain Lanthanide Contraction and its effect on 5d elements',
      'Why is the first ionization energy of Nitrogen higher than Oxygen?',
    ],
  },
  {
    category: '🔥 Flame Tests & Reactions',
    prompts: [
      'Why do alkali metals produce characteristic flame test emission colors?',
      'How to balance redox reactions using the oxidation number method?',
      'Why is Francium significantly more reactive than Lithium?',
    ],
  },
  {
    category: '🌍 Real-World Materials',
    prompts: [
      'Why is Helium essential for cooling superconducting magnets in MRI?',
      'How do catalytic converters use Platinum, Palladium, and Rhodium?',
      'Compare allotropes of Carbon: Diamond vs Graphene vs Fullerene',
    ],
  },
];

export const TutorSidebar: React.FC<TutorSidebarProps> = ({
  activeElement,
  onSelectElement,
  gradeLevel,
  onGradeLevelChange,
  soundEnabled,
  onToggleSound,
  onQuickPrompt,
  onExportNotes,
  onClearChat,
  providerBadge = 'NVIDIA NIM',
  modelBadge = 'Llama 3.2 11B',
}) => {
  const [elementSearchOpen, setElementSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredElements = ELEMENTS.filter(
    (el) =>
      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.atomicNumber.toString() === searchQuery.trim()
  ).slice(0, 10);

  return (
    <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-3xl shadow-2xl saturate-200">
      {/* Engine Status Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-900/40 via-black/40 to-indigo-900/40 border border-purple-500/20 flex items-center justify-between shadow-inner relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-purple-500/10 blur-xl"></div>
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" />
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5 drop-shadow-sm">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {providerBadge}
            </div>
            <p className="text-[10px] text-purple-200 font-mono drop-shadow-sm">{modelBadge}</p>
          </div>
        </div>

        <button
          onClick={onToggleSound}
          className={`relative z-10 p-1.5 rounded-lg border text-xs transition-all cursor-pointer shadow-sm ${
            soundEnabled
              ? 'bg-purple-600/30 text-purple-200 border-purple-500/40'
              : 'bg-white/5 text-white/50 border-white/10'
          }`}
          title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Grade Level Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
          Target Curriculum
        </label>
        <div className="relative">
          <select
            value={gradeLevel}
            onChange={(e) => {
              onGradeLevelChange(e.target.value as GradeLevel);
              playSound('toggle', soundEnabled);
            }}
            className="w-full bg-white/5 text-white font-extrabold text-xs px-3 py-2.5 rounded-xl border border-white/10 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner pr-8 backdrop-blur-md"
          >
            {GRADE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl} className="bg-slate-900 text-white">
                {lvl}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Active Element Radar Card */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
            <Atom className="w-3.5 h-3.5 text-cyan-400" />
            Active Element Context
          </label>
          <button
            onClick={() => setElementSearchOpen(!elementSearchOpen)}
            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
          >
            {elementSearchOpen ? 'Close' : 'Switch Element'}
          </button>
        </div>

        {/* Element Switcher Dropdown */}
        {elementSearchOpen && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 mb-2 animate-in fade-in zoom-in-95 backdrop-blur-xl">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, name, Z..."
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {filteredElements.map((el) => (
                <button
                  key={el.atomicNumber}
                  onClick={() => {
                    onSelectElement(el);
                    setElementSearchOpen(false);
                    setSearchQuery('');
                    playSound('click', soundEnabled);
                  }}
                  className="w-full px-2 py-1.5 text-left text-xs rounded-lg hover:bg-white/10 flex items-center justify-between text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <span className="font-bold">
                    {el.name} <span className="font-mono text-cyan-400 font-bold">({el.symbol})</span>
                  </span>
                  <span className="font-mono text-[10px] text-white/40">Z={el.atomicNumber}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Element Card */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex flex-col items-center justify-center text-white shadow-md font-mono shrink-0">
              <span className="text-xs font-black">{activeElement.symbol}</span>
              <span className="text-[9px] opacity-80">{activeElement.atomicNumber}</span>
            </div>
            <div>
              <div className="text-xs font-black text-white drop-shadow-sm">{activeElement.name}</div>
              <div className="text-[10px] text-white/50 font-mono truncate max-w-[150px]">
                {activeElement.electronConfiguration}
              </div>
              <div className="text-[9px] text-cyan-400 font-medium">{activeElement.category}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Syllabus Prompts Accordion */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          Curated Study Prompts
        </label>

        <div className="space-y-2">
          {CURATED_TOPICS.map((topic, tIdx) => (
            <div key={tIdx} className="space-y-1">
              <div className="text-[11px] font-bold text-white/40 px-1">{topic.category}</div>
              <div className="space-y-1">
                {topic.prompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      onQuickPrompt(p);
                      playSound('click', soundEnabled);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-purple-900/40 text-white/70 hover:text-purple-200 border border-white/5 hover:border-purple-500/30 text-[11px] leading-snug transition-all cursor-pointer line-clamp-2"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: Export & Clear */}
      <div className="pt-2 border-t border-white/10 flex items-center gap-2">
        <button
          onClick={() => {
            onExportNotes();
            playSound('click', soundEnabled);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs border border-white/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          title="Download study transcript"
        >
          <Download className="w-3.5 h-3.5 text-purple-400" />
          <span>Export Notes</span>
        </button>

        <button
          onClick={() => {
            onClearChat();
            playSound('click', soundEnabled);
          }}
          className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/50 text-white/50 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
