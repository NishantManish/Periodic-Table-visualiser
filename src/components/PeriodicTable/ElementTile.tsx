import React from 'react';
import { ElementData, HeatmapProperty } from '../../types';
import { CATEGORY_COLORS } from '../../data/elementsData';
import { useAppStore } from '../../store/useAppStore';
import { Bookmark } from 'lucide-react';

interface ElementTileProps {
  element: ElementData;
  heatmapProperty?: HeatmapProperty;
  minHeatmapVal?: number;
  maxHeatmapVal?: number;
}

export const ElementTile: React.FC<ElementTileProps> = ({
  element,
  heatmapProperty = 'none',
  minHeatmapVal = 0,
  maxHeatmapVal = 100,
}) => {
  const { setSelectedElement, selectedElement, bookmarks } = useAppStore();
  const isSelected = selectedElement?.atomicNumber === element.atomicNumber;
  const isBookmarked = bookmarks.includes(element.atomicNumber);

  // Compute category styles
  const categoryStyle = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown;

  // Compute heatmap value if enabled
  let heatmapColorStyle: React.CSSProperties = {};
  let heatmapValDisplay: string | null = null;

  if (heatmapProperty !== 'none') {
    const rawVal = element[heatmapProperty as keyof ElementData] as number | null;
    if (rawVal !== null && rawVal !== undefined) {
      const norm = Math.max(0, Math.min(1, (rawVal - minHeatmapVal) / (maxHeatmapVal - minHeatmapVal || 1)));
      // Interpolate from deep indigo (low) to cyan (mid) to bright orange/red (high)
      const hue = (1 - norm) * 240; // 240 (blue) down to 0 (red)
      heatmapColorStyle = {
        backgroundColor: `hsla(${hue}, 85%, 35%, 0.4)`,
        borderColor: `hsla(${hue}, 90%, 55%, 0.8)`,
      };
      heatmapValDisplay = String(rawVal);
    } else {
      heatmapColorStyle = {
        backgroundColor: 'rgba(51, 65, 85, 0.2)',
        borderColor: 'rgba(71, 85, 105, 0.3)',
      };
      heatmapValDisplay = 'N/A';
    }
  }

  return (
    <button
      onClick={() => setSelectedElement(element)}
      style={heatmapProperty !== 'none' ? heatmapColorStyle : {}}
      aria-label={`Element ${element.atomicNumber}: ${element.name} (${element.symbol}), ${element.category.replace('-', ' ')}, state ${element.state}, atomic mass ${element.atomicMass.toFixed(2)}`}
      className={`group relative flex flex-col justify-between p-1.5 sm:p-2 rounded-xl transition-all duration-200 cursor-pointer text-left select-none border min-h-[64px] sm:min-h-[72px] md:min-h-[78px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:z-40 ${
        heatmapProperty === 'none'
          ? `${categoryStyle.bg} hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 active:scale-95`
          : 'hover:scale-105 hover:z-20 shadow-md active:scale-95'
      } ${
        isSelected
          ? 'ring-2 ring-cyan-400 border-cyan-400 scale-[1.05] z-30 shadow-xl shadow-cyan-500/30'
          : 'border-slate-800/80 dark:border-slate-800/80'
      }`}
    >
      {/* Top Header: Atomic Number & State Indicator */}
      <div className="flex items-center justify-between w-full text-[10px] sm:text-xs font-mono font-semibold opacity-90">
        <span className="text-slate-300 dark:text-slate-300 font-bold">{element.atomicNumber}</span>
        <div className="flex items-center gap-1">
          {isBookmarked && <Bookmark className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              element.state === 'gas'
                ? 'bg-sky-400 animate-pulse'
                : element.state === 'liquid'
                ? 'bg-blue-400'
                : element.state === 'synthetic'
                ? 'bg-purple-400'
                : 'bg-emerald-400'
            }`}
            title={`State: ${element.state}`}
          />
        </div>
      </div>

      {/* Main Symbol */}
      <div className="my-0.5 text-center">
        <span className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-100 dark:text-slate-100 group-hover:text-cyan-300 transition-colors">
          {element.symbol}
        </span>
      </div>

      {/* Bottom Name & Atomic Mass or Heatmap Value */}
      <div className="w-full text-[9px] sm:text-[10px] leading-tight overflow-hidden">
        {heatmapProperty !== 'none' ? (
          <div className="text-center font-mono font-bold text-cyan-300 truncate">
            {heatmapValDisplay}
          </div>
        ) : (
          <>
            <div className="font-semibold text-slate-200 dark:text-slate-200 truncate group-hover:text-white">
              {element.name}
            </div>
            <div className="text-slate-400 dark:text-slate-400 font-mono text-[8px] sm:text-[9px] truncate">
              {element.atomicMass.toFixed(2)}
            </div>
          </>
        )}
      </div>

      {/* Subtle Glow Effect on Hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none" />
    </button>
  );
};
