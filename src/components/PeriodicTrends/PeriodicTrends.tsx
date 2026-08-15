import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ELEMENTS, CATEGORY_LABELS, CATEGORY_COLORS } from '../../data/elementsData';
import { HeatmapProperty, ElementData } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import {
  TrendingUp,
  BarChart2,
  Info,
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Layers,
  Grid,
  Sparkles,
  Flame,
  Zap,
  Scale,
  Activity,
  Compass,
  RotateCcw,
  Sliders,
  HelpCircle,
  Eye,
  Maximize2,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

// Property metadata dictionary covering all 8 prompt-requested properties + extra options
export interface TrendPropertyMeta {
  key: HeatmapProperty;
  title: string;
  shortName: string;
  unit: string;
  color: string;
  secondaryColor: string;
  periodTrend: 'increases' | 'decreases' | 'varies';
  groupTrend: 'increases' | 'decreases' | 'varies';
  summary: string;
  explanation: string;
  anomalies: string;
  minLabel: string;
  maxLabel: string;
}

export const TREND_PROPERTIES: Record<HeatmapProperty, TrendPropertyMeta> = {
  none: {
    key: 'none',
    title: 'Atomic Number (Z)',
    shortName: 'Atomic No.',
    unit: '',
    color: '#38bdf8',
    secondaryColor: '#0284c7',
    periodTrend: 'increases',
    groupTrend: 'increases',
    summary: 'Standard atomic ordering (1 to 118 protons).',
    explanation: 'Sequential proton count defining element identity along periods and down groups.',
    anomalies: 'No anomalies; strictly monotonic.',
    minLabel: 'Lightest (Hydrogen, Z=1)',
    maxLabel: 'Heaviest (Oganesson, Z=118)',
  },
  atomicRadius: {
    key: 'atomicRadius',
    title: 'Atomic Radius',
    shortName: 'Atomic Radius',
    unit: 'pm',
    color: '#a855f7',
    secondaryColor: '#c084fc',
    periodTrend: 'decreases',
    groupTrend: 'increases',
    summary: 'Distance from nucleus to outermost electron shell.',
    explanation:
      'Decreases across a period (left → right) as effective nuclear charge (Zeff) pulls electron shells closer. Increases down a group as new principal electron shells (n) are added.',
    anomalies:
      'Lanthanide contraction causes period 6 transition metals (e.g., Hafnium) to have nearly identical radii to period 5 metals (Zirconium).',
    minLabel: 'Smallest (Helium ~31 pm)',
    maxLabel: 'Largest (Cesium ~298 pm)',
  },
  density: {
    key: 'density',
    title: 'Density',
    shortName: 'Density',
    unit: 'g/cm³',
    color: '#34d399',
    secondaryColor: '#10b981',
    periodTrend: 'varies',
    groupTrend: 'increases',
    summary: 'Mass per unit volume at standard room temperature and pressure.',
    explanation:
      'Peaks near the center of transition metals (Group 8-10) due to close atomic packing and high atomic mass. Osmium and Iridium are the densest naturally occurring elements (~22.59 g/cm³).',
    anomalies:
      'Gases (Hydrogen, Helium, Nitrogen) have tiny STP mass densities, while period 6 transition metals exhibit extreme packing density.',
    minLabel: 'Lowest (Hydrogen ~0.000089 g/cm³)',
    maxLabel: 'Highest (Osmium & Iridium ~22.59 g/cm³)',
  },
  electronegativity: {
    key: 'electronegativity',
    title: 'Electronegativity (Pauling)',
    shortName: 'Electronegativity',
    unit: 'Pauling',
    color: '#38bdf8',
    secondaryColor: '#60a5fa',
    periodTrend: 'increases',
    groupTrend: 'decreases',
    summary: 'Tendency of an atom to attract shared bonding electrons.',
    explanation:
      'Increases across a period as nuclear charge increases and atomic radius shrinks. Decreases down a group because valence electrons are farther from the nucleus.',
    anomalies:
      'Noble gases (He, Ne, Ar) generally lack Pauling electronegativity values because they rarely form chemical bonds.',
    minLabel: 'Lowest (Francium / Cesium ~0.79)',
    maxLabel: 'Highest (Fluorine ~3.98)',
  },
  atomicMass: {
    key: 'atomicMass',
    title: 'Atomic Mass',
    shortName: 'Atomic Mass',
    unit: 'u',
    color: '#f59e0b',
    secondaryColor: '#fbbf24',
    periodTrend: 'increases',
    groupTrend: 'increases',
    summary: 'Weighted average mass of naturally occurring isotopes.',
    explanation:
      'Increases consistently across periods and down groups as protons and neutrons accumulate in the atomic nucleus.',
    anomalies:
      'Minor mass inversions occur due to isotope distribution: Argon (Z=18, 39.95 u) is heavier than Potassium (Z=19, 39.10 u); Cobalt > Nickel; Tellurium > Iodine.',
    minLabel: 'Lightest (Hydrogen 1.008 u)',
    maxLabel: 'Heaviest (Oganesson 294 u)',
  },
  meltingPoint: {
    key: 'meltingPoint',
    title: 'Melting Point',
    shortName: 'Melting Point',
    unit: 'K',
    color: '#fbbf24',
    secondaryColor: '#f59e0b',
    periodTrend: 'varies',
    groupTrend: 'varies',
    summary: 'Temperature required to transition from solid to liquid state.',
    explanation:
      'Peaks in middle transition metals (strong d-electron metallic bonds) and Group 14 network covalent solids (Carbon/Diamond melts at ~3823 K). Noble gases melt near absolute zero.',
    anomalies:
      'Mercury (234.3 K) is liquid at room temperature due to relativistic stabilization of its 6s orbital pair.',
    minLabel: 'Lowest (Helium 0.95 K at 25 atm)',
    maxLabel: 'Highest (Carbon ~3823 K / Tungsten 3695 K)',
  },
  boilingPoint: {
    key: 'boilingPoint',
    title: 'Boiling Point',
    shortName: 'Boiling Point',
    unit: 'K',
    color: '#f43f5e',
    secondaryColor: '#fb7185',
    periodTrend: 'varies',
    groupTrend: 'varies',
    summary: 'Temperature required to transition from liquid to gaseous phase.',
    explanation:
      'Reflects total interatomic bonding energy. Highest in refractory transition metals (Rhenium, Tungsten ~5800 K) and lowest in light noble gases.',
    anomalies:
      'Helium has the lowest boiling point of any element (4.22 K) and requires pressure to freeze into a solid.',
    minLabel: 'Lowest (Helium 4.22 K)',
    maxLabel: 'Highest (Rhenium 5869 K / Tungsten 5828 K)',
  },
  ionizationEnergy: {
    key: 'ionizationEnergy',
    title: 'First Ionization Energy',
    shortName: 'Ionization Energy',
    unit: 'kJ/mol',
    color: '#6366f1',
    secondaryColor: '#818cf8',
    periodTrend: 'increases',
    groupTrend: 'decreases',
    summary: 'Energy required to remove the outermost valence electron.',
    explanation:
      'Increases across a period as effective nuclear charge holds electrons tightly. Decreases down a group because valence electrons sit in higher shells farther from the nucleus.',
    anomalies:
      'Slight dips occur between Be → B (filling s before p orbital) and N → O (electron pairing repulsion in 2p orbitals).',
    minLabel: 'Lowest (Cesium 375.7 kJ/mol)',
    maxLabel: 'Highest (Helium 2372.3 kJ/mol)',
  },
  electronAffinity: {
    key: 'electronAffinity',
    title: 'Electron Affinity',
    shortName: 'Electron Affinity',
    unit: 'kJ/mol',
    color: '#ec4899',
    secondaryColor: '#f472b6',
    periodTrend: 'increases',
    groupTrend: 'decreases',
    summary: 'Energy released when an atom gains an extra electron.',
    explanation:
      'Halogens (Group 17) have the highest electron affinities because adding 1 electron completes a stable noble gas octet.',
    anomalies:
      'Chlorine (-349 kJ/mol) has a higher electron affinity than Fluorine (-328 kJ/mol) because Fluorine’s compact 2p subshell suffers severe electron-electron repulsion.',
    minLabel: 'Lowest (Noble gases & Alkaline Earths ~0)',
    maxLabel: 'Highest (Chlorine 349 kJ/mol)',
  },
  abundanceEarth: {
    key: 'abundanceEarth',
    title: 'Crust Abundance',
    shortName: 'Abundance',
    unit: 'mg/kg',
    color: '#10b981',
    secondaryColor: '#34d399',
    periodTrend: 'varies',
    groupTrend: 'varies',
    summary: 'Concentration in Earth’s continental crust in parts per million.',
    explanation:
      'Oxygen (~461,000 mg/kg) and Silicon (~282,000 mg/kg) dominate Earth’s crust, making up ~74% by mass, followed by Aluminium and Iron.',
    anomalies:
      'Precious metals (Gold, Platinum, Rhodium) are extremely rare (<0.005 mg/kg), while light elements dominate.',
    minLabel: 'Rarest (Technetium / Francium ~0)',
    maxLabel: 'Most Abundant (Oxygen 461,000 mg/kg)',
  },
};

type ExplorerViewMode = 'chart' | 'heatmap-grid' | 'comparison';

export const PeriodicTrends: React.FC = () => {
  const { setSelectedElement } = useAppStore();

  // Mode & Property Selection State
  const [viewMode, setViewMode] = useState<ExplorerViewMode>('chart');
  const [primaryProperty, setPrimaryProperty] = useState<HeatmapProperty>('electronegativity');
  const [secondaryProperty, setSecondaryProperty] = useState<HeatmapProperty | 'none'>('atomicRadius');
  const [enableDualAxis, setEnableDualAxis] = useState<boolean>(true);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>('all');
  const [selectedBlock, setSelectedBlock] = useState<string | 'all'>('all');

  // Comparison mode elements
  const [compElem1, setCompElem1] = useState<ElementData>(ELEMENTS[10]); // Sodium (Na, Z=11)
  const [compElem2, setCompElem2] = useState<ElementData>(ELEMENTS[16]); // Chlorine (Cl, Z=17)

  // Active hovered element in chart or grid
  const [hoveredElement, setHoveredElement] = useState<ElementData | null>(null);

  // Meta infos
  const primaryMeta = TREND_PROPERTIES[primaryProperty];
  const secondaryMeta = secondaryProperty !== 'none' ? TREND_PROPERTIES[secondaryProperty] : null;

  // Filtered dataset for Recharts & Grid
  const filteredDataset = useMemo(() => {
    return ELEMENTS.filter((el) => {
      if (selectedGroup !== 'all' && el.group !== selectedGroup) return false;
      if (selectedPeriod !== 'all' && el.period !== selectedPeriod) return false;
      if (selectedBlock !== 'all' && el.block !== selectedBlock) return false;
      return true;
    });
  }, [selectedGroup, selectedPeriod, selectedBlock]);

  // Compute Min / Max for Primary Property for heatmaps
  const { minPrimary, maxPrimary, avgPrimary } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;

    ELEMENTS.forEach((el) => {
      const v = el[primaryProperty as keyof ElementData] as number | null;
      if (v !== null && typeof v === 'number' && !isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
        sum += v;
        count++;
      }
    });

    return {
      minPrimary: min === Infinity ? 0 : min,
      maxPrimary: max === -Infinity ? 100 : max,
      avgPrimary: count > 0 ? sum / count : 0,
    };
  }, [primaryProperty]);

  // Format dataset for Recharts
  const chartData = useMemo(() => {
    return filteredDataset.map((el) => {
      const pVal = (el[primaryProperty as keyof ElementData] as number) ?? null;
      const sVal = secondaryProperty !== 'none' ? ((el[secondaryProperty as keyof ElementData] as number) ?? null) : null;

      return {
        symbol: el.symbol,
        name: el.name,
        z: el.atomicNumber,
        primaryVal: pVal,
        secondaryVal: sVal,
        group: el.group,
        period: el.period,
        block: el.block,
        category: el.category,
        element: el,
      };
    });
  }, [filteredDataset, primaryProperty, secondaryProperty]);

  // Helper function to convert value to color gradient for heatmap
  const getHeatmapColor = (val: number | null): string => {
    if (val === null || val === undefined) return '#1e293b'; // slate-800
    if (maxPrimary === minPrimary) return primaryMeta.color;

    const ratio = Math.max(0, Math.min(1, (val - minPrimary) / (maxPrimary - minPrimary)));

    // Interpolate hue from 240 (blue) down to 0 (red/amber)
    const hue = Math.round((1 - ratio) * 240);
    return `hsl(${hue}, 85%, 52%)`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Periodic Trend Explorer</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
              Interactive Analytics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare periodic properties across periods, groups, and blocks with real-time visual heatmaps & explanations.
          </p>
        </div>

        {/* View Mode Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setViewMode('chart')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'chart'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Interactive Chart</span>
          </button>

          <button
            onClick={() => setViewMode('heatmap-grid')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'heatmap-grid'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Periodic Heatmap</span>
          </button>

          <button
            onClick={() => setViewMode('comparison')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'comparison'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Head-to-Head</span>
          </button>
        </div>
      </div>

      {/* Property Selector Strip (8 Main Prompt Properties) */}
      <div className="bg-slate-900/80 p-4 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-2 text-cyan-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4" /> Choose Primary Property:
          </span>
          <span className="text-slate-400 font-mono">
            Range: {minPrimary.toLocaleString()} - {maxPrimary.toLocaleString()} {primaryMeta.unit}
          </span>
        </div>

        {/* 8 Quick Property Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {[
            { key: 'atomicRadius', name: 'Atomic Radius', icon: '⚛️' },
            { key: 'density', name: 'Density', icon: '💧' },
            { key: 'electronegativity', name: 'Electronegativity', icon: '⚡' },
            { key: 'atomicMass', name: 'Atomic Mass', icon: '⚖️' },
            { key: 'meltingPoint', name: 'Melting Point', icon: '🔥' },
            { key: 'boilingPoint', name: 'Boiling Point', icon: '💨' },
            { key: 'ionizationEnergy', name: 'Ionization Energy', icon: '🔋' },
            { key: 'electronAffinity', name: 'Electron Affinity', icon: '🧲' },
          ].map((prop) => {
            const isSelected = primaryProperty === prop.key;
            const meta = TREND_PROPERTIES[prop.key as HeatmapProperty];

            return (
              <button
                key={prop.key}
                onClick={() => setPrimaryProperty(prop.key as HeatmapProperty)}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-lg">{prop.icon}</span>
                <span className="text-[11px] font-extrabold leading-tight">{prop.name}</span>
                <span className="text-[9px] font-mono opacity-80" style={{ color: meta.color }}>
                  {meta.unit || 'Pauling'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters & Secondary Comparison Overlay Controls */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          
          {/* Secondary Property Overlay Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Compare Overlay:</span>
            <select
              value={secondaryProperty}
              onChange={(e) => setSecondaryProperty(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold cursor-pointer"
            >
              <option value="none">None (Single Property)</option>
              {Object.keys(TREND_PROPERTIES)
                .filter((k) => k !== 'none' && k !== primaryProperty)
                .map((k) => (
                  <option key={k} value={k}>
                    {TREND_PROPERTIES[k as HeatmapProperty].title} ({TREND_PROPERTIES[k as HeatmapProperty].unit})
                  </option>
                ))}
            </select>

            {secondaryProperty !== 'none' && (
              <label className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={enableDualAxis}
                  onChange={(e) => setEnableDualAxis(e.target.checked)}
                  className="rounded accent-cyan-400 cursor-pointer"
                />
                <span>Dual Y-Axes</span>
              </label>
            )}
          </div>

          {/* Group / Period / Block Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Group:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold"
              >
                <option value="all">All Groups (1-18)</option>
                {Array.from({ length: 18 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Group {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Period:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold"
              >
                <option value="all">All Periods (1-7)</option>
                {Array.from({ length: 7 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Period {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Block:</span>
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold uppercase"
              >
                <option value="all">All Blocks</option>
                <option value="s">s-Block</option>
                <option value="p">p-Block</option>
                <option value="d">d-Block</option>
                <option value="f">f-Block</option>
              </select>
            </div>

            {(selectedGroup !== 'all' || selectedPeriod !== 'all' || selectedBlock !== 'all') && (
              <button
                onClick={() => {
                  setSelectedGroup('all');
                  setSelectedPeriod('all');
                  setSelectedBlock('all');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

        </div>
      </div>

      {/* VIEW MODE 1: INTERACTIVE RECHARTS GRAPH */}
      {viewMode === 'chart' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-2xl h-[480px] relative flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-slate-100">
                  {primaryMeta.title} {secondaryMeta ? `vs ${secondaryMeta.title}` : 'Across Elements'}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Showing {filteredDataset.length} Elements
              </span>
            </div>

            {/* Recharts Main Stage */}
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="symbol"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={filteredDataset.length > 50 ? 2 : 0}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={primaryMeta.color}
                    fontSize={11}
                    unit={` ${primaryMeta.unit}`}
                  />
                  {secondaryMeta && enableDualAxis && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={secondaryMeta.color}
                      fontSize={11}
                      unit={` ${secondaryMeta.unit}`}
                    />
                  )}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const el: ElementData = data.element;
                        setHoveredElement(el);

                        return (
                          <div className="bg-slate-950/95 border border-slate-800 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-extrabold text-cyan-400">{el.symbol}</span>
                                <span className="font-extrabold text-white">{el.name}</span>
                              </div>
                              <span className="font-mono text-slate-400 font-bold">Z = {el.atomicNumber}</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between font-mono">
                                <span style={{ color: primaryMeta.color }}>{primaryMeta.shortName}:</span>
                                <strong className="text-white">
                                  {data.primaryVal !== null ? `${data.primaryVal} ${primaryMeta.unit}` : 'N/A'}
                                </strong>
                              </div>

                              {secondaryMeta && (
                                <div className="flex justify-between font-mono">
                                  <span style={{ color: secondaryMeta.color }}>{secondaryMeta.shortName}:</span>
                                  <strong className="text-white">
                                    {data.secondaryVal !== null ? `${data.secondaryVal} ${secondaryMeta.unit}` : 'N/A'}
                                  </strong>
                                </div>
                              )}
                            </div>

                            <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex justify-between font-mono">
                              <span>Group {el.group} | Period {el.period}</span>
                              <span className="uppercase font-bold text-amber-400">{el.block}-block</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="primaryVal"
                    name={`${primaryMeta.title} (${primaryMeta.unit})`}
                    fill={primaryMeta.color}
                    opacity={0.35}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="primaryVal"
                    name={primaryMeta.title}
                    stroke={primaryMeta.color}
                    strokeWidth={3}
                    dot={{ fill: primaryMeta.color, r: 3 }}
                  />

                  {secondaryMeta && (
                    <Line
                      yAxisId={enableDualAxis ? 'right' : 'left'}
                      type="monotone"
                      dataKey="secondaryVal"
                      name={secondaryMeta.title}
                      stroke={secondaryMeta.color}
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      dot={{ fill: secondaryMeta.color, r: 3 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW MODE 2: PERIODIC TABLE HEATMAP GRID */}
      {viewMode === 'heatmap-grid' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          {/* Legend Gradient Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-200">
                Heatmap Intensity Legend ({primaryMeta.title})
              </span>
              <p className="text-[11px] text-slate-400">
                Cell colors scale continuously from Minimum ({minPrimary} {primaryMeta.unit}) to Maximum ({maxPrimary} {primaryMeta.unit}).
              </p>
            </div>

            {/* Gradient Bar Visual */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-blue-400">{minPrimary} {primaryMeta.unit}</span>
              <div className="w-48 sm:w-64 h-4 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 via-emerald-400 via-amber-400 to-rose-500 shadow-inner" />
              <span className="text-xs font-mono font-bold text-rose-400">{maxPrimary} {primaryMeta.unit}</span>
            </div>
          </div>

          {/* Interactive 118-Element Periodic Grid */}
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="min-w-[850px] grid grid-cols-18 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800/80">
              {Array.from({ length: 7 }, (_, periodIdx) => {
                const pNum = periodIdx + 1;
                return Array.from({ length: 18 }, (_, groupIdx) => {
                  const gNum = groupIdx + 1;

                  const el = ELEMENTS.find((e) => e.period === pNum && e.group === gNum);
                  if (!el) {
                    return <div key={`empty-${pNum}-${gNum}`} className="w-full aspect-square" />;
                  }

                  const val = el[primaryProperty as keyof ElementData] as number | null;
                  const color = getHeatmapColor(val);

                  return (
                    <motion.button
                      key={el.atomicNumber}
                      whileHover={{ scale: 1.15, zIndex: 30 }}
                      onClick={() => setSelectedElement(el)}
                      onMouseEnter={() => setHoveredElement(el)}
                      className="relative aspect-square rounded-xl p-1 flex flex-col items-center justify-between border border-slate-800/60 shadow-sm transition-all cursor-pointer group"
                      style={{
                        backgroundColor: val !== null ? color : '#0f172a',
                        color: '#ffffff',
                      }}
                    >
                      <div className="w-full flex justify-between text-[8px] font-mono font-bold opacity-80">
                        <span>{el.atomicNumber}</span>
                      </div>

                      <span className="text-xs font-extrabold tracking-tight drop-shadow-md">
                        {el.symbol}
                      </span>

                      <span className="text-[8px] font-mono font-bold truncate max-w-full opacity-90 drop-shadow-sm">
                        {val !== null ? val : 'N/A'}
                      </span>
                    </motion.button>
                  );
                });
              })}
            </div>
          </div>

          {/* Lanthanides & Actinides Strip */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Lanthanides & Actinides</span>
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-[850px] space-y-1.5">
                {/* Lanthanides */}
                <div className="flex gap-1.5 pl-[100px]">
                  {ELEMENTS.filter((e) => e.category === 'lanthanide').map((el) => {
                    const val = el[primaryProperty as keyof ElementData] as number | null;
                    const color = getHeatmapColor(val);

                    return (
                      <motion.button
                        key={el.atomicNumber}
                        whileHover={{ scale: 1.15, zIndex: 30 }}
                        onClick={() => setSelectedElement(el)}
                        className="w-11 aspect-square rounded-xl p-1 flex flex-col items-center justify-between border border-slate-800 shadow-sm cursor-pointer"
                        style={{ backgroundColor: val !== null ? color : '#0f172a', color: '#fff' }}
                      >
                        <span className="text-[8px] font-mono opacity-80">{el.atomicNumber}</span>
                        <span className="text-xs font-extrabold">{el.symbol}</span>
                        <span className="text-[8px] font-mono">{val !== null ? val : 'N/A'}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Actinides */}
                <div className="flex gap-1.5 pl-[100px]">
                  {ELEMENTS.filter((e) => e.category === 'actinide').map((el) => {
                    const val = el[primaryProperty as keyof ElementData] as number | null;
                    const color = getHeatmapColor(val);

                    return (
                      <motion.button
                        key={el.atomicNumber}
                        whileHover={{ scale: 1.15, zIndex: 30 }}
                        onClick={() => setSelectedElement(el)}
                        className="w-11 aspect-square rounded-xl p-1 flex flex-col items-center justify-between border border-slate-800 shadow-sm cursor-pointer"
                        style={{ backgroundColor: val !== null ? color : '#0f172a', color: '#fff' }}
                      >
                        <span className="text-[8px] font-mono opacity-80">{el.atomicNumber}</span>
                        <span className="text-xs font-extrabold">{el.symbol}</span>
                        <span className="text-[8px] font-mono">{val !== null ? val : 'N/A'}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW MODE 3: HEAD-TO-HEAD ELEMENT COMPARISON */}
      {viewMode === 'comparison' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" /> Head-to-Head Element Comparison
              </h3>
              <p className="text-xs text-slate-400">
                Select any two elements to compare all 8 periodic properties side-by-side with metric ratios.
              </p>
            </div>
          </div>

          {/* Element Selection Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Element 1 Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Element 1:</label>
              <select
                value={compElem1.atomicNumber}
                onChange={(e) => {
                  const found = ELEMENTS.find((el) => el.atomicNumber === Number(e.target.value));
                  if (found) setCompElem1(found);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-extrabold text-sm cursor-pointer"
              >
                {ELEMENTS.map((el) => (
                  <option key={el.atomicNumber} value={el.atomicNumber}>
                    {el.atomicNumber}. {el.name} ({el.symbol})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-4 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/40 flex flex-col items-center justify-center">
                  <span className="text-xs font-mono text-cyan-400">Z={compElem1.atomicNumber}</span>
                  <span className="text-2xl font-extrabold text-white">{compElem1.symbol}</span>
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">{compElem1.name}</h4>
                  <p className="text-xs text-slate-400">
                    Category: <strong className="text-cyan-300">{CATEGORY_LABELS[compElem1.category]}</strong>
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Group {compElem1.group} | Period {compElem1.period} | {compElem1.block}-block
                  </p>
                </div>
              </div>
            </div>

            {/* Element 2 Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Element 2:</label>
              <select
                value={compElem2.atomicNumber}
                onChange={(e) => {
                  const found = ELEMENTS.find((el) => el.atomicNumber === Number(e.target.value));
                  if (found) setCompElem2(found);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-extrabold text-sm cursor-pointer"
              >
                {ELEMENTS.map((el) => (
                  <option key={el.atomicNumber} value={el.atomicNumber}>
                    {el.atomicNumber}. {el.name} ({el.symbol})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-4 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col items-center justify-center">
                  <span className="text-xs font-mono text-amber-400">Z={compElem2.atomicNumber}</span>
                  <span className="text-2xl font-extrabold text-white">{compElem2.symbol}</span>
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">{compElem2.name}</h4>
                  <p className="text-xs text-slate-400">
                    Category: <strong className="text-amber-300">{CATEGORY_LABELS[compElem2.category]}</strong>
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Group {compElem2.group} | Period {compElem2.period} | {compElem2.block}-block
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Side-by-Side Table Comparison */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Property-by-Property Metrics
            </h4>

            <div className="space-y-2">
              {[
                { key: 'atomicRadius', title: 'Atomic Radius', unit: 'pm' },
                { key: 'density', title: 'Density', unit: 'g/cm³' },
                { key: 'electronegativity', title: 'Electronegativity', unit: 'Pauling' },
                { key: 'atomicMass', title: 'Atomic Mass', unit: 'u' },
                { key: 'meltingPoint', title: 'Melting Point', unit: 'K' },
                { key: 'boilingPoint', title: 'Boiling Point', unit: 'K' },
                { key: 'ionizationEnergy', title: 'First Ionization Energy', unit: 'kJ/mol' },
                { key: 'electronAffinity', title: 'Electron Affinity', unit: 'kJ/mol' },
              ].map((prop) => {
                const val1 = compElem1[prop.key as keyof ElementData] as number | null;
                const val2 = compElem2[prop.key as keyof ElementData] as number | null;

                const hasVal1 = val1 !== null && typeof val1 === 'number';
                const hasVal2 = val2 !== null && typeof val2 === 'number';

                const maxVal = Math.max(hasVal1 ? val1 : 0, hasVal2 ? val2 : 0, 1);
                const pct1 = hasVal1 ? Math.min(100, Math.round((val1 / maxVal) * 100)) : 0;
                const pct2 = hasVal2 ? Math.min(100, Math.round((val2 / maxVal) * 100)) : 0;

                return (
                  <div key={prop.key} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-300">
                      <span>{prop.title}</span>
                      <span className="text-slate-500 text-[11px] font-mono">Unit: {prop.unit}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                      {/* Elem 1 Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-cyan-400 font-bold">{compElem1.symbol}</span>
                          <span className="text-white font-bold">{hasVal1 ? `${val1} ${prop.unit}` : 'N/A'}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct1}%` }}
                          />
                        </div>
                      </div>

                      {/* Elem 2 Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono">
                          <span className="text-amber-400 font-bold">{compElem2.symbol}</span>
                          <span className="text-white font-bold">{hasVal2 ? `${val2} ${prop.unit}` : 'N/A'}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct2}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* SCIENTIFIC EXPLANATIONS & TREND RULES CARD */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-extrabold text-white">
            Scientific Explanation & Principles: {primaryMeta.title}
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {primaryMeta.explanation}
        </p>

        {/* Trend Arrows Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Period Rule */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <ArrowRight className="w-4 h-4" />
              <span>Across Period (Left → Right): {primaryMeta.periodTrend.toUpperCase()}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              As atomic number Z increases across a row, protons are added to the nucleus without adding new electron shells. This increases effective nuclear charge (Zeff), pulling valence electrons closer.
            </p>
          </div>

          {/* Group Rule */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <ArrowDown className="w-4 h-4" />
              <span>Down Group (Top → Bottom): {primaryMeta.groupTrend.toUpperCase()}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Moving down a column, new principal energy levels (n) are added. Inner electron shells shield outer electrons from nuclear pull, expanding the atom's size and decreasing electron binding energy.
            </p>
          </div>

        </div>

        {/* Key Anomalies */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Notable Anomalies & Exceptions:</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {primaryMeta.anomalies}
          </p>
        </div>

      </div>

    </div>
  );
};
