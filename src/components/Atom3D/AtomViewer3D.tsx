import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { AtomCanvas, AtomCanvasRef } from './AtomCanvas';
import { ELEMENTS, CATEGORY_LABELS } from '../../data/elementsData';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  Atom as AtomIcon,
  Layers,
  ZoomIn,
  ZoomOut,
  Move,
  Eye,
  Palette,
  Tag,
  Info,
} from 'lucide-react';

// Aufbau Subshell Definition
const SUBSHELL_ORDER: { name: string; n: number; l: 's' | 'p' | 'd' | 'f'; cap: number; orbitals: number }[] = [
  { name: '1s', n: 1, l: 's', cap: 2, orbitals: 1 },
  { name: '2s', n: 2, l: 's', cap: 2, orbitals: 1 },
  { name: '2p', n: 2, l: 'p', cap: 6, orbitals: 3 },
  { name: '3s', n: 3, l: 's', cap: 2, orbitals: 1 },
  { name: '3p', n: 3, l: 'p', cap: 6, orbitals: 3 },
  { name: '4s', n: 4, l: 's', cap: 2, orbitals: 1 },
  { name: '3d', n: 3, l: 'd', cap: 10, orbitals: 5 },
  { name: '4p', n: 4, l: 'p', cap: 6, orbitals: 3 },
  { name: '5s', n: 5, l: 's', cap: 2, orbitals: 1 },
  { name: '4d', n: 4, l: 'd', cap: 10, orbitals: 5 },
  { name: '5p', n: 5, l: 'p', cap: 6, orbitals: 3 },
  { name: '6s', n: 6, l: 's', cap: 2, orbitals: 1 },
  { name: '4f', n: 4, l: 'f', cap: 14, orbitals: 7 },
  { name: '5d', n: 5, l: 'd', cap: 10, orbitals: 5 },
  { name: '6p', n: 6, l: 'p', cap: 6, orbitals: 3 },
  { name: '7s', n: 7, l: 's', cap: 2, orbitals: 1 },
  { name: '5f', n: 5, l: 'f', cap: 14, orbitals: 7 },
  { name: '6d', n: 6, l: 'd', cap: 10, orbitals: 5 },
  { name: '7p', n: 7, l: 'p', cap: 6, orbitals: 3 },
];

// Ground-state Aufbau / Madelung exceptions (Z -> subshell count overrides)
export const AUFBAU_EXCEPTIONS: Record<number, { overrides: Record<string, number>; reason: string }> = {
  24: { overrides: { '4s': 1, '3d': 5 }, reason: 'Chromium (Z=24): 1 electron promotes from 4s to 3d to achieve a symmetric, half-filled 3d⁵ subshell with maximum exchange energy.' },
  29: { overrides: { '4s': 1, '3d': 10 }, reason: 'Copper (Z=29): 1 electron promotes from 4s to 3d to achieve a completely filled, spherically symmetric 3d¹⁰ subshell.' },
  41: { overrides: { '5s': 1, '4d': 4 }, reason: 'Niobium (Z=41): 5s¹ 4d⁴ configuration minimizes inter-electronic repulsion in the compact 5s orbital.' },
  42: { overrides: { '5s': 1, '4d': 5 }, reason: 'Molybdenum (Z=42): 5s¹ 4d⁵ achieves two half-filled subshells with high exchange stabilization.' },
  44: { overrides: { '5s': 1, '4d': 7 }, reason: 'Ruthenium (Z=44): 5s¹ 4d⁷ lowers electron-electron pairing repulsion.' },
  45: { overrides: { '5s': 1, '4d': 8 }, reason: 'Rhodium (Z=45): 5s¹ 4d⁸ stabilizes radial charge distribution.' },
  46: { overrides: { '5s': 0, '4d': 10 }, reason: 'Palladium (Z=46): Unique 5s⁰ 4d¹⁰ closed-shell d-subshell configuration where both 5s electrons shift to 4d.' },
  47: { overrides: { '5s': 1, '4d': 10 }, reason: 'Silver (Z=47): 5s¹ 4d¹⁰ achieves a full 4d¹⁰ subshell analogous to Copper.' },
  57: { overrides: { '4f': 0, '5d': 1 }, reason: 'Lanthanum (Z=57): 5d orbital lies slightly lower in energy than 4f at the start of the lanthanide series (5d¹ 6s²).' },
  58: { overrides: { '4f': 1, '5d': 1 }, reason: 'Cerium (Z=58): Near-degeneracy of 4f and 5d orbitals yields 4f¹ 5d¹ 6s².' },
  64: { overrides: { '4f': 7, '5d': 1 }, reason: 'Gadolinium (Z=64): Preserves a half-filled 4f⁷ core for maximum exchange stability by placing the next electron in 5d¹.' },
  78: { overrides: { '6s': 1, '5d': 9 }, reason: 'Platinum (Z=78): Relativistic contraction and d-orbital stabilization favor 6s¹ 4f¹⁴ 5d⁹.' },
  79: { overrides: { '6s': 1, '5d': 10 }, reason: 'Gold (Z=79): 6s¹ 4f¹⁴ 5d¹⁰ achieves a closed 5d¹⁰ subshell with strong relativistic 6s contraction.' },
  89: { overrides: { '5f': 0, '6d': 1 }, reason: 'Actinium (Z=89): 6d¹ 7s² is lower in energy than 5f¹ prior to f-shell nuclear collapse.' },
  90: { overrides: { '5f': 0, '6d': 2 }, reason: 'Thorium (Z=90): 6d² 7s² ground state due to diffuse 5f orbital energy.' },
  96: { overrides: { '5f': 7, '6d': 1 }, reason: 'Curium (Z=96): Preserves a half-filled 5f⁷ subshell (5f⁷ 6d¹ 7s²) analogous to Gadolinium.' },
};

export function getAufbauFilling(z: number) {
  let remaining = z;
  const countsMap: Record<string, number> = {};

  for (const sub of SUBSHELL_ORDER) {
    if (remaining <= 0) break;
    const count = Math.min(remaining, sub.cap);
    countsMap[sub.name] = count;
    remaining -= count;
  }

  // Apply real-world quantum exchange-energy exceptions if applicable
  const exception = AUFBAU_EXCEPTIONS[z];
  if (exception) {
    Object.entries(exception.overrides).forEach(([subName, val]) => {
      countsMap[subName] = val;
    });
  }

  const result: { subshell: typeof SUBSHELL_ORDER[0]; filled: number; orbitalSpins: ('up' | 'down')[][] }[] = [];

  for (const sub of SUBSHELL_ORDER) {
    const count = countsMap[sub.name] || 0;
    if (count <= 0) continue;

    const boxes: ('up' | 'down')[][] = Array.from({ length: sub.orbitals }, () => []);

    // Hund's Rule of Maximum Multiplicity: fill all degenerate orbitals singly with parallel spin (↑) before pairing (↓)
    for (let i = 0; i < count; i++) {
      if (i < sub.orbitals) {
        boxes[i].push('up');
      } else {
        boxes[i - sub.orbitals].push('down');
      }
    }

    result.push({
      subshell: sub,
      filled: count,
      orbitalSpins: boxes,
    });
  }

  return result;
}

const SHELL_NAMES = ['K (n=1)', 'L (n=2)', 'M (n=3)', 'N (n=4)', 'O (n=5)', 'P (n=6)', 'Q (n=7)'];

type RenderStyle = 'realistic' | 'neon' | 'wireframe' | 'xray' | 'bohr';

export const AtomViewer3D: React.FC = () => {
  const { selectedElement } = useAppStore();
  const [localElement, setLocalElement] = useState(selectedElement || ELEMENTS[0]);
  const currentElement = localElement;

  useEffect(() => {
    if (selectedElement) setLocalElement(selectedElement);
  }, [selectedElement]);

  const canvasRef = useRef<AtomCanvasRef>(null);

  const handleZoomIn = () => canvasRef.current?.zoomIn();
  const handleZoomOut = () => canvasRef.current?.zoomOut();
  const handleResetCamera = () => canvasRef.current?.resetCamera();

  // Main Mode Tabs
  const [activeMode, setActiveMode] = useState<'3d-atom' | 'aufbau-filling' | 'bohr-quantum' | 'lewis-dot'>('3d-atom');

  // 3D Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [orbitalType, setOrbitalType] = useState<'bohr' | 's' | 'p' | 'd' | 'f' | 'all'>('bohr');
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('realistic');

  // View & Label Controls
  const [showLabels, setShowLabels] = useState(true);
  const [showShells, setShowShells] = useState(true);
  const [showNucleus] = useState(true);

  // Aufbau filling state
  const [fillingStep, setFillingStep] = useState<number>(currentElement.atomicNumber);
  const [autoFilling, setAutoFilling] = useState(false);

  // Bohr quantum jump state
  const [initialShell, setInitialShell] = useState<number>(Math.min(2, Math.max(2, currentElement.bohrShells.length)));
  const [finalShell, setFinalShell] = useState<number>(1);
  const [excitedShell, setExcitedShell] = useState<number | null>(null);
  const [photonEvent, setPhotonEvent] = useState<{
    wavelength: number;
    color: string;
    energy: number;
    eventType: 'Emission' | 'Absorption';
    fromN: number;
    toN: number;
  } | null>(null);

  useEffect(() => {
    setFillingStep(currentElement.atomicNumber);
  }, [currentElement]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (autoFilling) {
      timer = setInterval(() => {
        setFillingStep((prev) => {
          if (prev >= currentElement.atomicNumber) {
            setAutoFilling(false);
            return currentElement.atomicNumber;
          }
          return prev + 1;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [autoFilling, currentElement.atomicNumber]);

  const prevElement = () => {
    const prevZ = currentElement.atomicNumber > 1 ? currentElement.atomicNumber - 1 : 118;
    const found = ELEMENTS.find((e) => e.atomicNumber === prevZ);
    if (found) setLocalElement(found);
  };

  const nextElement = () => {
    const nextZ = currentElement.atomicNumber < 118 ? currentElement.atomicNumber + 1 : 1;
    const found = ELEMENTS.find((e) => e.atomicNumber === nextZ);
    if (found) setLocalElement(found);
  };

  // Calculate Bohr Energy Jump Event (Rydberg formula: ΔE = 13.6 * |1/n_f² - 1/n_i²| eV)
  const triggerQuantumJump = (fromN: number, toN: number) => {
    const actualFrom = fromN === toN ? (toN === 1 ? 2 : 1) : fromN;
    const actualTo = toN;
    setInitialShell(actualFrom);
    setFinalShell(actualTo);

    const eFrom = -13.6 / (actualFrom * actualFrom);
    const eTo = -13.6 / (actualTo * actualTo);
    const deltaE = Math.abs(eFrom - eTo); // eV
    const eventType: 'Emission' | 'Absorption' = actualFrom > actualTo ? 'Emission' : 'Absorption';

    const wavelength = Math.max(1, Math.round(1239.84 / deltaE));

    let color = '#38bdf8';
    if (wavelength < 380) color = '#a855f7'; // UV
    else if (wavelength < 450) color = '#818cf8'; // Violet
    else if (wavelength < 495) color = '#38bdf8'; // Blue/Cyan
    else if (wavelength < 570) color = '#4ade80'; // Green
    else if (wavelength < 590) color = '#facc15'; // Yellow
    else if (wavelength < 620) color = '#f97316'; // Orange
    else color = '#ef4444'; // Red / IR

    setExcitedShell(actualTo);
    setPhotonEvent({
      wavelength,
      color,
      energy: Number(deltaE.toFixed(2)),
      eventType,
      fromN: actualFrom,
      toN: actualTo,
    });

    setTimeout(() => {
      setExcitedShell(null);
    }, 1200);
  };

  const protonCount = currentElement.atomicNumber;
  const neutronCount = Math.max(0, Math.round(currentElement.atomicMass) - protonCount);
  const aufbauData = getAufbauFilling(fillingStep);
  const activeException = AUFBAU_EXCEPTIONS[fillingStep];

  return (
    <div className="space-y-5">
      {/* Top Header: Element Selector & Mode Navigation Combined for PC Efficiency */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
          <button
            onClick={prevElement}
            className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-cyan-400 font-mono">{currentElement.symbol}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-white">{currentElement.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono font-bold border border-slate-700">
                  Z = {currentElement.atomicNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {CATEGORY_LABELS[currentElement.category]} • {currentElement.electronConfiguration}
              </div>
            </div>
          </div>

          <button
            onClick={nextElement}
            className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: '3d-atom', label: '3D Quantum Stage', icon: <AtomIcon className="w-3.5 h-3.5" /> },
            { id: 'aufbau-filling', label: 'Aufbau Orbital Filling', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
            { id: 'bohr-quantum', label: 'Bohr Quantum Transitions', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
            { id: 'lewis-dot', label: 'Lewis Dot & Valence', icon: <Layers className="w-3.5 h-3.5 text-purple-400" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeMode === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: 3D QUANTUM ATOM STAGE (PC Widescreen 8:4 Split) */}
      {activeMode === '3d-atom' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* Left 8 Cols: 3D Viewport Stage */}
          <div className="lg:col-span-8 relative w-full h-[520px] xl:h-[620px] rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
            <div className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing">
              <AtomCanvas
                ref={canvasRef}
                element={currentElement}
                renderStyle={renderStyle as any}
                orbitalType={orbitalType as any}
                showNucleus={showNucleus}
                showShells={showShells}
                showLabels={showLabels}
                isPlaying={isPlaying}
                rotationSpeed={speed}
              />
            </div>

            {/* Top Overlay Controls */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
              <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Rotate'}</span>
                </button>

                <div className="flex items-center gap-2 px-2 text-xs text-slate-300 border-l border-slate-800">
                  <span>Speed:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.2"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-16 accent-cyan-400 cursor-pointer"
                  />
                  <span className="font-mono text-cyan-400 font-bold">{speed}x</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
                <div className="hidden sm:flex items-center gap-1.5 px-2 text-[11px] font-mono text-slate-400 border-r border-slate-800 mr-1">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Drag: 360° | Scroll: Zoom</span>
                </div>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer border border-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer border border-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetCamera}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-all cursor-pointer border border-slate-700 flex items-center gap-1 text-xs font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>

            {/* Bottom Overlay Controls */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
              <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md text-xs">
                <Palette className="w-3.5 h-3.5 text-purple-400 mx-1.5" />
                {(['realistic', 'neon', 'wireframe', 'xray', 'bohr'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setRenderStyle(style)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-bold transition-all cursor-pointer ${
                      renderStyle === style
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md text-xs">
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    showLabels ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> Labels
                </button>
                <button
                  onClick={() => setShowShells(!showShells)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    showShells ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Shells
                </button>
                <select
                  value={orbitalType}
                  onChange={(e) => setOrbitalType(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold cursor-pointer"
                >
                  <option value="bohr">Bohr Shells Only</option>
                  <option value="s">s-Orbital (Spherical)</option>
                  <option value="p">p-Orbital (Dumbbell)</option>
                  <option value="d">d-Orbital (Cloverleaf)</option>
                  <option value="f">f-Orbital (Complex)</option>
                  <option value="all">All Orbitals Combined</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: PC Quantum & Subatomic Inspector Panel */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4">
            {/* Subatomic Particles Card */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3">
              <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
                Subatomic Composition
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30">
                  <div className="text-[10px] font-bold text-rose-400 uppercase">Protons (p⁺)</div>
                  <div className="text-xl font-mono font-black text-white mt-0.5">{protonCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-blue-500/30">
                  <div className="text-[10px] font-bold text-blue-400 uppercase">Neutrons (n⁰)</div>
                  <div className="text-xl font-mono font-black text-white mt-0.5">{neutronCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase">Electrons (e⁻)</div>
                  <div className="text-xl font-mono font-black text-white mt-0.5">{protonCount}</div>
                </div>
              </div>
            </div>

            {/* Electron Configuration & Shells Card */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3">
              <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                Quantum Shell Distribution
              </h4>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm font-bold text-emerald-300">
                {currentElement.electronConfiguration}
              </div>
              <div className="space-y-1.5">
                {currentElement.bohrShells.map((count, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 font-bold">{SHELL_NAMES[idx]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${Math.min(100, (count / (2 * (idx + 1) * (idx + 1))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-cyan-300 font-bold w-10 text-right">{count} e⁻</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Physical & Atomic Metrics Card */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-2.5 flex-1 flex flex-col justify-between">
              <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
                Atomic & Physical Telemetry
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Atomic Mass</span>
                  <strong className="font-mono text-white">{currentElement.atomicMass} u</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Standard Phase</span>
                  <strong className="capitalize text-emerald-400">{currentElement.state}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Electronegativity</span>
                  <strong className="font-mono text-cyan-300">{currentElement.electronegativity ?? 'N/A'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Atomic Radius</span>
                  <strong className="font-mono text-amber-300">
                    {currentElement.atomicRadius ? `${currentElement.atomicRadius} pm` : 'N/A'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Valence Electrons</span>
                  <strong className="font-mono text-purple-300">{currentElement.valenceElectrons} e⁻</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Density</span>
                  <strong className="font-mono text-white">
                    {currentElement.density ? `${currentElement.density} g/cm³` : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: AUFBAU ELECTRON FILLING ANIMATION */}
      {activeMode === 'aufbau-filling' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Aufbau Principle, Hund&apos;s Rule & Pauli Exclusion Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Simulates step-by-step subshell filling according to Madelung (n + l) energy ordering, Hund&apos;s maximum multiplicity rule (↑ before ↓), and real quantum exchange exceptions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFillingStep(1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Reset (Z=1)
              </button>
              <button
                onClick={() => setFillingStep((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                -1 e⁻
              </button>
              <button
                onClick={() => setAutoFilling(!autoFilling)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  autoFilling ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {autoFilling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {autoFilling ? 'Pause Auto Fill' : 'Auto Fill Sequence'}
              </button>
              <button
                onClick={() => setFillingStep((prev) => Math.min(currentElement.atomicNumber, prev + 1))}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                +1 e⁻
              </button>
            </div>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-400 font-mono">
              <span>Filling Step: {fillingStep} / {currentElement.atomicNumber} Electrons</span>
              <span className="text-cyan-400">
                Isoelectronic Neutral Ground State: {ELEMENTS.find((e) => e.atomicNumber === fillingStep)?.name || currentElement.name} (Z={fillingStep})
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={currentElement.atomicNumber}
              value={fillingStep}
              onChange={(e) => setFillingStep(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Quantum Exchange Stabilization Exception Alert */}
          {activeException && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-300 uppercase tracking-wide block">
                  Aufbau / Madelung Rule Exception Detected
                </span>
                <p className="text-slate-200 mt-0.5">{activeException.reason}</p>
              </div>
            </div>
          )}

          {/* Subshell Orbital Box Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {aufbauData.map(({ subshell, filled, orbitalSpins }) => (
              <motion.div
                key={subshell.name}
                layout
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-extrabold text-cyan-400 text-sm">
                    {subshell.name} <span className="text-[10px] text-slate-500">(n+l = {subshell.n + (subshell.l === 's' ? 0 : subshell.l === 'p' ? 1 : subshell.l === 'd' ? 2 : 3)})</span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    {filled} / {subshell.cap} e⁻
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
                  {orbitalSpins.map((spins, boxIdx) => (
                    <div
                      key={boxIdx}
                      className="w-9 h-11 rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center gap-0.5 font-bold font-mono text-sm shadow-inner"
                    >
                      {spins.map((spin, sIdx) => (
                        <span
                          key={sIdx}
                          className={spin === 'up' ? 'text-amber-400' : 'text-cyan-400'}
                        >
                          {spin === 'up' ? '↑' : '↓'}
                        </span>
                      ))}
                      {spins.length === 0 && <span className="text-slate-700 text-xs">•</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 3: BOHR QUANTUM TRANSITIONS & PHOTON EMISSION */}
      {activeMode === 'bohr-quantum' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> Quantum Bohr Model & Spectral Photon Transitions
              </h3>
              <p className="text-xs text-slate-400">
                Select initial shell (nᵢ) and final shell (n_f) or click any ring to simulate electron excitation/relaxation and calculate photon energy ΔE and wavelength λ.
              </p>
            </div>

            {/* Shell Transition Selector Controls */}
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold">From nᵢ:</span>
              <select
                value={initialShell}
                onChange={(e) => setInitialShell(Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>n = {n}</option>
                ))}
              </select>
              <span className="text-slate-400 font-bold">→ To n_f:</span>
              <select
                value={finalShell}
                onChange={(e) => setFinalShell(Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>n = {n}</option>
                ))}
              </select>
              <button
                onClick={() => triggerQuantumJump(initialShell, finalShell)}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold cursor-pointer transition-all"
              >
                Trigger Jump
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Interactive Concentric Bohr Model */}
            <div className="relative w-full h-80 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden p-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-xl z-10 border border-amber-300/40">
                <span>{currentElement.symbol}</span>
                <span className="text-[9px] font-mono text-amber-200">+{protonCount}</span>
              </div>

              {currentElement.bohrShells.map((count, sIdx) => {
                const n = sIdx + 1;
                const radius = 42 + sIdx * 18;
                const isExcited = excitedShell === n;

                return (
                  <button
                    key={n}
                    onClick={() => triggerQuantumJump(initialShell, n)}
                    className={`absolute rounded-full border-2 transition-all cursor-pointer ${
                      isExcited
                        ? 'border-cyan-400 shadow-lg shadow-cyan-400/50 scale-105'
                        : 'border-slate-700/60 hover:border-cyan-400/80'
                    }`}
                    style={{
                      width: `${radius * 2}px`,
                      height: `${radius * 2}px`,
                    }}
                    title={`Click shell n=${n} to simulate quantum transition`}
                  >
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-slate-900 px-1 rounded">
                      n={n} ({count}e⁻)
                    </span>
                  </button>
                );
              })}

              {photonEvent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-3 px-4 py-2 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl flex items-center gap-3 text-xs font-mono"
                >
                  <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: photonEvent.color }} />
                  <span className="text-slate-200 font-bold">
                    Photon {photonEvent.eventType} (n={photonEvent.fromN} → n={photonEvent.toN}): ΔE = {photonEvent.energy} eV | λ = {photonEvent.wavelength} nm
                  </span>
                </motion.div>
              )}
            </div>

            {/* Energy Level Diagram */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Bohr Principal Energy Levels (Eₙ = −13.6 / n² eV)
              </h4>

              <div className="space-y-2">
                {currentElement.bohrShells.map((count, sIdx) => {
                  const n = sIdx + 1;
                  const eVal = (-13.6 / (n * n)).toFixed(2);

                  return (
                    <div
                      key={n}
                      onClick={() => triggerQuantumJump(n, 1)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer text-xs"
                    >
                      <span className="font-mono font-bold text-cyan-400">
                        n={n} ({SHELL_NAMES[sIdx]})
                      </span>
                      <span className="text-slate-400 font-mono">{count} electrons</span>
                      <span className="font-mono font-bold text-amber-400">{eVal} eV</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: LEWIS DOT STRUCTURE & VALENCE */}
      {activeMode === 'lewis-dot' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" /> Lewis Dot & Valence Electron Configuration
            </h3>
            <p className="text-xs text-slate-400">
              Follows Gilbert Lewis & Hund&apos;s pairing convention: valence electrons occupy the 4 compass sides singly first (1–4) before pairing (5–8).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-40 h-40 flex items-center justify-center bg-slate-900 rounded-3xl border-2 border-purple-500/40 shadow-xl">
                <span className="text-4xl font-extrabold text-white">{currentElement.symbol}</span>

                {Array.from({ length: Math.min(currentElement.valenceElectrons, 8) }).map((_, i) => {
                  // Proper paired compass positions (Top, Right, Bottom, Left)
                  const positions = [
                    'top-3 left-1/2 -translate-x-2.5',     // 1: Top single/left
                    'right-3 top-1/2 -translate-y-2.5',   // 2: Right single/top
                    'bottom-3 left-1/2 -translate-x-2.5', // 3: Bottom single/left
                    'left-3 top-1/2 -translate-y-2.5',    // 4: Left single/top
                    'top-3 left-1/2 translate-x-1.5',     // 5: Top pair
                    'right-3 top-1/2 translate-y-1.5',    // 6: Right pair
                    'bottom-3 left-1/2 translate-x-1.5',  // 7: Bottom pair
                    'left-3 top-1/2 translate-y-1.5',     // 8: Left pair
                  ];
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className={`absolute w-3.5 h-3.5 rounded-full bg-purple-400 shadow-md shadow-purple-400/80 ${positions[i]}`}
                    />
                  );
                })}
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-purple-300">
                  {currentElement.valenceElectrons} Valence Electrons
                </span>
                <p className="text-xs text-slate-400">
                  {currentElement.category === 'noble-gas'
                    ? `Closed valence shell (${currentElement.atomicNumber === 2 ? 'Duet 1s²' : 'Octet ns²np⁶'} — Chemically Inert)`
                    : currentElement.valenceElectrons === 8
                    ? 'Closed d/s shell configuration'
                    : `Requires ${Math.max(0, (currentElement.period === 1 ? 2 : 8) - currentElement.valenceElectrons)} electron(s) to complete ${currentElement.period === 1 ? 'duet' : 'octet'}.`}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-cyan-400 uppercase tracking-wider">Reactivity & Bonding Summary</h4>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                  <span>Group Number:</span>
                  <strong className="text-white font-mono">{currentElement.group}</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                  <span>Valence Electrons:</span>
                  <strong className="text-purple-400 font-mono">{currentElement.valenceElectrons}</strong>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                  <span>Common Oxidation States:</span>
                  <strong className="text-emerald-400 font-mono">
                    {currentElement.oxidationStates.map((s) => (s > 0 ? `+${s}` : `${s}`)).join(', ')}
                  </strong>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-900">
                  <span>Orbital Block:</span>
                  <strong className="text-amber-400 uppercase font-mono">{currentElement.block}-block</strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

