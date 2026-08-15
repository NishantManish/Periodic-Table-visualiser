import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { REACTIONS_LIBRARY } from '../../data/reactionsData';
import { Reaction } from '../../types';
import {
  Zap,
  Play,
  Sparkles,
  Loader2,
  Thermometer,
  Gauge,
  ArrowRight,
  ShieldAlert,
  Flame,
  Info,
  CheckCircle2,
  Activity,
  Award,
  Layers,
  BarChart3,
  FlaskConical,
  RotateCcw,
  Sliders,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
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
  type: 'reactant' | 'product';
  symbol: string;
  color: string;
}

export const ReactionSimulator: React.FC = () => {
  const { unlockAchievement } = useAppStore();

  const [selectedReaction, setSelectedReaction] = useState<Reaction>(REACTIONS_LIBRARY[0]);
  const [temperature, setTemperature] = useState<number>(selectedReaction.requiredConditions.temp);
  const [pressure, setPressure] = useState<number>(selectedReaction.requiredConditions.pressure);
  const [catalyst, setCatalyst] = useState<string>(selectedReaction.requiredConditions.catalyst || 'None');
  const [hasCatalyst, setHasCatalyst] = useState<boolean>(!!selectedReaction.requiredConditions.catalyst);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // AI Custom Reaction Predictor State
  const [customReactants, setCustomReactants] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Chamber Particle Animation Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ReactionParticle[]>([]);
  const animFrameId = useRef<number | null>(null);

  // When reaction changes, reset conditions
  const handleSelectReaction = (r: Reaction) => {
    setSelectedReaction(r);
    setTemperature(r.requiredConditions.temp);
    setPressure(r.requiredConditions.pressure);
    setCatalyst(r.requiredConditions.catalyst || 'None');
    setHasCatalyst(!!r.requiredConditions.catalyst);
    setSimulationProgress(0);
    setIsSimulating(false);
    setActiveStepIndex(0);
  };

  // Run Chamber Simulation with Timer & Particle Acceleration
  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setActiveStepIndex(0);
    unlockAchievement('reaction_sim');

    const duration = 4000; // 4 seconds total
    const intervalTime = 100;
    const stepsCount = selectedReaction.stepsExplanation?.length || 4;

    const timer = setInterval(() => {
      setSimulationProgress((prev) => {
        const next = prev + (100 / (duration / intervalTime));
        if (next >= 100) {
          clearInterval(timer);
          setIsSimulating(false);
          setActiveStepIndex(stepsCount - 1);
          return 100;
        }

        // Calculate step index
        const currentStep = Math.min(
          stepsCount - 1,
          Math.floor((next / 100) * stepsCount)
        );
        setActiveStepIndex(currentStep);

        return next;
      });
    }, intervalTime);
  };

  // Initialize and Update Particle Chamber Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create particles based on reactants
    const numParticles = 24;
    const newParticles: ReactionParticle[] = [];

    const reactantColor1 = '#38bdf8'; // Cyan
    const reactantColor2 = '#f59e0b'; // Amber
    const productColor = '#10b981'; // Emerald

    for (let i = 0; i < numParticles; i++) {
      const isReactant1 = i % 2 === 0;
      const symbol = isReactant1
        ? selectedReaction.reactants[0] || 'R1'
        : selectedReaction.reactants[1] || selectedReaction.reactants[0] || 'R2';

      newParticles.push({
        id: i,
        x: Math.random() * (width - 40) + 20,
        y: Math.random() * (height - 40) + 20,
        vx: (Math.random() - 0.5) * (temperature / 100 + 1),
        vy: (Math.random() - 0.5) * (temperature / 100 + 1),
        radius: 12,
        type: 'reactant',
        symbol,
        color: isReactant1 ? reactantColor1 : reactantColor2,
      });
    }

    particlesRef.current = newParticles;

    // Canvas Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Speed multiplier from temperature & pressure
      const speedMultiplier = (temperature / 300) * (pressure / 50) + 0.5;
      const conversionRatio = simulationProgress / 100;

      particlesRef.current.forEach((p, idx) => {
        // Move particle
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Bounce off walls
        if (p.x - p.radius < 0 || p.x + p.radius > width) p.vx *= -1;
        if (p.y - p.radius < 0 || p.y + p.radius > height) p.vy *= -1;

        // Convert particle to product if simulation progressing
        if (idx < numParticles * conversionRatio) {
          p.type = 'product';
          p.color = productColor;
          p.symbol = selectedReaction.products[0] || 'P';
        } else if (p.type === 'product' && conversionRatio === 0) {
          p.type = 'reactant';
          p.color = idx % 2 === 0 ? reactantColor1 : reactantColor2;
          p.symbol = idx % 2 === 0 ? selectedReaction.reactants[0] : selectedReaction.reactants[1] || selectedReaction.reactants[0];
        }

        // Draw particle sphere
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isSimulating ? 15 : 6;
        ctx.fill();

        // White border ring
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Text label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, p.x, p.y);
      });

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [selectedReaction, temperature, pressure, simulationProgress, isSimulating]);

  // AI Prediction Handler
  const handlePredictReaction = async () => {
    if (!customReactants.trim()) return;
    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/predict-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reactants: customReactants,
          conditions: { temp: temperature, pressure, catalyst: hasCatalyst ? catalyst : 'None' },
        }),
      });
      const data = await res.json();
      setAiResult(data.result || { error: 'Could not predict reaction.' });
    } catch (err) {
      setAiResult({ error: 'Failed to communicate with Reaction AI server.' });
    } finally {
      setAiLoading(false);
    }
  };

  // Calculations for Energy Diagram
  const activationEnergy = selectedReaction.activationEnergy || 180;
  const catalystEaReduction = hasCatalyst ? 60 : 0;
  const effectiveEa = Math.max(20, activationEnergy - catalystEaReduction);
  const deltaH = selectedReaction.deltaH || -90;
  const isExothermic = deltaH < 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Reaction Preset Library Bar */}
      <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" /> Reaction Library Presets
          </h3>
          <span className="text-[10px] text-slate-400 font-mono font-bold">Select preset or build custom</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {REACTIONS_LIBRARY.map((r) => {
            const active = selectedReaction.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectReaction(r)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all border whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 scale-105'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span>{r.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900/40 text-[10px] font-mono">
                  {r.reactionType}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Reaction Stage Chamber & Condition Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Chamber Canvas & Collision Simulator */}
        <div className="lg:col-span-7 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 flex flex-col justify-between">
          
          {/* Reaction Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedReaction.title}</h2>
                <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold border border-amber-500/30">
                  {selectedReaction.reactionType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedReaction.description}</p>
            </div>
          </div>

          {/* Balanced Chemical Equation Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2 shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
              Balanced Chemical Equation
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-cyan-300 tracking-wider">
              {selectedReaction.balancedEquation}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs font-bold pt-1">
              <span className={isExothermic ? 'text-rose-400' : 'text-cyan-400'}>
                Heat of Reaction (ΔH): {selectedReaction.energyChange}
              </span>
              <span className="text-amber-400 font-mono">
                Eₐ = {effectiveEa} kJ/mol
              </span>
            </div>
          </div>

          {/* Interactive Molecular Collision Canvas Chamber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Activity className="w-4 h-4" /> Molecular Collision Simulation Chamber
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Temp: {temperature}°C | Pressure: {pressure} atm
              </span>
            </div>

            <div className="relative w-full h-56 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={224}
                className="w-full h-full block"
              />

              {/* Simulation Progress Overlay Bar */}
              {isSimulating && (
                <div className="absolute inset-x-4 bottom-4 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 backdrop-blur-md space-y-1.5 shadow-xl">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-cyan-300">Reaction Progress & Energy Barrier...</span>
                    <span className="text-amber-400 font-mono">{Math.round(simulationProgress)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-200"
                      style={{ width: `${simulationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reactants -> Products Visual Flow Pills */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Reactants</span>
              <div className="flex flex-wrap gap-2">
                {selectedReaction.reactants.map((r, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-extrabold text-sm border border-cyan-500/30">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ArrowRight className="w-6 h-6 text-amber-400 animate-pulse" />
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">Transform</span>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Products</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {selectedReaction.products.map((p, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-sm border border-emerald-500/30">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Run Simulation Action Button */}
          <button
            onClick={startSimulation}
            disabled={isSimulating}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Simulating Reaction Chamber...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Run Reaction Chamber Simulation</span>
              </>
            )}
          </button>

        </div>

        {/* Right 5 Cols: Condition Sliders & Custom Predictor */}
        <div className="lg:col-span-5 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          
          <div className="space-y-5">
            <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" /> Reaction Chamber Conditions
            </h3>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-400" /> Temperature (T):
                </span>
                <span className="font-mono text-rose-400 font-black text-sm">{temperature} °C</span>
              </div>
              <input
                type="range"
                min="0"
                max="1500"
                step="10"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">
                Higher temperature increases particle velocity and collision kinetic energy.
              </p>
            </div>

            {/* Pressure Slider */}
            <div className="space-y-2">
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
                onChange={(e) => setPressure(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">
                Increasing pressure compresses gas volume, boosting collision frequency.
              </p>
            </div>

            {/* Catalyst Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Catalyst Included
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
                  Catalyst: <strong>{catalyst}</strong> (Lowers Eₐ from {activationEnergy} → {effectiveEa} kJ/mol)
                </div>
              )}
            </div>

          </div>

          {/* AI Reaction Predictor Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Reaction Predictor
              </h4>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">Gemini AI</span>
            </div>

            <input
              type="text"
              value={customReactants}
              onChange={(e) => setCustomReactants(e.target.value)}
              placeholder="e.g. Mg + HCl or Na + H2O..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
            />

            <button
              onClick={handlePredictReaction}
              disabled={aiLoading || !customReactants.trim()}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Predict Products & Thermodynamics
            </button>

            {aiResult && (
              <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 text-xs space-y-1">
                <p className="font-extrabold text-purple-300">
                  {aiResult.balancedEquation || 'Predicted Equation'}
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {aiResult.explanation || JSON.stringify(aiResult)}
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* LOWER SECTION: ENERGY DIAGRAM, MECHANISM EXPLANATION & INDUSTRIAL/SAFETY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 Cols: Energy Profile Diagram (SVG Chart) */}
        <div className="lg:col-span-6 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Reaction Energy Profile Diagram
            </h3>
            <span className="text-[11px] font-mono font-bold text-amber-400">
              Eₐ = {effectiveEa} kJ/mol | ΔH = {deltaH} kJ/mol
            </span>
          </div>

          <div className="h-64 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Axes */}
              <line x1="40" y1="20" x2="40" y2="170" stroke="#475569" strokeWidth="2" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="#475569" strokeWidth="2" />

              {/* Axis Labels */}
              <text x="20" y="100" fill="#94a3b8" fontSize="10" fontWeight="bold" transform="rotate(-90 20 100)" textAnchor="middle">
                Potential Energy (kJ)
              </text>
              <text x="210" y="192" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
                Reaction Coordinate →
              </text>

              {/* Reactant & Product Baseline Energy Levels */}
              {/* Reactant level at y=120 */}
              <line x1="40" y1="120" x2="100" y2="120" stroke="#38bdf8" strokeWidth="3" />
              <text x="70" y="112" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                Reactants
              </text>

              {/* Product level: if exothermic, y=150; if endothermic, y=80 */}
              {(() => {
                const prodY = isExothermic ? 150 : 70;
                const peakY = Math.max(30, 120 - effectiveEa * 0.4);

                return (
                  <g>
                    {/* Uncatalyzed Energy Curve */}
                    <path
                      d={`M 100 120 C 150 ${120 - activationEnergy * 0.4}, 200 ${120 - activationEnergy * 0.4}, 260 ${peakY} C 300 ${prodY}, 330 ${prodY}, 370 ${prodY}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray={hasCatalyst ? '4 4' : 'none'}
                    />

                    {/* Catalyzed Energy Curve if catalyst on */}
                    {hasCatalyst && (
                      <path
                        d={`M 100 120 C 150 ${120 - effectiveEa * 0.4}, 200 ${120 - effectiveEa * 0.4}, 260 ${peakY} C 300 ${prodY}, 330 ${prodY}, 370 ${prodY}`}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                    )}

                    {/* Transition State Peak Marker */}
                    <circle cx="260" cy={peakY} r="5" fill="#f43f5e" />
                    <text x="260" y={peakY - 10} fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">
                      Transition State ‡
                    </text>

                    {/* Product Line */}
                    <line x1="310" y1={prodY} x2="370" y2={prodY} stroke="#10b981" strokeWidth="3" />
                    <text x="340" y={prodY - 8} fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
                      Products
                    </text>

                    {/* Activation Energy E_a Arrow */}
                    <line x1="180" y1="120" x2="180" y2={peakY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="185" y={(120 + peakY) / 2} fill="#f59e0b" fontSize="9" fontWeight="bold">
                      Eₐ = {effectiveEa}
                    </text>

                    {/* Enthalpy Delta H Arrow */}
                    <line x1="350" y1="120" x2="350" y2={prodY} stroke={isExothermic ? '#f43f5e' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="355" y={(120 + prodY) / 2} fill={isExothermic ? '#f43f5e' : '#38bdf8'} fontSize="9" fontWeight="bold">
                      ΔH = {deltaH}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            💡 The curve represents potential energy during molecular collisions. Reactants must absorb activation energy ($E_a$) to reach the <strong>Transition State ‡</strong> before forming stable products with enthalpy change ($\Delta H$).
          </p>
        </div>

        {/* Right 6 Cols: Step-by-Step Reaction Mechanism Breakdown */}
        <div className="lg:col-span-6 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Step-by-Step Reaction Mechanism
              </h3>
              <span className="text-xs font-bold text-slate-300">
                Step {activeStepIndex + 1} of {selectedReaction.stepsExplanation?.length || 4}
              </span>
            </div>

            {/* Steps Timeline Navigation */}
            <div className="space-y-2.5">
              {selectedReaction.stepsExplanation?.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                return (
                  <button
                    key={step.step}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 ${
                        isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {step.step}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER ROW: INDUSTRIAL USES & SAFETY HAZARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Industrial Applications Card */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Real-World & Industrial Uses
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
            {selectedReaction.industrialApplication}
          </p>
        </div>

        {/* Safety Notes & GHS Hazards Card */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Laboratory Safety & GHS Warnings
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
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
                <span>Standard laboratory PPE required: Safety goggles, nitrile gloves, and fume hood operation.</span>
              </li>
            )}
          </ul>
        </div>

      </div>

    </div>
  );
};
