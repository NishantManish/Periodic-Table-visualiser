import React from 'react';
import { Atom, Heart, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-sky-400 animate-spin-slow" />
          <span className="font-semibold text-slate-200 text-sm">
            Periodic Table Explorer
          </span>
          <span className="text-slate-500">| Grade 5 to University</span>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Chemistry Tutor Powered
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            IUPAC Data Accurate
          </span>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> for Science
          </span>
        </div>
      </div>
    </footer>
  );
};
