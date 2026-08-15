import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { FlaskConical, CheckCircle2, XCircle, RefreshCw, Zap, Award, Flame } from 'lucide-react';

interface ReactionQuestion {
  id: string;
  reactants: string;
  correctProducts: string;
  distractors: string[];
  reactionType: string;
  energyChange: string;
  explanation: string;
}

const REACTION_BANK: ReactionQuestion[] = [
  {
    id: 'rx-1',
    reactants: '2 Na(s) + Cl₂(g)',
    correctProducts: '2 NaCl(s)',
    distractors: ['NaCl₂(s)', '2 NaCl₂(s)', 'Na₂Cl(s)'],
    reactionType: 'Synthesis (Combination)',
    energyChange: '-822 kJ/mol (Exothermic)',
    explanation: 'Sodium transfers an electron to Chlorine forming stable Na⁺ and Cl⁻ ionic lattice (Sodium Chloride table salt).',
  },
  {
    id: 'rx-2',
    reactants: 'CH₄(g) + 2 O₂(g)',
    correctProducts: 'CO₂(g) + 2 H₂O(g)',
    distractors: ['CO(g) + H₂O(g)', 'C(s) + 2 H₂O(g)', 'CO₂(g) + H₂(g)'],
    reactionType: 'Combustion',
    energyChange: '-891 kJ/mol (Exothermic)',
    explanation: 'Complete combustion of methane produces carbon dioxide and water vapor releasing intense thermal energy.',
  },
  {
    id: 'rx-3',
    reactants: 'Zn(s) + 2 HCl(aq)',
    correctProducts: 'ZnCl₂(aq) + H₂(g)',
    distractors: ['ZnCl(aq) + H₂(g)', 'ZnH₂(s) + Cl₂(g)', 'Zn(OH)₂ + Cl₂'],
    reactionType: 'Single Replacement',
    energyChange: '-153 kJ/mol (Exothermic)',
    explanation: 'Zinc is more reactive than Hydrogen, displacing H⁺ ions to form Zinc Chloride solution and escaping Hydrogen gas bubbles.',
  },
  {
    id: 'rx-4',
    reactants: 'HCl(aq) + NaOH(aq)',
    correctProducts: 'NaCl(aq) + H₂O(l)',
    distractors: ['NaHCl(aq) + O₂(g)', 'NaO(s) + HCl₂(aq)', 'NaOHCl(aq) + H₂(g)'],
    reactionType: 'Acid-Base Neutralization',
    energyChange: '-57 kJ/mol (Exothermic)',
    explanation: 'H⁺ from hydrochloric acid reacts with OH⁻ from sodium hydroxide to form neutral liquid water and aqueous salt.',
  },
  {
    id: 'rx-5',
    reactants: '2 H₂O₂(aq) [MnO₂ Catalyst]',
    correctProducts: '2 H₂O(l) + O₂(g)',
    distractors: ['2 H₂(g) + 2 O₂(g)', 'H₂O(l) + O₃(g)', '2 H₂O(l) + H₂(g)'],
    reactionType: 'Decomposition',
    energyChange: '-196 kJ/mol (Exothermic)',
    explanation: 'Hydrogen peroxide catalytically decomposes into harmless liquid water and bubbling oxygen gas.',
  },
  {
    id: 'rx-6',
    reactants: 'AgNO₃(aq) + NaCl(aq)',
    correctProducts: 'AgCl(s)↓ + NaNO₃(aq)',
    distractors: ['AgNa(s) + ClNO₃(aq)', 'AgNO₂(s) + NaClO(aq)', 'Ag₂(s) + NaNO₃(aq)'],
    reactionType: 'Double Replacement (Precipitation)',
    energyChange: '-65.7 kJ/mol (Exothermic)',
    explanation: 'Silver ions combine with Chloride ions to form an insoluble white precipitate of Silver Chloride.',
  },
  {
    id: 'rx-7',
    reactants: 'N₂(g) + 3 H₂(g) [Fe Catalyst]',
    correctProducts: '2 NH₃(g)',
    distractors: ['NH₄(g)', '2 NH₂(g)', 'N₂H₄(l)'],
    reactionType: 'Synthesis (Haber Process)',
    energyChange: '-92 kJ/mol (Exothermic)',
    explanation: 'The Haber-Bosch process synthesizes Ammonia gas under high pressure and temperature over an iron catalyst.',
  },
];

export const ReactionQuiz: React.FC = () => {
  const { addXp, unlockAchievement } = useAppStore();

  const [questionIdx, setQuestionIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const currentQ = REACTION_BANK[questionIdx];

  useEffect(() => {
    setSelectedOpt(null);
    const opts = [currentQ.correctProducts, ...currentQ.distractors].sort(
      () => 0.5 - Math.random()
    );
    setOptions(opts);
  }, [questionIdx]);

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);

    if (options[idx] === currentQ.correctProducts) {
      setScore((prev) => prev + 1);
      addXp(30);
      unlockAchievement('reaction_master');
    }
  };

  const handleNext = () => {
    setQuestionIdx((prev) => (prev + 1) % REACTION_BANK.length);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Chemical Reaction Predictor</h3>
            <p className="text-xs text-slate-400">Predict products and balance stoichiometry</p>
          </div>
        </div>

        <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-rose-300">
          Score: <strong className="text-white font-bold">{score} / {REACTION_BANK.length}</strong>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-7 space-y-6 shadow-2xl">
        
        {/* Reactants Formula */}
        <div className="space-y-3 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Reactants</span>
          <div className="text-xl font-extrabold text-white font-mono flex items-center justify-center gap-3">
            <span>{currentQ.reactants}</span>
            <span className="text-rose-400 font-black">→</span>
            <span className="text-rose-500/60 underline decoration-dashed">? [Products]</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 block">Select the correct product(s):</span>
          {options.map((opt, idx) => {
            const isSelected = selectedOpt === idx;
            const isCorrect = opt === currentQ.correctProducts;

            let btnStyle = 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800';
            if (selectedOpt !== null) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold shadow-lg shadow-emerald-500/20';
              } else if (isSelected) {
                btnStyle = 'bg-rose-950/80 text-rose-300 border-rose-500 font-bold';
              } else {
                btnStyle = 'bg-slate-950/40 text-slate-600 border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedOpt !== null}
                onClick={() => handleSelect(idx)}
                className={`w-full p-4 rounded-2xl border text-xs text-left font-mono transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span>{opt}</span>
                {selectedOpt !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {selectedOpt !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {selectedOpt !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between text-xs font-bold text-rose-300 gap-2">
              <span>Type: {currentQ.reactionType}</span>
              <span className="text-slate-400 font-mono">{currentQ.energyChange}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              💡 <strong>Atomic Mechanism:</strong> {currentQ.explanation}
            </p>

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Next Chemical Reaction
            </button>
          </motion.div>
        )}

      </div>

    </div>
  );
};
