import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { REACTIONS_LIBRARY } from '../../data/reactionsData';
import { Reaction } from '../../types';
import {
  Zap,
  Play,
  Pause,
  Sparkles,
  Loader2,
  Thermometer,
  Gauge,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Award,
  Layers,
  BarChart3,
  FlaskConical,
  RotateCcw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Search,
  Beaker,
  Plus,
  Trash2,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

// Particle shape for the reaction chamber animation
interface ReactionParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'reactant1' | 'reactant2' | 'product';
  symbol: string;
  color: string;
  adsorbed?: boolean;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface BubbleParticle {
  x: number;
  y: number;
  vy: number;
  radius: number;
  alpha: number;
}

// Common reagents for Virtual Lab Bench shelf
const LAB_REAGENTS = [
  { formula: 'H₂', name: 'Hydrogen Gas', category: 'Gas', color: '#38bdf8' },
  { formula: 'O₂', name: 'Oxygen Gas', category: 'Gas', color: '#60a5fa' },
  { formula: 'N₂', name: 'Nitrogen Gas', category: 'Gas', color: '#818cf8' },
  { formula: 'CH₄', name: 'Methane Gas', category: 'Gas', color: '#a78bfa' },
  { formula: 'H₂O', name: 'Water', category: 'Liquid', color: '#0284c7' },
  { formula: 'Na', name: 'Sodium Metal', category: 'Alkali Metal', color: '#f59e0b' },
  { formula: 'HCl', name: 'Hydrochloric Acid', category: 'Acid', color: '#f43f5e' },
  { formula: 'NaOH', name: 'Sodium Hydroxide', category: 'Base', color: '#10b981' },
  { formula: 'Zn', name: 'Zinc Metal', category: 'Metal', color: '#94a3b8' },
  { formula: 'Al', name: 'Aluminum Powder', category: 'Metal', color: '#cbd5e1' },
  { formula: 'Fe₂O₃', name: 'Iron(III) Oxide', category: 'Oxide', color: '#b45309' },
  { formula: 'CaCO₃', name: 'Calcium Carbonate', category: 'Mineral', color: '#e2e8f0' },
  { formula: 'H₂O₂', name: 'Hydrogen Peroxide', category: 'Peroxide', color: '#34d399' },
  { formula: 'AgNO₃', name: 'Silver Nitrate', category: 'Salt', color: '#e0e7ff' },
  { formula: 'NaCl', name: 'Sodium Chloride', category: 'Salt', color: '#f8fafc' },
];

export const ReactionSimulator: React.FC = () => {
  const { unlockAchievement } = useAppStore();

  const [activeTab, setActiveTab] = useState<'presets' | 'workbench' | 'ai'>('presets');
  const [selectedReaction, setSelectedReaction] = useState<Reaction>(REACTIONS_LIBRARY[0]);
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Thermodynamic & Kinetic Conditions
  const [temperature, setTemperature] = useState<number>(selectedReaction.requiredConditions.temp);
  const [pressure, setPressure] = useState<number>(selectedReaction.requiredConditions.pressure);
  const [catalyst, setCatalyst] = useState<string>(selectedReaction.requiredConditions.catalyst || 'None');
  const [hasCatalyst, setHasCatalyst] = useState<boolean>(!!selectedReaction.requiredConditions.catalyst);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [scrubCoordinate, setScrubCoordinate] = useState<number>(0);

  // Virtual Lab Bench State
  const [mixedReagents, setMixedReagents] = useState<string[]>(['H₂', 'O₂']);

  // AI Prediction State
  const [customReactantsInput, setCustomReactantsInput] = useState('');
  const [aiResult, setAiResult] = useState<Record<string, any> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Chamber Particle Animation Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ReactionParticle[]>([]);
  const sparksRef = useRef<SparkParticle[]>([]);
  const bubblesRef = useRef<BubbleParticle[]>([]);
  const animFrameId = useRef<number | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When reaction changes, update conditions
  const handleSelectReaction = useCallback((r: Reaction) => {
    setSelectedReaction(r);
    setTemperature(r.requiredConditions.temp);
    setPressure(r.requiredConditions.pressure);
    setCatalyst(r.requiredConditions.catalyst || 'None');
    setHasCatalyst(!!r.requiredConditions.catalyst);
    setSimulationProgress(0);
    setIsSimulating(false);
    setActiveStepIndex(0);
    setScrubCoordinate(0);
  }, []);

  // Filter reactions
  const filteredReactions = useMemo(() => {
    return REACTIONS_LIBRARY.filter((r) => {
      const matchesType = filterType === 'All' || r.reactionType === filterType;
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.balancedEquation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reactants.some((react) => react.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.products.some((prod) => prod.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [filterType, searchQuery]);

  // Run Chamber Simulation with Timer
  const startSimulation = () => {
    if (isSimulating) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    setSimulationProgress(0);
    setActiveStepIndex(0);
    unlockAchievement('reaction_sim');

    const duration = 5000;
    const intervalTime = 80;
    const stepsCount = selectedReaction.stepsExplanation?.length || 4;

    const timer = setInterval(() => {
      setSimulationProgress((prev) => {
        const next = prev + 100 / (duration / intervalTime);
        if (next >= 100) {
          clearInterval(timer);
          setIsSimulating(false);
          setActiveStepIndex(stepsCount - 1);
          setScrubCoordinate(100);
          return 100;
        }

        const currentStep = Math.min(stepsCount - 1, Math.floor((next / 100) * stepsCount));
        setActiveStepIndex(currentStep);
        setScrubCoordinate(Math.min(100, Math.floor(next)));

        return next;
      });
    }, intervalTime);

    simulationTimerRef.current = timer;
  };

  const resetSimulation = () => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    setIsSimulating(false);
    setSimulationProgress(0);
    setActiveStepIndex(0);
    setScrubCoordinate(0);
  };

  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Initialize and Update Particle Chamber Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const pistonY = 20 + Math.min(65, (pressure / 500) * 65);
    const numParticles = 32;
    const newParticles: ReactionParticle[] = [];

    const reactantColor1 = '#38bdf8';
    const reactantColor2 = '#fbbf24';
    const productColor = '#34d399';

    const reactant1 = selectedReaction.reactants[0] || 'A';
    const reactant2 = selectedReaction.reactants[1] || selectedReaction.reactants[0] || 'B';
    const product = selectedReaction.products[0] || 'C';

    for (let i = 0; i < numParticles; i++) {
      const isReactant1 = i % 2 === 0;
      const symbol = isReactant1 ? reactant1 : reactant2;
      const tempK = temperature + 273.15;
      const baseSpeed = Math.sqrt(tempK / 298) * 1.6;

      newParticles.push({
        id: i,
        x: Math.random() * (width - 60) + 30,
        y: Math.random() * (height - pistonY - 50) + pistonY + 20,
        vx: (Math.random() - 0.5) * baseSpeed * 2,
        vy: (Math.random() - 0.5) * baseSpeed * 2,
        radius: 11,
        type: isReactant1 ? 'reactant1' : 'reactant2',
        symbol,
        color: isReactant1 ? reactantColor1 : reactantColor2,
      });
    }

    particlesRef.current = newParticles;
    sparksRef.current = [];
    bubblesRef.current = [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Piston Cylinder Chamber Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      if (temperature > 300) {
        const heatAlpha = Math.min(0.25, ((temperature - 300) / 1200) * 0.25);
        ctx.fillStyle = `rgba(249, 115, 22, ${heatAlpha})`;
        ctx.fillRect(0, pistonY, width, height - pistonY);
      }

      // 2. Draw Moving Mechanical Compressor Piston
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(15, 0, width - 30, pistonY);

      ctx.fillStyle = '#334155';
      ctx.fillRect(10, pistonY - 8, width - 20, 8);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, pistonY - 8, width - 20, 8);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`COMPRESSOR PISTON · ${pressure} ATM`, width / 2, pistonY - 14);

      // 3. Draw Heterogeneous Catalyst Bed Mesh
      const catalystBedHeight = 24;
      const bedY = height - catalystBedHeight;
      if (hasCatalyst) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(15, bedY, width - 30, catalystBedHeight);

        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        for (let x = 20; x < width - 20; x += 12) {
          ctx.beginPath();
          ctx.moveTo(x, bedY);
          ctx.lineTo(x + 6, height);
          ctx.stroke();
        }
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`CATALYTIC BED [${catalyst}]`, width / 2, bedY + 16);
      }

      // 4. Update and Draw Particles
      const conversionRatio = simulationProgress / 100;
      const particles = particlesRef.current;

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x - p.radius < 20) {
          p.x = 20 + p.radius;
          p.vx *= -1;
        }
        if (p.x + p.radius > width - 20) {
          p.x = width - 20 - p.radius;
          p.vx *= -1;
        }

        const floorLimit = hasCatalyst ? bedY - p.radius : height - 15 - p.radius;
        if (p.y - p.radius < pistonY) {
          p.y = pistonY + p.radius;
          p.vy *= -1;
        }
        if (p.y > floorLimit) {
          p.y = floorLimit;
          p.vy *= -1;

          if (hasCatalyst && Math.random() < 0.4 && p.type !== 'product') {
            p.adsorbed = true;
            sparksRef.current.push({
              x: p.x,
              y: bedY,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 2 - 1,
              alpha: 1,
              color: '#facc15',
              size: 2.5,
            });
          }
        }

        if (idx < numParticles * conversionRatio) {
          if (p.type !== 'product') {
            for (let s = 0; s < 5; s++) {
              sparksRef.current.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                alpha: 1,
                color: '#34d399',
                size: 2.5,
              });
            }
          }
          p.type = 'product';
          p.color = productColor;
          p.symbol = product;
        } else if (p.type === 'product' && conversionRatio === 0) {
          p.type = idx % 2 === 0 ? 'reactant1' : 'reactant2';
          p.color = idx % 2 === 0 ? reactantColor1 : reactantColor2;
          p.symbol = idx % 2 === 0 ? reactant1 : reactant2;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;

        if (isSimulating || temperature > 400) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 3;
        }
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, p.x, p.y);
      });

      // 5. Update and Draw Sparks
      for (let s = sparksRef.current.length - 1; s >= 0; s--) {
        const spark = sparksRef.current[s];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.alpha -= 0.04;

        if (spark.alpha <= 0) {
          sparksRef.current.splice(s, 1);
        } else {
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
          ctx.fillStyle = spark.color;
          ctx.globalAlpha = Math.max(0, spark.alpha);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      // 6. Draw Effervescence Bubbles for Gas Reactions
      if (
        isSimulating &&
        (selectedReaction.reactionType === 'Combustion' ||
          selectedReaction.balancedEquation.includes('↑') ||
          selectedReaction.balancedEquation.includes('H₂'))
      ) {
        if (Math.random() < 0.35) {
          bubblesRef.current.push({
            x: Math.random() * (width - 60) + 30,
            y: height - 25,
            vy: -Math.random() * 2 - 1.5,
            radius: Math.random() * 3.5 + 1.5,
            alpha: 0.8,
          });
        }
      }

      for (let b = bubblesRef.current.length - 1; b >= 0; b--) {
        const bubble = bubblesRef.current[b];
        bubble.y += bubble.vy;
        bubble.alpha -= 0.015;

        if (bubble.y < pistonY || bubble.alpha <= 0) {
          bubblesRef.current.splice(b, 1);
        } else {
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${bubble.alpha})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [selectedReaction, temperature, pressure, hasCatalyst, catalyst, isSimulating, simulationProgress]);

  // Handle Lab Shelf Reagent Click (with subset matching)
  const toggleReagent = (formula: string) => {
    if (mixedReagents.includes(formula)) {
      setMixedReagents(mixedReagents.filter((r) => r !== formula));
    } else {
      if (mixedReagents.length >= 4) return;
      const next = [...mixedReagents, formula];
      setMixedReagents(next);

      const exactMatch = REACTIONS_LIBRARY.find(
        (r) =>
          r.reactants.every((react) => next.includes(react)) &&
          next.every((item) => r.reactants.includes(item))
      );
      if (exactMatch) {
        handleSelectReaction(exactMatch);
      }
    }
  };

  // AI Reaction Prediction with NVIDIA NIM or Gemini
  const handlePredictReaction = async (reactantsToUse?: string) => {
    const reactantsString = reactantsToUse || customReactantsInput.trim() || mixedReagents.join(' + ');
    if (!reactantsString) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/predict-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reactants: reactantsString,
          conditions: {
            temp: temperature,
            pressure,
            catalyst: hasCatalyst ? catalyst : 'None',
          },
        }),
      });

      const data = await res.json();
      if (data.result && !data.result.error) {
        setAiResult(data.result);

        if (data.result.balancedEquation) {
          const loaded: Reaction = {
            id: data.result.id || `custom-${Date.now()}`,
            title: data.result.title || 'AI Predicted Reaction',
            reactants: data.result.reactants || mixedReagents,
            products: data.result.products || ['Product'],
            balancedEquation: data.result.balancedEquation,
            energyChange: data.result.energyChange || '-100 kJ/mol',
            deltaH: data.result.deltaH ?? -100,
            activationEnergy: data.result.activationEnergy ?? 60,
            entropyChange: data.result.entropyChange ?? 50,
            reactionType: data.result.reactionType || 'Synthesis',
            equilibriumType: data.result.equilibriumType || 'Irreversible',
            phaseState: data.result.phaseState || 'Gas Phase',
            description: data.result.description || 'AI analyzed reaction mechanism.',
            industrialApplication: data.result.industrialApplication || 'Chemical synthesis',
            safetyNotes: data.result.safetyNotes || ['Wear standard PPE.'],
            stepsExplanation: data.result.stepsExplanation || [
              { step: 1, title: 'Molecular Collision', detail: 'Reactants approach with sufficient kinetic velocity.' },
              { step: 2, title: 'Transition State', detail: 'Old bonds stretch and break at peak activation barrier.' },
              { step: 3, title: 'Electron Transfer', detail: 'Radicals / ions reform new low-energy molecular bonds.' },
              { step: 4, title: 'Product Desorption', detail: 'Stable product molecules release reaction enthalpy.' },
            ],
            requiredConditions: {
              temp: temperature,
              pressure,
              catalyst: hasCatalyst ? catalyst : undefined,
            },
          };
          setSelectedReaction(loaded);
        }
      } else {
        setAiResult({ error: data.error || 'Could not predict chemical reaction.' });
      }
    } catch {
      setAiResult({ error: 'Failed to communicate with Reaction AI server.' });
    } finally {
      setAiLoading(false);
    }
  };

  // --- THERMODYNAMICS, ARRHENIUS KINETICS & LE CHATELIER EQUILIBRIUM ENGINE ---
  const activationEnergy = selectedReaction.activationEnergy || 120;
  const catalystEaReduction = hasCatalyst ? Math.round(activationEnergy * 0.45) : 0;
  const effectiveEa = Math.max(15, activationEnergy - catalystEaReduction);
  const deltaH = selectedReaction.deltaH ?? -92;
  const deltaS = selectedReaction.entropyChange ?? -50; // J/(mol·K)
  const isExothermic = deltaH < 0;

  const tempK = temperature + 273.15;
  const R = 8.314; // J/(mol·K)

  // True Boltzmann Factor f = exp(-Ea / RT)
  const boltzmannExponent = -(effectiveEa * 1000) / (R * tempK);
  const boltzmannValue = Math.exp(boltzmannExponent);
  const boltzmannDisplay =
    boltzmannValue >= 0.001
      ? `${(boltzmannValue * 100).toFixed(2)}%`
      : boltzmannValue.toExponential(2);

  // Relative Rate Speedup compared to uncatalyzed 298 K baseline
  const baselineExponent = -(activationEnergy * 1000) / (R * 298.15);
  const log10RateRatio = (boltzmannExponent - baselineExponent) / Math.LN10 + Math.log10(pressure);
  const relativeRateDisplay =
    Math.abs(log10RateRatio) < 3
      ? `${Math.pow(10, log10RateRatio).toFixed(1)}×`
      : `10^${log10RateRatio.toFixed(1)}×`;

  // Gibbs Free Energy: ΔG = ΔH - T·ΔS (kJ/mol)
  const deltaGVal = deltaH - (tempK * deltaS) / 1000;
  const deltaG = deltaGVal.toFixed(1);
  const isSpontaneous = deltaGVal < 0;

  // Equilibrium Constant log10(K_eq) = -ΔG / (2.303 * R * T)
  const log10Keq = (-deltaGVal * 1000) / (2.303 * R * tempK);

  // Estimate Equilibrium Yield (%) considering ΔG and Pressure Le Chatelier shift
  const isReversible =
    selectedReaction.equilibriumType === 'Reversible' || selectedReaction.balancedEquation.includes('⇌');
  const equilibriumYield = useMemo(() => {
    if (!isReversible && deltaGVal < -20) return 99.9;
    // Logistic mapping from log10(Keq) plus pressure contribution
    const pFactor = pressure > 10 ? Math.log10(pressure) * 0.45 : 0;
    const effectiveLogK = Math.max(-6, Math.min(6, log10Keq * 0.25 + pFactor));
    const K = Math.pow(10, effectiveLogK);
    const yieldPct = (K / (1 + K)) * 100;
    return Number(Math.max(1.0, Math.min(99.9, yieldPct)).toFixed(1));
  }, [isReversible, deltaGVal, log10Keq, pressure]);

  const leChatelierNote = useMemo(() => {
    if (!isReversible) {
      return `Irreversible reaction (ΔG = ${deltaG} kJ/mol): Proceeds virtually to completion (~${equilibriumYield}% yield). Increasing T (${temperature}°C) or P (${pressure} atm) accelerates collision kinetics.`;
    }
    if (isExothermic) {
      return `Reversible exothermic equilibrium (ΔH < 0): High T (${temperature}°C) accelerates rate but shifts K_eq toward reactants; high P (${pressure} atm) compresses gas volume to boost conversion yield (~${equilibriumYield}%).`;
    }
    return `Reversible endothermic equilibrium (ΔH > 0): Raising T (${temperature}°C) shifts K_eq toward products (~${equilibriumYield}% yield).`;
  }, [isReversible, isExothermic, deltaG, equilibriumYield, temperature, pressure]);

  return (
    <div className="space-y-5 w-full">
      {/* HEADER CONTROLS & WORKSPACE TABS */}
      <div className="bg-black/40 p-4 sm:p-5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/10 self-start shadow-inner">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> Presets Library ({REACTIONS_LIBRARY.length})
          </button>

          <button
            onClick={() => setActiveTab('workbench')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'workbench'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Beaker className="w-3.5 h-3.5" /> Virtual Lab Shelf
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Predictor
          </button>
        </div>

        {/* Search & Reaction Type Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-lg justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reaction, formula, or element..."
              className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black/30 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500 cursor-pointer shrink-0 shadow-inner"
          >
            <option value="All">All Types</option>
            <option value="Synthesis">Synthesis</option>
            <option value="Decomposition">Decomposition</option>
            <option value="Combustion">Combustion</option>
            <option value="Single Replacement">Single Replacement</option>
            <option value="Double Replacement">Double Replacement</option>
            <option value="Acid-Base">Acid-Base</option>
            <option value="Redox">Redox</option>
          </select>
        </div>
      </div>

      {/* WORKBENCH MODE: VIRTUAL LAB BENCH REAGENT SHELF */}
      <AnimatePresence>
        {activeTab === 'workbench' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 p-5 rounded-3xl border border-amber-500/30 shadow-xl space-y-4 backdrop-blur-3xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-amber-400" /> Interactive Reagents Shelf
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click to add or remove chemical reagents into your reaction mixture:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Current Mix:</span>
                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
                  {mixedReagents.length === 0 ? (
                    <span className="text-slate-500 text-xs italic">Empty flask</span>
                  ) : (
                    mixedReagents.map((r, i) => (
                      <span key={i} className="text-xs font-mono font-black text-amber-300">
                        {r}
                        {i < mixedReagents.length - 1 ? ' + ' : ''}
                      </span>
                    ))
                  )}
                  {mixedReagents.length > 0 && (
                    <button
                      onClick={() => setMixedReagents([])}
                      className="ml-2 text-rose-400 hover:text-rose-300 cursor-pointer"
                      title="Clear flask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {LAB_REAGENTS.map((item) => {
                const selected = mixedReagents.includes(item.formula);
                return (
                  <button
                    key={item.formula}
                    onClick={() => toggleReagent(item.formula)}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                      selected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 scale-105'
                        : 'bg-black/20 text-slate-300 border-white/10 hover:bg-white/10 shadow-sm'
                    }`}
                  >
                    <span className="font-mono font-black text-sm">{item.formula}</span>
                    <span className="text-[10px] opacity-75 font-normal">({item.name})</span>
                    {selected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Mix reagents to automatically match curated experiments or click below to simulate with AI.
              </span>
              <button
                onClick={() => handlePredictReaction()}
                disabled={aiLoading || mixedReagents.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Simulate Mixture with AI
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRESETS HORIZONTAL RIBBON */}
      {activeTab === 'presets' && (
        <div className="bg-black/40 p-4 rounded-3xl border border-white/10 shadow-xl space-y-3 backdrop-blur-3xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <FlaskConical className="w-4 h-4" /> Curated Reaction Presets ({filteredReactions.length})
            </span>
            <span className="text-[11px] text-white/50 font-mono">Select to simulate dynamics</span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {filteredReactions.map((r) => {
              const active = selectedReaction.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectReaction(r)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2.5 cursor-pointer shrink-0 ${
                    active
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-black/20 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white shadow-inner'
                  }`}
                >
                  <span className="font-extrabold">{r.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono border border-white/5">
                    {r.reactionType}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AI PREDICTOR PROMPT TAB */}
      <AnimatePresence>
        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> AI Reaction Predictor & Balancer
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Type ANY chemical reactants to calculate reaction equations, thermodynamics, and mechanism steps:
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Llama 3.3 70B Instruct
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customReactantsInput}
                onChange={(e) => setCustomReactantsInput(e.target.value)}
                placeholder="e.g. Fe + O2, Cu + HNO3, C2H5OH + O2, or NaHCO3 + CH3COOH..."
                className="flex-1 px-4 py-3 text-xs rounded-2xl bg-black/40 border border-white/10 text-slate-200 focus:outline-none focus:border-purple-500 font-mono shadow-inner"
              />
              <button
                onClick={() => handlePredictReaction(customReactantsInput)}
                disabled={aiLoading || !customReactantsInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-purple-600/30 shrink-0"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Predict Reaction & Energy
              </button>
            </div>

            {aiResult && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-purple-300 font-mono text-sm">
                    {aiResult.balancedEquation || 'Predicted Reaction'}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">{aiResult.energyChange}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{aiResult.description}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN TWO-COLUMN SPLIT: REACTION CHAMBER (7) & REACTION KINETICS (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Molecular Collision Chamber Canvas */}
        <div className="lg:col-span-7 bg-black/40 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5 flex flex-col justify-between backdrop-blur-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {selectedReaction.title}
                </h2>
                <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                  {selectedReaction.reactionType}
                </span>
                {selectedReaction.phaseState && (
                  <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-slate-300 text-[11px] font-mono border border-white/10">
                    {selectedReaction.phaseState}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{selectedReaction.description}</p>
            </div>
          </div>

          {/* Balanced Chemical Equation Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/20 border border-white/10 text-center space-y-2 shadow-inner">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block">
              Stoichiometric Balanced Equation
            </span>
            <div className="text-xl sm:text-3xl font-mono font-black text-cyan-300 tracking-wider">
              {selectedReaction.balancedEquation}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold pt-1">
              <span className={isExothermic ? 'text-rose-400' : 'text-cyan-400'}>
                Enthalpy (ΔH): {selectedReaction.energyChange}
              </span>
              <span className="text-amber-400 font-mono">Eₐ Barrier: {effectiveEa} kJ/mol</span>
              <span className={isSpontaneous ? 'text-emerald-400' : 'text-amber-400'}>
                ΔG: {deltaG} kJ/mol ({isSpontaneous ? 'Spontaneous' : 'Endergonic'})
              </span>
            </div>
          </div>

          {/* Molecular Collision Simulator Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-2 text-cyan-400">
                <Activity className="w-4 h-4 text-cyan-400" /> Molecular Collision Simulation Chamber
              </span>
              <span className="text-[11px] font-mono text-white/60">
                T: {temperature} °C ({tempK.toFixed(0)} K) | P: {pressure} atm | Est. Yield: {equilibriumYield}%
              </span>
            </div>

            <div className="relative w-full h-72 rounded-2xl bg-black/40 border border-white/10 overflow-hidden shadow-inner">
              <canvas ref={canvasRef} width={680} height={288} className="w-full h-full block" />

              {isSimulating && (
                <div className="absolute inset-x-4 bottom-4 bg-black/70 p-3 rounded-2xl border border-white/20 backdrop-blur-md space-y-1.5 shadow-xl">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-cyan-300">Reaction Coordinate Conversion...</span>
                    <span className="text-amber-400 font-mono">{Math.round(simulationProgress)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-black/40 shadow-inner overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-150"
                      style={{ width: `${simulationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reactants -> Products Visual Transformation Cards */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/10 shadow-inner">
            <div className="space-y-1">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block">
                Reactants
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedReaction.reactants.map((r, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-extrabold text-sm border border-cyan-500/30"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center px-2">
              <ArrowRight className="w-6 h-6 text-amber-400" />
              <span className="text-[9px] font-mono text-white/50 mt-0.5">Transform</span>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block">
                Products
              </span>
              <div className="flex flex-wrap gap-2 justify-end">
                {selectedReaction.products.map((p, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-sm border border-emerald-500/30"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={startSimulation}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isSimulating ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" />
                  <span>Pause Reaction Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{simulationProgress >= 100 ? 'Rerun Chamber Simulation' : 'Run Reaction Simulation'}</span>
                </>
              )}
            </button>

            <button
              onClick={resetSimulation}
              className="p-3.5 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              title="Reset Chamber"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Conditions, Kinetics & Thermodynamics HUD */}
        <div className="lg:col-span-5 bg-black/40 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-6 backdrop-blur-3xl flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/10">
              <Sliders className="w-4 h-4 text-cyan-400" /> Chamber Thermodynamic Conditions
            </h3>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-400" /> Temperature (T):
                </span>
                <span className="font-mono text-rose-400 font-black text-sm">
                  {temperature} °C <span className="text-xs font-normal text-slate-400">({tempK.toFixed(0)} K)</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1500"
                step="10"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">
                Mean Kinetic Energy Eₖ = (3/2)k_B·T. Higher thermal velocities increase collision frequency and energy.
              </p>
            </div>

            {/* Pressure Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" /> Pressure (P):
                </span>
                <span className="font-mono text-cyan-400 font-black text-sm">{pressure} atm</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                step="5"
                value={pressure}
                onChange={(e) => setPressure(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">
                Boyle&apos;s Law (P ∝ 1/V): Piston physically compresses chamber volume, increasing concentration [M].
              </p>
            </div>

            {/* Catalyst Toggle */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Heterogeneous / Homogeneous Catalyst
                </span>
                <button
                  onClick={() => setHasCatalyst(!hasCatalyst)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    hasCatalyst ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      hasCatalyst ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {hasCatalyst && (
                <div className="text-[11px] text-cyan-300 font-mono bg-cyan-950/40 p-2 rounded-xl border border-cyan-500/30">
                  Catalyst: <strong>{catalyst}</strong> (Lowers Eₐ barrier from {activationEnergy} → {effectiveEa} kJ/mol)
                </div>
              )}
            </div>
          </div>

          {/* Arrhenius Kinetics & Thermodynamics Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 shadow-inner">
            <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" /> Arrhenius Kinetics & Equilibrium HUD
            </h4>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Boltzmann Factor</span>
                <span className="text-sm font-mono font-black text-cyan-300">{boltzmannDisplay}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">f = exp(−Eₐ / R·T)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Relative Rate (k/k₀)</span>
                <span className="text-sm font-mono font-black text-purple-300">{relativeRateDisplay}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">vs. 298 K, 1 atm uncatalyzed</span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Gibbs Free Energy (ΔG)</span>
                <span
                  className={`text-sm font-mono font-black ${
                    isSpontaneous ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {deltaG} kJ/mol
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">ΔG = ΔH − T·ΔS</span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Equilibrium Yield</span>
                <span className="text-sm font-mono font-black text-emerald-300">{equilibriumYield}%</span>
                <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                  log₁₀(K) = {log10Keq.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Le Chatelier Shift Note */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-bold block mb-1">Le Chatelier&apos;s Principle & Kinetics:</strong>
              {leChatelierNote}
            </div>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: INTERACTIVE ENERGY PROFILE & STEP-BY-STEP MECHANISM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Interactive Potential Energy Profile Diagram */}
        <div className="lg:col-span-6 bg-black/40 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-3xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Reaction Potential Energy Profile
            </h3>
            <span className="text-[11px] font-mono font-bold text-amber-400">
              Eₐ = {effectiveEa} kJ/mol | ΔH = {deltaH} kJ/mol
            </span>
          </div>

          <div className="h-64 bg-black/20 rounded-2xl border border-white/10 p-3 relative flex items-center justify-center shadow-inner">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <line x1="40" y1="20" x2="40" y2="170" stroke="#334155" strokeWidth="2" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="#334155" strokeWidth="2" />

              <text
                x="20"
                y="95"
                fill="#64748b"
                fontSize="9"
                fontWeight="bold"
                transform="rotate(-90 20 95)"
                textAnchor="middle"
              >
                Potential Energy (kJ/mol)
              </text>
              <text x="210" y="190" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                Reaction Coordinate (ξ) →
              </text>

              <line x1="40" y1="120" x2="100" y2="120" stroke="#38bdf8" strokeWidth="3" />
              <text x="70" y="112" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                Reactants
              </text>

              {(() => {
                const prodY = isExothermic ? 150 : 70;
                const peakUncatY = Math.max(25, 120 - activationEnergy * 0.4);
                const peakCatY = Math.max(25, 120 - effectiveEa * 0.4);

                const scrubX = 100 + (scrubCoordinate / 100) * 250;
                let scrubY = 120;
                if (scrubCoordinate < 50) {
                  const t = scrubCoordinate / 50;
                  scrubY = 120 - (120 - (hasCatalyst ? peakCatY : peakUncatY)) * Math.sin((t * Math.PI) / 2);
                } else {
                  const t = (scrubCoordinate - 50) / 50;
                  const peak = hasCatalyst ? peakCatY : peakUncatY;
                  scrubY = peak + (prodY - peak) * (1 - Math.cos((t * Math.PI) / 2));
                }

                return (
                  <g>
                    <path
                      d={`M 100 120 C 150 ${peakUncatY}, 190 ${peakUncatY}, 225 ${peakUncatY} C 265 ${prodY}, 300 ${prodY}, 350 ${prodY}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray={hasCatalyst ? '4 4' : 'none'}
                    />

                    {hasCatalyst && (
                      <path
                        d={`M 100 120 C 150 ${peakCatY}, 190 ${peakCatY}, 225 ${peakCatY} C 265 ${prodY}, 300 ${prodY}, 350 ${prodY}`}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                    )}

                    <circle
                      cx="225"
                      cy={hasCatalyst ? peakCatY : peakUncatY}
                      r="4.5"
                      fill="#f43f5e"
                    />
                    <text
                      x="225"
                      y={(hasCatalyst ? peakCatY : peakUncatY) - 8}
                      fill="#f43f5e"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Transition State [‡]
                    </text>

                    <line x1="320" y1={prodY} x2="370" y2={prodY} stroke="#34d399" strokeWidth="3" />
                    <text x="345" y={prodY - 8} fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
                      Products
                    </text>

                    <circle cx={scrubX} cy={scrubY} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>Inspect Reaction Coordinate (ξ):</span>
              <span className="font-mono text-cyan-300">{scrubCoordinate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={scrubCoordinate}
              onChange={(e) => setScrubCoordinate(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-black/20 rounded-lg shadow-inner border border-white/10"
            />
          </div>

          <p className="text-[11px] text-white/60 leading-relaxed">
            Reactants absorb activation energy (Eₐ) to reach the activated complex <strong>Transition State [‡]</strong> where old bonds cleave. Adding a catalyst lowers Eₐ without altering overall enthalpy (ΔH).
          </p>
        </div>

        {/* Right 6 Columns: Step-by-Step Reaction Mechanism */}
        <div className="lg:col-span-6 bg-black/40 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-3xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Elementary Reaction Mechanism Steps
            </h3>
            <span className="text-xs font-bold text-slate-300">
              Step {activeStepIndex + 1} of {selectedReaction.stepsExplanation?.length || 4}
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedReaction.stepsExplanation?.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={step.step}
                  onClick={() => {
                    setActiveStepIndex(idx);
                    const totalSteps = selectedReaction.stepsExplanation?.length || 4;
                    setScrubCoordinate(Math.round((idx / Math.max(1, totalSteps - 1)) * 100));
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isActive
                      ? 'bg-cyan-950/60 border-cyan-500/60 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                      : 'bg-black/40 border-white/10 hover:bg-black/60'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 shadow-inner ${
                      isActive ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20' : 'bg-black/20 text-white/50 border border-white/10'
                    }`}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{step.detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER ROW: INDUSTRIAL USES & GHS LABORATORY SAFETY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/40 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-3 backdrop-blur-3xl">
          <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Real-World & Industrial Applications
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/10 shadow-inner">
            {selectedReaction.industrialApplication}
          </p>
        </div>

        <div className="bg-black/40 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-3 backdrop-blur-3xl">
          <h3 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Laboratory Safety & GHS Hazards
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 bg-black/20 p-4 rounded-2xl border border-white/10 shadow-inner">
            {selectedReaction.safetyNotes ? (
              selectedReaction.safetyNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Standard laboratory PPE required: Safety goggles, nitrile gloves, and fume hood.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

