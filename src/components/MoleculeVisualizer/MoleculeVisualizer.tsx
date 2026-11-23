import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MOLECULES_LIBRARY,
  ISOMER_FAMILIES_META,
  getIsomersForMolecule,
  normalizeFormulaAscii,
} from '@/data/moleculesData';
import { MoleculeDossier, MoleculeAtomNode, MoleculeBondEdge, PendingReactionSetup } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import {
  MoleculeCanvas3D,
  RenderStyle3D,
  CPK_PALETTE,
  ActiveIrVibrationMode,
} from './MoleculeCanvas3D';
import {
  solveMolecularGraph3D,
  computeCanonicalTopologySignature,
  ComposerNode2D as ComposerNode,
  ComposerEdge2D as ComposerEdge,
} from '@/utils/molecularGraphEngine';
import {
  Search,
  Atom,
  Layers,
  FlaskConical,
  Flame,
  Activity,
  ShieldAlert,
  Sparkles,
  GitBranch,
  Columns,
  Plus,
  Trash2,
  Link2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Cpu,
  Beaker,
  Compass,
  Info,
  ArrowRight,
  RefreshCw,
  Play,
  Square,
} from 'lucide-react';

type WorkspaceMode = 'visualizer' | 'composer' | 'ai-synthesizer';
type DossierTab =
  | 'overview'
  | 'bonding'
  | 'synthesis'
  | 'thermodynamics'
  | 'spectroscopy'
  | 'applications';

// 21-Element Composer Palette covering Main-Group, Hypervalent, Noble Gas & Transition Elements
const COMPOSER_ELEMENTS: Array<{
  symbol: string;
  name: string;
  valenceElectrons: number;
  typicalValence: number;
  maxValence: number;
  electronegativity: number;
}> = [
  { symbol: 'H', name: 'Hydrogen', valenceElectrons: 1, typicalValence: 1, maxValence: 1, electronegativity: 2.20 },
  { symbol: 'B', name: 'Boron', valenceElectrons: 3, typicalValence: 3, maxValence: 4, electronegativity: 2.04 },
  { symbol: 'C', name: 'Carbon', valenceElectrons: 4, typicalValence: 4, maxValence: 4, electronegativity: 2.55 },
  { symbol: 'N', name: 'Nitrogen', valenceElectrons: 5, typicalValence: 3, maxValence: 4, electronegativity: 3.04 },
  { symbol: 'O', name: 'Oxygen', valenceElectrons: 6, typicalValence: 2, maxValence: 3, electronegativity: 3.44 },
  { symbol: 'F', name: 'Fluorine', valenceElectrons: 7, typicalValence: 1, maxValence: 1, electronegativity: 3.98 },
  { symbol: 'Na', name: 'Sodium', valenceElectrons: 1, typicalValence: 1, maxValence: 1, electronegativity: 0.93 },
  { symbol: 'Mg', name: 'Magnesium', valenceElectrons: 2, typicalValence: 2, maxValence: 2, electronegativity: 1.31 },
  { symbol: 'Al', name: 'Aluminum', valenceElectrons: 3, typicalValence: 3, maxValence: 6, electronegativity: 1.61 },
  { symbol: 'Si', name: 'Silicon', valenceElectrons: 4, typicalValence: 4, maxValence: 6, electronegativity: 1.90 },
  { symbol: 'P', name: 'Phosphorus', valenceElectrons: 5, typicalValence: 3, maxValence: 5, electronegativity: 2.19 },
  { symbol: 'S', name: 'Sulfur', valenceElectrons: 6, typicalValence: 2, maxValence: 6, electronegativity: 2.58 },
  { symbol: 'Cl', name: 'Chlorine', valenceElectrons: 7, typicalValence: 1, maxValence: 7, electronegativity: 3.16 },
  { symbol: 'K', name: 'Potassium', valenceElectrons: 1, typicalValence: 1, maxValence: 1, electronegativity: 0.82 },
  { symbol: 'Ca', name: 'Calcium', valenceElectrons: 2, typicalValence: 2, maxValence: 2, electronegativity: 1.00 },
  { symbol: 'Cr', name: 'Chromium', valenceElectrons: 6, typicalValence: 3, maxValence: 6, electronegativity: 1.66 },
  { symbol: 'Fe', name: 'Iron', valenceElectrons: 8, typicalValence: 3, maxValence: 6, electronegativity: 1.83 },
  { symbol: 'Cu', name: 'Copper', valenceElectrons: 11, typicalValence: 2, maxValence: 4, electronegativity: 1.90 },
  { symbol: 'Br', name: 'Bromine', valenceElectrons: 7, typicalValence: 1, maxValence: 5, electronegativity: 2.96 },
  { symbol: 'I', name: 'Iodine', valenceElectrons: 7, typicalValence: 1, maxValence: 7, electronegativity: 2.66 },
  { symbol: 'Xe', name: 'Xenon', valenceElectrons: 8, typicalValence: 2, maxValence: 6, electronegativity: 2.60 },
];

// Precompute canonical Weisfeiler-Lehman topological signatures for every reference library structure
const LIBRARY_TOPOLOGY_SIGNATURES = new Map<string, string>(
  MOLECULES_LIBRARY.map((m) => [m.id, computeCanonicalTopologySignature(m.atoms, m.bonds)])
);

function solveCustomMolecule3D(nodes: ComposerNode[], edges: ComposerEdge[]) {
  const solved = solveMolecularGraph3D(nodes, edges);
  const customSignature = computeCanonicalTopologySignature(
    solved.dossier.atoms,
    solved.dossier.bonds
  );
  const targetFormulaAscii = normalizeFormulaAscii(solved.dossier.formula);

  // Match a library molecule ONLY when BOTH Hill formula AND canonical connectivity graph match
  const exactLibraryMatch = MOLECULES_LIBRARY.find(
    (m) =>
      normalizeFormulaAscii(m.formula) === targetFormulaAscii &&
      m.atoms.length === nodes.length &&
      LIBRARY_TOPOLOGY_SIGNATURES.get(m.id) === customSignature
  );

  if (exactLibraryMatch) {
    solved.dossier.name = `${exactLibraryMatch.name} (Matched Topology)`;
    solved.dossier.iupacName = exactLibraryMatch.iupacName;
    solved.dossier.casNumber = exactLibraryMatch.casNumber;
    solved.dossier.smiles = exactLibraryMatch.smiles;
    solved.dossier.thermodynamics = exactLibraryMatch.thermodynamics;
    solved.dossier.synthesisMethods = exactLibraryMatch.synthesisMethods;
    solved.dossier.physicalProperties = exactLibraryMatch.physicalProperties;
    solved.dossier.spectroscopy = exactLibraryMatch.spectroscopy;
    solved.dossier.applications = exactLibraryMatch.applications;
    solved.dossier.safety = exactLibraryMatch.safety;
  }

  return {
    ...solved,
    matchedLibraryId: exactLibraryMatch?.id ?? null,
    topologySignature: customSignature,
  };
}

function buildReactionSetupFromMolecule(mol: MoleculeDossier): PendingReactionSetup {
  const idMap: Record<string, PendingReactionSetup> = {
    ammonia: { reactantSymbols: ['N', 'H'], temperature: 450, pressure: 200, catalyst: true },
    water: { reactantSymbols: ['H', 'O'], temperature: 500, pressure: 1, catalyst: true },
    'carbon-dioxide': { reactantSymbols: ['C', 'O'], temperature: 700, pressure: 1, catalyst: false },
    'sulfur-dioxide': { reactantSymbols: ['S', 'O'], temperature: 400, pressure: 1, catalyst: false },
    'sulfuric-acid': { reactantSymbols: ['S', 'O'], temperature: 450, pressure: 2, catalyst: true },
    'sodium-chloride': { reactantSymbols: ['Na', 'Cl'], temperature: 250, pressure: 1, catalyst: false },
    methane: { reactantSymbols: ['C', 'H'], temperature: 400, pressure: 50, catalyst: true },
    ethene: { reactantSymbols: ['C', 'H'], temperature: 750, pressure: 1, catalyst: false },
    ethanol: { reactantSymbols: ['C', 'H'], temperature: 280, pressure: 65, catalyst: true },
    ozone: { reactantSymbols: ['O'], temperature: 25, pressure: 1, catalyst: false },
    'boron-trifluoride': { reactantSymbols: ['B', 'F'], temperature: 150, pressure: 1, catalyst: false },
    'phosphorus-pentachloride': { reactantSymbols: ['P', 'Cl'], temperature: 180, pressure: 1, catalyst: false },
    'sulfur-hexafluoride': { reactantSymbols: ['S', 'F'], temperature: 300, pressure: 1, catalyst: false },
    'xenon-tetrafluoride': { reactantSymbols: ['Xe', 'F'], temperature: 400, pressure: 6, catalyst: false },
    'xenon-difluoride': { reactantSymbols: ['Xe', 'F'], temperature: 400, pressure: 1, catalyst: false },
  };

  if (idMap[mol.id]) {
    return {
      ...idMap[mol.id],
      moleculeId: mol.id,
      moleculeName: mol.name,
      moleculeFormula: mol.formula,
    };
  }

  const distinctSymbols = Array.from(new Set(mol.atoms.map((a) => a.symbol)));
  const tempMatch = mol.synthesisMethods.industrial.conditions.match(/(\d{2,4})\s*°?C/);
  const pressMatch = mol.synthesisMethods.industrial.conditions.match(/(\d+(?:\.\d+)?)\s*(?:atm|bar)/i);
  const catText = mol.synthesisMethods.industrial.catalyst.toLowerCase();
  const hasCat = catText.length > 0 && !catText.includes('none') && !catText.includes('uncatalyzed');

  return {
    reactantSymbols: distinctSymbols.slice(0, 3),
    temperature: tempMatch ? parseInt(tempMatch[1], 10) : 250,
    pressure: pressMatch ? Math.max(1, Math.round(parseFloat(pressMatch[1]))) : 1,
    catalyst: hasCat,
    moleculeId: mol.id,
    moleculeName: mol.name,
    moleculeFormula: mol.formula,
  };
}

export const MoleculeVisualizer: React.FC = () => {
  const { activeMoleculeId, setActiveMoleculeId, launchReactionSimulation } = useAppStore();

  // Top-level Workspace Mode
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('visualizer');

  // Dynamic Library (starts with 35 curated molecules + any AI-synthesized molecules added at runtime)
  const [customMolecules, setCustomMolecules] = useState<MoleculeDossier[]>([]);
  const allMolecules = useMemo(
    () => [...customMolecules, ...MOLECULES_LIBRARY],
    [customMolecules]
  );

  // Selected Molecule & Isomer Comparison State
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('ethanol');
  const [comparisonMoleculeId, setComparisonMoleculeId] = useState<string | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTab>('overview');
  const [selectedAtomIndex, setSelectedAtomIndex] = useState<number | null>(null);

  // Sync deep-linked molecule from cross-lab navigation
  useEffect(() => {
    if (!activeMoleculeId) return;
    const exists = allMolecules.some((m) => m.id === activeMoleculeId);
    if (exists) {
      setWorkspaceMode('visualizer');
      setSelectedMoleculeId(activeMoleculeId);
      setComparisonMoleculeId(null);
      setActiveDossierTab('overview');
      setSelectedAtomIndex(null);
    }
    setActiveMoleculeId(null);
  }, [activeMoleculeId, allMolecules, setActiveMoleculeId]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [vseprFilter, setVseprFilter] = useState<string>('All');
  const [activeIsomerFamily, setActiveIsomerFamily] = useState<string | null>(null);

  // 3D Viewport Controls
  const [renderStyle, setRenderStyle] = useState<RenderStyle3D>('ball-and-stick');
  const [showLonePairs, setShowLonePairs] = useState<boolean>(true);
  const [showDipoleVector, setShowDipoleVector] = useState<boolean>(true);
  const [showAtomLabels, setShowAtomLabels] = useState<boolean>(true);
  const [showBondLengths, setShowBondLengths] = useState<boolean>(false);
  const [showBondAngles, setShowBondAngles] = useState<boolean>(true);

  // Composer State (default pre-loaded with Ethanol C2H6O so it's immediately interactive)
  const [composerNodes, setComposerNodes] = useState<ComposerNode[]>([
    { id: 1, symbol: 'C', x2d: 140, y2d: 150 },
    { id: 2, symbol: 'C', x2d: 230, y2d: 150 },
    { id: 3, symbol: 'O', x2d: 315, y2d: 115 },
    { id: 4, symbol: 'H', x2d: 375, y2d: 145 },
    { id: 5, symbol: 'H', x2d: 85, y2d: 150 },
    { id: 6, symbol: 'H', x2d: 140, y2d: 90 },
    { id: 7, symbol: 'H', x2d: 140, y2d: 210 },
    { id: 8, symbol: 'H', x2d: 230, y2d: 90 },
    { id: 9, symbol: 'H', x2d: 230, y2d: 210 },
  ]);
  const [composerEdges, setComposerEdges] = useState<ComposerEdge[]>([
    { source: 1, target: 2, order: 1 },
    { source: 2, target: 3, order: 1 },
    { source: 3, target: 4, order: 1 },
    { source: 1, target: 5, order: 1 },
    { source: 1, target: 6, order: 1 },
    { source: 1, target: 7, order: 1 },
    { source: 2, target: 8, order: 1 },
    { source: 2, target: 9, order: 1 },
  ]);
  const [selectedComposerNodeId, setSelectedComposerNodeId] = useState<number | null>(1);
  const [bondOrderToCreate, setBondOrderToCreate] = useState<1 | 1.5 | 2 | 3>(1);
  const composerSvgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const didDragRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Active 3D FT-IR Vibrational Normal Mode
  const [activeIrMode, setActiveIrMode] = useState<ActiveIrVibrationMode | null>(null);

  // Clear active IR vibration when switching molecules
  useEffect(() => {
    setActiveIrMode(null);
  }, [selectedMoleculeId]);

  // AI Synthesizer State
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Active Molecule object
  const selectedMolecule = useMemo(
    () => allMolecules.find((m) => m.id === selectedMoleculeId) || allMolecules[0],
    [allMolecules, selectedMoleculeId]
  );

  // Structural isomers sharing the same formula / isomerGroup
  const relatedIsomers = useMemo(
    () => getIsomersForMolecule(selectedMolecule, allMolecules),
    [selectedMolecule, allMolecules]
  );

  const comparisonMolecule = useMemo(() => {
    if (!comparisonMoleculeId) return null;
    return allMolecules.find((m) => m.id === comparisonMoleculeId) || null;
  }, [allMolecules, comparisonMoleculeId]);

  // Filtered Library
  const filteredMolecules = useMemo(() => {
    return allMolecules.filter((m) => {
      if (activeIsomerFamily && m.isomerGroup !== activeIsomerFamily) return false;
      if (categoryFilter !== 'All' && m.category !== categoryFilter) return false;
      if (vseprFilter !== 'All' && !m.vseprNotation.startsWith(vseprFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const qAscii = normalizeFormulaAscii(q).toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchIupac = m.iupacName.toLowerCase().includes(q);
        const matchFormula =
          m.formula.toLowerCase().includes(q) ||
          normalizeFormulaAscii(m.formula).toLowerCase().includes(qAscii);
        const matchCondensed = m.condensedFormula.toLowerCase().includes(q);
        const matchGeom = m.geometry.toLowerCase().includes(q);
        const matchVsepr = m.vseprNotation.toLowerCase().includes(q);
        const matchCas = m.casNumber.toLowerCase().includes(q);
        return (
          matchName ||
          matchIupac ||
          matchFormula ||
          matchCondensed ||
          matchGeom ||
          matchVsepr ||
          matchCas
        );
      }
      return true;
    });
  }, [allMolecules, activeIsomerFamily, categoryFilter, vseprFilter, searchQuery]);

  // Composer 3D VSEPR Solution
  const composerSolution = useMemo(
    () => solveCustomMolecule3D(composerNodes, composerEdges),
    [composerNodes, composerEdges]
  );

  // Matching isomers in library for current Composer formula
  const composerFormulaIsomers = useMemo(() => {
    const ascii = normalizeFormulaAscii(composerSolution.dossier.formula);
    return allMolecules.filter((m) => normalizeFormulaAscii(m.formula) === ascii);
  }, [allMolecules, composerSolution.dossier.formula]);

  // Select a molecule & clear stale comparison if not in same isomer group
  const handleSelectMolecule = (mol: MoleculeDossier) => {
    setSelectedMoleculeId(mol.id);
    setSelectedAtomIndex(null);
    if (comparisonMolecule && comparisonMolecule.isomerGroup !== mol.isomerGroup) {
      setComparisonMoleculeId(null);
    }
  };

  // Load any library molecule into the 2D/3D Topology Composer
  const handleLoadIntoComposer = (mol: MoleculeDossier) => {
    const newNodes: ComposerNode[] = mol.atoms.map((a, idx) => ({
      id: idx + 1,
      symbol: a.symbol,
      x2d: Math.round(230 + a.x * 58),
      y2d: Math.round(155 - a.y * 58 + a.z * 22),
    }));
    const newEdges: ComposerEdge[] = mol.bonds.map((b) => ({
      source: b.source + 1,
      target: b.target + 1,
      order: b.order,
    }));
    setComposerNodes(newNodes);
    setComposerEdges(newEdges);
    setSelectedComposerNodeId(1);
    setWorkspaceMode('composer');
  };

  // Add atom in Composer
  const handleAddComposerAtom = (symbol: string) => {
    const nextId = composerNodes.reduce((max, n) => Math.max(max, n.id), 0) + 1;
    const anchor = composerNodes.find((n) => n.id === selectedComposerNodeId) || composerNodes[composerNodes.length - 1];
    const angle = (nextId * 67 * Math.PI) / 180;
    const newX = anchor ? Math.max(40, Math.min(420, Math.round(anchor.x2d + Math.cos(angle) * 58))) : 220;
    const newY = anchor ? Math.max(40, Math.min(270, Math.round(anchor.y2d + Math.sin(angle) * 58))) : 150;

    setComposerNodes((prev) => [...prev, { id: nextId, symbol, x2d: newX, y2d: newY }]);
    if (selectedComposerNodeId !== null) {
      setComposerEdges((prev) => [
        ...prev,
        { source: selectedComposerNodeId, target: nextId, order: bondOrderToCreate },
      ]);
    }
    setSelectedComposerNodeId(nextId);
  };

  // Click node in Composer 2D SVG: if another node is selected, toggle/cycle bond between them
  const handleComposerNodeClick = (clickedId: number, shiftKey: boolean) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (shiftKey && selectedComposerNodeId !== null && selectedComposerNodeId !== clickedId) {
      setComposerEdges((prev) => {
        const existingIdx = prev.findIndex(
          (e) =>
            (e.source === selectedComposerNodeId && e.target === clickedId) ||
            (e.source === clickedId && e.target === selectedComposerNodeId)
        );
        if (existingIdx !== -1) {
          // Cycle bond order 1 -> 2 -> 3 -> remove
          const existing = prev[existingIdx];
          if (existing.order === 1) {
            const copy = [...prev];
            copy[existingIdx] = { ...existing, order: 2 };
            return copy;
          }
          if (existing.order === 2) {
            const copy = [...prev];
            copy[existingIdx] = { ...existing, order: 3 };
            return copy;
          }
          return prev.filter((_, i) => i !== existingIdx);
        }
        return [
          ...prev,
          { source: selectedComposerNodeId, target: clickedId, order: bondOrderToCreate },
        ];
      });
    } else {
      setSelectedComposerNodeId(clickedId);
    }
  };

  // Smooth 2D SVG pointer drag-to-move using screen-to-SVG CTM inverse
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingNodeId === null || !composerSvgRef.current) return;
    if (dragStartRef.current && !didDragRef.current) {
      const dist = Math.hypot(
        e.clientX - dragStartRef.current.x,
        e.clientY - dragStartRef.current.y
      );
      if (dist <= 4) return;
      didDragRef.current = true;
    }
    const svg = composerSvgRef.current;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const localPt = pt.matrixTransform(ctm.inverse());
    const clampedX = Math.max(24, Math.min(436, Math.round(localPt.x)));
    const clampedY = Math.max(24, Math.min(286, Math.round(localPt.y)));
    setComposerNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x2d: clampedX, y2d: clampedY } : n))
    );
  };

  // Auto-Saturate all unsaturated heavy atoms with implicit Hydrogens (+H)
  const handleAutoSaturateHydrogens = () => {
    const valences: Record<string, number> = {
      C: 4,
      N: 3,
      O: 2,
      B: 3,
      Si: 4,
      P: 3,
      S: 2,
      F: 1,
      Cl: 1,
      Br: 1,
      I: 1,
    };
    let nextId = composerNodes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
    const addedNodes: ComposerNode[] = [];
    const addedEdges: ComposerEdge[] = [];

    for (const node of composerNodes) {
      const targetValence = valences[node.symbol];
      if (!targetValence) continue;
      const boSum = composerEdges.reduce(
        (acc, e) => (e.source === node.id || e.target === node.id ? acc + e.order : acc),
        0
      );
      const missingH = Math.max(0, Math.round(targetValence - boSum));
      if (missingH === 0) continue;

      // Compute average angle of existing neighbors so new H atoms fan cleanly away
      const neighborAngles: number[] = [];
      for (const e of composerEdges) {
        const otherId = e.source === node.id ? e.target : e.target === node.id ? e.source : null;
        if (otherId !== null) {
          const nb = composerNodes.find((n) => n.id === otherId);
          if (nb) neighborAngles.push(Math.atan2(nb.y2d - node.y2d, nb.x2d - node.x2d));
        }
      }
      const baseAngle =
        neighborAngles.length > 0
          ? Math.atan2(
              -neighborAngles.reduce((s, a) => s + Math.sin(a), 0),
              -neighborAngles.reduce((s, a) => s + Math.cos(a), 0)
            )
          : -Math.PI / 2;

      for (let h = 0; h < missingH; h++) {
        const spread = missingH === 1 ? 0 : ((h / (missingH - 1)) - 0.5) * 1.65;
        const ang = baseAngle + spread;
        const hx = Math.max(26, Math.min(434, Math.round(node.x2d + Math.cos(ang) * 44)));
        const hy = Math.max(26, Math.min(284, Math.round(node.y2d + Math.sin(ang) * 44)));
        addedNodes.push({ id: nextId, symbol: 'H', x2d: hx, y2d: hy });
        addedEdges.push({ source: node.id, target: nextId, order: 1 });
        nextId++;
      }
    }

    if (addedNodes.length > 0) {
      setComposerNodes((prev) => [...prev, ...addedNodes]);
      setComposerEdges((prev) => [...prev, ...addedEdges]);
    }
  };

  // Strip all Hydrogen atoms (-H) to quickly edit the heavy-atom carbon/heteroatom skeleton
  const handleStripHydrogens = () => {
    const heavyNodes = composerNodes.filter((n) => n.symbol !== 'H');
    if (heavyNodes.length === 0) return;
    const heavyIds = new Set(heavyNodes.map((n) => n.id));
    setComposerNodes(heavyNodes);
    setComposerEdges((prev) => prev.filter((e) => heavyIds.has(e.source) && heavyIds.has(e.target)));
    if (selectedComposerNodeId !== null && !heavyIds.has(selectedComposerNodeId)) {
      setSelectedComposerNodeId(heavyNodes[0].id);
    }
  };

  // 1-Click Ring & Functional Group Structural Stamps
  const handleApplyStructuralStamp = (
    stamp: 'benzene' | 'cyclopropane' | 'cyclohexane' | 'carbonyl' | 'carboxyl' | 'amino' | 'nitro'
  ) => {
    if (stamp === 'benzene') {
      const cx = 230;
      const cy = 155;
      const rRing = 56;
      const rH = 98;
      const nodes: ComposerNode[] = [];
      const edges: ComposerEdge[] = [];
      for (let i = 0; i < 6; i++) {
        const th = (i * Math.PI) / 3 - Math.PI / 6;
        nodes.push({
          id: i + 1,
          symbol: 'C',
          x2d: Math.round(cx + rRing * Math.cos(th)),
          y2d: Math.round(cy + rRing * Math.sin(th)),
        });
        nodes.push({
          id: i + 7,
          symbol: 'H',
          x2d: Math.round(cx + rH * Math.cos(th)),
          y2d: Math.round(cy + rH * Math.sin(th)),
        });
        edges.push({ source: i + 1, target: ((i + 1) % 6) + 1, order: 1.5 });
        edges.push({ source: i + 1, target: i + 7, order: 1 });
      }
      setComposerNodes(nodes);
      setComposerEdges(edges);
      setSelectedComposerNodeId(1);
      return;
    }

    if (stamp === 'cyclopropane') {
      const cx = 230;
      const cy = 160;
      const rRing = 48;
      const nodes: ComposerNode[] = [];
      const edges: ComposerEdge[] = [];
      for (let i = 0; i < 3; i++) {
        const th = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const cId = i + 1;
        nodes.push({
          id: cId,
          symbol: 'C',
          x2d: Math.round(cx + rRing * Math.cos(th)),
          y2d: Math.round(cy + rRing * Math.sin(th)),
        });
        edges.push({ source: cId, target: ((i + 1) % 3) + 1, order: 1 });
        // Two hydrogens per CH2 ring vertex
        for (let h = 0; h < 2; h++) {
          const hId = 4 + i * 2 + h;
          const hAng = th + (h === 0 ? -0.32 : 0.32);
          nodes.push({
            id: hId,
            symbol: 'H',
            x2d: Math.round(cx + 96 * Math.cos(hAng)),
            y2d: Math.round(cy + 96 * Math.sin(hAng)),
          });
          edges.push({ source: cId, target: hId, order: 1 });
        }
      }
      setComposerNodes(nodes);
      setComposerEdges(edges);
      setSelectedComposerNodeId(1);
      return;
    }

    if (stamp === 'cyclohexane') {
      const cx = 230;
      const cy = 155;
      const rRing = 62;
      const nodes: ComposerNode[] = [];
      const edges: ComposerEdge[] = [];
      for (let i = 0; i < 6; i++) {
        const th = (i * Math.PI) / 3 - Math.PI / 6;
        nodes.push({
          id: i + 1,
          symbol: 'C',
          x2d: Math.round(cx + rRing * Math.cos(th)),
          y2d: Math.round(cy + rRing * Math.sin(th)),
        });
        edges.push({ source: i + 1, target: ((i + 1) % 6) + 1, order: 1 });
      }
      setComposerNodes(nodes);
      setComposerEdges(edges);
      setSelectedComposerNodeId(1);
      return;
    }

    // Functional group attachments onto currently selected atom
    const anchor =
      composerNodes.find((n) => n.id === selectedComposerNodeId) ||
      composerNodes[composerNodes.length - 1];
    if (!anchor) return;
    let nextId = composerNodes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
    const clamped = (x: number, y: number) => ({
      x2d: Math.max(28, Math.min(432, Math.round(x))),
      y2d: Math.max(28, Math.min(282, Math.round(y))),
    });

    if (stamp === 'carbonyl') {
      const oPos = clamped(anchor.x2d, anchor.y2d - 52);
      setComposerNodes((prev) => [...prev, { id: nextId, symbol: 'O', ...oPos }]);
      setComposerEdges((prev) => [...prev, { source: anchor.id, target: nextId, order: 2 }]);
      return;
    }

    if (stamp === 'carboxyl') {
      const cId = nextId++;
      const o1Id = nextId++;
      const o2Id = nextId++;
      const hId = nextId++;
      const cPos = clamped(anchor.x2d + 54, anchor.y2d);
      const o1Pos = clamped(cPos.x2d, cPos.y2d - 50);
      const o2Pos = clamped(cPos.x2d + 48, cPos.y2d + 28);
      const hPos = clamped(o2Pos.x2d + 36, o2Pos.y2d);
      setComposerNodes((prev) => [
        ...prev,
        { id: cId, symbol: 'C', ...cPos },
        { id: o1Id, symbol: 'O', ...o1Pos },
        { id: o2Id, symbol: 'O', ...o2Pos },
        { id: hId, symbol: 'H', ...hPos },
      ]);
      setComposerEdges((prev) => [
        ...prev,
        { source: anchor.id, target: cId, order: 1 },
        { source: cId, target: o1Id, order: 2 },
        { source: cId, target: o2Id, order: 1 },
        { source: o2Id, target: hId, order: 1 },
      ]);
      setSelectedComposerNodeId(cId);
      return;
    }

    if (stamp === 'amino') {
      const nId = nextId++;
      const h1Id = nextId++;
      const h2Id = nextId++;
      const nPos = clamped(anchor.x2d + 54, anchor.y2d);
      const h1Pos = clamped(nPos.x2d + 34, nPos.y2d - 34);
      const h2Pos = clamped(nPos.x2d + 34, nPos.y2d + 34);
      setComposerNodes((prev) => [
        ...prev,
        { id: nId, symbol: 'N', ...nPos },
        { id: h1Id, symbol: 'H', ...h1Pos },
        { id: h2Id, symbol: 'H', ...h2Pos },
      ]);
      setComposerEdges((prev) => [
        ...prev,
        { source: anchor.id, target: nId, order: 1 },
        { source: nId, target: h1Id, order: 1 },
        { source: nId, target: h2Id, order: 1 },
      ]);
      setSelectedComposerNodeId(nId);
      return;
    }

    if (stamp === 'nitro') {
      const nId = nextId++;
      const o1Id = nextId++;
      const o2Id = nextId++;
      const nPos = clamped(anchor.x2d + 54, anchor.y2d);
      const o1Pos = clamped(nPos.x2d + 38, nPos.y2d - 36);
      const o2Pos = clamped(nPos.x2d + 38, nPos.y2d + 36);
      setComposerNodes((prev) => [
        ...prev,
        { id: nId, symbol: 'N', ...nPos },
        { id: o1Id, symbol: 'O', ...o1Pos },
        { id: o2Id, symbol: 'O', ...o2Pos },
      ]);
      setComposerEdges((prev) => [
        ...prev,
        { source: anchor.id, target: nId, order: 1 },
        { source: nId, target: o1Id, order: 2 },
        { source: nId, target: o2Id, order: 1 },
      ]);
      setSelectedComposerNodeId(nId);
    }
  };

  // Normalize AI-returned MoleculeDossier so partial LLM payloads never crash nested UI views
  const normalizeAiMoleculeDossier = (raw: any, fallbackIdx = 0): MoleculeDossier => {
    const atoms: MoleculeAtomNode[] = Array.isArray(raw?.atoms)
      ? raw.atoms.map((a: any) => ({
          symbol: typeof a?.symbol === 'string' && a.symbol.trim() ? a.symbol.trim() : 'C',
          x: Number.isFinite(Number(a?.x)) ? Number(a.x) : 0,
          y: Number.isFinite(Number(a?.y)) ? Number(a.y) : 0,
          z: Number.isFinite(Number(a?.z)) ? Number(a.z) : 0,
          partialCharge: Number.isFinite(Number(a?.partialCharge)) ? Number(a.partialCharge) : 0,
          formalCharge: Number.isFinite(Number(a?.formalCharge)) ? Number(a.formalCharge) : 0,
          hybridization: typeof a?.hybridization === 'string' ? a.hybridization : 'sp³',
          lonePairs: Number.isFinite(Number(a?.lonePairs)) ? Number(a.lonePairs) : 0,
        }))
      : [];
    const bonds: MoleculeBondEdge[] = Array.isArray(raw?.bonds)
      ? raw.bonds
          .filter(
            (b: any) =>
              Number.isInteger(b?.source) &&
              Number.isInteger(b?.target) &&
              b.source >= 0 &&
              b.source < atoms.length &&
              b.target >= 0 &&
              b.target < atoms.length
          )
          .map((b: any) => ({
            source: b.source,
            target: b.target,
            order: ([1, 1.33, 1.5, 2, 3].includes(Number(b.order)) ? Number(b.order) : 1) as
              | 1
              | 1.33
              | 1.5
              | 2
              | 3,
            lengthAngstrom: Number.isFinite(Number(b?.lengthAngstrom))
              ? Number(b.lengthAngstrom)
              : undefined,
          }))
      : [];

    const formulaStr = typeof raw?.formula === 'string' && raw.formula ? raw.formula : 'Custom';
    const rawSafety = raw?.safety || {};
    const rawNfpa = rawSafety?.nfpa704 || {};
    const rawPhys = raw?.physicalProperties || {};
    const rawSpec = raw?.spectroscopy || {};
    const rawForm = raw?.formationCriteria || {};
    const rawThermo = raw?.thermodynamics || {};
    const rawSynth = raw?.synthesisMethods || {};
    const rawSynthInd = rawSynth?.industrial || {};
    const rawSynthLab = rawSynth?.laboratory || {};
    const rawApps = raw?.applications || {};

    const validState =
      rawPhys?.stateAtSTP === 'Gas' || rawPhys?.stateAtSTP === 'Liquid' || rawPhys?.stateAtSTP === 'Solid'
        ? rawPhys.stateAtSTP
        : 'Liquid';

    const validBondTypes: MoleculeDossier['bondType'][] = [
      'Covalent',
      'Polar Covalent',
      'Ionic',
      'Coordinate Covalent',
      'Delocalized Aromatic',
    ];
    const bondType = validBondTypes.includes(raw?.bondType) ? raw.bondType : 'Covalent';

    const validCategories: MoleculeDossier['category'][] = [
      'Inorganic',
      'Organic',
      'Hydrocarbon',
      'Hypervalent',
      'Allotrope',
      'Ionic / Salt',
      'Noble Gas',
    ];
    const category = validCategories.includes(raw?.category) ? raw.category : 'Organic';

    return {
      id:
        typeof raw?.id === 'string' && raw.id.trim()
          ? raw.id.trim()
          : `ai-mol-${Date.now()}-${fallbackIdx}`,
      name: typeof raw?.name === 'string' && raw.name ? raw.name : 'AI Synthesized Molecule',
      iupacName: typeof raw?.iupacName === 'string' && raw.iupacName ? raw.iupacName : raw?.name || 'Custom IUPAC',
      commonNames: Array.isArray(raw?.commonNames) ? raw.commonNames.map(String) : [],
      casNumber: typeof raw?.casNumber === 'string' ? raw.casNumber : 'N/A',
      smiles: typeof raw?.smiles === 'string' ? raw.smiles : '',
      formula: formulaStr,
      condensedFormula: typeof raw?.condensedFormula === 'string' ? raw.condensedFormula : formulaStr,
      isomerGroup:
        typeof raw?.isomerGroup === 'string' && raw.isomerGroup
          ? raw.isomerGroup
          : normalizeFormulaAscii(formulaStr),
      isomerType: raw?.isomerType || 'Canonical',
      isomerComparisonNote:
        typeof raw?.isomerComparisonNote === 'string' ? raw.isomerComparisonNote : undefined,
      category,
      molecularWeight: Number.isFinite(Number(raw?.molecularWeight)) ? Number(raw.molecularWeight) : 0,
      degreeOfUnsaturation: Number.isFinite(Number(raw?.degreeOfUnsaturation))
        ? Number(raw.degreeOfUnsaturation)
        : 0,
      pointGroup: typeof raw?.pointGroup === 'string' ? raw.pointGroup : 'C₁',
      bondType,
      geometry: typeof raw?.geometry === 'string' ? raw.geometry : 'Tetrahedral',
      electronicGeometry: typeof raw?.electronicGeometry === 'string' ? raw.electronicGeometry : 'Tetrahedral',
      vseprNotation: typeof raw?.vseprNotation === 'string' ? raw.vseprNotation : 'AX₄',
      stericNumber: Number.isFinite(Number(raw?.stericNumber)) ? Number(raw.stericNumber) : 4,
      bondAngle: typeof raw?.bondAngle === 'string' ? raw.bondAngle : '109.5°',
      hybridization: typeof raw?.hybridization === 'string' ? raw.hybridization : 'sp³',
      polarity: raw?.polarity === 'Nonpolar' ? 'Nonpolar' : 'Polar',
      dipoleMomentDebye: Number.isFinite(Number(raw?.dipoleMomentDebye))
        ? Number(raw.dipoleMomentDebye)
        : 0,
      description: typeof raw?.description === 'string' ? raw.description : '',
      formationCriteria: {
        octetRuleStatus:
          typeof rawForm?.octetRuleStatus === 'string'
            ? rawForm.octetRuleStatus
            : 'Satisfies standard valence rules.',
        deltaEN: typeof rawForm?.deltaEN === 'string' ? rawForm.deltaEN : 'N/A',
        sigmaBonds: Number.isFinite(Number(rawForm?.sigmaBonds)) ? Number(rawForm.sigmaBonds) : bonds.length,
        piBonds: Number.isFinite(Number(rawForm?.piBonds)) ? Number(rawForm.piBonds) : 0,
        lonePairsTotal: Number.isFinite(Number(rawForm?.lonePairsTotal))
          ? Number(rawForm.lonePairsTotal)
          : atoms.reduce((s, a) => s + (a.lonePairs || 0), 0),
        resonanceDescription:
          typeof rawForm?.resonanceDescription === 'string'
            ? rawForm.resonanceDescription
            : 'Localized bonding description.',
      },
      thermodynamics: {
        deltaHf: typeof rawThermo?.deltaHf === 'string' ? rawThermo.deltaHf : 'N/A',
        deltaGf: typeof rawThermo?.deltaGf === 'string' ? rawThermo.deltaGf : 'N/A',
        entropyS: typeof rawThermo?.entropyS === 'string' ? rawThermo.entropyS : 'N/A',
        bondEnergies: Array.isArray(rawThermo?.bondEnergies)
          ? rawThermo.bondEnergies.map((be: any) => ({
              bond: typeof be?.bond === 'string' ? be.bond : 'Bond',
              lengthAngstrom: Number.isFinite(Number(be?.lengthAngstrom)) ? Number(be.lengthAngstrom) : 1.5,
              energyKjMol: Number.isFinite(Number(be?.energyKjMol)) ? Number(be.energyKjMol) : 350,
            }))
          : [],
      },
      synthesisMethods: {
        industrial: {
          processName: typeof rawSynthInd?.processName === 'string' ? rawSynthInd.processName : 'Industrial Synthesis',
          equation: typeof rawSynthInd?.equation === 'string' ? rawSynthInd.equation : 'N/A',
          conditions: typeof rawSynthInd?.conditions === 'string' ? rawSynthInd.conditions : 'Standard catalytic conditions',
          catalyst: typeof rawSynthInd?.catalyst === 'string' ? rawSynthInd.catalyst : 'None',
          mechanismSummary: typeof rawSynthInd?.mechanismSummary === 'string' ? rawSynthInd.mechanismSummary : 'N/A',
        },
        laboratory: {
          methodName: typeof rawSynthLab?.methodName === 'string' ? rawSynthLab.methodName : 'Laboratory Preparation',
          equation: typeof rawSynthLab?.equation === 'string' ? rawSynthLab.equation : 'N/A',
          reagents: typeof rawSynthLab?.reagents === 'string' ? rawSynthLab.reagents : 'N/A',
          conditions: typeof rawSynthLab?.conditions === 'string' ? rawSynthLab.conditions : 'Ambient / Reflux',
          procedureNotes: typeof rawSynthLab?.procedureNotes === 'string' ? rawSynthLab.procedureNotes : 'N/A',
        },
      },
      physicalProperties: {
        stateAtSTP: validState,
        appearance: typeof rawPhys?.appearance === 'string' ? rawPhys.appearance : 'N/A',
        meltingPointC: typeof rawPhys?.meltingPointC === 'string' ? rawPhys.meltingPointC : 'N/A',
        boilingPointC: typeof rawPhys?.boilingPointC === 'string' ? rawPhys.boilingPointC : 'N/A',
        density: typeof rawPhys?.density === 'string' ? rawPhys.density : 'N/A',
        solubility: typeof rawPhys?.solubility === 'string' ? rawPhys.solubility : 'N/A',
        pKa: typeof rawPhys?.pKa === 'string' ? rawPhys.pKa : 'N/A',
        intermolecularForces: Array.isArray(rawPhys?.intermolecularForces)
          ? rawPhys.intermolecularForces.map(String)
          : ['London dispersion forces'],
      },
      spectroscopy: {
        irBands: Array.isArray(rawSpec?.irBands)
          ? rawSpec.irBands.map((b: any) => ({
              wavenumberCm: typeof b?.wavenumberCm === 'string' ? b.wavenumberCm : '1500 cm⁻¹',
              assignment: typeof b?.assignment === 'string' ? b.assignment : 'Vibration',
            }))
          : [],
        nmrShifts: Array.isArray(rawSpec?.nmrShifts)
          ? rawSpec.nmrShifts.map((n: any) => ({
              nucleus: typeof n?.nucleus === 'string' ? n.nucleus : '¹H',
              shiftPpm: typeof n?.shiftPpm === 'string' ? n.shiftPpm : 'N/A',
              assignment: typeof n?.assignment === 'string' ? n.assignment : 'N/A',
            }))
          : [],
      },
      applications: {
        industrial: Array.isArray(rawApps?.industrial) ? rawApps.industrial.map(String) : [],
        laboratory: Array.isArray(rawApps?.laboratory) ? rawApps.laboratory.map(String) : [],
        biologicalAndMedical: Array.isArray(rawApps?.biologicalAndMedical)
          ? rawApps.biologicalAndMedical.map(String)
          : [],
      },
      safety: {
        ghsHazards: Array.isArray(rawSafety?.ghsHazards) ? rawSafety.ghsHazards.map(String) : [],
        nfpa704: {
          health: Number.isFinite(Number(rawNfpa?.health)) ? Number(rawNfpa.health) : 0,
          flammability: Number.isFinite(Number(rawNfpa?.flammability)) ? Number(rawNfpa.flammability) : 0,
          instability: Number.isFinite(Number(rawNfpa?.instability)) ? Number(rawNfpa.instability) : 0,
          special: typeof rawNfpa?.special === 'string' ? rawNfpa.special : undefined,
        },
        handling:
          typeof rawSafety?.handling === 'string'
            ? rawSafety.handling
            : 'Follow standard laboratory PPE and ventilation protocols.',
      },
      atoms,
      bonds,
    };
  };

  // AI Molecule & Isomer Synthesis handler
  const handleAiSynthesize = async (customPrompt?: string) => {
    const targetQuery = (customPrompt ?? aiQuery).trim();
    if (!targetQuery) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/analyze-molecule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to synthesize molecule.');
      }

      const payload = data.result || data;
      if (!payload?.molecule || !Array.isArray(payload.molecule.atoms) || payload.molecule.atoms.length === 0) {
        throw new Error('AI response did not include valid 3D atomic coordinates.');
      }

      const primaryMol = normalizeAiMoleculeDossier(payload.molecule, 0);
      const extraIsomers: MoleculeDossier[] = Array.isArray(payload.relatedIsomers)
        ? payload.relatedIsomers
            .filter((iso: any) => Array.isArray(iso?.atoms) && iso.atoms.length > 0)
            .map((iso: any, idx: number) => normalizeAiMoleculeDossier(iso, idx + 1))
        : [];

      const addedList = [primaryMol, ...extraIsomers];
      setCustomMolecules((prev) => {
        const filtered = prev.filter((p) => !addedList.some((a) => a.id === p.id));
        return [...addedList, ...filtered];
      });
      setSelectedMoleculeId(primaryMol.id);
      if (extraIsomers.length > 0) {
        setComparisonMoleculeId(extraIsomers[0].id);
      } else {
        setComparisonMoleculeId(null);
      }
      setWorkspaceMode('visualizer');
    } catch (err: any) {
      setAiError(err?.message || 'Unable to analyze molecule right now.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-5 flex flex-col gap-5 text-slate-900 dark:text-slate-100">
      {/* =====================================================================
          HEADER & WORKSPACE MODE SWITCHER
         ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shrink-0">
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                3D Molecule Visualizer & Isomer Studio
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {allMolecules.length} Reference Structures
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Interactive WebGL crystallographic coordinates, constitutional & geometric isomer comparisons, VSEPR lone-pair geometry, synthesis routes, and spectroscopy.
            </p>
          </div>
        </div>

        {/* 3-Workspace Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setWorkspaceMode('visualizer')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              workspaceMode === 'visualizer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            3D Visualizer & Isomer Studio
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('composer')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              workspaceMode === 'composer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Formula & Topology Composer
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('ai-synthesizer')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              workspaceMode === 'ai-synthesizer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Molecular Synthesizer
          </button>
        </div>
      </div>

      {/* =====================================================================
          WORKSPACE 1: 3D VISUALIZER, ISOMER STUDIO & ENCYCLOPEDIA DOSSIER
         ===================================================================== */}
      {workspaceMode === 'visualizer' && (
        <div className="flex flex-col gap-5">
          {/* Quick Isomer & Allotrope Families Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Featured Structural & Geometric Isomer Families (Same Atoms, Different 3D Structures)
                </span>
              </div>
              {activeIsomerFamily && (
                <button
                  type="button"
                  onClick={() => setActiveIsomerFamily(null)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Show All {allMolecules.length} Molecules
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {ISOMER_FAMILIES_META.map((fam) => {
                const isActive =
                  activeIsomerFamily === fam.groupKey ||
                  selectedMolecule.isomerGroup === fam.groupKey;
                return (
                  <button
                    key={fam.groupKey}
                    type="button"
                    onClick={() => {
                      const firstMatch = allMolecules.find((m) => m.isomerGroup === fam.groupKey);
                      const secondMatch = allMolecules.filter((m) => m.isomerGroup === fam.groupKey)[1];
                      if (firstMatch) {
                        setSelectedMoleculeId(firstMatch.id);
                        setComparisonMoleculeId(secondMatch ? secondMatch.id : null);
                      }
                    }}
                    className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-400 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-extrabold text-sm text-indigo-700 dark:text-indigo-300">
                        {fam.displayFormula}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300">
                        {fam.count} forms
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {fam.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {fam.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search, Filters & Horizontal Molecule Selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, formula (C2H6O, C3H6O, SF4, XeF4), IUPAC name, geometry, or CAS..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by chemical category"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="All">All Categories</option>
                  <option value="Organic">Organic Functional</option>
                  <option value="Hydrocarbon">Hydrocarbons & Rings</option>
                  <option value="Inorganic">Inorganic Covalent</option>
                  <option value="Hypervalent">Hypervalent (SN 5 & 6)</option>
                  <option value="Noble Gas">Noble Gas Compounds</option>
                  <option value="Allotrope">Elemental Allotropes</option>
                  <option value="Ionic / Salt">Ionic Salts</option>
                </select>

                <select
                  value={vseprFilter}
                  onChange={(e) => setVseprFilter(e.target.value)}
                  aria-label="Filter by VSEPR notation"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="All">All VSEPR Classes</option>
                  <option value="AX₂">AX₂ / AX₂E / AX₂E₂ / AX₂E₃</option>
                  <option value="AX₃">AX₃ / AX₃E / AX₃E₂</option>
                  <option value="AX₄">AX₄ / AX₄E / AX₄E₂</option>
                  <option value="AX₅">AX₅ / AX₅E</option>
                  <option value="AX₆">AX₆ (Octahedral)</option>
                </select>
              </div>
            </div>

            {/* Scrollable Molecule Cards */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
              {filteredMolecules.map((mol) => {
                const isSelected = mol.id === selectedMolecule.id;
                const isCompared = mol.id === comparisonMoleculeId;
                return (
                  <button
                    key={mol.id}
                    type="button"
                    onClick={() => handleSelectMolecule(mol)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : isCompared
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-400'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{mol.name}</span>
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {mol.formula}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {mol.condensedFormula} • {mol.vseprNotation}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================================
              AUTOMATIC ISOMER & ALLOTROPE SWITCHER BANNER (IF MULTIPLE EXIST)
             ================================================================= */}
          {relatedIsomers.length > 1 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-cyan-50/80 dark:from-indigo-950/50 dark:via-slate-900 dark:to-cyan-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-xs flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs">
                    {selectedMolecule.formula}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Structural & Stereoisomeric Formations Using the Same Atoms ({relatedIsomers.length} Distinct Structures)
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Click any isomer to inspect it, or toggle <strong>Side-by-Side 3D Split View</strong> to compare bond angles, dipole vectors, and boiling points simultaneously.
                    </p>
                  </div>
                </div>

                {/* Toggle Side-by-Side Comparison Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (comparisonMolecule) {
                      setComparisonMoleculeId(null);
                    } else {
                      const other = relatedIsomers.find((m) => m.id !== selectedMolecule.id);
                      if (other) setComparisonMoleculeId(other.id);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    comparisonMolecule
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  <Columns className="w-4 h-4" />
                  {comparisonMolecule ? 'Exit Split Comparison' : 'Compare Isomers Side-by-Side'}
                </button>
              </div>

              {/* Isomer Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {relatedIsomers.map((iso) => {
                  const isPrimary = iso.id === selectedMolecule.id;
                  const isSecondary = iso.id === comparisonMoleculeId;
                  return (
                    <div
                      key={iso.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                        isPrimary
                          ? 'bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-400 shadow-sm'
                          : isSecondary
                          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-500 shadow-sm'
                          : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isPrimary && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-600 text-white">
                                Primary (A)
                              </span>
                            )}
                            {isSecondary && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500 text-slate-950">
                                Compared (B)
                              </span>
                            )}
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {iso.name}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {iso.condensedFormula}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <span>
                            Type: <strong>{iso.isomerType}</strong>
                          </span>
                          <span>
                            BP: <strong className="font-mono">{iso.physicalProperties.boilingPointC}</strong>
                          </span>
                          <span>
                            μ: <strong className="font-mono">{iso.dipoleMomentDebye.toFixed(2)} D</strong>
                          </span>
                        </div>

                        {iso.isomerComparisonNote && (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                            {iso.isomerComparisonNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setSelectedMoleculeId(iso.id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
                          >
                            View Primary
                          </button>
                        )}
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() =>
                              setComparisonMoleculeId(isSecondary ? null : iso.id)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                              isSecondary
                                ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 text-amber-900 dark:text-amber-200'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isSecondary ? 'Remove Split View' : 'Compare in Split 3D'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              MAIN 12-COLUMN SPLIT: 3D STAGE (7 COLS) + 6-TAB DOSSIER (5 COLS)
             ================================================================= */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* LEFT 7 COLUMNS: 3D WEBGL STAGE & RENDER CONTROLS */}
            <div className="xl:col-span-7 flex flex-col gap-3">
              {/* Render Mode & Overlay Toolbar */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                {/* 4 Render Styles */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(
                    [
                      { id: 'ball-and-stick', label: 'Ball & Stick' },
                      { id: 'space-filling', label: 'Space-Filling (CPK)' },
                      { id: 'licorice', label: 'Licorice Skeletal' },
                      { id: 'esp-polarity', label: 'ESP Charge Map' },
                    ] as Array<{ id: RenderStyle3D; label: string }>
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setRenderStyle(st.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        renderStyle === st.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Scientific Overlay Toggles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowLonePairs((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      showLonePairs
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Lone Pairs (E)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDipoleVector((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      showDipoleVector
                        ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-400 text-pink-800 dark:text-pink-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Dipole (μ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBondAngles((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      showBondAngles
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Bond Angles (θ°)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBondLengths((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      showBondLengths
                        ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-400 text-cyan-800 dark:text-cyan-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Lengths (Å)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAtomLabels((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      showAtomLabels
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-800 dark:text-indigo-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Labels (δ)
                  </button>
                </div>
              </div>

              {/* 3D Canvas Component */}
              <MoleculeCanvas3D
                molecule={selectedMolecule}
                comparisonMolecule={comparisonMolecule}
                renderStyle={renderStyle}
                showLonePairs={showLonePairs}
                showDipoleVector={showDipoleVector}
                showAtomLabels={showAtomLabels}
                showBondLengths={showBondLengths}
                showBondAngles={showBondAngles}
                selectedAtomIndex={selectedAtomIndex}
                onSelectAtom={setSelectedAtomIndex}
                activeIrMode={activeIrMode}
                onStopIrMode={() => setActiveIrMode(null)}
              />

              {/* Selected Atom Inspector Strip */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {selectedAtomIndex !== null && selectedMolecule.atoms[selectedAtomIndex] ? (
                  (() => {
                    const a = selectedMolecule.atoms[selectedAtomIndex];
                    return (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold">
                          Atom #{selectedAtomIndex + 1}: {a.symbol}
                        </span>
                        <span>
                          Coordinates:{' '}
                          <strong className="font-mono">
                            ({a.x.toFixed(2)}, {a.y.toFixed(2)}, {a.z.toFixed(2)}) Å
                          </strong>
                        </span>
                        <span>
                          Hybridization: <strong className="font-mono">{a.hybridization || 'sp³'}</strong>
                        </span>
                        <span>
                          Lone Pairs: <strong className="font-mono">{a.lonePairs ?? 0}</strong>
                        </span>
                        <span>
                          Partial Charge:{' '}
                          <strong className="font-mono">
                            {a.partialCharge !== undefined
                              ? a.partialCharge > 0
                                ? `+${a.partialCharge.toFixed(2)}`
                                : a.partialCharge.toFixed(2)
                              : '0.00'}
                          </strong>
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      Click any atom sphere in the 3D model to inspect its exact Ångström coordinates $(x,y,z)$, orbital hybridization, formal charge, and partial charge ($\delta$).
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleLoadIntoComposer(selectedMolecule)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Edit in Topology Composer
                </button>
              </div>
            </div>

            {/* RIGHT 5 COLUMNS: 6-TAB MOLECULAR ENCYCLOPEDIA DOSSIER */}
            <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
              {/* Dossier Header Banner */}
              <div className="p-5 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                        {selectedMolecule.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                        CAS: {selectedMolecule.casNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-bold">
                        Point Group: {selectedMolecule.pointGroup}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                      {selectedMolecule.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      IUPAC: <strong className="text-slate-700 dark:text-slate-200">{selectedMolecule.iupacName}</strong> • SMILES:{' '}
                      <code className="font-mono text-indigo-600 dark:text-indigo-400">{selectedMolecule.smiles}</code>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {selectedMolecule.formula}
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {selectedMolecule.molecularWeight.toFixed(2)} g/mol
                    </div>
                  </div>
                </div>

                {/* Key Quick Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70">
                    <div className="text-[10px] uppercase font-bold text-slate-400">VSEPR Class</div>
                    <div className="text-xs font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {selectedMolecule.vseprNotation} (SN={selectedMolecule.stericNumber})
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Hybridization</div>
                    <div className="text-xs font-mono font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                      {selectedMolecule.hybridization}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Dipole (μ)</div>
                    <div className="text-xs font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {selectedMolecule.dipoleMomentDebye.toFixed(2)} D ({selectedMolecule.polarity})
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Unsaturation</div>
                    <div className="text-xs font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                      IHD = {selectedMolecule.degreeOfUnsaturation}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Tab Navigation */}
              <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                {(
                  [
                    { id: 'overview', label: 'Overview', icon: BookOpen },
                    { id: 'bonding', label: 'Criteria', icon: Atom },
                    { id: 'synthesis', label: 'Synthesis', icon: FlaskConical },
                    { id: 'thermodynamics', label: 'Thermo', icon: Flame },
                    { id: 'spectroscopy', label: 'Spectra', icon: Activity },
                    { id: 'applications', label: 'Uses/Safety', icon: ShieldAlert },
                  ] as Array<{ id: DossierTab; label: string; icon: React.FC<{ className?: string }> }>
                ).map((t) => {
                  const Icon = t.icon;
                  const active = activeDossierTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveDossierTab(t.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[11px] font-bold border-b-2 transition-all ${
                        active
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dossier Tab Content Area */}
              <div className="p-5 flex flex-col gap-4 max-h-[540px] overflow-y-auto text-xs sm:text-sm">
                {/* TAB 1: OVERVIEW & IDENTITY */}
                {activeDossierTab === 'overview' && (
                  <div className="flex flex-col gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 leading-relaxed text-slate-700 dark:text-slate-200">
                      {selectedMolecule.description}
                    </div>

                    {selectedMolecule.isomerComparisonNote && (
                      <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70">
                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                          Isomer & Structural Distinction ({selectedMolecule.isomerType})
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {selectedMolecule.isomerComparisonNote}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Condensed Formula
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                          {selectedMolecule.condensedFormula}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Molecular Geometry
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                          {selectedMolecule.geometry}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Electronic Geometry
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                          {selectedMolecule.electronicGeometry}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Experimental Bond Angles
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                          {selectedMolecule.bondAngle}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BONDING & FORMATION CRITERIA */}
                {activeDossierTab === 'bonding' && (
                  <div className="flex flex-col gap-3.5">
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
                        Octet / Duet / Hypervalent Formation Criterion
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                        {selectedMolecule.formationCriteria.octetRuleStatus}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {selectedMolecule.formationCriteria.sigmaBonds} σ
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">Sigma Bonds</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-lg font-mono font-black text-cyan-600 dark:text-cyan-400">
                          {selectedMolecule.formationCriteria.piBonds} π
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">Pi Bonds</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-lg font-mono font-black text-amber-600 dark:text-amber-400">
                          {selectedMolecule.formationCriteria.lonePairsTotal} LP
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">Total Lone Pairs</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Electronegativity Difference (ΔEN) & Bond Character
                      </div>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        {selectedMolecule.formationCriteria.deltaEN} ({selectedMolecule.bondType})
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Resonance, Delocalization & Orbital Overlap
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {selectedMolecule.formationCriteria.resonanceDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: SYNTHESIS & PREPARATION METHODS */}
                {activeDossierTab === 'synthesis' && (
                  <div className="flex flex-col gap-4">
                    {/* Industrial Route */}
                    <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          Industrial Manufacturing Process
                        </span>
                        <button
                          onClick={() =>
                            launchReactionSimulation(buildReactionSetupFromMolecule(selectedMolecule))
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Simulate in Reaction Chamber</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedMolecule.synthesisMethods.industrial.processName}
                      </h3>
                      <div className="p-2.5 rounded-lg bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto">
                        {selectedMolecule.synthesisMethods.industrial.equation}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-1">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">
                            Conditions
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {selectedMolecule.synthesisMethods.industrial.conditions}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">
                            Catalyst System
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {selectedMolecule.synthesisMethods.industrial.catalyst}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 border-t border-indigo-200/60 dark:border-indigo-800/50">
                        {selectedMolecule.synthesisMethods.industrial.mechanismSummary}
                      </p>
                    </div>

                    {/* Laboratory Preparation */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex flex-col gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          Laboratory Synthesis & Preparation
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedMolecule.synthesisMethods.laboratory.methodName}
                      </h3>
                      <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
                        {selectedMolecule.synthesisMethods.laboratory.equation}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-1">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">
                            Reagents
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {selectedMolecule.synthesisMethods.laboratory.reagents}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">
                            Reaction Conditions
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {selectedMolecule.synthesisMethods.laboratory.conditions}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 border-t border-emerald-200/60 dark:border-emerald-800/50">
                        {selectedMolecule.synthesisMethods.laboratory.procedureNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 4: THERMODYNAMICS & BOND METRICS */}
                {activeDossierTab === 'thermodynamics' && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Enthalpy ΔHf°
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                          {selectedMolecule.thermodynamics.deltaHf}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Gibbs Free Energy ΔGf°
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                          {selectedMolecule.thermodynamics.deltaGf}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Molar Entropy S°
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1">
                          {selectedMolecule.thermodynamics.entropyS}
                        </div>
                      </div>
                    </div>

                    {/* Bond Lengths & Dissociation Energies Table */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                        Bond Lengths (Å) & Bond Dissociation Enthalpies (kJ/mol)
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-2 px-3">Bond Type</th>
                            <th className="py-2 px-3 font-mono">Length (Å)</th>
                            <th className="py-2 px-3 font-mono">Energy (kJ/mol)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {selectedMolecule.thermodynamics.bondEnergies.map((be, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {be.bond}
                              </td>
                              <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                                {be.lengthAngstrom} Å
                              </td>
                              <td className="py-2 px-3 font-mono text-amber-600 dark:text-amber-400">
                                {be.energyKjMol} kJ/mol
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 5: SPECTROSCOPY & PHYSICAL PROPERTIES */}
                {activeDossierTab === 'spectroscopy' && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Phase at STP
                        </span>
                        <span className="font-bold">{selectedMolecule.physicalProperties.stateAtSTP}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Melting Point
                        </span>
                        <span className="font-mono font-bold">
                          {selectedMolecule.physicalProperties.meltingPointC}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Boiling Point
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {selectedMolecule.physicalProperties.boilingPointC}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Density
                        </span>
                        <span className="font-mono font-bold">
                          {selectedMolecule.physicalProperties.density}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Acidity / Basicity (pKa)
                        </span>
                        <span className="font-mono font-bold">
                          {selectedMolecule.physicalProperties.pKa}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Dominant Intermolecular Forces (IMFs)
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                        {selectedMolecule.physicalProperties.intermolecularForces.map((imf, i) => (
                          <li key={i}>{imf}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Interactive FT-IR Transmittance Spectrum Plot (4000 → 400 cm⁻¹) & Clickable 3D Vibrations */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Interactive FT-IR Transmittance Spectrum (4000 – 400 cm⁻¹)
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Click any absorption peak or band below to animate its 3D vibrational normal mode live in WebGL
                          </p>
                        </div>
                        {activeIrMode && (
                          <button
                            type="button"
                            onClick={() => setActiveIrMode(null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer shrink-0"
                          >
                            <Square className="w-3 h-3" />
                            Stop Vibration
                          </button>
                        )}
                      </div>

                      {selectedMolecule.spectroscopy.irBands.length > 0 && (() => {
                        const bandsParsed = selectedMolecule.spectroscopy.irBands.map((ir, idx) => {
                          const nums = ir.wavenumberCm.replace(/,/g, '').match(/\d{3,4}/g);
                          const center = nums
                            ? nums.length >= 2
                              ? (parseInt(nums[0], 10) + parseInt(nums[1], 10)) * 0.5
                              : parseInt(nums[0], 10)
                            : 1500;
                          const desc = ir.wavenumberCm.toLowerCase();
                          const width = desc.includes('broad') ? 190 : desc.includes('medium') ? 70 : 52;
                          const depth = desc.includes('very strong')
                            ? 0.82
                            : desc.includes('strong')
                            ? 0.72
                            : desc.includes('weak')
                            ? 0.34
                            : 0.55;
                          return { ir, idx, center: Math.max(450, Math.min(3900, center)), width, depth };
                        });

                        const W = 440;
                        const H = 132;
                        const padL = 32;
                        const padR = 12;
                        const padT = 12;
                        const padB = 26;
                        const plotW = W - padL - padR;
                        const plotH = H - padT - padB;
                        const wnToX = (wn: number) => padL + ((4000 - wn) / 3600) * plotW;
                        const trToY = (tr: number) => padT + (1 - tr) * plotH;

                        const pathPts: string[] = [];
                        for (let wn = 4000; wn >= 400; wn -= 20) {
                          let transmittance = 0.96;
                          for (const bp of bandsParsed) {
                            const delta = (wn - bp.center) / bp.width;
                            transmittance -= bp.depth / (1 + delta * delta);
                          }
                          transmittance = Math.max(0.06, Math.min(0.98, transmittance));
                          pathPts.push(
                            `${wn === 4000 ? 'M' : 'L'}${wnToX(wn).toFixed(1)},${trToY(transmittance).toFixed(1)}`
                          );
                        }

                        return (
                          <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 overflow-x-auto">
                            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[320px]">
                              {[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500].map((wn) => (
                                <g key={`wn-${wn}`}>
                                  <line
                                    x1={wnToX(wn)}
                                    y1={padT}
                                    x2={wnToX(wn)}
                                    y2={padT + plotH}
                                    stroke="#1e293b"
                                    strokeDasharray="2 3"
                                  />
                                  <text
                                    x={wnToX(wn)}
                                    y={H - 8}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="8.5"
                                    fontFamily="monospace"
                                  >
                                    {wn}
                                  </text>
                                </g>
                              ))}
                              <text
                                x={padL - 4}
                                y={padT + 6}
                                textAnchor="end"
                                fill="#94a3b8"
                                fontSize="8"
                                fontFamily="monospace"
                              >
                                100%
                              </text>
                              <text
                                x={padL - 4}
                                y={padT + plotH}
                                textAnchor="end"
                                fill="#94a3b8"
                                fontSize="8"
                                fontFamily="monospace"
                              >
                                0%T
                              </text>

                              {/* Spectrum Curve */}
                              <path
                                d={pathPts.join(' ')}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.75"
                              />

                              {/* Clickable Peak Markers */}
                              {bandsParsed.map((bp) => {
                                const isPlaying =
                                  activeIrMode?.wavenumberCm === bp.ir.wavenumberCm &&
                                  activeIrMode?.assignment === bp.ir.assignment;
                                const tipY = trToY(Math.max(0.08, 0.96 - bp.depth));
                                return (
                                  <g
                                    key={`pk-${bp.idx}`}
                                    className="cursor-pointer"
                                    onClick={() =>
                                      setActiveIrMode(
                                        isPlaying
                                          ? null
                                          : {
                                              wavenumberCm: bp.ir.wavenumberCm,
                                              assignment: bp.ir.assignment,
                                            }
                                      )
                                    }
                                  >
                                    <line
                                      x1={wnToX(bp.center)}
                                      y1={padT}
                                      x2={wnToX(bp.center)}
                                      y2={tipY}
                                      stroke={isPlaying ? '#f472b6' : '#6366f1'}
                                      strokeDasharray="2 2"
                                      strokeOpacity={isPlaying ? 0.95 : 0.45}
                                    />
                                    <circle
                                      cx={wnToX(bp.center)}
                                      cy={tipY}
                                      r={isPlaying ? 4.8 : 3.4}
                                      fill={isPlaying ? '#f472b6' : '#818cf8'}
                                      stroke="#ffffff"
                                      strokeWidth="1"
                                    >
                                      <title>{`${bp.ir.wavenumberCm} — ${bp.ir.assignment}`}</title>
                                    </circle>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        );
                      })()}

                      {/* Clickable Diagnostic IR Band Rows */}
                      <div className="space-y-1.5">
                        {selectedMolecule.spectroscopy.irBands.map((ir, idx) => {
                          const isPlaying =
                            activeIrMode?.wavenumberCm === ir.wavenumberCm &&
                            activeIrMode?.assignment === ir.assignment;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setActiveIrMode(
                                  isPlaying
                                    ? null
                                    : { wavenumberCm: ir.wavenumberCm, assignment: ir.assignment }
                                )
                              }
                              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                                isPlaying
                                  ? 'bg-indigo-600/15 dark:bg-indigo-500/20 border-indigo-500 text-indigo-900 dark:text-indigo-100'
                                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                    isPlaying
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                                  }`}
                                >
                                  {isPlaying ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                                  {ir.wavenumberCm}
                                </span>
                              </div>
                              <span className="text-slate-600 dark:text-slate-300 text-right truncate">
                                {ir.assignment}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Frontier Molecular Orbital (HOMO–LUMO) Energy Diagram */}
                    {(() => {
                      const piCount = selectedMolecule.formationCriteria.piBonds;
                      const lpCount = selectedMolecule.formationCriteria.lonePairsTotal;
                      const isAromatic = selectedMolecule.bonds.some((b) => b.order === 1.5);
                      const hasPi = piCount > 0 || isAromatic;
                      const hasLonePairs = lpCount > 0;

                      const homoLabel = hasLonePairs
                        ? 'n (Non-bonding Lone Pair)'
                        : hasPi
                        ? isAromatic
                          ? 'π₂, π₃ (Degenerate Aromatic)'
                          : 'π (Bonding Pi Orbital)'
                        : 'σ (Highest Bonding Sigma)';
                      const lumoLabel = hasPi ? 'π* (Antibonding Pi*)' : 'σ* (Antibonding Sigma*)';
                      const transitionType =
                        hasLonePairs && hasPi
                          ? 'n → π* & π → π* (Near-UV)'
                          : hasPi
                          ? 'π → π* (UV Absorption)'
                          : hasLonePairs
                          ? 'n → σ* (Vacuum-UV)'
                          : 'σ → σ* (Far-UV, High Gap)';
                      const gapCategory = isAromatic
                        ? 'Medium Conjugated Gap (~4.8 eV)'
                        : hasPi && hasLonePairs
                        ? 'Moderate Gap (~4.2–5.5 eV)'
                        : hasPi
                        ? 'Moderate-Wide Gap (~6.5 eV)'
                        : 'Wide Saturated Gap (>8.5 eV)';

                      const levels: Array<{
                        label: string;
                        role: 'LUMO' | 'HOMO' | 'OCC' | 'VIRT';
                        electrons: number;
                      }> = [
                        { label: 'σ*', role: hasPi ? 'VIRT' : 'LUMO', electrons: 0 },
                        ...(hasPi
                          ? [{ label: 'π*', role: 'LUMO' as const, electrons: 0 }]
                          : []),
                        ...(hasLonePairs
                          ? [{ label: 'n (LP)', role: 'HOMO' as const, electrons: 2 }]
                          : []),
                        ...(hasPi
                          ? [
                              {
                                label: isAromatic ? 'π (deloc)' : 'π',
                                role: (hasLonePairs ? 'OCC' : 'HOMO') as 'OCC' | 'HOMO',
                                electrons: 2,
                              },
                            ]
                          : []),
                        {
                          label: 'σ',
                          role: (!hasLonePairs && !hasPi ? 'HOMO' : 'OCC') as 'OCC' | 'HOMO',
                          electrons: 2,
                        },
                      ];

                      return (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                              Frontier Molecular Orbital (HOMO–LUMO) Energy Diagram
                            </span>
                            <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-300">
                              {transitionType}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-7 bg-slate-950 rounded-lg border border-slate-800 p-3 space-y-2">
                              {levels.map((lv, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-[11px] font-mono">
                                  <span className="w-16 text-right text-slate-400 shrink-0">
                                    {lv.label}
                                  </span>
                                  <div
                                    className={`flex-1 h-0.5 relative ${
                                      lv.role === 'LUMO'
                                        ? 'bg-sky-400'
                                        : lv.role === 'HOMO'
                                        ? 'bg-amber-400'
                                        : 'bg-slate-600'
                                    }`}
                                  >
                                    {lv.electrons > 0 && (
                                      <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 text-amber-300 font-bold tracking-widest">
                                        ↑↓
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`w-12 text-[10px] font-bold shrink-0 ${
                                      lv.role === 'LUMO'
                                        ? 'text-sky-400'
                                        : lv.role === 'HOMO'
                                        ? 'text-amber-400'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {lv.role === 'LUMO'
                                      ? 'LUMO'
                                      : lv.role === 'HOMO'
                                      ? 'HOMO'
                                      : lv.electrons > 0
                                      ? 'Occ.'
                                      : 'Virt.'}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="sm:col-span-5 space-y-1.5 text-[11px]">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  HOMO (Nucleophilic Site)
                                </span>
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                                  {homoLabel}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  LUMO (Electrophilic Site)
                                </span>
                                <span className="font-mono font-bold text-sky-600 dark:text-sky-300">
                                  {lumoLabel}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Qualitative ΔE(HOMO–LUMO)
                                </span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {gapCategory}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* NMR Shifts */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                        NMR Chemical Shifts (¹H, ¹³C, ¹⁹F, ³¹P, ¹²⁹Xe)
                      </div>
                      <div className="space-y-1.5">
                        {selectedMolecule.spectroscopy.nmrShifts.map((nmr, idx) => (
                          <div key={idx} className="text-xs border-b last:border-b-0 border-slate-200/60 dark:border-slate-700/60 pb-1 last:pb-0">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              [{nmr.nucleus}] {nmr.shiftPpm}:
                            </span>{' '}
                            <span className="text-slate-600 dark:text-slate-300">
                              {nmr.assignment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: USES, APPLICATIONS & NFPA 704 / GHS SAFETY */}
                {activeDossierTab === 'applications' && (
                  <div className="flex flex-col gap-3.5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                        Industrial Applications
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        {selectedMolecule.applications.industrial.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        Laboratory & Biological / Medical Roles
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        {selectedMolecule.applications.laboratory.map((item, i) => (
                          <li key={`lab-${i}`}>{item}</li>
                        ))}
                        {selectedMolecule.applications.biologicalAndMedical.map((item, i) => (
                          <li key={`bio-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* NFPA 704 Fire Diamond + GHS Hazards */}
                    <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                          GHS Hazards & NFPA 704 Safety Profile
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white" title="NFPA Health">
                            H:{selectedMolecule.safety.nfpa704.health}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white" title="NFPA Flammability">
                            F:{selectedMolecule.safety.nfpa704.flammability}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950" title="NFPA Instability">
                            I:{selectedMolecule.safety.nfpa704.instability}
                          </span>
                          {selectedMolecule.safety.nfpa704.special && (
                            <span className="px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-300">
                              {selectedMolecule.safety.nfpa704.special}
                            </span>
                          )}
                        </div>
                      </div>

                      <ul className="list-disc list-inside text-xs text-rose-900 dark:text-rose-200 space-y-0.5">
                        {selectedMolecule.safety.ghsHazards.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-rose-200/60 dark:border-rose-800/50">
                        <strong>Handling:</strong> {selectedMolecule.safety.handling}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          WORKSPACE 2: FORMULA & TOPOLOGY COMPOSER (WITH LIVE 3D VSEPR SOLVER)
         ===================================================================== */}
      {workspaceMode === 'composer' && (
        <div className="flex flex-col gap-5">
          {/* 21-Element Interactive Palette */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  21-Element Main-Group, Hypervalent & Transition Palette
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click an element to bond it to the currently selected atom node. Hold <strong>Shift + Click</strong> between any two existing atoms in the 2D graph to add/cycle single, double, or triple bonds.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">New Bond Order:</span>
                {([1, 2, 3] as Array<1 | 2 | 3>).map((ord) => (
                  <button
                    key={ord}
                    type="button"
                    onClick={() => setBondOrderToCreate(ord)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      bondOrderToCreate === ord
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {ord === 1 ? 'Single (—)' : ord === 2 ? 'Double (=)' : 'Triple (≡)'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setComposerNodes([{ id: 1, symbol: 'C', x2d: 220, y2d: 150 }]);
                    setComposerEdges([]);
                    setSelectedComposerNodeId(1);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Graph
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-11 lg:grid-cols-21 gap-1.5">
              {COMPOSER_ELEMENTS.map((el) => {
                const cpk = CPK_PALETTE[el.symbol];
                return (
                  <button
                    key={el.symbol}
                    type="button"
                    onClick={() => handleAddComposerAtom(el.symbol)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all flex flex-col items-center"
                    title={`${el.name} • Valence e⁻: ${el.valenceElectrons} • EN: ${el.electronegativity}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-400/40 mb-1"
                      style={{ backgroundColor: cpk?.color || '#6366F1' }}
                    />
                    <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
                      {el.symbol}
                    </span>
                    <span className="text-[9px] text-slate-400">v={el.typicalValence}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2D Graph Editor + Live 3D VSEPR Relaxed Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 2D Interactive Graph Canvas (5 cols) */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2D Topological Connectivity Graph
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Drag atoms to reposition • Click to select • Shift+Click another atom to cycle bond (1 → 2 → 3 → remove)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAutoSaturateHydrogens}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-300/60 dark:border-emerald-700/60 cursor-pointer"
                    title="Auto-saturate all open valences with Hydrogen atoms"
                  >
                    +H Saturate
                  </button>
                  <button
                    type="button"
                    onClick={handleStripHydrogens}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold border border-slate-300/60 dark:border-slate-700 cursor-pointer"
                    title="Strip all Hydrogen atoms to edit the heavy-atom skeleton"
                  >
                    −H Strip
                  </button>
                  {selectedComposerNodeId !== null && composerNodes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = composerNodes.filter((n) => n.id !== selectedComposerNodeId);
                        setComposerNodes(remaining);
                        setComposerEdges((prev) =>
                          prev.filter(
                            (e) =>
                              e.source !== selectedComposerNodeId &&
                              e.target !== selectedComposerNodeId
                          )
                        );
                        setSelectedComposerNodeId(remaining[0]?.id ?? null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold cursor-pointer"
                    >
                      Delete Atom
                    </button>
                  )}
                </div>
              </div>

              {/* 1-Click Ring & Functional Group Structural Stamps */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
                  Stamps:
                </span>
                {(
                  [
                    { id: 'benzene', label: 'Benzene C₆H₆' },
                    { id: 'cyclopropane', label: 'Cyclopropane' },
                    { id: 'cyclohexane', label: 'Cyclohexane' },
                    { id: 'carbonyl', label: '+ =O' },
                    { id: 'carboxyl', label: '+ –COOH' },
                    { id: 'amino', label: '+ –NH₂' },
                    { id: 'nitro', label: '+ –NO₂' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleApplyStructuralStamp(st.id)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-indigo-950/70 text-slate-700 dark:text-slate-200 text-[11px] font-mono font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <svg
                ref={composerSvgRef}
                viewBox="0 0 460 310"
                onPointerMove={handleSvgPointerMove}
                onPointerUp={(e) => {
                  if (composerSvgRef.current?.hasPointerCapture(e.pointerId)) {
                    composerSvgRef.current.releasePointerCapture(e.pointerId);
                  }
                  setDraggingNodeId(null);
                  dragStartRef.current = null;
                }}
                onPointerCancel={(e) => {
                  if (composerSvgRef.current?.hasPointerCapture(e.pointerId)) {
                    composerSvgRef.current.releasePointerCapture(e.pointerId);
                  }
                  setDraggingNodeId(null);
                  dragStartRef.current = null;
                }}
                className="w-full h-[310px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 select-none touch-none"
              >
                {/* Edges */}
                {composerEdges.map((edge, idx) => {
                  const n1 = composerNodes.find((n) => n.id === edge.source);
                  const n2 = composerNodes.find((n) => n.id === edge.target);
                  if (!n1 || !n2) return null;
                  const dx = n2.x2d - n1.x2d;
                  const dy = n2.y2d - n1.y2d;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const nx = (-dy / len) * 4.5;
                  const ny = (dx / len) * 4.5;

                  return (
                    <g key={`e-${idx}`}>
                      {edge.order === 1 && (
                        <line
                          x1={n1.x2d}
                          y1={n1.y2d}
                          x2={n2.x2d}
                          y2={n2.y2d}
                          stroke="#64748B"
                          strokeWidth={3}
                        />
                      )}
                      {edge.order === 1.5 && (
                        <>
                          <line
                            x1={n1.x2d}
                            y1={n1.y2d}
                            x2={n2.x2d}
                            y2={n2.y2d}
                            stroke="#64748B"
                            strokeWidth={3}
                          />
                          <line
                            x1={n1.x2d + nx}
                            y1={n1.y2d + ny}
                            x2={n2.x2d + nx}
                            y2={n2.y2d + ny}
                            stroke="#38BDF8"
                            strokeWidth={2}
                            strokeDasharray="4 3"
                          />
                        </>
                      )}
                      {edge.order === 2 && (
                        <>
                          <line
                            x1={n1.x2d + nx}
                            y1={n1.y2d + ny}
                            x2={n2.x2d + nx}
                            y2={n2.y2d + ny}
                            stroke="#64748B"
                            strokeWidth={2.5}
                          />
                          <line
                            x1={n1.x2d - nx}
                            y1={n1.y2d - ny}
                            x2={n2.x2d - nx}
                            y2={n2.y2d - ny}
                            stroke="#64748B"
                            strokeWidth={2.5}
                          />
                        </>
                      )}
                      {edge.order === 3 && (
                        <>
                          <line
                            x1={n1.x2d}
                            y1={n1.y2d}
                            x2={n2.x2d}
                            y2={n2.y2d}
                            stroke="#64748B"
                            strokeWidth={2.5}
                          />
                          <line
                            x1={n1.x2d + nx * 1.4}
                            y1={n1.y2d + ny * 1.4}
                            x2={n2.x2d + nx * 1.4}
                            y2={n2.y2d + ny * 1.4}
                            stroke="#64748B"
                            strokeWidth={2}
                          />
                          <line
                            x1={n1.x2d - nx * 1.4}
                            y1={n1.y2d - ny * 1.4}
                            x2={n2.x2d - nx * 1.4}
                            y2={n2.y2d - ny * 1.4}
                            stroke="#64748B"
                            strokeWidth={2}
                          />
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {composerNodes.map((node, idx) => {
                  const isSel = node.id === selectedComposerNodeId;
                  const cpk = CPK_PALETTE[node.symbol]?.color || '#6366F1';
                  const diag = composerSolution.atomDiagnostics[idx];
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x2d}, ${node.y2d})`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        didDragRef.current = false;
                        dragStartRef.current = { x: e.clientX, y: e.clientY };
                        composerSvgRef.current?.setPointerCapture(e.pointerId);
                        setDraggingNodeId(node.id);
                      }}
                      onClick={(e) => handleComposerNodeClick(node.id, e.shiftKey)}
                      className={draggingNodeId === node.id ? 'cursor-grabbing' : 'cursor-grab'}
                    >
                      {isSel && (
                        <circle
                          r={22}
                          fill="none"
                          stroke="#4F46E5"
                          strokeWidth={2.5}
                          strokeDasharray="4 2"
                        />
                      )}
                      <circle
                        r={16}
                        fill={cpk}
                        stroke={isSel ? '#4F46E5' : '#1E293B'}
                        strokeWidth={2}
                      />
                      <text
                        textAnchor="middle"
                        dy="4"
                        fill={node.symbol === 'H' ? '#0F172A' : '#FFFFFF'}
                        className="text-[11px] font-mono font-bold pointer-events-none"
                      >
                        {node.symbol}
                      </text>
                      {diag && diag.formalCharge !== 0 && (
                        <text
                          x={14}
                          y={-12}
                          className="text-[10px] font-mono font-extrabold fill-amber-500"
                        >
                          {diag.formalCharge > 0 ? `+${diag.formalCharge}` : diag.formalCharge}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Formula & Matched Library Isomers Banner */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Hill Formula & Unsaturation
                    </span>
                    <span className="font-mono font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                      {composerSolution.dossier.formula}
                    </span>{' '}
                    <span className="text-xs font-mono text-slate-500">
                      ({composerSolution.dossier.molecularWeight} g/mol • IHD = {composerSolution.ihd})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {composerSolution.matchedLibraryId ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Exact Topology Match
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Novel / Custom Isomer
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        composerSolution.isConnected
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {composerSolution.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                {composerFormulaIsomers.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Isomers of {composerSolution.dossier.formula}:
                    </span>
                    {composerFormulaIsomers.map((iso) => {
                      const isCurrentMatch = composerSolution.matchedLibraryId === iso.id;
                      return (
                        <button
                          key={iso.id}
                          type="button"
                          onClick={() => handleLoadIntoComposer(iso)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            isCurrentMatch
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:underline'
                          }`}
                        >
                          {isCurrentMatch ? '✓ ' : 'Load '}
                          {iso.name} ({iso.condensedFormula})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Live 3D VSEPR Relaxed Model + Multi-Center Table (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <MoleculeCanvas3D
                molecule={composerSolution.dossier}
                renderStyle={renderStyle}
                showLonePairs={showLonePairs}
                showDipoleVector={showDipoleVector}
                showAtomLabels={true}
                showBondLengths={true}
                showBondAngles={true}
                selectedAtomIndex={null}
              />

              {/* Per-Atom Multi-Center VSEPR & Octet Diagnostic Table */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Multi-Center VSEPR, Hybridization & Formal Charge Analyzer
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAiQuery(composerSolution.dossier.formula);
                      handleAiSynthesize(composerSolution.dossier.formula);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Full AI Encyclopedia Dossier for {composerSolution.dossier.formula}
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[220px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Atom</th>
                        <th className="py-2 px-3">Bonds (BO)</th>
                        <th className="py-2 px-3">Lone Pairs</th>
                        <th className="py-2 px-3">VSEPR</th>
                        <th className="py-2 px-3">Hybridization</th>
                        <th className="py-2 px-3">Local Geometry</th>
                        <th className="py-2 px-3">Formal Charge</th>
                        <th className="py-2 px-3">Valence Shell</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {composerSolution.atomDiagnostics.map((d) => (
                        <tr key={d.index}>
                          <td className="py-1.5 px-3 font-mono font-bold">
                            #{d.index + 1} {d.symbol}
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {d.bondedAtoms} ({d.bondOrderSum})
                          </td>
                          <td className="py-1.5 px-3 font-mono">{d.lonePairs}</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {d.vseprNotation}
                          </td>
                          <td className="py-1.5 px-3 font-mono">{d.hybridization}</td>
                          <td className="py-1.5 px-3">{d.geometry}</td>
                          <td className="py-1.5 px-3 font-mono font-bold">
                            {d.formalCharge > 0 ? `+${d.formalCharge}` : d.formalCharge}
                          </td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                d.octetStatus === 'Valid'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : d.octetStatus === 'Hypervalent'
                                  ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {d.octetStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          WORKSPACE 3: AI MOLECULAR & ISOMER SYNTHESIZER
         ===================================================================== */}
      {workspaceMode === 'ai-synthesizer' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col gap-5 max-w-4xl mx-auto w-full">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                AI 3D Crystallographic & Isomer Synthesizer
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Enter any chemical formula, common name, or IUPAC name (e.g., <code>C4H8</code>, <code>Aspirin</code>, <code>Caffeine</code>, <code>C5H12</code>, <code>Phosphoric acid</code>). The AI engine computes 3D Ångström atomic coordinates, bond connectivity, VSEPR geometry, industrial/laboratory synthesis methods, spectroscopy, and structural isomers.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAiSynthesize();
              }}
              placeholder="Enter formula or molecule name (e.g., C4H8 isomers, Acetic acid, Hydrogen peroxide, C3H8O)..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              disabled={aiLoading || !aiQuery.trim()}
              onClick={() => handleAiSynthesize()}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Synthesizing 3D Coordinates & Isomers...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Synthesize 3D Molecule & Isomers
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Quick Benchmark Prompts */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Try Synthesizing These Molecules & Isomer Sets:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'C3H8O (Propan-1-ol, Propan-2-ol & Methoxyethane)',
                'C4H8 (But-1-ene, cis-But-2-ene & Cyclobutane)',
                'Acetic Acid vs Methyl Formate (C2H4O2)',
                'Hydrogen Peroxide (H2O2)',
                'Phosphoric Acid (H3PO4)',
                'Trichloromethane / Chloroform (CHCl3)',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setAiQuery(sample);
                    handleAiSynthesize(sample);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoleculeVisualizer;
