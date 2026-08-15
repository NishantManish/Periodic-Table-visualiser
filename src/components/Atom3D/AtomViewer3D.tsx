import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { AtomCanvas, AtomCanvasRef } from './AtomCanvas';
import { ELEMENTS, CATEGORY_LABELS, CATEGORY_COLORS } from '../../data/elementsData';
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
  EyeOff,
  Palette,
  Sliders,
  Tag,
  Maximize2,
  RefreshCw,
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

export function getAufbauFilling(z: number) {
  let remaining = z;
  const result: { subshell: typeof SUBSHELL_ORDER[0]; filled: number; orbitalSpins: ('up' | 'down')[][] }[] = [];

  for (const sub of SUBSHELL_ORDER) {
    if (remaining <= 0) break;
    const count = Math.min(remaining, sub.cap);
    remaining -= count;

    const boxes: ('up' | 'down')[][] = Array.from({ length: sub.orbitals }, () => []);

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

  // Sync local element if selectedElement changes globally
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
  const [showNucleus, setShowNucleus] = useState(true);

  // Aufbau filling state
  const [fillingStep, setFillingStep] = useState<number>(currentElement.atomicNumber);
  const [autoFilling, setAutoFilling] = useState(false);

  // Bohr quantum jump state
  const [excitedShell, setExcitedShell] = useState<number | null>(null);
  const [photonEvent, setPhotonEvent] = useState<{ wavelength: number; color: string; energy: number } | null>(null);

  

  // Synchronize fillingStep with currentElement
  useEffect(() => {
    setFillingStep(currentElement.atomicNumber);
  }, [currentElement]);

  // Aufbau auto-filling timer
  useEffect(() => {
    let timer: any;
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

  // Prev / Next element
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


  // Calculate Bohr Energy Jump Event
  const triggerQuantumJump = (fromShell: number, toShell: number) => {
    const eFrom = -13.6 / (fromShell * fromShell);
    const eTo = -13.6 / (toShell * toShell);
    const deltaE = Math.abs(eFrom - eTo); // eV

    const wavelength = Math.round(1240 / deltaE);

    let color = '#38bdf8';
    if (wavelength < 400) color = '#c084fc';
    else if (wavelength < 450) color = '#818cf8';
    else if (wavelength < 500) color = '#38bdf8';
    else if (wavelength < 570) color = '#4ade80';
    else if (wavelength < 620) color = '#facc15';
    else if (wavelength < 700) color = '#f97316';
    else color = '#ef4444';

    setExcitedShell(toShell);
    setPhotonEvent({ wavelength, color, energy: Number(deltaE.toFixed(2)) });

    setTimeout(() => {
      setExcitedShell(null);
    }, 1200);
  };

  const protonCount = currentElement.atomicNumber;
  const neutronCount = Math.round(currentElement.atomicMass) - protonCount;
  const aufbauData = getAufbauFilling(fillingStep);

  return (
    <div className="space-y-6">
      
      {/* Element Selector Banner */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-4 bg-slate-900/40 p-3 md:p-5 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-2xl">
        <button
          onClick={prevElement}
          className="p-2 md:p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-1 md:gap-2 text-sm font-bold transition-all shadow-md cursor-pointer border border-slate-700/50"
        >
          <ChevronLeft className="w-4 h-4" /> <span className="hidden md:inline">Prev</span>
        </button>

        <div className="text-center flex flex-col items-center justify-center min-w-0">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 drop-shadow-sm">{currentElement.symbol}</span>
            <span className="text-xl md:text-2xl font-extrabold text-slate-100 truncate">{currentElement.name}</span>
            <span className="text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-full bg-slate-800/80 text-cyan-300 font-mono font-bold border border-slate-700 shadow-inner whitespace-nowrap">
              Z = {currentElement.atomicNumber}
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-slate-400 mt-2 tracking-wide truncate max-w-full">
            Cat: <strong className="text-cyan-300 capitalize">{CATEGORY_LABELS[currentElement.category]}</strong> <span className="opacity-50 mx-1 md:mx-2">|</span> Config:{' '}
            <strong className="text-emerald-400 font-mono">{currentElement.electronConfiguration}</strong>
          </p>
        </div>

        <button
          onClick={nextElement}
          className="p-2 md:p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-1 md:gap-2 text-sm font-bold transition-all shadow-md cursor-pointer border border-slate-700/50"
        >
          <span className="hidden md:inline">Next</span> <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-2 pt-2">
        {[
          { id: '3d-atom', label: '3D Quantum Atom Stage', icon: <AtomIcon className="w-4 h-4" /> },
          { id: 'aufbau-filling', label: 'Aufbau Electron Filling', icon: <Zap className="w-4 h-4 text-amber-400" /> },
          { id: 'bohr-quantum', label: 'Bohr Quantum Transitions', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
          { id: 'lewis-dot', label: 'Lewis Dot & Valence', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMode(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-2xl transition-all border cursor-pointer whitespace-nowrap shadow-sm ${
              activeMode === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-cyan-500/30 scale-105'
                : 'bg-slate-900/60 text-slate-300 border-slate-700/50 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: 3D QUANTUM ATOM STAGE */}
      {activeMode === '3d-atom' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Main 3D Stage Container */}
          <div className="relative w-full h-[600px] md:h-[700px] rounded-[2rem] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col justify-between p-5">
            
            
            {/* React Three Fiber Canvas */}
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


            {/* Top Toolbar: Play/Pause, Speed & Camera Controls */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
              
              <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title={isPlaying ? 'Pause Auto Rotation' : 'Play Auto Rotation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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

              {/* 3D Camera Controls & View Navigation */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
                <div className="hidden sm:flex items-center gap-1.5 px-2 text-[11px] font-mono text-slate-400 border-r border-slate-800 mr-1">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Drag: 360° | Scroll: Zoom</span>
                </div>

                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer border border-slate-700/60"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer border border-slate-700/60"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  onClick={handleResetCamera}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-all cursor-pointer border border-slate-700/60 flex items-center gap-1 text-xs font-mono"
                  title="Reset 3D Camera View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Reset View</span>
                </button>
              </div>

            </div>

            {/* Middle Controls Floating Bar: Style Selector & Toggle Layer Visibility */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
              
              {/* Style Selector */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 backdrop-blur-md text-xs">
                <Palette className="w-4 h-4 text-purple-400 ml-1 mr-1" />
                {(['realistic', 'neon', 'wireframe', 'xray', 'bohr'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setRenderStyle(style)}
                    className={`px-2.5 py-1 rounded-xl capitalize font-bold transition-all cursor-pointer ${
                      renderStyle === style
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              {/* Orbitals & Shell Visibility Toggles */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 backdrop-blur-md text-xs">
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    showLabels ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> Labels
                </button>

                <button
                  onClick={() => setShowShells(!showShells)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    showShells ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Shells
                </button>

                {/* Quantum Orbital Type Dropdown */}
                <select
                  value={orbitalType}
                  onChange={(e) => setOrbitalType(e.target.value as any)}
                  className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold cursor-pointer"
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

          {/* Properties Panel Below Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Particles */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 shadow-md">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Subatomic Particles</h4>
              <div className="space-y-2 text-sm font-bold">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Protons
                  </div>
                  <span className="text-slate-200">{protonCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Neutrons
                  </div>
                  <span className="text-slate-200">{neutronCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Electrons
                  </div>
                  <span className="text-slate-200">{protonCount}</span>
                </div>
              </div>
            </div>

            {/* Electron Config */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 shadow-md">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Electron Configuration</h4>
              <div className="text-sm font-bold text-slate-200 font-mono mb-2">
                {currentElement.electronConfiguration}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-3">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Shells: [{currentElement.bohrShells.join(', ')}]</span>
              </div>
            </div>

            {/* Physical Properties */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 shadow-md">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Physical Properties</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phase:</span>
                  <span className="font-bold text-slate-200 capitalize">{currentElement.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mass:</span>
                  <span className="font-bold text-slate-200">{currentElement.atomicMass} u</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Density:</span>
                  <span className="font-bold text-slate-200">{currentElement.density || 'N/A'} g/cm³</span>
                </div>
              </div>
            </div>

            {/* Atomic Properties */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 shadow-md">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Atomic Properties</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Electronegativity:</span>
                  <span className="font-bold text-slate-200">{currentElement.electronegativity || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Radius:</span>
                  <span className="font-bold text-slate-200">{currentElement.atomicRadius ? `${currentElement.atomicRadius} pm` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Block:</span>
                  <span className="font-bold text-slate-200">{currentElement.block}-block</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-2">
            💡 <span className="font-semibold text-slate-200">Interactive Controls:</span> Drag to Rotate 360° | Scroll or Pinch to Zoom | Right-Click Drag to Pan stage.
          </p>
        </motion.div>
      )}

      {/* TAB 2: AUFBAU ELECTRON FILLING ANIMATION */}
      {activeMode === 'aufbau-filling' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Aufbau Principle Electron Filling Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Simulates step-by-step electron filling according to Madelung rule (n+l) and Hund's rule for spin state (↑↓).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveMode('3d-atom')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer text-xs md:text-sm"
              >
                <AtomIcon className="w-4 h-4" /> Back to 3D Model
              </button>
              <button
                onClick={() => setFillingStep(1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Reset to 1 Electron"
              >
                <RotateCcw className="w-4 h-4" /> Reset
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
                Current Element: {ELEMENTS.find((e) => e.atomicNumber === fillingStep)?.name || currentElement.name}
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

          {/* Subshell Orbital Box Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {aufbauData.map(({ subshell, filled, orbitalSpins }) => (
              <motion.div
                key={subshell.name}
                layout
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-extrabold text-cyan-400 text-sm">{subshell.name}</span>
                  <span className="text-slate-400 font-mono">
                    {filled} / {subshell.cap} e⁻
                  </span>
                </div>

                {/* Orbital Boxes */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {orbitalSpins.map((spins, boxIdx) => (
                    <div
                      key={boxIdx}
                      className="w-10 h-12 rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center gap-1 font-bold font-mono text-sm shadow-inner"
                    >
                      {spins.map((spin, sIdx) => (
                        <motion.span
                          key={sIdx}
                          initial={{ scale: 0, y: -5 }}
                          animate={{ scale: 1, y: 0 }}
                          className={spin === 'up' ? 'text-amber-400' : 'text-cyan-400'}
                        >
                          {spin === 'up' ? '↑' : '↓'}
                        </motion.span>
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
          className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" /> Quantum Bohr Model & Energy Level Jump Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Click any shell to simulate an electron quantum transition (excitation/de-excitation) and calculate emitted photon wavelength $\lambda$.
            </p>
          </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveMode('3d-atom')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer text-xs md:text-sm"
              >
                <AtomIcon className="w-4 h-4" /> Back to 3D Model
              </button>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Interactive Concentric Bohr Model */}
            <div className="relative w-full h-80 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden p-4">
              
              {/* Nucleus Center */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-xl z-10 border border-amber-300/40">
                <span>{currentElement.symbol}</span>
                <span className="text-[9px] font-mono text-amber-200">+{protonCount}</span>
              </div>

              {/* Shell Rings */}
              {currentElement.bohrShells.map((count, sIdx) => {
                const n = sIdx + 1;
                const radius = 45 + sIdx * 18;
                const isExcited = excitedShell === n;

                return (
                  <button
                    key={n}
                    onClick={() => triggerQuantumJump(1, n)}
                    className={`absolute rounded-full border-2 transition-all cursor-pointer ${
                      isExcited
                        ? 'border-cyan-400 shadow-lg shadow-cyan-400/50 scale-105'
                        : 'border-slate-700/60 hover:border-cyan-400/80'
                    }`}
                    style={{
                      width: `${radius * 2}px`,
                      height: `${radius * 2}px`,
                    }}
                    title={`Click shell n=${n} to simulate transition`}
                  >
                    {/* Shell Label */}
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-slate-900 px-1 rounded">
                      n={n} ({count}e⁻)
                    </span>
                  </button>
                );
              })}

              {/* Photon Emission Animation Banner */}
              {photonEvent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-4 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 shadow-xl flex items-center gap-3 text-xs font-mono"
                >
                  <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: photonEvent.color }} />
                  <span className="text-slate-200 font-bold">
                    Photon Emitted! $\Delta E$ = {photonEvent.energy} eV | $\lambda$ = {photonEvent.wavelength} nm
                  </span>
                </motion.div>
              )}

            </div>

            {/* Energy Level Diagram */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Energy Levels $E_n = -13.6 / n^2$ eV</h4>
              
              <div className="space-y-2">
                {currentElement.bohrShells.map((count, sIdx) => {
                  const n = sIdx + 1;
                  const eVal = (-13.6 / (n * n)).toFixed(2);

                  return (
                    <div
                      key={n}
                      onClick={() => triggerQuantumJump(1, n)}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer text-xs"
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
          className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" /> Lewis Dot & Valence Electron Configuration
            </h3>
            <p className="text-xs text-slate-400">
              Shows valence electron pairing rules determining reactivity, bonding capacity, and octet stability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Interactive Lewis Card */}
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-36 h-36 flex items-center justify-center bg-slate-900 rounded-3xl border-2 border-purple-500/40 shadow-xl">
                <span className="text-4xl font-extrabold text-white">{currentElement.symbol}</span>

                {Array.from({ length: Math.min(currentElement.valenceElectrons, 8) }).map((_, i) => {
                  const positions = [
                    'top-3 left-1/2 -translate-x-1/2',
                    'right-3 top-1/2 -translate-y-1/2',
                    'bottom-3 left-1/2 -translate-x-1/2',
                    'left-3 top-1/2 -translate-y-1/2',
                    'top-3 left-1/3 -translate-x-1/2',
                    'right-3 top-1/3 -translate-y-1/2',
                    'bottom-3 left-1/3 -translate-x-1/2',
                    'left-3 top-1/3 -translate-y-1/2',
                  ];
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.08 }}
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
                  {currentElement.valenceElectrons === 8
                    ? 'Stable Octet Configuration (Inert)'
                    : `Needs ${8 - currentElement.valenceElectrons} electron(s) to complete octet.`}
                </p>
              </div>
            </div>

            {/* Valence Details List */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-cyan-400 uppercase tracking-wider">Reactivity Summary</h4>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between p-2 rounded-xl bg-slate-900">
                  <span>Group Number:</span>
                  <strong className="text-white font-mono">{currentElement.group}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-900">
                  <span>Valence Electrons:</span>
                  <strong className="text-purple-400 font-mono">{currentElement.valenceElectrons}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-900">
                  <span>Oxidation States:</span>
                  <strong className="text-emerald-400 font-mono">
                    {currentElement.oxidationStates.map((s) => (s > 0 ? `+${s}` : `${s}`)).join(', ')}
                  </strong>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-900">
                  <span>Block Type:</span>
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
