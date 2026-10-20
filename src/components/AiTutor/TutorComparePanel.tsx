import React from 'react';
import { motion } from 'motion/react';
import { Scale, Sparkles, ArrowRightLeft, Atom } from 'lucide-react';
import { ElementData } from '../../types';
import { ELEMENTS } from '../../data/elementsData';

interface TutorComparePanelProps {
  elementA: ElementData;
  elementB: ElementData;
  onSelectA: (el: ElementData) => void;
  onSelectB: (el: ElementData) => void;
  onRunComparison: () => void;
  loading: boolean;
}

export const TutorComparePanel: React.FC<TutorComparePanelProps> = ({
  elementA,
  elementB,
  onSelectA,
  onSelectB,
  onRunComparison,
  loading,
}) => {
  const metrics = [
    { label: 'Atomic Number (Z)', valA: elementA.atomicNumber, valB: elementB.atomicNumber, unit: '' },
    { label: 'Atomic Mass', valA: elementA.atomicMass.toFixed(2), valB: elementB.atomicMass.toFixed(2), unit: 'u' },
    { label: 'Electronegativity', valA: elementA.electronegativity ?? 'N/A', valB: elementB.electronegativity ?? 'N/A', unit: '' },
    { label: 'Atomic Radius', valA: elementA.atomicRadius ?? 'N/A', valB: elementB.atomicRadius ?? 'N/A', unit: 'pm' },
    { label: 'Ionization Energy', valA: elementA.ionizationEnergy ?? 'N/A', valB: elementB.ionizationEnergy ?? 'N/A', unit: 'kJ/mol' },
    { label: 'Melting Point', valA: elementA.meltingPoint ? `${elementA.meltingPoint} K` : 'N/A', valB: elementB.meltingPoint ? `${elementB.meltingPoint} K` : 'N/A', unit: '' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 shadow-2xl space-y-4 mb-4 backdrop-blur-3xl saturate-200"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 drop-shadow-sm">
          <Scale className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black text-white">Comparative Chemistry Studio</span>
        </div>
        <span className="text-[10px] text-white/50 font-mono">Side-by-side metric comparison</span>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Element A */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 shadow-inner backdrop-blur-md">
          <label className="text-[10px] font-extrabold uppercase text-purple-400 drop-shadow-sm">Element A</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex flex-col items-center justify-center text-white font-mono font-black text-xs shrink-0 shadow-md border border-white/10">
              <span>{elementA.symbol}</span>
              <span className="text-[8px] opacity-80">{elementA.atomicNumber}</span>
            </div>
            <select
              value={elementA.atomicNumber}
              onChange={(e) => {
                const found = ELEMENTS.find((el) => el.atomicNumber === parseInt(e.target.value));
                if (found) onSelectA(found);
              }}
              className="flex-1 bg-black/20 text-white font-bold text-xs p-2 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner backdrop-blur-md"
            >
              {ELEMENTS.map((el) => (
                <option key={el.atomicNumber} value={el.atomicNumber} className="bg-slate-900 text-white">
                  {el.atomicNumber}. {el.name} ({el.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Element B */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 shadow-inner backdrop-blur-md">
          <label className="text-[10px] font-extrabold uppercase text-cyan-400 drop-shadow-sm">Element B</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex flex-col items-center justify-center text-white font-mono font-black text-xs shrink-0 shadow-md border border-white/10">
              <span>{elementB.symbol}</span>
              <span className="text-[8px] opacity-80">{elementB.atomicNumber}</span>
            </div>
            <select
              value={elementB.atomicNumber}
              onChange={(e) => {
                const found = ELEMENTS.find((el) => el.atomicNumber === parseInt(e.target.value));
                if (found) onSelectB(found);
              }}
              className="flex-1 bg-black/20 text-white font-bold text-xs p-2 rounded-lg border border-white/10 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner backdrop-blur-md"
            >
              {ELEMENTS.map((el) => (
                <option key={el.atomicNumber} value={el.atomicNumber} className="bg-slate-900 text-white">
                  {el.atomicNumber}. {el.name} ({el.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparative Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1 text-center shadow-inner backdrop-blur-sm">
            <div className="text-[9px] font-bold text-white/50 truncate drop-shadow-sm">{m.label}</div>
            <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold">
              <span className="text-purple-300 drop-shadow-sm">{m.valA}</span>
              <span className="text-white/30">vs</span>
              <span className="text-cyan-300 drop-shadow-sm">{m.valB}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={onRunComparison}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-white/20 backdrop-blur-md"
      >
        <Sparkles className="w-4 h-4 text-amber-300 drop-shadow-sm" />
        <span className="drop-shadow-sm">Generate In-Depth AI Comparative Breakdown</span>
      </button>
    </motion.div>
  );
};
