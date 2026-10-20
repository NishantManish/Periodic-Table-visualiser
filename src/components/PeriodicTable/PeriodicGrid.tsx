import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ELEMENTS, CATEGORY_LABELS, CATEGORY_COLORS } from '../../data/elementsData';
import { ElementTile } from './ElementTile';
import { useAppStore } from '../../store/useAppStore';
import { ElementCategory, PhysicalState, ElementBlock, ElementData } from '../../types';
import { Filter, Sparkles, RotateCcw, Atom, ExternalLink } from 'lucide-react';

export const PeriodicGrid: React.FC = () => {
  const {
    searchQuery,
    categoryFilter,
    setCategoryFilter,
    stateFilter,
    setStateFilter,
    blockFilter,
    setBlockFilter,
    groupFilter,
    setGroupFilter,
    periodFilter,
    setPeriodFilter,
    resetFilters,
    heatmapProperty,
    selectedElement,
    setSelectedElement,
    setViewMode,
  } = useAppStore();

  const [hoveredElement, setHoveredElement] = useState<ElementData | null>(null);
  const previewElement = hoveredElement || selectedElement || ELEMENTS[5]; // Default to Carbon (Z=6)

  const handleTileHover = useCallback((el: ElementData | null) => {
    if (el) setHoveredElement(el);
  }, []);

  // Filter elements by Search & Selected Category / State / Block / Group / Period
  const filteredElements = useMemo(() => {
    return ELEMENTS.filter((el) => {
      if (categoryFilter !== 'all' && el.category !== categoryFilter) return false;
      if (stateFilter !== 'all' && el.state !== stateFilter) return false;
      if (blockFilter !== 'all' && el.block !== blockFilter) return false;
      if (groupFilter !== 'all' && el.group !== groupFilter) return false;
      if (periodFilter !== 'all' && el.period !== periodFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      if (el.symbol.toLowerCase() === q) return true;
      if (String(el.atomicNumber) === q) return true;
      if (el.name.toLowerCase().includes(q)) return true;
      if (el.category.toLowerCase().includes(q) || CATEGORY_LABELS[el.category]?.toLowerCase().includes(q)) return true;
      if (el.state.toLowerCase() === q) return true;
      if (q === `${el.block}-block` || q === `${el.block} block` || q === el.block) return true;
      if (q === `group ${el.group}` || q === `g${el.group}`) return true;
      if (q === `period ${el.period}` || q === `p${el.period}`) return true;
      if (el.discoverer.toLowerCase().includes(q)) return true;
      if (el.uses.some((u) => u.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [searchQuery, categoryFilter, stateFilter, blockFilter, groupFilter, periodFilter]);

  const activeFiltersCount = [
    categoryFilter !== 'all',
    stateFilter !== 'all',
    blockFilter !== 'all',
    groupFilter !== 'all',
    periodFilter !== 'all',
    Boolean(searchQuery.trim()),
  ].filter(Boolean).length;

  // Compute Heatmap min/max for active heatmap property
  const { minVal, maxVal } = useMemo(() => {
    if (heatmapProperty === 'none') return { minVal: 0, maxVal: 100 };
    let min = Infinity;
    let max = -Infinity;
    ELEMENTS.forEach((el) => {
      const v = el[heatmapProperty as keyof ElementData] as number | null;
      if (v !== null && typeof v === 'number') {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });
    return { minVal: min === Infinity ? 0 : min, maxVal: max === -Infinity ? 100 : max };
  }, [heatmapProperty]);

  // Group elements for grid layout: Periods 1-7 (excluding Lanthanides 57-71 & Actinides 89-103)
  const mainGridMap = useMemo(() => {
    const map: Record<string, ElementData> = {};
    ELEMENTS.forEach((el) => {
      if ((el.atomicNumber >= 57 && el.atomicNumber <= 71) || (el.atomicNumber >= 89 && el.atomicNumber <= 103)) {
        return;
      }
      map[`${el.period}-${el.group}`] = el;
    });
    return map;
  }, []);

  const lanthanides = useMemo(
    () => ELEMENTS.filter((el) => el.atomicNumber >= 57 && el.atomicNumber <= 71),
    []
  );

  const actinides = useMemo(
    () => ELEMENTS.filter((el) => el.atomicNumber >= 89 && el.atomicNumber <= 103),
    []
  );

  const categoriesList: (ElementCategory | 'all')[] = [
    'all',
    'reactive-nonmetal',
    'noble-gas',
    'alkali-metal',
    'alkaline-earth',
    'metalloid',
    'post-transition-metal',
    'transition-metal',
    'lanthanide',
    'actinide',
  ];

  const statesList: (PhysicalState | 'all')[] = ['all', 'solid', 'liquid', 'gas', 'synthetic'];
  const blocksList: (ElementBlock | 'all')[] = ['all', 's', 'p', 'd', 'f'];

  return (
    <div className="space-y-4 pb-10">
      {/* Top Grid Control Bar & Desktop Live Telemetry Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Filter Controls Card (8 cols on XL PC) */}
        <div className="xl:col-span-8 glass-panel p-4 rounded-2xl shadow-xl flex flex-col justify-between space-y-3 border border-white/10">
          {/* Main Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2.5 border-b border-white/10">
            <span className="text-[11px] font-black text-slate-400 flex items-center gap-1 mr-1.5 shrink-0 tracking-wider uppercase">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Category:
            </span>
            {categoriesList.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all border cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All (118)' : CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>

          {/* Secondary Filters Row: State, Block, Group, Period, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <div className="flex flex-wrap items-center gap-3">
              {/* Physical State Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold text-[11px] uppercase">State:</span>
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  {statesList.map((st) => {
                    const active = stateFilter === st;
                    return (
                      <button
                        key={st}
                        onClick={() => setStateFilter(st)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Block Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold text-[11px] uppercase">Block:</span>
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  {blocksList.map((blk) => {
                    const active = blockFilter === blk;
                    return (
                      <button
                        key={blk}
                        onClick={() => setBlockFilter(blk)}
                        className={`px-2.5 py-1 rounded-lg font-mono uppercase font-bold text-[11px] transition-all cursor-pointer ${
                          active
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {blk}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold text-[11px] uppercase">Group:</span>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All (1-18)</option>
                  {Array.from({ length: 18 }, (_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-slate-900 text-white">
                      Group {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold text-[11px] uppercase">Period:</span>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All (1-7)</option>
                  {Array.from({ length: 7 }, (_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-slate-900 text-white">
                      Period {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Counter & Reset Button */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 text-xs">
                  {filteredElements.length} / 118
                </span>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold transition-all border border-rose-500/30 cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Live Element Quick-Telemetry Card (4 cols on XL PC) */}
        <div className="xl:col-span-4 glass-panel p-4 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              onClick={() => setSelectedElement(previewElement)}
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border border-white/25 shadow-lg shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                CATEGORY_COLORS[previewElement.category]?.bg || 'bg-slate-800'
              }`}
            >
              <span className="text-[10px] font-mono font-bold text-white/80 leading-none">
                {previewElement.atomicNumber}
              </span>
              <span className="text-2xl font-black text-white leading-tight">
                {previewElement.symbol}
              </span>
              <span className="text-[9px] font-mono text-white/75 leading-none">
                {previewElement.atomicMass.toFixed(2)}
              </span>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white truncate">{previewElement.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-300 text-[10px] font-mono font-bold uppercase shrink-0">
                  {previewElement.block}-block
                </span>
              </div>
              <div className="text-xs font-mono text-emerald-300 truncate">
                {previewElement.electronConfiguration}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-300 font-mono">
                <span>EN: <strong>{previewElement.electronegativity ?? 'N/A'}</strong></span>
                <span>•</span>
                <span>State: <strong className="capitalize text-cyan-300">{previewElement.state}</strong></span>
                <span>•</span>
                <span>G{previewElement.group}/P{previewElement.period}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedElement(previewElement)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3 h-3" /> Details
            </button>
            <button
              onClick={() => {
                setSelectedElement(previewElement);
                setViewMode('3d-atom');
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Atom className="w-3 h-3" /> 3D Atom
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Spectrum Legend (Visible if Heatmap Property Selected) */}
      {heatmapProperty !== 'none' && (
        <div className="flex items-center justify-between gap-4 glass-panel p-3.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span className="font-extrabold text-white capitalize tracking-wide text-xs sm:text-sm">
              {heatmapProperty.replace(/([A-Z])/g, ' $1')} Spectrum
            </span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className="font-mono text-cyan-300 font-bold text-xs">{minVal.toFixed(1)}</span>
            <div className="h-3.5 flex-1 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-amber-400 to-rose-600 shadow-inner border border-white/10" />
            <span className="font-mono text-rose-400 font-bold text-xs">{maxVal.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Main 18-Column Periodic Table Grid — Fluid Widescreen PC Layout */}
      <div className="overflow-x-auto lg:overflow-x-visible pb-2 custom-scrollbar w-full">
        <div className="w-full min-w-[980px] lg:min-w-0 grid grid-cols-[28px_repeat(18,minmax(0,1fr))] xl:grid-cols-[34px_repeat(18,minmax(0,1fr))] gap-1 sm:gap-1.5 xl:gap-2">
          {/* Top Left Period/Group Header Label */}
          <div className="flex items-center justify-center text-[10px] font-mono text-slate-500 font-bold">
            P\G
          </div>

          {/* Group Column Header Numbers (1 to 18) */}
          {Array.from({ length: 18 }, (_, i) => {
            const gNum = i + 1;
            const activeGroup = groupFilter === gNum;
            return (
              <button
                key={`group-num-${gNum}`}
                onClick={() => setGroupFilter(activeGroup ? 'all' : gNum)}
                title={`Filter by Group ${gNum}`}
                className={`text-center text-[10px] xl:text-xs font-mono font-bold py-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  activeGroup
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60'
                }`}
              >
                {gNum}
              </button>
            );
          })}

          {/* Periods 1 to 7 */}
          {Array.from({ length: 7 }, (_, pIndex) => {
            const periodNum = pIndex + 1;
            const activePeriod = periodFilter === periodNum;
            return (
              <React.Fragment key={`period-row-${periodNum}`}>
                {/* Period Number Label on Left (Clickable filter) */}
                <button
                  onClick={() => setPeriodFilter(activePeriod ? 'all' : periodNum)}
                  className={`flex items-center justify-center font-mono text-xs font-extrabold rounded-xl h-full min-h-[60px] lg:min-h-[68px] xl:min-h-[76px] 2xl:min-h-[82px] border transition-colors cursor-pointer ${
                    activePeriod
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'text-cyan-400 bg-slate-900/70 border-slate-800/80 hover:bg-slate-800'
                  }`}
                  title={`Filter by Period ${periodNum}`}
                >
                  {periodNum}
                </button>

                {Array.from({ length: 18 }, (_, gIndex) => {
                  const groupNum = gIndex + 1;
                  const element = mainGridMap[`${periodNum}-${groupNum}`];

                  // Period 6 La placeholder tile
                  if (periodNum === 6 && groupNum === 3) {
                    return (
                      <button
                        key="la-placeholder"
                        onClick={() => setCategoryFilter(categoryFilter === 'lanthanide' ? 'all' : 'lanthanide')}
                        className="flex flex-col items-center justify-center p-1 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-center h-full min-h-[60px] lg:min-h-[68px] xl:min-h-[76px] 2xl:min-h-[82px] shadow-sm select-none cursor-pointer transition-colors"
                      >
                        <span className="text-[9px] xl:text-[10px] font-mono font-bold text-indigo-200">57-71</span>
                        <span className="text-[8.5px] font-semibold text-indigo-300">La-Lu</span>
                        <span className="text-[7px] text-indigo-400/80 leading-none hidden xl:block">Lanthanides</span>
                      </button>
                    );
                  }

                  // Period 7 Ac placeholder tile
                  if (periodNum === 7 && groupNum === 3) {
                    return (
                      <button
                        key="ac-placeholder"
                        onClick={() => setCategoryFilter(categoryFilter === 'actinide' ? 'all' : 'actinide')}
                        className="flex flex-col items-center justify-center p-1 rounded-xl bg-fuchsia-950/50 hover:bg-fuchsia-900/60 border border-fuchsia-500/40 text-fuchsia-300 text-center h-full min-h-[60px] lg:min-h-[68px] xl:min-h-[76px] 2xl:min-h-[82px] shadow-sm select-none cursor-pointer transition-colors"
                      >
                        <span className="text-[9px] xl:text-[10px] font-mono font-bold text-fuchsia-200">89-103</span>
                        <span className="text-[8.5px] font-semibold text-fuchsia-300">Ac-Lr</span>
                        <span className="text-[7px] text-fuchsia-400/80 leading-none hidden xl:block">Actinides</span>
                      </button>
                    );
                  }

                  if (!element) {
                    return (
                      <div
                        key={`empty-${periodNum}-${groupNum}`}
                        className="h-full min-h-[60px] lg:min-h-[68px] xl:min-h-[76px] 2xl:min-h-[82px]"
                      />
                    );
                  }

                  const isMatch = filteredElements.some((e) => e.atomicNumber === element.atomicNumber);

                  return (
                    <div
                      key={element.atomicNumber}
                      className={`h-full w-full transition-opacity ${
                        isMatch ? 'opacity-100' : 'opacity-20 grayscale'
                      }`}
                    >
                      <ElementTile
                        element={element}
                        heatmapProperty={heatmapProperty}
                        minHeatmapVal={minVal}
                        maxHeatmapVal={maxVal}
                        onHover={handleTileHover}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Lanthanides & Actinides Separated Rows (f-block) */}
        <div className="w-full min-w-[980px] lg:min-w-0 mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 xl:space-y-2">
          {/* Lanthanides Row */}
          <div className="grid grid-cols-[28px_repeat(18,minmax(0,1fr))] xl:grid-cols-[34px_repeat(18,minmax(0,1fr))] gap-1 sm:gap-1.5 xl:gap-2">
            <div className="col-start-1 col-span-3 text-right pr-2 flex items-center justify-end text-[10px] xl:text-[11px] font-bold text-indigo-400 uppercase tracking-wider select-none">
              57–71 Lanthanides
            </div>
            <div
              style={{ gridColumn: '4 / span 15', display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
              className="col-start-4 col-span-[15] grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:gap-1.5 xl:gap-2"
            >
              {lanthanides.map((el) => {
                const isMatch = filteredElements.some((e) => e.atomicNumber === el.atomicNumber);
                return (
                  <div
                    key={el.atomicNumber}
                    className={`h-full w-full transition-opacity ${
                      isMatch ? 'opacity-100' : 'opacity-20 grayscale'
                    }`}
                  >
                    <ElementTile
                      element={el}
                      heatmapProperty={heatmapProperty}
                      minHeatmapVal={minVal}
                      maxHeatmapVal={maxVal}
                      onHover={handleTileHover}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actinides Row */}
          <div className="grid grid-cols-[28px_repeat(18,minmax(0,1fr))] xl:grid-cols-[34px_repeat(18,minmax(0,1fr))] gap-1 sm:gap-1.5 xl:gap-2">
            <div className="col-start-1 col-span-3 text-right pr-2 flex items-center justify-end text-[10px] xl:text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider select-none">
              89–103 Actinides
            </div>
            <div
              style={{ gridColumn: '4 / span 15', display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
              className="col-start-4 col-span-[15] grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:gap-1.5 xl:gap-2"
            >
              {actinides.map((el) => {
                const isMatch = filteredElements.some((e) => e.atomicNumber === el.atomicNumber);
                return (
                  <div
                    key={el.atomicNumber}
                    className={`h-full w-full transition-opacity ${
                      isMatch ? 'opacity-100' : 'opacity-20 grayscale'
                    }`}
                  >
                    <ElementTile
                      element={el}
                      heatmapProperty={heatmapProperty}
                      minHeatmapVal={minVal}
                      maxHeatmapVal={maxVal}
                      onHover={handleTileHover}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Category Color Legend Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 pt-3 border-t border-slate-800/80">
        {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
          const style = CATEGORY_COLORS[catKey as ElementCategory];
          if (!style) return null;
          return (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey === categoryFilter ? 'all' : (catKey as ElementCategory))}
              className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] text-left transition-all cursor-pointer ${style.bg} ${
                categoryFilter === catKey ? 'ring-2 ring-cyan-400 font-bold' : 'hover:opacity-90 border-white/10'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full border shrink-0 ${style.border}`} />
              <span className="truncate font-semibold text-white">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

