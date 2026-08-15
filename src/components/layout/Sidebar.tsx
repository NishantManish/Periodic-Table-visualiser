import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ViewMode } from '@/types';
import {
  Table,
  Box,
  Share2,
  Flame,
  TrendingUp,
  BookOpen,
  Award,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { viewMode, setViewMode } = useAppStore();

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'table', label: 'Periodic Table', icon: <Table className="w-4 h-4" /> },
    { id: '3d-atom', label: '3D Atom & Orbital', icon: <Box className="w-4 h-4" /> },
    { id: 'molecule-builder', label: 'Molecule Builder', icon: <Share2 className="w-4 h-4" /> },
    { id: 'reaction-simulator', label: 'Reaction Simulator', icon: <Flame className="w-4 h-4" /> },
    { id: 'trends', label: 'Periodic Trends', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'learning', label: 'Learning & Progress', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quiz', label: 'Quiz & Practice Mode', icon: <Award className="w-4 h-4" /> },
    { id: 'ai-tutor', label: 'AI Chemistry Tutor', icon: <Bot className="w-4 h-4" /> },
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-40 p-4 pt-20 flex flex-col justify-between shadow-2xl">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Navigation Modules
        </p>
        {navItems.map((item) => {
          const isActive = viewMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setViewMode(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
