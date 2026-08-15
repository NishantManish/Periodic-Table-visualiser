import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOLECULES_LIBRARY } from '../../data/moleculesData';
import { Molecule } from '../../types';
import {
  Boxes,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
  Info,
  RotateCcw,
  Move,
  Link as LinkIcon,
  MousePointer,
  HelpCircle,
  Eye,
  Check,
  Award,
  Layers,
  Scale,
  Atom as AtomIcon,
  Copy,
  Download,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

// Atomic Data Dictionary for Builder Palette
interface PaletteElement {
  symbol: string;
  name: string;
  atomicMass: number;
  electronegativity: number;
  valenceElectrons: number;
  color: string;
  radius: number;
}

const PALETTE_ELEMENTS: Record<string, PaletteElement> = {
  H: { symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, electronegativity: 2.20, valenceElectrons: 1, color: '#ffffff', radius: 24 },
  C: { symbol: 'C', name: 'Carbon', atomicMass: 12.011, electronegativity: 2.55, valenceElectrons: 4, color: '#334155', radius: 36 },
  N: { symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, electronegativity: 3.04, valenceElectrons: 5, color: '#3b82f6', radius: 34 },
  O: { symbol: 'O', name: 'Oxygen', atomicMass: 15.999, electronegativity: 3.44, valenceElectrons: 6, color: '#ef4444', radius: 34 },
  F: { symbol: 'F', name: 'Fluorine', atomicMass: 18.998, electronegativity: 3.98, valenceElectrons: 7, color: '#a855f7', radius: 30 },
  Na: { symbol: 'Na', name: 'Sodium', atomicMass: 22.990, electronegativity: 0.93, valenceElectrons: 1, color: '#f59e0b', radius: 42 },
  P: { symbol: 'P', name: 'Phosphorus', atomicMass: 30.974, electronegativity: 2.19, valenceElectrons: 5, color: '#f97316', radius: 38 },
  S: { symbol: 'S', name: 'Sulfur', atomicMass: 32.06, electronegativity: 2.58, valenceElectrons: 6, color: '#eab308', radius: 40 },
  Cl: { symbol: 'Cl', name: 'Chlorine', atomicMass: 35.45, electronegativity: 3.16, valenceElectrons: 7, color: '#22c55e', radius: 38 },
  Br: { symbol: 'Br', name: 'Bromine', atomicMass: 79.904, electronegativity: 2.96, valenceElectrons: 7, color: '#9a3412', radius: 42 },
};

// Custom Built Canvas Node & Edge types
export interface BuilderAtomNode {
  id: string;
  symbol: string;
  x: number; // pixels in canvas
  y: number;
}

export interface BuilderBondEdge {
  id: string;
  sourceId: string;
  targetId: string;
  order: 1 | 2 | 3;
}

export const MoleculeBuilder: React.FC = () => {
  const { unlockAchievement } = useAppStore();

  // Mode Selection: Preset Preset vs Custom Sandbox
  const [activeTab, setActiveTab] = useState<'custom-builder' | '3d-library'>('custom-builder');

  // Preset 3D state
  const [selectedPreset, setSelectedPreset] = useState<Molecule>(MOLECULES_LIBRARY[0]); // Water
  const [rotationX, setRotationX] = useState(15);
  const [rotationY, setRotationY] = useState(30);

  // Custom Drag-and-Drop Canvas State
  const [builderAtoms, setBuilderAtoms] = useState<BuilderAtomNode[]>([
    { id: 'atom-0', symbol: 'O', x: 220, y: 180 },
    { id: 'atom-1', symbol: 'H', x: 130, y: 220 },
    { id: 'atom-2', symbol: 'H', x: 310, y: 220 },
  ]);

  const [builderBonds, setBuilderBonds] = useState<BuilderBondEdge[]>([
    { id: 'bond-0', sourceId: 'atom-0', targetId: 'atom-1', order: 1 },
    { id: 'bond-1', sourceId: 'atom-0', targetId: 'atom-2', order: 1 },
  ]);

  // Canvas Interactions Mode: 'select' | 'bond' | 'erase'
  const [toolMode, setToolMode] = useState<'select' | 'bond' | 'erase'>('select');
  const [selectedBondOrder, setSelectedBondOrder] = useState<1 | 2 | 3>(1);
  const [bondSourceAtomId, setBondSourceAtomId] = useState<string | null>(null);

  // Dragging atom state
  const [draggingAtomId, setDraggingAtomId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- AUTOMATIC MOLECULAR PREDICTOR ENGINE ---
  const predictedData = useMemo(() => {
    if (builderAtoms.length === 0) {
      return {
        formula: 'None',
        molecularWeight: 0,
        bondType: 'N/A',
        geometry: 'N/A',
        bondAngle: 'N/A',
        hybridization: 'N/A',
        polarity: 'N/A',
        totalValenceElectrons: 0,
        iupacMatch: 'Empty Canvas',
        centralAtomSymbol: 'None',
        stericNumber: 0,
        lonePairsOnCentral: 0,
      };
    }

    // 1. Formula Calculation (Hill System: C first, then H, then alphabetical)
    const counts: Record<string, number> = {};
    let mw = 0;
    let totalValence = 0;

    builderAtoms.forEach((a) => {
      counts[a.symbol] = (counts[a.symbol] || 0) + 1;
      const elData = PALETTE_ELEMENTS[a.symbol] || PALETTE_ELEMENTS['H'];
      mw += elData.atomicMass;
      totalValence += elData.valenceElectrons;
    });

    let formulaStr = '';
    const symbols = Object.keys(counts);

    // Hill order logic
    if (counts['C']) {
      formulaStr += `C${counts['C'] > 1 ? counts['C'] : ''}`;
      if (counts['H']) {
        formulaStr += `H${counts['H'] > 1 ? counts['H'] : ''}`;
      }
      symbols
        .filter((s) => s !== 'C' && s !== 'H')
        .sort()
        .forEach((s) => {
          formulaStr += `${s}${counts[s] > 1 ? counts[s] : ''}`;
        });
    } else {
      symbols
        .sort()
        .forEach((s) => {
          formulaStr += `${s}${counts[s] > 1 ? counts[s] : ''}`;
        });
    }

    // Convert numbers in formulaStr to subscript unicode
    const subscriptMap: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    };
    const formattedFormula = formulaStr.replace(/\d/g, (d) => subscriptMap[d] || d);

    // 2. Identify Central Atom (atom connected to the most bonds, or lowest electronegativity non-H)
    const bondCounts: Record<string, number> = {};
    builderBonds.forEach((b) => {
      bondCounts[b.sourceId] = (bondCounts[b.sourceId] || 0) + b.order;
      bondCounts[b.targetId] = (bondCounts[b.targetId] || 0) + b.order;
    });

    let centralAtom = builderAtoms[0];
    let maxBonds = -1;

    builderAtoms.forEach((a) => {
      const bCount = bondCounts[a.id] || 0;
      if (bCount > maxBonds) {
        maxBonds = bCount;
        centralAtom = a;
      }
    });

    // 3. Electronegativity Difference & Bond Type
    let maxEnDiff = 0;
    builderBonds.forEach((b) => {
      const src = builderAtoms.find((a) => a.id === b.sourceId);
      const tgt = builderAtoms.find((a) => a.id === b.targetId);
      if (src && tgt) {
        const en1 = PALETTE_ELEMENTS[src.symbol]?.electronegativity || 2.2;
        const en2 = PALETTE_ELEMENTS[tgt.symbol]?.electronegativity || 2.2;
        const diff = Math.abs(en1 - en2);
        if (diff > maxEnDiff) maxEnDiff = diff;
      }
    });

    let predictedBondType = 'Covalent';
    if (maxEnDiff > 1.7) predictedBondType = 'Ionic';
    else if (maxEnDiff >= 0.4) predictedBondType = 'Polar Covalent';
    else predictedBondType = 'Nonpolar Covalent';

    // 4. VSEPR Geometry Calculation
    const centralEl = PALETTE_ELEMENTS[centralAtom.symbol] || PALETTE_ELEMENTS['C'];

    // Number of bonded atoms to central atom (distinct neighbors)
    const centralNeighbors = builderBonds
      .filter((b) => b.sourceId === centralAtom.id || b.targetId === centralAtom.id)
      .map((b) => (b.sourceId === centralAtom.id ? b.targetId : b.sourceId));
    const uniqueNeighborCount = new Set(centralNeighbors).size;

    // Total shared electrons on central atom
    const totalSharedOnCentral = bondCounts[centralAtom.id] || 0;
    const lonePairsOnCentral = Math.max(0, Math.floor((centralEl.valenceElectrons - totalSharedOnCentral) / 2));

    const stericNumber = uniqueNeighborCount + lonePairsOnCentral;

    let geometry = 'Linear';
    let bondAngle = '180°';
    let hybridization = 'sp';
    let polarity = 'Nonpolar';

    if (uniqueNeighborCount === 1) {
      geometry = 'Linear';
      bondAngle = '180°';
      hybridization = 'sp';
      polarity = maxEnDiff > 0.4 ? 'Polar' : 'Nonpolar';
    } else if (stericNumber === 2) {
      geometry = 'Linear';
      bondAngle = '180°';
      hybridization = 'sp';
      polarity = 'Nonpolar';
    } else if (stericNumber === 3) {
      if (lonePairsOnCentral === 1) {
        geometry = 'Bent';
        bondAngle = '~118°';
        hybridization = 'sp²';
        polarity = 'Polar';
      } else {
        geometry = 'Trigonal Planar';
        bondAngle = '120°';
        hybridization = 'sp²';
        polarity = 'Nonpolar';
      }
    } else if (stericNumber === 4) {
      if (lonePairsOnCentral === 2) {
        geometry = 'Bent';
        bondAngle = '104.5°';
        hybridization = 'sp³';
        polarity = 'Polar';
      } else if (lonePairsOnCentral === 1) {
        geometry = 'Trigonal Pyramidal';
        bondAngle = '107°';
        hybridization = 'sp³';
        polarity = 'Polar';
      } else {
        geometry = 'Tetrahedral';
        bondAngle = '109.5°';
        hybridization = 'sp³';
        polarity = 'Nonpolar';
      }
    } else if (stericNumber === 5) {
      geometry = 'Trigonal Bipyramidal';
      bondAngle = '90° / 120°';
      hybridization = 'sp³d';
      polarity = 'Nonpolar';
    } else if (stericNumber >= 6) {
      geometry = 'Octahedral';
      bondAngle = '90°';
      hybridization = 'sp³d²';
      polarity = 'Nonpolar';
    }

    // 5. Match with Known Molecule Names
    let iupacMatch = 'Custom Molecule';
    const matchPreset = MOLECULES_LIBRARY.find(
      (m) => m.formula.replace(/\s+/g, '') === formattedFormula.replace(/\s+/g, '')
    );
    if (matchPreset) {
      iupacMatch = `${matchPreset.name} (${matchPreset.iupacName})`;
    } else if (formattedFormula === 'H₂O') iupacMatch = 'Water (Oxidiane)';
    else if (formattedFormula === 'CO₂') iupacMatch = 'Carbon Dioxide';
    else if (formattedFormula === 'CH₄') iupacMatch = 'Methane';
    else if (formattedFormula === 'NH₃') iupacMatch = 'Ammonia (Azane)';
    else if (formattedFormula === 'O₃') iupacMatch = 'Ozone';
    else if (formattedFormula === 'H₂O₂') iupacMatch = 'Hydrogen Peroxide';

    return {
      formula: formattedFormula,
      molecularWeight: Number(mw.toFixed(3)),
      bondType: predictedBondType,
      geometry,
      bondAngle,
      hybridization,
      polarity,
      totalValenceElectrons: totalValence,
      iupacMatch,
      centralAtomSymbol: centralAtom.symbol,
      stericNumber,
      lonePairsOnCentral,
    };
  }, [builderAtoms, builderBonds]);

  // --- CANVAS ACTIONS ---

  // Add atom to canvas from palette
  const addAtomNode = (symbol: string) => {
    const id = `atom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newAtom: BuilderAtomNode = {
      id,
      symbol,
      x: 200 + (builderAtoms.length % 5) * 40,
      y: 180 + (builderAtoms.length % 4) * 35,
    };
    setBuilderAtoms([...builderAtoms, newAtom]);
    unlockAchievement('molecule_creator');
  };

  // Remove atom and connected bonds
  const removeAtomNode = (atomId: string) => {
    setBuilderAtoms(builderAtoms.filter((a) => a.id !== atomId));
    setBuilderBonds(builderBonds.filter((b) => b.sourceId !== atomId && b.targetId !== atomId));
    if (bondSourceAtomId === atomId) setBondSourceAtomId(null);
  };

  // Click handler on an atom
  const handleAtomClick = (atomId: string) => {
    if (toolMode === 'erase') {
      removeAtomNode(atomId);
      return;
    }

    if (toolMode === 'bond') {
      if (!bondSourceAtomId) {
        setBondSourceAtomId(atomId);
      } else if (bondSourceAtomId !== atomId) {
        // Toggle or add bond between source and target
        const existingIndex = builderBonds.findIndex(
          (b) =>
            (b.sourceId === bondSourceAtomId && b.targetId === atomId) ||
            (b.sourceId === atomId && b.targetId === bondSourceAtomId)
        );

        if (existingIndex >= 0) {
          // Cycle bond order: 1 -> 2 -> 3 -> remove
          const currentOrder = builderBonds[existingIndex].order;
          if (currentOrder < 3) {
            const updated = [...builderBonds];
            updated[existingIndex].order = (currentOrder + 1) as 1 | 2 | 3;
            setBuilderBonds(updated);
          } else {
            setBuilderBonds(builderBonds.filter((_, idx) => idx !== existingIndex));
          }
        } else {
          // Add new bond
          const newBond: BuilderBondEdge = {
            id: `bond-${Date.now()}`,
            sourceId: bondSourceAtomId,
            targetId: atomId,
            order: selectedBondOrder,
          };
          setBuilderBonds([...builderBonds, newBond]);
        }
        setBondSourceAtomId(null);
      }
    }
  };

  // Dragging atom around canvas
  const handlePointerDownAtom = (e: React.PointerEvent, atomId: string) => {
    if (toolMode === 'select') {
      e.stopPropagation();
      setDraggingAtomId(atomId);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (draggingAtomId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left));
      const newY = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top));

      setBuilderAtoms((prev) =>
        prev.map((a) => (a.id === draggingAtomId ? { ...a, x: newX, y: newY } : a))
      );
    }
  };

  const handlePointerUpCanvas = () => {
    setDraggingAtomId(null);
  };

  // Clear All Canvas
  const handleClearCanvas = () => {
    setBuilderAtoms([]);
    setBuilderBonds([]);
    setBondSourceAtomId(null);
  };

  // Load Preset directly into Builder Sandbox
  const loadPresetToSandbox = (mol: Molecule) => {
    setSelectedPreset(mol);

    // Convert preset 3D atoms to 2D canvas coordinates
    const scale = 80;
    const centerX = 220;
    const centerY = 180;

    const newAtoms: BuilderAtomNode[] = mol.atoms.map((a, idx) => ({
      id: `preset-atom-${idx}`,
      symbol: a.symbol,
      x: centerX + (a.x || 0) * scale,
      y: centerY + (a.y || 0) * scale,
    }));

    const newBonds: BuilderBondEdge[] = mol.bonds.map((b, idx) => ({
      id: `preset-bond-${idx}`,
      sourceId: `preset-atom-${b.source}`,
      targetId: `preset-atom-${b.target}`,
      order: b.order,
    }));

    setBuilderAtoms(newAtoms);
    setBuilderBonds(newBonds);
    setActiveTab('custom-builder');
    unlockAchievement('molecule_creator');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Mode Tabs */}
      <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Interactive Molecule Builder & Predictor</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
              Drag-&-Drop Science
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Construct 2D & 3D chemical structures, snap atoms, create bonds, and auto-calculate VSEPR geometry & polarity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('custom-builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'custom-builder'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AtomIcon className="w-4 h-4" />
            <span>Interactive Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('3d-library')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === '3d-library'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Preset 3D Gallery</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE CUSTOM BUILDER SANDBOX */}
      {activeTab === 'custom-builder' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main 3-Column Split View: Palette | Canvas Stage | Predicted Physics & Lewis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 3 Cols: Element Atom Palette */}
            <div className="lg:col-span-3 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4" /> Atom Palette
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Click any atom symbol below to add it directly to your canvas stage:
                </p>

                {/* Grid Palette */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PALETTE_ELEMENTS).map((el) => (
                    <button
                      key={el.symbol}
                      onClick={() => addAtomNode(el.symbol)}
                      className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/50 flex items-center gap-2.5 transition-all cursor-pointer group"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white shadow-md border border-white/30"
                        style={{ backgroundColor: el.color }}
                      >
                        {el.symbol}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">{el.name}</div>
                        <div className="text-[9px] font-mono text-slate-400">Valence: {el.valenceElectrons}e⁻</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Preset Launcher inside palette */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Load Quick Structure:</span>
                <div className="flex flex-wrap gap-1.5">
                  {MOLECULES_LIBRARY.slice(0, 6).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => loadPresetToSandbox(m)}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white text-[11px] font-bold font-mono transition-all border border-slate-700 cursor-pointer"
                    >
                      {m.formula}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Middle 5 Cols: Interactive Drag-&-Drop Canvas */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 rounded-3xl border border-slate-800 shadow-2xl relative min-h-[480px] flex flex-col justify-between overflow-hidden">
              
              {/* Canvas Toolbar Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 z-10 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-md">
                
                {/* Mode Selectors */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setToolMode('select');
                      setBondSourceAtomId(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      toolMode === 'select'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Drag and position atoms"
                  >
                    <MousePointer className="w-3.5 h-3.5" /> Drag
                  </button>

                  <button
                    onClick={() => setToolMode('bond')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      toolMode === 'bond'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Click two atoms to connect or change bond order"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Bond
                  </button>

                  <button
                    onClick={() => {
                      setToolMode('erase');
                      setBondSourceAtomId(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      toolMode === 'erase'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Click atom to remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Erase
                  </button>
                </div>

                {/* Bond Order Selector */}
                {toolMode === 'bond' && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400 font-bold">Order:</span>
                    {[1, 2, 3].map((ord) => (
                      <button
                        key={ord}
                        onClick={() => setSelectedBondOrder(ord as 1 | 2 | 3)}
                        className={`w-6 h-6 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          selectedBondOrder === ord ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ord === 1 ? '—' : ord === 2 ? '=' : '≡'}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleClearCanvas}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Clear All Canvas"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Main SVG & HTML Interactive Canvas */}
              <div
                ref={canvasRef}
                onPointerMove={handlePointerMoveCanvas}
                onPointerUp={handlePointerUpCanvas}
                className="relative w-full h-[360px] my-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden touch-none cursor-crosshair"
              >
                {/* SVG Render Layer for Bond Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {builderBonds.map((b) => {
                    const src = builderAtoms.find((a) => a.id === b.sourceId);
                    const tgt = builderAtoms.find((a) => a.id === b.targetId);
                    if (!src || !tgt) return null;

                    const dx = tgt.x - src.x;
                    const dy = tgt.y - src.y;
                    const dist = Math.hypot(dx, dy) || 1;

                    // Perpendicular offset for double/triple bonds
                    const nx = -dy / dist;
                    const ny = dx / dist;

                    return (
                      <g key={b.id}>
                        {b.order === 1 && (
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke="#94a3b8"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        )}
                        {b.order === 2 && (
                          <>
                            <line
                              x1={src.x + nx * 3}
                              y1={src.y + ny * 3}
                              x2={tgt.x + nx * 3}
                              y2={tgt.y + ny * 3}
                              stroke="#38bdf8"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            <line
                              x1={src.x - nx * 3}
                              y1={src.y - ny * 3}
                              x2={tgt.x - nx * 3}
                              y2={tgt.y - ny * 3}
                              stroke="#38bdf8"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                          </>
                        )}
                        {b.order === 3 && (
                          <>
                            <line
                              x1={src.x}
                              y1={src.y}
                              x2={tgt.x}
                              y2={tgt.y}
                              stroke="#f59e0b"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <line
                              x1={src.x + nx * 5}
                              y1={src.y + ny * 5}
                              x2={tgt.x + nx * 5}
                              y2={tgt.y + ny * 5}
                              stroke="#f59e0b"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <line
                              x1={src.x - nx * 5}
                              y1={src.y - ny * 5}
                              x2={tgt.x - nx * 5}
                              y2={tgt.y - ny * 5}
                              stroke="#f59e0b"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* HTML Nodes for Dragging & Clicking Atoms */}
                {builderAtoms.map((a) => {
                  const elData = PALETTE_ELEMENTS[a.symbol] || PALETTE_ELEMENTS['H'];
                  const isBondSource = bondSourceAtomId === a.id;

                  return (
                    <motion.div
                      key={a.id}
                      layoutId={a.id}
                      onPointerDown={(e) => handlePointerDownAtom(e, a.id)}
                      onClick={() => handleAtomClick(a.id)}
                      className={`absolute rounded-full flex items-center justify-center font-extrabold text-xs text-white shadow-xl transition-transform cursor-pointer select-none z-10 ${
                        isBondSource ? 'ring-4 ring-amber-400 scale-125' : 'hover:scale-110'
                      }`}
                      style={{
                        left: `${a.x}px`,
                        top: `${a.y}px`,
                        width: `${elData.radius * 1.3}px`,
                        height: `${elData.radius * 1.3}px`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: elData.color,
                        border: '2px solid rgba(255,255,255,0.4)',
                      }}
                    >
                      {a.symbol}
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-[11px] text-slate-400 z-10">
                💡 <span className="font-semibold text-slate-200">Tips:</span> In <strong>Bond Mode</strong>, click 1st atom then 2nd atom to link. Click bond repeatedly to change order (Single → Double → Triple).
              </p>

            </div>

            {/* Right 4 Cols: Predicted Physics & Lewis Structure */}
            <div className="lg:col-span-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Predicted Properties
                  </h3>
                  <span className="font-mono text-xs font-extrabold text-amber-400">
                    {predictedData.formula}
                  </span>
                </div>

                {/* Properties Cards Grid */}
                <div className="space-y-2 text-xs">
                  
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">IUPAC / Name Match:</span>
                    <strong className="text-cyan-300 font-bold">{predictedData.iupacMatch}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Molecular Weight:</span>
                    <strong className="text-white font-mono">{predictedData.molecularWeight} g/mol</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">VSEPR Shape:</span>
                    <strong className="text-emerald-400 font-bold">{predictedData.geometry}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Estimated Bond Angle:</span>
                    <strong className="text-amber-400 font-mono">{predictedData.bondAngle}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Hybridization State:</span>
                    <strong className="text-purple-400 font-mono">{predictedData.hybridization}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Bond Character:</span>
                    <strong className="text-cyan-400 font-bold">{predictedData.bondType}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Overall Polarity:</span>
                    <strong className={predictedData.polarity === 'Polar' ? 'text-rose-400 font-bold' : 'text-slate-300 font-bold'}>
                      {predictedData.polarity}
                    </strong>
                  </div>

                </div>

                {/* Lewis Structure Rendering Display */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Live Lewis Structure Diagram:
                  </span>

                  <div className="h-28 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-center p-2 relative">
                    {/* SVG Render for Lewis structure diagram */}
                    <svg className="w-full h-full">
                      <g transform="translate(100, 50)">
                        {/* Central Symbol */}
                        <text
                          x="0"
                          y="5"
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="22"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {predictedData.centralAtomSymbol}
                        </text>

                        {/* Lone Pair Dots on Central Atom */}
                        {predictedData.lonePairsOnCentral >= 1 && (
                          <g fill="#f59e0b">
                            <circle cx="-5" cy="-18" r="2.5" />
                            <circle cx="5" cy="-18" r="2.5" />
                          </g>
                        )}
                        {predictedData.lonePairsOnCentral >= 2 && (
                          <g fill="#f59e0b">
                            <circle cx="-5" cy="22" r="2.5" />
                            <circle cx="5" cy="22" r="2.5" />
                          </g>
                        )}

                        {/* Outer Connected Bonds representation */}
                        <line x1="20" y1="0" x2="45" y2="0" stroke="#94a3b8" strokeWidth="3" />
                        <text x="58" y="5" fill="#ffffff" fontSize="16" fontWeight="bold">
                          X
                        </text>

                        {predictedData.stericNumber >= 2 && (
                          <>
                            <line x1="-20" y1="0" x2="-45" y2="0" stroke="#94a3b8" strokeWidth="3" />
                            <text x="-58" y="5" fill="#ffffff" fontSize="16" fontWeight="bold">
                              X
                            </text>
                          </>
                        )}
                      </g>
                    </svg>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </motion.div>
      )}

      {/* TAB 2: PRESET 3D GALLERY */}
      {activeTab === '3d-library' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Preset Selector Banner */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" /> Preset 3D Molecule Gallery
            </h3>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {MOLECULES_LIBRARY.map((m) => {
                const active = selectedPreset.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedPreset(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      active
                        ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-mono text-cyan-300 font-extrabold">{m.formula}</span>
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main 3D Molecule Visualizer & Property Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Interactive 3D Canvas Stage */}
            <div className="lg:col-span-2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 relative min-h-[460px] flex flex-col justify-between shadow-2xl overflow-hidden">
              
              {/* Controls Bar */}
              <div className="flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    {selectedPreset.name} <span className="text-cyan-400 font-mono">({selectedPreset.formula})</span>
                  </h2>
                  <p className="text-xs text-slate-400">{selectedPreset.iupacName} | MW: {selectedPreset.molecularWeight} g/mol</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadPresetToSandbox(selectedPreset)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <AtomIcon className="w-3.5 h-3.5" /> Edit in Sandbox
                  </button>

                  <button
                    onClick={() => {
                      setRotationX(15);
                      setRotationY(30);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Render 3D Molecule Graphic (Interactive Spheres & Cylinders) */}
              <div
                className="w-full h-72 my-4 relative flex items-center justify-center cursor-grab active:cursor-grabbing"
                onMouseMove={(e) => {
                  if (e.buttons === 1) {
                    setRotationY((prev) => prev + e.movementX * 0.5);
                    setRotationX((prev) => prev - e.movementY * 0.5);
                  }
                }}
              >
                <div
                  className="relative transition-transform duration-75"
                  style={{
                    transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Render Bonds */}
                  {selectedPreset.bonds.map((bond, idx) => {
                    const sourceAtom = selectedPreset.atoms[bond.source];
                    const targetAtom = selectedPreset.atoms[bond.target];
                    if (!sourceAtom || !targetAtom) return null;

                    const scale = 70;
                    const x1 = (sourceAtom.x || 0) * scale;
                    const y1 = (sourceAtom.y || 0) * scale;
                    const z1 = (sourceAtom.z || 0) * scale;
                    const x2 = (targetAtom.x || 0) * scale;
                    const y2 = (targetAtom.y || 0) * scale;
                    const z2 = (targetAtom.z || 0) * scale;

                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const dz = z2 - z1;
                    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    return (
                      <div
                        key={`bond-${idx}`}
                        className="absolute bg-slate-400/80 rounded-full"
                        style={{
                          width: `${len}px`,
                          height: '6px',
                          left: `${x1}px`,
                          top: `${y1}px`,
                          transformOrigin: '0 50%',
                          transform: `translate3d(0,0,${z1}px) rotateY(${Math.atan2(dz, dx)}rad) rotateZ(${Math.atan2(dy, Math.sqrt(dx * dx + dz * dz))}rad)`,
                        }}
                      />
                    );
                  })}

                  {/* Render Atom Spheres */}
                  {selectedPreset.atoms.map((atom, idx) => {
                    const scale = 70;
                    const x = (atom.x || 0) * scale;
                    const y = (atom.y || 0) * scale;
                    const z = (atom.z || 0) * scale;
                    const size = atom.symbol === 'H' ? 36 : 52;

                    return (
                      <div
                        key={`atom-${idx}`}
                        className="absolute rounded-full flex items-center justify-center font-extrabold text-white text-xs shadow-xl transition-all"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: atom.color || '#3b82f6',
                          transform: `translate3d(${x - size / 2}px, ${y - size / 2}px, ${z}px)`,
                          border: '2px solid rgba(255,255,255,0.4)',
                        }}
                      >
                        {atom.symbol}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 z-10">
                🖱️ Click and drag mouse to rotate molecule structure in 3D.
              </p>

            </div>

            {/* Right 1 Col: Molecular Properties & Predictor */}
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Predicted Molecular Physics
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Geometry Shape</span>
                    <span className="font-bold text-slate-100">{selectedPreset.geometry}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Bond Angle</span>
                    <span className="font-mono font-bold text-cyan-400">{selectedPreset.bondAngle}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Hybridization State</span>
                    <span className="font-mono font-bold text-purple-400">{selectedPreset.hybridization}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Bond Type</span>
                    <span className="font-bold text-emerald-400">{selectedPreset.bondType}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Molecular Polarity</span>
                    <span className="font-bold text-rose-400">{selectedPreset.polarity}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                  {selectedPreset.description}
                </p>
              </div>

            </div>

          </div>
        </motion.div>
      )}

    </div>
  );
};
