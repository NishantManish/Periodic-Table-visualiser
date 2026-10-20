import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { MOLECULES_LIBRARY } from '../../data/moleculesData';
import { Molecule } from '../../types';
import {
  Boxes,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  RotateCcw,
  Link as LinkIcon,
  MousePointer,
  CheckCircle2,
  AlertTriangle,
  Atom as AtomIcon,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

// Atomic Data Dictionary for Builder Palette with strict valency rules
interface PaletteElement {
  symbol: string;
  name: string;
  atomicMass: number;
  electronegativity: number;
  valenceElectrons: number;
  standardValency: number;
  maxBonds: number; // Octet or hypervalent d-orbital limit
  color: string;
  radius: number;
}

const PALETTE_ELEMENTS: Record<string, PaletteElement> = {
  H: { symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, electronegativity: 2.20, valenceElectrons: 1, standardValency: 1, maxBonds: 1, color: '#ffffff', radius: 24 },
  C: { symbol: 'C', name: 'Carbon', atomicMass: 12.011, electronegativity: 2.55, valenceElectrons: 4, standardValency: 4, maxBonds: 4, color: '#334155', radius: 36 },
  N: { symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, electronegativity: 3.04, valenceElectrons: 5, standardValency: 3, maxBonds: 4, color: '#3b82f6', radius: 34 },
  O: { symbol: 'O', name: 'Oxygen', atomicMass: 15.999, electronegativity: 3.44, valenceElectrons: 6, standardValency: 2, maxBonds: 3, color: '#ef4444', radius: 34 },
  F: { symbol: 'F', name: 'Fluorine', atomicMass: 18.998, electronegativity: 3.98, valenceElectrons: 7, standardValency: 1, maxBonds: 1, color: '#a855f7', radius: 30 },
  Na: { symbol: 'Na', name: 'Sodium', atomicMass: 22.990, electronegativity: 0.93, valenceElectrons: 1, standardValency: 1, maxBonds: 1, color: '#f59e0b', radius: 42 },
  P: { symbol: 'P', name: 'Phosphorus', atomicMass: 30.974, electronegativity: 2.19, valenceElectrons: 5, standardValency: 3, maxBonds: 5, color: '#f97316', radius: 38 },
  S: { symbol: 'S', name: 'Sulfur', atomicMass: 32.06, electronegativity: 2.58, valenceElectrons: 6, standardValency: 2, maxBonds: 6, color: '#eab308', radius: 40 },
  Cl: { symbol: 'Cl', name: 'Chlorine', atomicMass: 35.45, electronegativity: 3.16, valenceElectrons: 7, standardValency: 1, maxBonds: 7, color: '#22c55e', radius: 38 },
  Br: { symbol: 'Br', name: 'Bromine', atomicMass: 79.904, electronegativity: 2.96, valenceElectrons: 7, standardValency: 1, maxBonds: 5, color: '#9a3412', radius: 42 },
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

  // Mode Selection: Preset vs Custom Sandbox
  const [activeTab, setActiveTab] = useState<'custom-builder' | '3d-library'>('custom-builder');

  // Preset 3D state
  const [selectedPreset, setSelectedPreset] = useState<Molecule>(MOLECULES_LIBRARY[0]); // Water
  const [rotationX, setRotationX] = useState(15);
  const [rotationY, setRotationY] = useState(30);

  // Custom Drag-and-Drop Canvas State
  const [builderAtoms, setBuilderAtoms] = useState<BuilderAtomNode[]>([
    { id: 'atom-0', symbol: 'O', x: 260, y: 190 },
    { id: 'atom-1', symbol: 'H', x: 160, y: 245 },
    { id: 'atom-2', symbol: 'H', x: 360, y: 245 },
  ]);

  const [builderBonds, setBuilderBonds] = useState<BuilderBondEdge[]>([
    { id: 'bond-0', sourceId: 'atom-0', targetId: 'atom-1', order: 1 },
    { id: 'bond-1', sourceId: 'atom-0', targetId: 'atom-2', order: 1 },
  ]);

  // Canvas Interactions Mode: 'select' | 'bond' | 'erase'
  const [toolMode, setToolMode] = useState<'select' | 'bond' | 'erase'>('select');
  const [selectedBondOrder, setSelectedBondOrder] = useState<1 | 2 | 3>(1);
  const [bondSourceAtomId, setBondSourceAtomId] = useState<string | null>(null);
  const [valencyWarning, setValencyWarning] = useState<string | null>(null);

  // Dragging atom state
  const [draggingAtomId, setDraggingAtomId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate bond count per atom ID
  const atomBondCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    builderBonds.forEach((b) => {
      counts[b.sourceId] = (counts[b.sourceId] || 0) + b.order;
      counts[b.targetId] = (counts[b.targetId] || 0) + b.order;
    });
    return counts;
  }, [builderBonds]);

  // --- AUTOMATIC MOLECULAR PREDICTOR ENGINE (VSEPR AXmEn + Octet + Formal Charge) ---
  const predictedData = useMemo(() => {
    if (builderAtoms.length === 0) {
      return {
        formula: 'None',
        molecularWeight: 0,
        bondType: 'N/A',
        geometry: 'N/A',
        vseprNotation: 'N/A',
        bondAngle: 'N/A',
        hybridization: 'N/A',
        polarity: 'N/A',
        totalValenceElectrons: 0,
        iupacMatch: 'Empty Canvas',
        centralAtomSymbol: 'None',
        stericNumber: 0,
        lonePairsOnCentral: 0,
        formalChargeCentral: 0,
        valencyStatus: 'Add atoms to begin',
        isOctetValid: true,
        centralNeighborsList: [] as { symbol: string; order: number }[],
      };
    }

    // 1. Formula Calculation (Hill System: C first, then H, then alphabetical; or Electronegativity order for inorganic binary)
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
      // Sort by electronegativity ascending (e.g. NaCl, H2O, NH3, SO2)
      symbols
        .sort((a, b) => {
          const enA = PALETTE_ELEMENTS[a]?.electronegativity || 2.2;
          const enB = PALETTE_ELEMENTS[b]?.electronegativity || 2.2;
          return enA - enB;
        })
        .forEach((s) => {
          formulaStr += `${s}${counts[s] > 1 ? counts[s] : ''}`;
        });
    }

    const subscriptMap: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    };
    const formattedFormula = formulaStr.replace(/\d/g, (d) => subscriptMap[d] || d);

    // 2. Identify Central Atom (prefer non-H atom with most bonds, then lowest electronegativity)
    let centralAtom = builderAtoms[0];
    let bestScore = -999;

    builderAtoms.forEach((a) => {
      const bCount = atomBondCounts[a.id] || 0;
      const el = PALETTE_ELEMENTS[a.symbol] || PALETTE_ELEMENTS['H'];
      const nonHBonus = a.symbol !== 'H' ? 50 : 0;
      const score = bCount * 20 + nonHBonus + (4.5 - el.electronegativity) * 5;
      if (score > bestScore) {
        bestScore = score;
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

    let predictedBondType = 'Nonpolar Covalent';
    if (builderBonds.length === 0) predictedBondType = 'Unbonded Atoms';
    else if (maxEnDiff > 1.7) predictedBondType = 'Ionic (ΔEN > 1.7)';
    else if (maxEnDiff >= 0.4) predictedBondType = 'Polar Covalent';

    // 4. VSEPR AXmEn Geometry & Formal Charge Calculation
    const centralEl = PALETTE_ELEMENTS[centralAtom.symbol] || PALETTE_ELEMENTS['C'];

    const centralAttachedBonds = builderBonds.filter(
      (b) => b.sourceId === centralAtom.id || b.targetId === centralAtom.id
    );
    const centralNeighborsList = centralAttachedBonds.map((b) => {
      const neighborId = b.sourceId === centralAtom.id ? b.targetId : b.sourceId;
      const neighborAtom = builderAtoms.find((a) => a.id === neighborId);
      return {
        symbol: neighborAtom?.symbol || 'X',
        order: b.order,
      };
    });

    // m = number of bonded atoms (sigma domains)
    const m = centralNeighborsList.length;
    // B = total bond order sum on central atom
    const totalBondOrderCentral = atomBondCounts[centralAtom.id] || 0;
    // Non-bonding electrons remaining on central atom
    const nonBondingElectrons = Math.max(0, centralEl.valenceElectrons - totalBondOrderCentral);
    // n = lone pairs on central atom
    const n = Math.floor(nonBondingElectrons / 2);

    const stericNumber = m + n;
    const vseprNotation = m > 0 ? `AX${m > 1 ? subscriptMap[String(m)] : ''}${n > 0 ? `E${n > 1 ? subscriptMap[String(n)] : ''}` : ''}` : 'Isolated Atom';

    // Formal Charge on central atom: FC = V - N_nonbonding - B_bonds
    const formalChargeCentral = centralEl.valenceElectrons - n * 2 - totalBondOrderCentral;

    // Check if all terminal substituent atoms around central are identical (for dipole cancellation)
    const neighborSymbols = centralNeighborsList.map((nb) => nb.symbol);
    const allSubstituentsIdentical =
      neighborSymbols.length > 0 && neighborSymbols.every((sym) => sym === neighborSymbols[0]);

    let geometry = 'Isolated Atom';
    let bondAngle = 'N/A';
    let hybridization = 'Un-hybridized';
    let polarity = 'Nonpolar';

    if (builderAtoms.length === 1 || m === 0) {
      geometry = 'Monoatomic / Unbonded';
      bondAngle = 'N/A';
      hybridization = 'None';
      polarity = 'Nonpolar';
    } else if (m === 1) {
      geometry = 'Linear (Diatomic)';
      bondAngle = '180°';
      hybridization = stericNumber === 2 ? 'sp' : stericNumber === 3 ? 'sp²' : 'sp³';
      polarity = maxEnDiff >= 0.4 ? 'Polar' : 'Nonpolar';
    } else if (stericNumber === 2) {
      // AX2
      geometry = 'Linear';
      bondAngle = '180°';
      hybridization = 'sp';
      polarity = allSubstituentsIdentical ? 'Nonpolar' : 'Polar';
    } else if (stericNumber === 3) {
      hybridization = 'sp²';
      if (n === 0) {
        geometry = 'Trigonal Planar';
        bondAngle = '120°';
        polarity = allSubstituentsIdentical && maxEnDiff < 1.7 ? 'Nonpolar' : 'Polar';
      } else {
        // AX2E
        geometry = 'Bent (Angular)';
        bondAngle = '~118°';
        polarity = 'Polar';
      }
    } else if (stericNumber === 4) {
      hybridization = 'sp³';
      if (n === 0) {
        geometry = 'Tetrahedral';
        bondAngle = '109.5°';
        polarity = allSubstituentsIdentical && maxEnDiff >= 0.4 ? 'Nonpolar (Symmetric)' : allSubstituentsIdentical ? 'Nonpolar' : 'Polar (Asymmetric)';
      } else if (n === 1) {
        geometry = 'Trigonal Pyramidal';
        bondAngle = '107.3°';
        polarity = 'Polar';
      } else {
        geometry = 'Bent (Angular)';
        bondAngle = '104.5°';
        polarity = 'Polar';
      }
    } else if (stericNumber === 5) {
      hybridization = 'sp³d';
      if (n === 0) {
        geometry = 'Trigonal Bipyramidal';
        bondAngle = '90° / 120°';
        polarity = allSubstituentsIdentical ? 'Nonpolar' : 'Polar';
      } else if (n === 1) {
        geometry = 'Seesaw';
        bondAngle = '<90° / <120°';
        polarity = 'Polar';
      } else if (n === 2) {
        geometry = 'T-Shaped';
        bondAngle = '<90°';
        polarity = 'Polar';
      } else {
        geometry = 'Linear';
        bondAngle = '180°';
        polarity = allSubstituentsIdentical ? 'Nonpolar' : 'Polar';
      }
    } else if (stericNumber >= 6) {
      hybridization = 'sp³d²';
      if (n === 0) {
        geometry = 'Octahedral';
        bondAngle = '90°';
        polarity = allSubstituentsIdentical ? 'Nonpolar' : 'Polar';
      } else if (n === 1) {
        geometry = 'Square Pyramidal';
        bondAngle = '<90°';
        polarity = 'Polar';
      } else {
        geometry = 'Square Planar';
        bondAngle = '90°';
        polarity = allSubstituentsIdentical ? 'Nonpolar' : 'Polar';
      }
    }

    // 5. Octet & Valency Check across all atoms
    let unsatisfiedCount = 0;
    let overvalentCount = 0;
    builderAtoms.forEach((a) => {
      const el = PALETTE_ELEMENTS[a.symbol] || PALETTE_ELEMENTS['H'];
      const bCount = atomBondCounts[a.id] || 0;
      if (bCount > el.maxBonds) overvalentCount++;
      else if (bCount < el.standardValency) unsatisfiedCount++;
    });

    const isOctetValid = overvalentCount === 0 && unsatisfiedCount === 0 && builderBonds.length > 0;
    const valencyStatus =
      overvalentCount > 0
        ? `Valency exceeded on ${overvalentCount} atom(s)`
        : unsatisfiedCount > 0
        ? `${unsatisfiedCount} atom(s) have open valence shells`
        : 'Octet / Duet Rules Satisfied ✓';

    // 6. Match with Known Molecule Names
    let iupacMatch = 'Custom Structure';
    const matchPreset = MOLECULES_LIBRARY.find(
      (mol) => mol.formula.replace(/\s+/g, '') === formattedFormula.replace(/\s+/g, '')
    );
    if (matchPreset) {
      iupacMatch = `${matchPreset.name} (${matchPreset.iupacName})`;
    } else if (formattedFormula === 'H₂O') iupacMatch = 'Water (Oxidane)';
    else if (formattedFormula === 'CO₂') iupacMatch = 'Carbon Dioxide';
    else if (formattedFormula === 'CH₄') iupacMatch = 'Methane';
    else if (formattedFormula === 'NH₃') iupacMatch = 'Ammonia (Azane)';
    else if (formattedFormula === 'O₃') iupacMatch = 'Ozone';
    else if (formattedFormula === 'H₂O₂') iupacMatch = 'Hydrogen Peroxide';
    else if (formattedFormula === 'SO₂') iupacMatch = 'Sulfur Dioxide';
    else if (formattedFormula === 'SF₆') iupacMatch = 'Sulfur Hexafluoride';
    else if (formattedFormula === 'PCl₅') iupacMatch = 'Phosphorus Pentachloride';
    else if (formattedFormula === 'HCl') iupacMatch = 'Hydrogen Chloride';
    else if (formattedFormula === 'NaCl') iupacMatch = 'Sodium Chloride';

    return {
      formula: formattedFormula,
      molecularWeight: Number(mw.toFixed(3)),
      bondType: predictedBondType,
      geometry,
      vseprNotation,
      bondAngle,
      hybridization,
      polarity,
      totalValenceElectrons: totalValence,
      iupacMatch,
      centralAtomSymbol: centralAtom.symbol,
      stericNumber,
      lonePairsOnCentral: n,
      formalChargeCentral,
      valencyStatus,
      isOctetValid,
      centralNeighborsList,
    };
  }, [builderAtoms, builderBonds, atomBondCounts]);

  // --- CANVAS ACTIONS ---

  const addAtomNode = (symbol: string) => {
    setValencyWarning(null);
    const id = `atom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newAtom: BuilderAtomNode = {
      id,
      symbol,
      x: 220 + (builderAtoms.length % 5) * 45,
      y: 190 + (builderAtoms.length % 4) * 40,
    };
    setBuilderAtoms([...builderAtoms, newAtom]);
    unlockAchievement('molecule_creator');
  };

  const removeAtomNode = (atomId: string) => {
    setValencyWarning(null);
    setBuilderAtoms(builderAtoms.filter((a) => a.id !== atomId));
    setBuilderBonds(builderBonds.filter((b) => b.sourceId !== atomId && b.targetId !== atomId));
    if (bondSourceAtomId === atomId) setBondSourceAtomId(null);
  };

  const handleAtomClick = (atomId: string) => {
    setValencyWarning(null);
    if (toolMode === 'erase') {
      removeAtomNode(atomId);
      return;
    }

    if (toolMode === 'bond') {
      if (!bondSourceAtomId) {
        setBondSourceAtomId(atomId);
      } else if (bondSourceAtomId !== atomId) {
        const srcAtom = builderAtoms.find((a) => a.id === bondSourceAtomId);
        const tgtAtom = builderAtoms.find((a) => a.id === atomId);
        if (!srcAtom || !tgtAtom) return;

        const srcEl = PALETTE_ELEMENTS[srcAtom.symbol] || PALETTE_ELEMENTS['H'];
        const tgtEl = PALETTE_ELEMENTS[tgtAtom.symbol] || PALETTE_ELEMENTS['H'];

        const existingIndex = builderBonds.findIndex(
          (b) =>
            (b.sourceId === bondSourceAtomId && b.targetId === atomId) ||
            (b.sourceId === atomId && b.targetId === bondSourceAtomId)
        );

        const srcCurrentBonds = atomBondCounts[srcAtom.id] || 0;
        const tgtCurrentBonds = atomBondCounts[tgtAtom.id] || 0;

        if (existingIndex >= 0) {
          const currentOrder = builderBonds[existingIndex].order;
          if (currentOrder < 3) {
            if (srcCurrentBonds + 1 > srcEl.maxBonds) {
              setValencyWarning(`${srcEl.name} (${srcEl.symbol}) cannot exceed ${srcEl.maxBonds} bond(s) (Octet/Duet limit).`);
              setBondSourceAtomId(null);
              return;
            }
            if (tgtCurrentBonds + 1 > tgtEl.maxBonds) {
              setValencyWarning(`${tgtEl.name} (${tgtEl.symbol}) cannot exceed ${tgtEl.maxBonds} bond(s) (Octet/Duet limit).`);
              setBondSourceAtomId(null);
              return;
            }
            const updated = [...builderBonds];
            updated[existingIndex].order = (currentOrder + 1) as 1 | 2 | 3;
            setBuilderBonds(updated);
          } else {
            setBuilderBonds(builderBonds.filter((_, idx) => idx !== existingIndex));
          }
        } else {
          if (srcCurrentBonds + selectedBondOrder > srcEl.maxBonds) {
            setValencyWarning(`${srcEl.name} (${srcEl.symbol}) max valency is ${srcEl.maxBonds} bond(s).`);
            setBondSourceAtomId(null);
            return;
          }
          if (tgtCurrentBonds + selectedBondOrder > tgtEl.maxBonds) {
            setValencyWarning(`${tgtEl.name} (${tgtEl.symbol}) max valency is ${tgtEl.maxBonds} bond(s).`);
            setBondSourceAtomId(null);
            return;
          }
          const newBond: BuilderBondEdge = {
            id: `bond-${Date.now()}`,
            sourceId: bondSourceAtomId,
            targetId: atomId,
            order: selectedBondOrder,
          };
          setBuilderBonds([...builderBonds, newBond]);
        }
        setBondSourceAtomId(null);
      } else {
        setBondSourceAtomId(null);
      }
    }
  };

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

  const handleClearCanvas = () => {
    setValencyWarning(null);
    setBuilderAtoms([]);
    setBuilderBonds([]);
    setBondSourceAtomId(null);
  };

  const loadPresetToSandbox = (mol: Molecule) => {
    setValencyWarning(null);
    setSelectedPreset(mol);

    const scale = 85;
    const centerX = 280;
    const centerY = 200;

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
    <div className="space-y-5 w-full">
      {/* Top Header Mode Tabs */}
      <div className="bg-black/40 p-4 sm:p-5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Interactive Molecule Builder & VSEPR Predictor
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
              AXₘEₙ + Octet Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Construct 2D & 3D molecular topologies with strict valency enforcement, formal charge calculation, and VSEPR dipole geometry.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10 shadow-inner">
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
          {/* Main 3-Column Split View on PC: Palette (3) | Canvas Stage (5) | Predicted Physics & Lewis (4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 3 Cols: Element Atom Palette */}
            <div className="lg:col-span-3 bg-black/40 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 flex flex-col justify-between backdrop-blur-3xl">
              <div>
                <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4" /> Atom Palette
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Click any atom to spawn it on the canvas. Max bond limits follow Octet/Duet & d-orbital rules:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PALETTE_ELEMENTS).map((el) => (
                    <button
                      key={el.symbol}
                      onClick={() => addAtomNode(el.symbol)}
                      className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/50 flex items-center gap-2.5 transition-all cursor-pointer group"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-slate-950 shadow-md border border-white/40 shrink-0"
                        style={{
                          backgroundColor: el.color,
                          color: el.symbol === 'H' || el.symbol === 'S' || el.symbol === 'Na' ? '#0f172a' : '#ffffff',
                        }}
                      >
                        {el.symbol}
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">{el.name}</div>
                        <div className="text-[9px] font-mono text-slate-400">
                          Val: {el.valenceElectrons}e⁻ · Max: {el.maxBonds}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Preset Launcher inside palette */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Load Quick Reference Structure:</span>
                <div className="flex flex-wrap gap-1.5">
                  {MOLECULES_LIBRARY.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => loadPresetToSandbox(m)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 text-[11px] font-bold font-mono transition-all border border-slate-700 cursor-pointer"
                      title={m.name}
                    >
                      {m.formula}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle 5 Cols: Interactive Drag-&-Drop Canvas */}
            <div className="lg:col-span-5 bg-black/40 p-5 rounded-3xl border border-white/10 shadow-2xl relative min-h-[520px] flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
              {/* Canvas Toolbar Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 z-10 bg-black/50 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
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
                    title="Click two atoms to connect or cycle bond order"
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

              {/* Valency / Octet Warning Banner */}
              {valencyWarning && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    {valencyWarning}
                  </span>
                  <button onClick={() => setValencyWarning(null)} className="text-[10px] underline">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Main SVG & HTML Interactive Canvas */}
              <div
                ref={canvasRef}
                onPointerMove={handlePointerMoveCanvas}
                onPointerUp={handlePointerUpCanvas}
                className="relative w-full h-[390px] my-2 rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden touch-none cursor-crosshair"
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
                              x1={src.x + nx * 3.5}
                              y1={src.y + ny * 3.5}
                              x2={tgt.x + nx * 3.5}
                              y2={tgt.y + ny * 3.5}
                              stroke="#38bdf8"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            <line
                              x1={src.x - nx * 3.5}
                              y1={src.y - ny * 3.5}
                              x2={tgt.x - nx * 3.5}
                              y2={tgt.y - ny * 3.5}
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
                              x1={src.x + nx * 5.5}
                              y1={src.y + ny * 5.5}
                              x2={tgt.x + nx * 5.5}
                              y2={tgt.y + ny * 5.5}
                              stroke="#f59e0b"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <line
                              x1={src.x - nx * 5.5}
                              y1={src.y - ny * 5.5}
                              x2={tgt.x - nx * 5.5}
                              y2={tgt.y - ny * 5.5}
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
                  const currentBonds = atomBondCounts[a.id] || 0;
                  const isSatisfied = currentBonds === elData.standardValency;

                  return (
                    <motion.div
                      key={a.id}
                      layoutId={a.id}
                      onPointerDown={(e) => handlePointerDownAtom(e, a.id)}
                      onClick={() => handleAtomClick(a.id)}
                      className={`absolute rounded-full flex flex-col items-center justify-center font-extrabold text-xs shadow-xl transition-transform cursor-pointer select-none z-10 ${
                        isBondSource ? 'ring-4 ring-amber-400 scale-125' : 'hover:scale-110'
                      }`}
                      style={{
                        left: `${a.x}px`,
                        top: `${a.y}px`,
                        width: `${elData.radius * 1.35}px`,
                        height: `${elData.radius * 1.35}px`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: elData.color,
                        color: a.symbol === 'H' || a.symbol === 'S' || a.symbol === 'Na' ? '#0f172a' : '#ffffff',
                        border: isSatisfied
                          ? '2px solid rgba(52, 211, 153, 0.9)'
                          : '2px solid rgba(255,255,255,0.4)',
                      }}
                    >
                      <span>{a.symbol}</span>
                      <span className="text-[8px] font-mono opacity-80 leading-none">
                        {currentBonds}/{elData.standardValency}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 z-10 px-1">
                <span>
                  In <strong>Bond Mode</strong>, click 1st atom then 2nd atom to link or cycle bond order (1 → 2 → 3).
                </span>
                <span
                  className={`font-mono font-bold flex items-center gap-1 ${
                    predictedData.isOctetValid ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {predictedData.isOctetValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  {predictedData.valencyStatus}
                </span>
              </div>
            </div>

            {/* Right 4 Cols: Predicted Physics & Dynamic Lewis Structure */}
            <div className="lg:col-span-4 bg-black/40 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 flex flex-col justify-between backdrop-blur-3xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> VSEPR & Electronic Telemetry
                  </h3>
                  <span className="font-mono text-sm font-black text-amber-400">
                    {predictedData.formula}
                  </span>
                </div>

                {/* Properties Cards Grid */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-slate-400">IUPAC / Common Name:</span>
                    <strong className="text-cyan-300 font-bold">{predictedData.iupacMatch}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-slate-400">Molecular Weight:</span>
                    <strong className="text-white font-mono">{predictedData.molecularWeight} g/mol</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-slate-400">VSEPR Class & Shape:</span>
                    <strong className="text-emerald-400 font-bold">
                      {predictedData.geometry} <span className="font-mono text-cyan-300">({predictedData.vseprNotation})</span>
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-slate-400">Ideal Bond Angle:</span>
                    <strong className="text-amber-400 font-mono">{predictedData.bondAngle}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-slate-400">Central Hybridization:</span>
                    <strong className="text-purple-400 font-mono">
                      {predictedData.hybridization} (SN = {predictedData.stericNumber})
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-slate-400">Central Formal Charge:</span>
                    <strong className="text-slate-200 font-mono">
                      {predictedData.centralAtomSymbol}: {predictedData.formalChargeCentral >= 0 ? `+${predictedData.formalChargeCentral}` : predictedData.formalChargeCentral}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-slate-400">Bond Character & Polarity:</span>
                    <strong className={predictedData.polarity.startsWith('Polar') ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
                      {predictedData.bondType} · {predictedData.polarity}
                    </strong>
                  </div>
                </div>

                {/* Dynamic Lewis Structure Diagram */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Central Atom Lewis Domain Diagram
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">
                      Lone Pairs: {predictedData.lonePairsOnCentral} | Total e⁻: {predictedData.totalValenceElectrons}
                    </span>
                  </div>

                  <div className="h-32 bg-black/60 rounded-xl border border-white/5 flex items-center justify-center p-2 relative">
                    <svg className="w-full h-full" viewBox="0 0 240 120">
                      <g transform="translate(120, 60)">
                        {/* Central Symbol */}
                        <text
                          x="0"
                          y="6"
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="20"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {predictedData.centralAtomSymbol}
                        </text>

                        {/* Render actual connected neighbors radially */}
                        {predictedData.centralNeighborsList.slice(0, 6).map((nb, idx, arr) => {
                          const angle = (idx / Math.max(1, arr.length)) * Math.PI * 2;
                          const x1 = Math.cos(angle) * 18;
                          const y1 = Math.sin(angle) * 18;
                          const x2 = Math.cos(angle) * 38;
                          const y2 = Math.sin(angle) * 38;
                          const tx = Math.cos(angle) * 50;
                          const ty = Math.sin(angle) * 50 + 4;

                          return (
                            <g key={idx}>
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={nb.order === 3 ? '#f59e0b' : nb.order === 2 ? '#38bdf8' : '#94a3b8'}
                                strokeWidth={nb.order === 3 ? '4' : nb.order === 2 ? '3' : '2'}
                              />
                              <text
                                x={tx}
                                y={ty}
                                textAnchor="middle"
                                fill="#f8fafc"
                                fontSize="13"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {nb.symbol}
                              </text>
                            </g>
                          );
                        })}

                        {/* Lone Pair Dots on Central Atom */}
                        {Array.from({ length: Math.min(3, predictedData.lonePairsOnCentral) }).map((_, lpIdx) => {
                          const baseAngle = -Math.PI / 2 + lpIdx * (Math.PI / 2);
                          const cx = Math.cos(baseAngle) * 22;
                          const cy = Math.sin(baseAngle) * 22;
                          return (
                            <g key={`lp-${lpIdx}`} fill="#f59e0b">
                              <circle cx={cx - 3} cy={cy} r="2.2" />
                              <circle cx={cx + 3} cy={cy} r="2.2" />
                            </g>
                          );
                        })}
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
          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-3xl space-y-3">
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      active
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-black/40 text-slate-300 border-white/10 hover:bg-black/60'
                    }`}
                  >
                    <span className="font-mono font-extrabold">{m.formula}</span>
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main 3D Molecule Visualizer & Property Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Interactive 3D Canvas Stage */}
            <div className="lg:col-span-8 bg-black/40 p-6 rounded-3xl border border-white/10 relative min-h-[480px] flex flex-col justify-between shadow-2xl overflow-hidden backdrop-blur-3xl">
              <div className="flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                    {selectedPreset.name} <span className="text-cyan-400 font-mono">({selectedPreset.formula})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedPreset.iupacName} | MW: {selectedPreset.molecularWeight} g/mol
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadPresetToSandbox(selectedPreset)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <AtomIcon className="w-3.5 h-3.5" /> Edit in Sandbox
                  </button>

                  <button
                    onClick={() => {
                      setRotationX(15);
                      setRotationY(30);
                    }}
                    className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                    title="Reset 3D Orientation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Render 3D Molecule Graphic */}
              <div
                className="w-full h-80 my-4 relative flex items-center justify-center cursor-grab active:cursor-grabbing"
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
                  {selectedPreset.bonds.map((bond, idx) => {
                    const sourceAtom = selectedPreset.atoms[bond.source];
                    const targetAtom = selectedPreset.atoms[bond.target];
                    if (!sourceAtom || !targetAtom) return null;

                    const scale = 75;
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

                  {selectedPreset.atoms.map((atom, idx) => {
                    const scale = 75;
                    const x = (atom.x || 0) * scale;
                    const y = (atom.y || 0) * scale;
                    const z = (atom.z || 0) * scale;
                    const size = atom.symbol === 'H' ? 38 : 54;

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
                Click and drag anywhere on the stage to rotate the 3D molecular geometry.
              </p>
            </div>

            {/* Right 4 Cols: Molecular Properties & Predictor */}
            <div className="lg:col-span-4 bg-black/40 p-6 rounded-3xl border border-white/10 space-y-5 flex flex-col justify-between backdrop-blur-3xl">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Molecular Geometry & Physics
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-black/20 border border-white/10 flex justify-between items-center shadow-inner">
                    <span className="text-white/50">Geometry Shape</span>
                    <span className="font-bold text-slate-100">{selectedPreset.geometry}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/20 border border-white/10 flex justify-between items-center shadow-inner">
                    <span className="text-white/50">Bond Angle</span>
                    <span className="font-mono font-bold text-cyan-400">{selectedPreset.bondAngle}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/20 border border-white/10 flex justify-between items-center shadow-inner">
                    <span className="text-white/50">Hybridization State</span>
                    <span className="font-mono font-bold text-purple-400">{selectedPreset.hybridization}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/20 border border-white/10 flex justify-between items-center shadow-inner">
                    <span className="text-white/50">Bond Type</span>
                    <span className="font-bold text-emerald-400">{selectedPreset.bondType}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/20 border border-white/10 flex justify-between items-center shadow-inner">
                    <span className="text-white/50">Molecular Polarity</span>
                    <span className="font-bold text-rose-400">{selectedPreset.polarity}</span>
                  </div>
                </div>

                <p className="text-xs text-white/70 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/10 shadow-inner">
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

