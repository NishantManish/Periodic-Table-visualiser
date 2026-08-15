import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ELEMENTS, CATEGORY_LABELS, CATEGORY_COLORS } from '../../data/elementsData';
import { ElementTile } from './ElementTile';
import { useAppStore } from '../../store/useAppStore';
import { ElementCategory, PhysicalState, ElementBlock, ElementData } from '../../types';
import { Filter, Sparkles, Search, RotateCcw, X, Layers } from 'lucide-react';

export const PeriodicGrid: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
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
  } = useAppStore();

  // Filter elements by Search & Selected Category / State / Block / Group / Period
  const filteredElements = useMemo(() => {
    return ELEMENTS.filter((el) => {
      // Category check
      if (categoryFilter !== 'all' && el.category !== categoryFilter) return false;

      // State check
      if (stateFilter !== 'all' && el.state !== stateFilter) return false;

      // Block check
      if (blockFilter !== 'all' && el.block !== blockFilter) return false;

      // Group check
      if (groupFilter !== 'all' && el.group !== groupFilter) return false;

      // Period check
      if (periodFilter !== 'all' && el.period !== periodFilter) return false;

      // Powerful Search query check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      // Check symbol match
      if (el.symbol.toLowerCase() === q) return true;

      // Check exact atomic number
      if (String(el.atomicNumber) === q) return true;

      // Check name match
      if (el.name.toLowerCase().includes(q)) return true;

      // Check category match
      if (el.category.toLowerCase().includes(q) || CATEGORY_LABELS[el.category]?.toLowerCase().includes(q)) return true;

      // Check state match
      if (el.state.toLowerCase() === q) return true;

      // Check block match (e.g., "d-block", "s block", "p")
      if (q === `${el.block}-block` || q === `${el.block} block` || q === el.block) return true;

      // Check group or period (e.g., "group 17", "period 3")
      if (q === `group ${el.group}` || q === `g${el.group}`) return true;
      if (q === `period ${el.period}` || q === `p${el.period}`) return true;

      // Check discoverer & uses
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
        return; // Lanthanides and Actinides are rendered in separated rows
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
    <div className="space-y-6 pb-12">
      
      {/* Category & Multi-Property Filter Toolbar */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-xl">
        
        {/* Main Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 border-b border-slate-800/60">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Category:
          </span>
          {categoriesList.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-all border cursor-pointer ${
                  active
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Categories' : CATEGORY_LABELS[cat]}
              </motion.button>
            );
          })}
        </div>

        {/* Secondary Filters Row: State, Block, Group, Period, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Physical State Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">State:</span>
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                {statesList.map((st) => {
                  const active = stateFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStateFilter(st)}
                      className={`px-2.5 py-0.5 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                        active ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
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
              <span className="text-slate-400 font-bold">Block:</span>
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                {blocksList.map((blk) => {
                  const active = blockFilter === blk;
                  return (
                    <button
                      key={blk}
                      onClick={() => setBlockFilter(blk)}
                      className={`px-2.5 py-0.5 rounded-lg font-mono uppercase font-medium transition-all cursor-pointer ${
                        active ? 'bg-purple-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
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
              <span className="text-slate-400 font-bold">Group:</span>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="all">All Groups (1-18)</option>
                {Array.from({ length: 18 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Group {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Period:</span>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="all">All Periods (1-7)</option>
                {Array.from({ length: 7 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Period {i + 1}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Active Filters Counter & Reset Button */}
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[11px]">
                {filteredElements.length} / 118 Elements
              </span>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            </motion.div>
          )}

        </div>

      </div>

      {/* Heatmap Spectrum Legend (Visible if Heatmap Property Selected) */}
      {heatmapProperty !== 'none' && (
        <div className="flex items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200 capitalize">
              {heatmapProperty.replace(/([A-Z])/g, ' $1')} Heatmap Spectrum:
            </span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className="font-mono text-cyan-400 font-bold">{minVal.toFixed(1)}</span>
            <div className="h-3 flex-1 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-amber-400 to-rose-600 shadow-inner" />
            <span className="font-mono text-rose-400 font-bold">{maxVal.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Main 18-Column Periodic Table Grid */}
      <div className="overflow-x-auto pb-4 custom-scrollbar w-full">
        <div className="w-[1200px] lg:w-full min-w-[1200px] grid grid-cols-[30px_repeat(18,minmax(0,1fr))] gap-1.5 sm:gap-2 items-center">
          
          {/* Top Left Period/Group Header Label */}
          <div className="text-center text-[10px] font-mono text-slate-500 font-bold">
            P\G
          </div>

          {/* Group Column Header Numbers (1 to 18) */}
          {Array.from({ length: 18 }, (_, i) => (
            <div key={`group-num-${i + 1}`} className="text-center text-[10px] sm:text-xs font-mono text-slate-400 font-bold pb-1">
              {i + 1}
            </div>
          ))}

          {/* Periods 1 to 7 */}
          {Array.from({ length: 7 }, (_, pIndex) => {
            const periodNum = pIndex + 1;
            return (
              <React.Fragment key={`period-row-${periodNum}`}>
                {/* Period Number Label on Left */}
                <div className="flex items-center justify-center font-mono text-xs font-extrabold text-cyan-400/80 bg-slate-900/60 rounded-lg h-8 border border-slate-800/60" title={`Period ${periodNum}`}>
                  {periodNum}
                </div>

                {Array.from({ length: 18 }, (_, gIndex) => {
                  const groupNum = gIndex + 1;
                  const element = mainGridMap[`${periodNum}-${groupNum}`];

                  // Period 6 La placeholder tile
                  if (periodNum === 6 && groupNum === 3) {
                    return (
                      <div
                        key="la-placeholder"
                        className="flex flex-col items-center justify-center p-1 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold text-center h-full min-h-[64px] sm:min-h-[72px]"
                      >
                        <span>57-71</span>
                        <span className="text-[8px] font-normal">La-Lu</span>
                      </div>
                    );
                  }

                  // Period 7 Ac placeholder tile
                  if (periodNum === 7 && groupNum === 3) {
                    return (
                      <div
                        key="ac-placeholder"
                        className="flex flex-col items-center justify-center p-1 rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-bold text-center h-full min-h-[64px] sm:min-h-[72px]"
                      >
                        <span>89-103</span>
                        <span className="text-[8px] font-normal">Ac-Lr</span>
                      </div>
                    );
                  }

                  if (!element) {
                    return <div key={`empty-${periodNum}-${groupNum}`} className="min-h-[64px] sm:min-h-[72px]" />;
                  }

                  const isMatch = filteredElements.some((e) => e.atomicNumber === element.atomicNumber);

                  return (
                    <div key={element.atomicNumber} className={isMatch ? 'opacity-100 scale-100' : 'opacity-25 grayscale scale-95 transition-all'}>
                      <ElementTile
                        element={element}
                        heatmapProperty={heatmapProperty}
                        minHeatmapVal={minVal}
                        maxHeatmapVal={maxVal}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Lanthanides & Actinides Separated Rows */}
        <div className="w-[1200px] lg:w-full min-w-[1200px] mt-8 pt-4 border-t border-slate-800/80 space-y-2">
          
          {/* Lanthanides Row */}
          <div className="grid grid-cols-[30px_repeat(18,minmax(0,1fr))] gap-1.5 sm:gap-2 items-center">
            <div className="col-start-1 col-span-3 text-right pr-2 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              Lanthanides
            </div>
            <div className="col-start-4 col-span-15 grid grid-cols-15 gap-1.5 sm:gap-2">
              {lanthanides.map((el) => {
                const isMatch = filteredElements.some((e) => e.atomicNumber === el.atomicNumber);
                return (
                  <div key={el.atomicNumber} className={isMatch ? 'opacity-100' : 'opacity-25 grayscale'}>
                    <ElementTile
                      element={el}
                      heatmapProperty={heatmapProperty}
                      minHeatmapVal={minVal}
                      maxHeatmapVal={maxVal}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actinides Row */}
          <div className="grid grid-cols-[30px_repeat(18,minmax(0,1fr))] gap-1.5 sm:gap-2 items-center mt-2">
            <div className="col-start-1 col-span-3 text-right pr-2 text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">
              Actinides
            </div>
            <div className="col-start-4 col-span-15 grid grid-cols-15 gap-1.5 sm:gap-2">
              {actinides.map((el) => {
                const isMatch = filteredElements.some((e) => e.atomicNumber === el.atomicNumber);
                return (
                  <div key={el.atomicNumber} className={isMatch ? 'opacity-100' : 'opacity-25 grayscale'}>
                    <ElementTile
                      element={el}
                      heatmapProperty={heatmapProperty}
                      minHeatmapVal={minVal}
                      maxHeatmapVal={maxVal}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Category Color Legend Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-4 border-t border-slate-800/80">
        {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
          const style = CATEGORY_COLORS[catKey as ElementCategory];
          if (!style) return null;
          return (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey === categoryFilter ? 'all' : (catKey as ElementCategory))}
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition-all ${style.bg} ${
                categoryFilter === catKey ? 'ring-2 ring-cyan-400 font-bold' : 'hover:opacity-90'
              }`}
            >
              <div className={`w-3 h-3 rounded-full border ${style.border}`} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
};
