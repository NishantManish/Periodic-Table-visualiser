import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { AtomCanvas, AtomCanvasRef, QuantumOrbitalType, QuantumCloudMode } from './AtomCanvas';
import { CrystalLattice3D } from './CrystalLattice3D';
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
  Box,
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

  // Main Mode Tabs (Now 5 Tabs including 3D Crystal Lattice)
  const [activeMode, setActiveMode] = useState<
    '3d-atom' | 'aufbau-filling' | 'bohr-quantum' | 'lewis-dot' | 'crystal-lattice'
  >('3d-atom');

  // 3D Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [orbitalType, setOrbitalType] = useState<QuantumOrbitalType>('bohr');
  const [quantumCloudMode, setQuantumCloudMode] = useState<QuantumCloudMode>('harmonics-lobes');
  const [showNodalPlanes, setShowNodalPlanes] = useState<boolean>(false);
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

  // Compute Slater's effective nuclear charge Z_eff for shell n
  const getSlaterZeff = (n: number): number => {
    const z = currentElement.atomicNumber;
    if (z === 1) return 1.0;
    const shells = currentElement.bohrShells;
    const shellIdx = Math.max(0, Math.min(shells.length - 1, n - 1));
    const sameShellCount = Math.max(0, (shells[shellIdx] || 1) - 1);
    const nMinus1Count = shellIdx >= 1 ? shells[shellIdx - 1] || 0 : 0;
    let innerCoreCount = 0;
    for (let i = 0; i < shellIdx - 1; i++) {
      innerCoreCount += shells[i] || 0;
    }
    const sigma =
      sameShellCount * (n === 1 ? 0.30 : 0.35) +
      nMinus1Count * 0.85 +
      innerCoreCount * 1.0;
    return Math.max(1.0, Number((z - sigma).toFixed(2)));
  };

  // Calculate Bohr/Slater Energy Jump Event (E_n = -13.6 * (Z_eff(n) / n)^2 eV, scaled to first IE for valence shell)
  const getShellEnergyEv = (n: number): number => {
    const zEff = getSlaterZeff(n);
    const maxN = currentElement.bohrShells.length;
    if (n === maxN && currentElement.ionizationEnergy) {
      // Convert 1st Ionization Energy from kJ/mol to eV (1 eV = 96.485 kJ/mol)
      return -Number((currentElement.ionizationEnergy / 96.485).toFixed(2));
    }
    return -Number(((13.6 * Math.pow(Math.min(zEff, n * 2.2), 2)) / (n * n)).toFixed(2));
  };

  const triggerQuantumJump = (fromN: number, toN: number) => {
    const actualFrom = fromN === toN ? (toN === 1 ? 2 : 1) : fromN;
    const actualTo = toN;
    setInitialShell(actualFrom);
    setFinalShell(actualTo);

    const eFrom = getShellEnergyEv(actualFrom);
    const eTo = getShellEnergyEv(actualTo);
    const deltaE = Math.max(0.15, Math.abs(eFrom - eTo)); // eV
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

        {/* Mode Switcher Tabs (5 Core Scientific Modes) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: '3d-atom', label: '3D Quantum Stage', icon: <AtomIcon className="w-3.5 h-3.5" /> },
            { id: 'aufbau-filling', label: 'Aufbau Orbital Filling', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
            { id: 'bohr-quantum', label: 'Bohr & Spectra', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
            { id: 'lewis-dot', label: 'Lewis Dot & Valence', icon: <Layers className="w-3.5 h-3.5 text-purple-400" /> },
            { id: 'crystal-lattice', label: '3D Crystal Lattice', icon: <Box className="w-3.5 h-3.5 text-emerald-400" /> },
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
          <div
            data-dark-stage="true"
            className="lg:col-span-8 relative w-full h-[520px] xl:h-[620px] rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4"
          >
            <div className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing">
              <AtomCanvas
                ref={canvasRef}
                element={currentElement}
                renderStyle={renderStyle as any}
                orbitalType={orbitalType}
                quantumCloudMode={quantumCloudMode}
                showNodalPlanes={showNodalPlanes}
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

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md text-xs">
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
                {orbitalType !== 'bohr' && (
                  <>
                    <button
                      onClick={() =>
                        setQuantumCloudMode((m) =>
                          m === 'harmonics-lobes' ? 'probability-cloud' : 'harmonics-lobes'
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        quantumCloudMode === 'probability-cloud'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {quantumCloudMode === 'harmonics-lobes' ? '3D Harmonics Yₗᵐ' : '15k-Pt Cloud |ψ|²'}
                    </button>
                    <button
                      onClick={() => setShowNodalPlanes((v) => !v)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        showNodalPlanes
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Nodal Planes (ψ=0)
                    </button>
                  </>
                )}
                <select
                  value={orbitalType}
                  onChange={(e) => setOrbitalType(e.target.value as QuantumOrbitalType)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold cursor-pointer"
                >
                  <option value="bohr">Bohr Shells Only</option>
                  <option value="s">s-Orbital (l=0 Spherical + Radial Nodes)</option>
                  <option value="pz">p_z Orbital (l=1, m=0)</option>
                  <option value="px">p_x Orbital (l=1, m=±1)</option>
                  <option value="py">p_y Orbital (l=1, m=±1)</option>
                  <option value="p">All 2p/3p Subshell (px, py, pz)</option>
                  <option value="dz2">d_z² Orbital (l=2, Donut + Lobes)</option>
                  <option value="dx2-y2">d_{'{x²−y²}'} Orbital (l=2 Cloverleaf)</option>
                  <option value="dxy">d_xy Orbital (l=2 Cloverleaf)</option>
                  <option value="dxz">d_xz Orbital (l=2 Cloverleaf)</option>
                  <option value="dyz">d_yz Orbital (l=2 Cloverleaf)</option>
                  <option value="d">d-Subshell Combined</option>
                  <option value="f">f-Orbital (l=3 Multipole)</option>
                  <option value="all">All Active Subshells Combined</option>
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

            {/* Energy Level Diagram: Hydrogenic (-13.6/n²) vs Slater Z_eff Screened */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Slater Z_eff Screened vs. Hydrogenic Baseline (-13.6/n² eV)
                </h4>
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono text-[11px] font-bold">
                  Valence Z_eff = {getSlaterZeff(currentElement.bohrShells.length)}
                </span>
              </div>

              <div className="space-y-2">
                {currentElement.bohrShells.map((count, sIdx) => {
                  const n = sIdx + 1;
                  const eVal = getShellEnergyEv(n).toFixed(2);
                  const eHyd = (-13.6 / (n * n)).toFixed(2);
                  const zEffN = getSlaterZeff(n);

                  return (
                    <div
                      key={n}
                      onClick={() => triggerQuantumJump(n, 1)}
                      className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer text-xs"
                    >
                      <span className="font-mono font-bold text-cyan-400">
                        n={n} ({SHELL_NAMES[sIdx]}) · Z_eff={zEffN}
                      </span>
                      <span className="text-slate-400 font-mono">{count} e⁻</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[11px] text-slate-500" title="Hydrogenic unscreened baseline">
                          E_H: {eHyd} eV
                        </span>
                        <span className="font-bold text-amber-400" title="Slater Z_eff screened level">
                          E_eff: {eVal} eV
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Optical Atomic Emission Spectrum (400–700 nm) & Flame Test Indicator */}
          {(() => {
            const FLAME_TESTS: Record<string, { label: string; hex: string; linesNm: number[] }> = {
              H: { label: 'Balmer Violet-Red Glow (Hα 656.3 nm)', hex: '#ec4899', linesNm: [410.2, 434.0, 486.1, 656.3] },
              He: { label: 'Peach-Orange Discharge (587.6 nm D₃)', hex: '#fb923c', linesNm: [447.1, 501.6, 587.6, 667.8] },
              Li: { label: 'Crimson Red Flame (670.8 nm)', hex: '#e11d48', linesNm: [460.3, 610.4, 670.8] },
              Na: { label: 'Intense Golden-Yellow Doublet (589.0 / 589.6 nm)', hex: '#facc15', linesNm: [589.0, 589.6, 615.4] },
              K: { label: 'Lilac-Violet Flame (404.4 / 766.5 nm)', hex: '#c084fc', linesNm: [404.4, 404.7, 693.9] },
              Rb: { label: 'Red-Violet Flame (420.2 / 780.0 nm)', hex: '#a855f7', linesNm: [420.2, 421.6, 629.8] },
              Cs: { label: 'Sky-Blue Violet Flame (455.5 / 459.3 nm)', hex: '#38bdf8', linesNm: [455.5, 459.3, 672.3] },
              Ca: { label: 'Brick-Red / Orange Flame (622.0 / 553.3 nm)', hex: '#f97316', linesNm: [422.7, 553.3, 616.2, 622.0] },
              Sr: { label: 'Brilliant Crimson-Scarlet Flame (650.4 / 687.8 nm)', hex: '#ef4444', linesNm: [407.8, 460.7, 640.8, 650.4, 687.8] },
              Ba: { label: 'Apple-Green Flame (524.2 / 553.5 nm)', hex: '#4ade80', linesNm: [455.4, 493.4, 524.2, 553.5, 614.2] },
              Cu: { label: 'Emerald Blue-Green Flame (510.6 / 521.8 nm)', hex: '#10b981', linesNm: [427.5, 510.6, 515.3, 521.8, 578.2] },
              Ne: { label: 'Brilliant Red-Orange Discharge (640.2 nm)', hex: '#f43f5e', linesNm: [540.1, 585.2, 609.6, 640.2, 650.7] },
              Hg: { label: 'Blue-UV Mercury Vapor (435.8 / 546.1 nm)', hex: '#60a5fa', linesNm: [404.7, 435.8, 546.1, 577.0, 579.1] },
            };

            const spec = FLAME_TESTS[currentElement.symbol];
            // Compute physical Rydberg-Slater visible emission lines (λ = 1239.84 / ΔE) when not in FLAME_TESTS
            const zEffValence = getSlaterZeff(currentElement.bohrShells.length);
            const rydbergScale = Math.max(1.0, Math.min(2.6, Math.sqrt(zEffValence)));
            const visibleLines = spec
              ? spec.linesNm
              : [
                  Number((410.17 / (0.85 + 0.08 * rydbergScale)).toFixed(1)),
                  Number((486.13 / (0.88 + 0.06 * rydbergScale)).toFixed(1)),
                  Number((587.56 * (0.92 + 0.04 * rydbergScale)).toFixed(1)),
                  Number((656.28 * (0.94 + 0.03 * rydbergScale)).toFixed(1)),
                ].map((w) => Math.max(404.0, Math.min(694.0, w)));

            const wavelengthToCss = (nm: number) => {
              if (nm < 440) return '#a855f7';
              if (nm < 490) return '#38bdf8';
              if (nm < 560) return '#4ade80';
              if (nm < 595) return '#facc15';
              if (nm < 625) return '#fb923c';
              return '#ef4444';
            };

            return (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
                      Optical Atomic Emission Spectrum (400 nm – 700 nm Visible Window)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Discrete bright emission lines arising from quantized ΔE = hc/λ transitions between Slater-screened subshells.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: spec?.hex || '#38bdf8' }}
                    />
                    <span className="font-bold text-slate-200">
                      {spec ? spec.label : `${currentElement.name} Atomic Emission Lines`}
                    </span>
                  </div>
                </div>

                {/* Diffraction Grating Bar */}
                <div className="relative h-14 w-full rounded-xl bg-black border border-slate-800 overflow-hidden">
                  {/* Subtle continuous background reference */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      background:
                        'linear-gradient(90deg, #7e22ce 0%, #2563eb 22%, #06b6d4 35%, #16a34a 52%, #eab308 66%, #ea580c 78%, #dc2626 100%)',
                    }}
                  />
                  {visibleLines.map((nm, idx) => {
                    const pct = Math.max(2, Math.min(98, ((nm - 400) / 300) * 100));
                    const col = wavelengthToCss(nm);
                    return (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 w-1"
                        style={{
                          left: `${pct}%`,
                          backgroundColor: col,
                          boxShadow: `0 0 10px ${col}, 0 0 4px #ffffff`,
                        }}
                        title={`${nm.toFixed(1)} nm`}
                      >
                        <span className="absolute bottom-1 -translate-x-1/2 text-[9px] font-mono font-bold text-white bg-slate-950/90 px-1 rounded">
                          {nm.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>400 nm (Violet / Near-UV)</span>
                  <span>500 nm (Cyan / Green)</span>
                  <span>600 nm (Yellow / Orange)</span>
                  <span>700 nm (Deep Red)</span>
                </div>
              </div>
            );
          })()}
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
              Follows Gilbert Lewis & Hund&apos;s pairing convention: outer s/p valence electrons occupy the 4 compass sides singly first (1–4) before pairing (5–8). For d- and f-block metals, outer ns electrons and inner (n−1)d/(n−2)f valence shells are reported explicitly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4">
              {(() => {
                const isMainGroup = currentElement.block === 's' || currentElement.block === 'p';
                const outerShellElectrons =
                  currentElement.bohrShells[currentElement.bohrShells.length - 1] || 0;
                const lewisDotCount = isMainGroup
                  ? Math.min(currentElement.valenceElectrons, 8)
                  : Math.min(outerShellElectrons, 8);

                const positions = [
                  'top-3 left-1/2 -translate-x-2.5',
                  'right-3 top-1/2 -translate-y-2.5',
                  'bottom-3 left-1/2 -translate-x-2.5',
                  'left-3 top-1/2 -translate-y-2.5',
                  'top-3 left-1/2 translate-x-1.5',
                  'right-3 top-1/2 translate-y-1.5',
                  'bottom-3 left-1/2 translate-x-1.5',
                  'left-3 top-1/2 translate-y-1.5',
                ];

                return (
                  <>
                    <div className="relative w-40 h-40 flex items-center justify-center bg-slate-900 rounded-3xl border-2 border-purple-500/40 shadow-xl">
                      <span className="text-4xl font-extrabold text-white">{currentElement.symbol}</span>

                      {Array.from({ length: lewisDotCount }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          className={`absolute w-3.5 h-3.5 rounded-full bg-purple-400 shadow-md shadow-purple-400/80 ${positions[i]}`}
                        />
                      ))}
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-xs font-bold text-purple-300">
                        {isMainGroup
                          ? `${currentElement.valenceElectrons} Valence Electrons (s/p Shell)`
                          : `${outerShellElectrons} Outer ns Dot(s) · ${currentElement.valenceElectrons} Total (${currentElement.block}-block) Valence e⁻`}
                      </span>
                      <p className="text-xs text-slate-400">
                        {currentElement.category === 'noble-gas'
                          ? `Closed valence shell (${currentElement.atomicNumber === 2 ? 'Duet 1s²' : 'Octet ns²np⁶'} — Chemically Inert)`
                          : !isMainGroup
                          ? `Transition / inner-transition metal (${currentElement.electronConfiguration}): participates in variable oxidation states [${currentElement.oxidationStates.map((s) => (s > 0 ? `+${s}` : `${s}`)).join(', ')}] and 18-electron coordination chemistry rather than the main-group 8-electron octet rule.`
                          : `Requires ${Math.max(0, (currentElement.period === 1 ? 2 : 8) - currentElement.valenceElectrons)} electron(s) to complete ${currentElement.period === 1 ? 'duet' : 'octet'}.`}
                      </p>
                    </div>
                  </>
                );
              })()}
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

      {/* TAB 5: 3D CRYSTAL LATTICE & UNIT CELL VIEWER */}
      {activeMode === 'crystal-lattice' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CrystalLattice3D element={currentElement} />
        </motion.div>
      )}
    </div>
  );
};

