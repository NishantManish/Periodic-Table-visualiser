import React, { useState, useMemo, useEffect } from 'react';
import {
  MOLECULES_LIBRARY,
  ISOMER_FAMILIES_META,
  getIsomersForMolecule,
  normalizeFormulaAscii,
} from '@/data/moleculesData';
import { MoleculeDossier, MoleculeAtomNode, MoleculeBondEdge, PendingReactionSetup } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { MoleculeCanvas3D, RenderStyle3D, CPK_PALETTE } from './MoleculeCanvas3D';
import {
  solveMolecularGraph3D,
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

function solveCustomMolecule3D(nodes: ComposerNode[], edges: ComposerEdge[]) {
  const solved = solveMolecularGraph3D(nodes, edges);
  const exactLibraryMatch = MOLECULES_LIBRARY.find(
    (m) =>
      normalizeFormulaAscii(m.formula) === normalizeFormulaAscii(solved.dossier.formula) &&
      m.atoms.length === nodes.length
  );

  if (exactLibraryMatch) {
    solved.dossier.name = `${exactLibraryMatch.name} (Custom Graph)`;
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

  return solved;
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
      const primaryMol: MoleculeDossier | undefined = payload.molecule;
      const extraIsomers: MoleculeDossier[] = Array.isArray(payload.relatedIsomers)
        ? payload.relatedIsomers
        : [];

      if (!primaryMol || !Array.isArray(primaryMol.atoms) || primaryMol.atoms.length === 0) {
        throw new Error('AI response did not include valid 3D atomic coordinates.');
      }

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

                    {/* FT-IR Bands */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
                        Diagnostic FT-IR Absorption Bands
                      </div>
                      <div className="space-y-1.5">
                        {selectedMolecule.spectroscopy.irBands.map((ir, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                            <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                              {ir.wavenumberCm}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 text-right">
                              {ir.assignment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2D Topological Connectivity Graph
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Click node to select • Shift+Click another node to cycle bond (1 → 2 → 3 → delete)
                  </p>
                </div>
                {selectedComposerNodeId !== null && composerNodes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerNodes((prev) => prev.filter((n) => n.id !== selectedComposerNodeId));
                      setComposerEdges((prev) =>
                        prev.filter(
                          (e) =>
                            e.source !== selectedComposerNodeId &&
                            e.target !== selectedComposerNodeId
                        )
                      );
                      setSelectedComposerNodeId(composerNodes[0]?.id || null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                  >
                    Delete Selected Atom
                  </button>
                )}
              </div>

              <svg
                viewBox="0 0 460 310"
                className="w-full h-[310px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 select-none"
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
                      onClick={(e) => handleComposerNodeClick(node.id, e.shiftKey)}
                      className="cursor-pointer"
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
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      composerSolution.isConnected
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {composerSolution.isConnected ? 'Connected Graph' : 'Disconnected Fragments'}
                  </span>
                </div>

                {composerFormulaIsomers.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Known Isomers for {composerSolution.dossier.formula}:
                    </span>
                    {composerFormulaIsomers.map((iso) => (
                      <button
                        key={iso.id}
                        type="button"
                        onClick={() => handleLoadIntoComposer(iso)}
                        className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:underline"
                      >
                        Load {iso.name} ({iso.condensedFormula})
                      </button>
                    ))}
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
