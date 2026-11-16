import React, { useRef, useState } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  Bookmark,
  Flame,
  Sparkles,
  Trophy,
  Download,
  Upload,
  Printer,
  FileText,
  FileSpreadsheet,
  FileJson,
  ArrowUpRight,
  Atom,
  FlaskConical,
  TrendingUp,
  Box,
  Table2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ELEMENTS, CATEGORY_LABELS } from '../../data/elementsData';
import { GradeLevel } from '../../types';
import { useToast } from '../ui/Toast';

interface SyllabusModule {
  id: string;
  title: string;
  summary: string;
  keyFormulaOrRule: string;
  launchLabel: string;
  icon: React.ReactNode;
  launchAction: () => void;
}

const GRADE_OPTIONS: GradeLevel[] = [
  'Grade 5',
  'Grade 8',
  'Grade 10',
  'CBSE/ICSE',
  'JEE/NEET',
  'University',
];

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const LearningDashboard: React.FC = () => {
  const {
    gradeLevel,
    setGradeLevel,
    xp,
    level,
    streak,
    lastStudyDate,
    bookmarks,
    notes,
    masteredFlashcards,
    achievements,
    setSelectedElement,
    setViewMode,
    openElementInAtom3D,
    openMoleculeInVisualizer,
    importProgressBackup,
  } = useAppStore();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<
    'syllabus' | 'bookmarks' | 'notes' | 'achievements' | 'export'
  >('syllabus');

  const bookmarkedElements = ELEMENTS.filter((el) => bookmarks.includes(el.atomicNumber));

  const findElement = (z: number) => ELEMENTS.find((e) => e.atomicNumber === z) || ELEMENTS[0];

  const SYLLABUS_BY_GRADE: Record<GradeLevel, SyllabusModule[]> = {
    'Grade 5': [
      {
        id: 'g5-matter',
        title: 'States of Matter & Everyday Elements',
        summary:
          'Recognize solids, liquids, and gases across the periodic table and explore familiar elements like Hydrogen, Oxygen, Carbon, and Gold.',
        keyFormulaOrRule: 'Solid (fixed shape) · Liquid (fixed volume) · Gas (fills container)',
        launchLabel: 'Explore Periodic Table',
        icon: <Table2 className="w-4 h-4 text-sky-600 dark:text-cyan-400" />,
        launchAction: () => setViewMode('table'),
      },
      {
        id: 'g5-atoms',
        title: 'Building Blocks: Protons, Neutrons & Electrons',
        summary:
          'Discover how the atomic number counts protons in the nucleus and see electrons orbit around simple atoms like Carbon and Oxygen.',
        keyFormulaOrRule: 'Atomic Number (Z) = Protons (p⁺) = Electrons (e⁻)',
        launchLabel: 'Inspect Carbon in 3D',
        icon: <Atom className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        launchAction: () => openElementInAtom3D(findElement(6), 'bohr'),
      },
      {
        id: 'g5-water',
        title: 'Simple Molecules Around Us',
        summary:
          'See how two Hydrogen atoms bond with one Oxygen atom to create bent Water (H₂O) molecules in 3D space.',
        keyFormulaOrRule: 'Water Formula: H₂O (2 Hydrogen + 1 Oxygen)',
        launchLabel: 'View Water 3D Model',
        icon: <Box className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
        launchAction: () => openMoleculeInVisualizer('water'),
      },
      {
        id: 'g5-reactions',
        title: 'Physical vs. Chemical Changes',
        summary:
          'Observe how combining reactants rearranges atoms into new products with heat and light in the reaction chamber.',
        keyFormulaOrRule: 'Reactants → Products (Atoms rearrange, never vanish)',
        launchLabel: 'Open Reaction Chamber',
        icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        launchAction: () => setViewMode('reaction-simulator'),
      },
    ],
    'Grade 8': [
      {
        id: 'g8-bohr',
        title: 'Bohr Shell Capacities & Valency',
        summary:
          'Fill K, L, and M electron shells up to 2, 8, and 18 electrons and determine chemical valency from outer-shell electrons.',
        keyFormulaOrRule: 'Max Shell Electrons = 2n² (K=2, L=8, M=18)',
        launchLabel: 'Open 3D Bohr Shells',
        icon: <Atom className="w-4 h-4 text-sky-600 dark:text-cyan-400" />,
        launchAction: () => openElementInAtom3D(findElement(11), 'bohr'),
      },
      {
        id: 'g8-metals',
        title: 'Metals, Nonmetals & Metalloids Classification',
        summary:
          'Compare luster, conductivity, malleability, and group families across Alkali Metals, Halogens, and Noble Gases.',
        keyFormulaOrRule: 'Left/Center = Metals · Staircase = Metalloids · Right = Nonmetals',
        launchLabel: 'Filter Table by Category',
        icon: <Table2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        launchAction: () => setViewMode('table'),
      },
      {
        id: 'g8-acids-bases',
        title: 'Neutralization & Common Reactions',
        summary:
          'Simulate HCl + NaOH neutralization and Sodium + Water single replacement to observe exothermic heat and gas evolution.',
        keyFormulaOrRule: 'Acid + Base → Salt + Water (H⁺ + OH⁻ → H₂O)',
        launchLabel: 'Simulate Reactions',
        icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        launchAction: () => setViewMode('reaction-simulator'),
      },
      {
        id: 'g8-compounds',
        title: 'Covalent vs. Ionic Compounds',
        summary:
          'Compare electron-sharing Methane (CH₄) and Carbon Dioxide (CO₂) against crystalline Sodium Chloride (NaCl).',
        keyFormulaOrRule: 'ΔEN > 1.7 → Ionic Transfer · ΔEN < 1.7 → Covalent Sharing',
        launchLabel: 'Compare in 3D Visualizer',
        icon: <Box className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
        launchAction: () => openMoleculeInVisualizer('sodium-chloride'),
      },
    ],
    'Grade 10': [
      {
        id: 'g10-trends',
        title: 'Periodic Law & Atomic Property Trends',
        summary:
          'Plot atomic radius, electronegativity, and first ionization energy across Periods 1–7 and Groups 1–18 with live charts.',
        keyFormulaOrRule: 'Across Period → Radius ↓, IE₁ ↑, EN ↑ · Down Group → Radius ↑',
        launchLabel: 'Open Trend Explorer',
        icon: <TrendingUp className="w-4 h-4 text-sky-600 dark:text-cyan-400" />,
        launchAction: () => setViewMode('trends'),
      },
      {
        id: 'g10-carbon',
        title: 'Carbon Tetravalency, Isomers & Functional Groups',
        summary:
          'Contrast functional-group constitutional isomers Ethanol (CH₃CH₂OH) and Dimethyl Ether (CH₃OCH₃) side-by-side in 3D.',
        keyFormulaOrRule: 'IHD = C − H/2 − X/2 + N/2 + 1',
        launchLabel: 'Inspect Ethanol Isomers',
        icon: <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        launchAction: () => openMoleculeInVisualizer('ethanol'),
      },
      {
        id: 'g10-stoich',
        title: 'Balancing Equations & Reaction Types',
        summary:
          'Verify mass conservation across Synthesis, Decomposition, Combustion, Single & Double Replacement reactions.',
        keyFormulaOrRule: '2H₂(g) + O₂(g) → 2H₂O(l) (ΔH = −571.6 kJ/mol)',
        launchLabel: 'Run Collision Chamber',
        icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        launchAction: () => setViewMode('reaction-simulator'),
      },
      {
        id: 'g10-config',
        title: 'Subshell Configurations & Valence Blocks',
        summary:
          'Trace s, p, d, and f block configurations and inspect how valence electrons govern oxidation states.',
        keyFormulaOrRule: 'Aufbau Fill Order: 1s → 2s → 2p → 3s → 3p → 4s → 3d',
        launchLabel: 'Launch Aufbau Simulator',
        icon: <Atom className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        launchAction: () => openElementInAtom3D(findElement(26), 'quantum-numbers'),
      },
    ],
    'CBSE/ICSE': [
      {
        id: 'cbse-vsepr',
        title: 'VSEPR Theory & Molecular Hybridization',
        summary:
          'Predict AXₘEₙ geometries (sp, sp², sp³, sp³d, sp³d²) and lone-pair bond-angle compression in NH₃, SF₄, and ClF₃.',
        keyFormulaOrRule: 'Steric Number = σ-bonds + Lone Pairs (AX₃E → 107° Trigonal Pyramidal)',
        launchLabel: 'Analyze Ammonia & SF₄',
        icon: <Box className="w-4 h-4 text-sky-600 dark:text-cyan-400" />,
        launchAction: () => openMoleculeInVisualizer('ammonia'),
      },
      {
        id: 'cbse-lechatelier',
        title: "Chemical Equilibrium & Le Chatelier's Principle",
        summary:
          'Adjust temperature, compressor pressure, and iron catalyst in the Haber-Bosch process to observe K_p shifts via Δn_gas.',
        keyFormulaOrRule: 'N₂ + 3H₂ ⇌ 2NH₃ (Δn_gas = −2; High P shifts right)',
        launchLabel: 'Simulate Haber Equilibrium',
        icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        launchAction: () => setViewMode('reaction-simulator'),
      },
      {
        id: 'cbse-solid-state',
        title: 'Solid State Crystal Lattices & Packing Efficiency',
        summary:
          'Inspect BCC, FCC/CCP, and Diamond cubic unit cells, coordination numbers, and atomic packing fractions in 3D.',
        keyFormulaOrRule: 'Packing Efficiency: SC 52.4% · BCC 68.0% · FCC/HCP 74.0%',
        launchLabel: 'Inspect 3D Crystal Lattice',
        icon: <Atom className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        launchAction: () => openElementInAtom3D(findElement(29), 'crystal'),
      },
      {
        id: 'cbse-periodicity',
        title: 'Ionization Enthalpy & Diagonal Relationships',
        summary:
          'Examine half-filled/full-filled subshell IE₁ anomalies (Be > B, N > O) and second-period screening trends.',
        keyFormulaOrRule: 'IE₁ Anomaly: 2p³ half-filled N (1402) > 2p⁴ O (1314 kJ/mol)',
        launchLabel: 'Plot Periodicity Curves',
        icon: <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        launchAction: () => setViewMode('trends'),
      },
    ],
    'JEE/NEET': [
      {
        id: 'jee-quantum',
        title: 'Quantum Numbers, Exchange Exceptions & Nodal Planes',
        summary:
          'Visualize 3D spherical harmonics Yₗᵐ, radial/angular nodes (n − l − 1 and l), and Cr/Cu/Pd Madelung exceptions.',
        keyFormulaOrRule: 'Total Nodes = n − 1 · Angular Nodes = l · Radial = n − l − 1',
        launchLabel: 'Render 3D Orbitals (Cr)',
        icon: <Atom className="w-4 h-4 text-sky-600 dark:text-cyan-400" />,
        launchAction: () => openElementInAtom3D(findElement(24), 'orbitals'),
      },
      {
        id: 'jee-stereochem',
        title: 'Isomerism, Aromaticity & Hypervalent VSEPR',
        summary:
          'Differentiate cis/trans stereoisomers (C₂H₂Cl₂), Hückel (4n+2)π resonance in Benzene, and XeF₄ / PCl₅ geometries.',
        keyFormulaOrRule: 'Hückel Aromaticity = (4n + 2)π e⁻ · d-orbital sp³d / sp³d²',
        launchLabel: 'Inspect Benzene & Isomers',
        icon: <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        launchAction: () => openMoleculeInVisualizer('benzene'),
      },
      {
        id: 'jee-kinetics',
        title: 'Arrhenius Kinetics & Gibbs Spontaneity',
        summary:
          'Quantify Maxwell-Boltzmann barrier crossing f = exp(−Eₐ/RT), catalyst Eₐ depression, and ΔG = ΔH − TΔS.',
        keyFormulaOrRule: 'k = A·exp(−Eₐ / RT) · ΔG° = ΔH° − TΔS° < 0 (Spontaneous)',
        launchLabel: 'Open Kinetic Simulator',
        icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        launchAction: () => setViewMode('reaction-simulator'),
      },
      {
        id: 'jee-bragg',
        title: 'Crystal X-Ray Diffraction & d-Spacing',
        summary:
          'Explore Miller planes (hkl), supercell expansion, and Bragg diffraction reflections across cubic & diamond lattices.',
        keyFormulaOrRule: 'nλ = 2d_hkl sin θ · d_hkl = a / √(h² + k² + l²)',
        launchLabel: 'Open Diamond Lattice',
        icon: <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        launchAction: () => openElementInAtom3D(findElement(6), 'crystal'),
      },
    ],
    University: [
      {
        id: 'uni-harmonics',
        title: 'Spherical Harmonics & Monte Carlo |ψ|² Densities',
        summary:
          'Evaluate real spherical harmonics Yₗᵐ(θ, φ) across s, p, d, and f multipoles and inspect 15,000-point |ψ|² orbital clouds.',
        keyFormulaOrRule: 'ψ_nlm(r,θ,φ) = R_nl(r) · Y_l^m(θ,φ)',
        launchLabel: 'Launch 3D Harmonics',
        icon: <Atom className="w-4 h-4 text-sky-600 dark:text-cyan-400" />,
        launchAction: () => openElementInAtom3D(findElement(29), 'orbitals'),
      },
      {
        id: 'uni-vff',
        title: 'Cheminformatics Graph Solver & VFF Relaxation',
        summary:
          'Construct arbitrary molecular graphs, compute per-center formal charges & resonance fractional bond orders, and minimize 3D coordinates.',
        keyFormulaOrRule: 'FCᵢ = Vᵢ − 2nᵢ − Bᵢ · Valence Force Field Energy Minimization',
        launchLabel: 'Open Molecular Graph Lab',
        icon: <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        launchAction: () => openMoleculeInVisualizer('sulfur-hexafluoride'),
      },
      {
        id: 'uni-thermo',
        title: 'Statistical Kinetics & Collision Theory',
        summary:
          'Analyze line-of-centers reduced-mass collision thresholds E_coll = ½μ(v_rel·n̂)² and thermodynamic equilibrium constants.',
        keyFormulaOrRule: 'ln(K_p) = −ΔG° / RT · Δn_gas = Σν_prod(g) − Σν_react(g)',
        launchLabel: 'Run Thermodynamic Chamber',
        icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        launchAction: () => setViewMode('reaction-simulator'),
      },
      {
        id: 'uni-crystallography',
        title: 'Reciprocal Lattice Planes & Hermann-Mauguin Symmetry',
        summary:
          'Inspect Hermann-Mauguin space groups, Miller indices (hkl) plane intersections, and synchrotron Cu-Kα Bragg peaks.',
        keyFormulaOrRule: 'Cu-Kα λ = 1.5406 Å · 2θ = 2 arcsin(λ / 2d_hkl)',
        launchLabel: 'Inspect Iron BCC Lattice',
        icon: <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        launchAction: () => openElementInAtom3D(findElement(26), 'crystal'),
      },
    ],
  };

  const currentModules = SYLLABUS_BY_GRADE[gradeLevel] || SYLLABUS_BY_GRADE['Grade 10'];

  // ============================================================================
  // EXPORT & BACKUP HANDLERS
  // ============================================================================
  const dateStamp = new Date().toISOString().slice(0, 10);

  const handleExportMarkdown = () => {
    const unlockedList = achievements.filter((a) => a.unlocked);
    const lines: string[] = [
      `# Periodic Table Explorer — Study Guide & Notes`,
      ``,
      `- **Curriculum Level:** ${gradeLevel}`,
      `- **Level / XP:** Level ${level} (${xp} XP)`,
      `- **Study Streak:** ${streak} day(s) (Last active: ${lastStudyDate})`,
      `- **Exported:** ${new Date().toLocaleString()}`,
      ``,
      `## Bookmarked Elements (${bookmarkedElements.length})`,
      ``,
    ];

    if (bookmarkedElements.length === 0) {
      lines.push(`_No elements bookmarked yet._`, ``);
    } else {
      lines.push(
        `| Z | Symbol | Element | Category | Atomic Mass (u) | Electron Configuration |`,
        `|---:|:---:|---|---|---:|---|`
      );
      bookmarkedElements.forEach((el) => {
        lines.push(
          `| ${el.atomicNumber} | ${el.symbol} | ${el.name} | ${CATEGORY_LABELS[el.category]} | ${el.atomicMass.toFixed(4)} | \`${el.electronConfiguration}\` |`
        );
      });
      lines.push(``);
    }

    lines.push(`## Personal Study Notes (${Object.keys(notes).length})`, ``);
    const noteEntries = Object.entries(notes);
    if (noteEntries.length === 0) {
      lines.push(`_No personal study notes recorded yet._`, ``);
    } else {
      noteEntries.forEach(([zStr, noteBody]) => {
        const z = parseInt(zStr, 10);
        const el = ELEMENTS.find((e) => e.atomicNumber === z);
        lines.push(`### ${el ? `${el.name} (${el.symbol}, Z=${el.atomicNumber})` : `Element Z=${z}`}`);
        lines.push(``);
        lines.push(noteBody.trim() || '_Empty note_');
        lines.push(``);
      });
    }

    lines.push(`## Key ${gradeLevel} Curriculum Formulas`, ``);
    currentModules.forEach((m, i) => {
      lines.push(`${i + 1}. **${m.title}** — \`${m.keyFormulaOrRule}\``);
    });
    lines.push(``);
    lines.push(
      `## Unlocked Achievements (${unlockedList.length}/${achievements.length})`,
      ``
    );
    unlockedList.forEach((a) => {
      lines.push(`- ${a.icon} **${a.title}** (${a.unlockedAt || 'Unlocked'}) — ${a.description}`);
    });

    triggerFileDownload(
      `periodic-explorer-study-guide-${dateStamp}.md`,
      lines.join('\n'),
      'text/markdown;charset=utf-8'
    );
    toast('Markdown Study Guide Exported', 'Saved notes and bookmarked elements as .md file.', 'success');
  };

  const handleExportCsv = () => {
    const header = [
      'AtomicNumber',
      'Symbol',
      'Name',
      'Category',
      'Group',
      'Period',
      'Block',
      'AtomicMass_u',
      'Electronegativity',
      'ElectronConfiguration',
      'CrystalStructure',
      'Bookmarked',
      'StudyNote',
    ];

    const relevantNumbers = new Set<number>([
      ...bookmarks,
      ...Object.keys(notes).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)),
    ]);

    const exportElements =
      relevantNumbers.size > 0
        ? ELEMENTS.filter((el) => relevantNumbers.has(el.atomicNumber))
        : ELEMENTS.slice(0, 36);

    const rows = [header.join(',')];
    exportElements.forEach((el) => {
      const row = [
        el.atomicNumber,
        el.symbol,
        el.name,
        CATEGORY_LABELS[el.category],
        el.group,
        el.period,
        el.block,
        el.atomicMass,
        el.electronegativity ?? '',
        el.electronConfiguration,
        el.crystalStructure,
        bookmarks.includes(el.atomicNumber) ? 'Yes' : 'No',
        notes[el.atomicNumber] || '',
      ].map(escapeCsvField);
      rows.push(row.join(','));
    });

    triggerFileDownload(
      `periodic-explorer-mastery-${dateStamp}.csv`,
      rows.join('\n'),
      'text/csv;charset=utf-8'
    );
    toast(
      'CSV Mastery Table Exported',
      `Exported ${exportElements.length} element records with study notes and bookmark flags.`,
      'success'
    );
  };

  const handleExportBackupJson = () => {
    const payload = {
      schema: 'periodic-table-explorer-backup-v1',
      exportedAt: new Date().toISOString(),
      gradeLevel,
      xp,
      level,
      streak,
      lastStudyDate,
      bookmarks,
      notes,
      masteredFlashcards,
      achievements,
    };
    triggerFileDownload(
      `periodic-explorer-backup-${dateStamp}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    toast('Full JSON Backup Saved', 'Download complete. Keep this file to restore progress anytime.', 'success');
  };

  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON structure');
      }
      importProgressBackup(parsed);
      toast(
        'Progress Backup Restored',
        `Imported notes, bookmarks (${Array.isArray(parsed.bookmarks) ? parsed.bookmarks.length : bookmarks.length}), and XP.`,
        'success'
      );
    } catch {
      toast(
        'Backup Import Failed',
        'Please select a valid Periodic Table Explorer JSON backup file.',
        'error'
      );
    } finally {
      e.target.value = '';
    }
  };

  const handlePrintRevisionSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Screen Interactive Portal */}
      <div className="no-print space-y-6">
        {/* Top Banner & Stats Overview */}
        <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Student Study Portal
              </h2>
              <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-sky-100 dark:bg-cyan-500/20 text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-cyan-500/40">
                {gradeLevel}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Dynamic curriculum pathways, element bookmarks, personal study notes, achievements &amp; portable backups.
            </p>
          </div>

          {/* Level & Streak Stats Grid */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10">
              <Flame className="w-6 h-6 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Streak
                </span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {streak} Days
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10">
              <Trophy className="w-6 h-6 text-sky-600 dark:text-cyan-400" />
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Level {level}
                </span>
                <span className="text-lg font-bold text-sky-700 dark:text-cyan-400 font-mono tabular-nums">
                  {xp} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10">
          {[
            { id: 'syllabus', label: 'Curriculum & Syllabi', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'bookmarks', label: `Saved Bookmarks (${bookmarks.length})`, icon: <Bookmark className="w-4 h-4" /> },
            { id: 'notes', label: `Study Notes (${Object.keys(notes).length})`, icon: <BookOpen className="w-4 h-4" /> },
            { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> },
            { id: 'export', label: 'Export & Backup Center', icon: <Download className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* SUB-TAB 1: DYNAMIC CURRICULUM SYLLABUS */}
        {activeSubTab === 'syllabus' && (
          <div className="space-y-5">
            {/* Inline Grade Tier Switcher */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <GraduationCap className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <span>Active Academic Track:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GRADE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGradeLevel(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      gradeLevel === g
                        ? 'bg-sky-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentModules.map((mod, idx) => (
                <div
                  key={mod.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-700 dark:text-cyan-400">
                        {mod.icon}
                        Module {idx + 1} · {gradeLevel}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {mod.summary}
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] font-semibold text-slate-800 dark:text-cyan-300">
                      {mod.keyFormulaOrRule}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                    <button
                      onClick={mod.launchAction}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>{mod.launchLabel}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setViewMode('ai-tutor')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Ask Tutor</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-TAB 2: BOOKMARKS */}
        {activeSubTab === 'bookmarks' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bookmarkedElements.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 col-span-full text-center py-12">
                No elements bookmarked yet. Click the bookmark icon on any element modal to save it here.
              </p>
            ) : (
              bookmarkedElements.map((el) => (
                <div
                  key={el.atomicNumber}
                  onClick={() => {
                    setSelectedElement(el);
                    setViewMode('table');
                  }}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 hover:border-sky-500 dark:hover:border-cyan-400/50 cursor-pointer transition-all space-y-2 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                      Z = {el.atomicNumber}
                    </span>
                    <span className="text-xl font-extrabold text-sky-600 dark:text-cyan-400">
                      {el.symbol}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{el.name}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {CATEGORY_LABELS[el.category]} · {el.atomicMass.toFixed(3)} u
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUB-TAB 3: NOTES */}
        {activeSubTab === 'notes' && (
          <div className="space-y-4">
            {Object.keys(notes).length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-12">
                No study notes written yet. Inspect an element and write custom notes in its Study Notes tab.
              </p>
            ) : (
              Object.entries(notes).map(([zStr, text]) => {
                const z = parseInt(zStr, 10);
                const el = ELEMENTS.find((e) => e.atomicNumber === z);
                return (
                  <div
                    key={z}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-sky-700 dark:text-cyan-400">
                      <span>
                        {el ? `${el.name} (${el.symbol}, Z=${el.atomicNumber})` : `Element Z=${z}`}
                      </span>
                      {el && (
                        <button
                          onClick={() => {
                            setSelectedElement(el);
                            setViewMode('table');
                          }}
                          className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                        >
                          Open Element
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SUB-TAB 4: ACHIEVEMENTS */}
        {activeSubTab === 'achievements' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-3xl border transition-all flex items-start gap-3 shadow-sm ${
                  a.unlocked
                    ? 'bg-white dark:bg-slate-900/90 border-sky-400 dark:border-cyan-500/50'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 opacity-60'
                }`}
              >
                <span className="text-3xl">{a.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{a.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {a.description}
                  </p>
                  {a.unlocked && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block mt-1">
                      Unlocked {a.unlockedAt}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUB-TAB 5: EXPORT & BACKUP CENTER */}
        {activeSubTab === 'export' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Export Markdown Study Guide */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-700 dark:text-cyan-400">
                  <FileText className="w-4 h-4" />
                  <span>Markdown Study Guide (.md)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Exports {bookmarkedElements.length} bookmarked elements, {Object.keys(notes).length} personal study notes, and {gradeLevel} reference formulas in portable Markdown format.
                </p>
              </div>
              <button
                onClick={handleExportMarkdown}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Study Notes (.md)</span>
              </button>
            </div>

            {/* 2. Export CSV Mastery Spreadsheet */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Element &amp; Study Mastery (.csv)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Generates an RFC-4180 CSV spreadsheet with atomic properties, electronegativity, crystal structure, bookmark flags, and study notes.
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Mastery Table (.csv)</span>
              </button>
            </div>

            {/* 3. Full JSON Progress Backup & Restore */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  <FileJson className="w-4 h-4" />
                  <span>Full Progress Backup &amp; Restore (.json)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Back up XP ({xp}), Level {level}, {streak}-day streak, bookmarks, notes, and achievements—or restore from an earlier backup file.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleExportBackupJson}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Backup (.json)</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Backup JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportBackupFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* 4. Print Formatted Revision Sheet */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  <Printer className="w-4 h-4" />
                  <span>Formatted Revision Sheet (Print / PDF)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Formats your {gradeLevel} key equations, bookmarked elements, and study notes into a crisp white-paper revision sheet ready to print or Save as PDF.
                </p>
              </div>
              <button
                onClick={handlePrintRevisionSheet}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Revision Sheet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable Revision Sheet (Rendered cleanly during window.print()) */}
      <section className="print-only-sheet space-y-6 p-6">
        <div className="border-b-2 border-slate-900 pb-3">
          <h1 className="text-2xl font-black text-slate-950">
            Periodic Table Explorer — {gradeLevel} Revision Sheet
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Level {level} ({xp} XP) · {streak}-Day Streak · Printed {new Date().toLocaleDateString()}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Key {gradeLevel} Formulas &amp; Principles
          </h2>
          <ul className="space-y-1.5 text-xs">
            {currentModules.map((mod) => (
              <li key={mod.id}>
                <strong>{mod.title}:</strong> <code>{mod.keyFormulaOrRule}</code>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Bookmarked Elements ({bookmarkedElements.length})
          </h2>
          <table className="w-full text-left text-xs border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-400 px-2 py-1">Z</th>
                <th className="border border-slate-400 px-2 py-1">Symbol</th>
                <th className="border border-slate-400 px-2 py-1">Name</th>
                <th className="border border-slate-400 px-2 py-1">Mass (u)</th>
                <th className="border border-slate-400 px-2 py-1">Configuration</th>
              </tr>
            </thead>
            <tbody>
              {bookmarkedElements.map((el) => (
                <tr key={el.atomicNumber}>
                  <td className="border border-slate-400 px-2 py-1 font-mono">{el.atomicNumber}</td>
                  <td className="border border-slate-400 px-2 py-1 font-bold">{el.symbol}</td>
                  <td className="border border-slate-400 px-2 py-1">{el.name}</td>
                  <td className="border border-slate-400 px-2 py-1 font-mono">
                    {el.atomicMass.toFixed(3)}
                  </td>
                  <td className="border border-slate-400 px-2 py-1 font-mono">
                    {el.electronConfiguration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Personal Study Notes ({Object.keys(notes).length})
          </h2>
          <div className="space-y-3 text-xs">
            {Object.entries(notes).map(([zStr, text]) => {
              const z = parseInt(zStr, 10);
              const el = ELEMENTS.find((e) => e.atomicNumber === z);
              return (
                <div key={z} className="border border-slate-300 rounded p-2.5">
                  <div className="font-bold text-slate-950">
                    {el ? `${el.name} (${el.symbol}, Z=${el.atomicNumber})` : `Element Z=${z}`}
                  </div>
                  <p className="text-slate-800 mt-1 whitespace-pre-line">{text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
