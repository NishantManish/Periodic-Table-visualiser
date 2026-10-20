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
  onHover?: (element: ElementData | null) => void;
}

export const ElementTile: React.FC<ElementTileProps> = React.memo(({
  element,
  heatmapProperty = 'none',
  minHeatmapVal = 0,
  maxHeatmapVal = 100,
  onHover,
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
      const hue = (1 - norm) * 240; // 240 (blue) down to 0 (red)
      heatmapColorStyle = {
        backgroundColor: `hsla(${hue}, 85%, 35%, 0.55)`,
        borderColor: `hsla(${hue}, 90%, 60%, 0.85)`,
      };
      heatmapValDisplay = String(rawVal);
    } else {
      heatmapColorStyle = {
        backgroundColor: 'rgba(30, 41, 59, 0.45)',
        borderColor: 'rgba(71, 85, 105, 0.4)',
      };
      heatmapValDisplay = 'N/A';
    }
  }

  return (
    <button
      onClick={() => setSelectedElement(element)}
      onMouseEnter={() => onHover?.(element)}
      style={heatmapProperty !== 'none' ? heatmapColorStyle : {}}
      aria-label={`Element ${element.atomicNumber}: ${element.name} (${element.symbol}), ${element.category.replace('-', ' ')}, state ${element.state}, atomic mass ${element.atomicMass.toFixed(2)}`}
      className={`group relative flex flex-col justify-between w-full h-full min-h-[60px] lg:min-h-[68px] xl:min-h-[76px] 2xl:min-h-[82px] p-1 sm:p-1.5 xl:p-2 rounded-xl border transition-all duration-200 cursor-pointer text-left select-none focus:outline-none focus:ring-2 focus:ring-cyan-300 shadow-sm ${
        heatmapProperty === 'none'
          ? `${categoryStyle.bg} hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:-translate-y-0.5 hover:z-20 active:scale-95`
          : 'hover:-translate-y-0.5 hover:z-20 shadow-md hover:border-white/60 active:scale-95'
      } ${
        isSelected
          ? 'ring-2 ring-cyan-300 border-cyan-300 -translate-y-0.5 z-30 shadow-xl shadow-cyan-500/40 bg-white/10 backdrop-blur-md'
          : 'border-white/15 backdrop-blur-sm'
      }`}
    >
      {/* Top Header: Atomic Number & State Indicator */}
      <div className="flex items-center justify-between w-full text-[9px] xl:text-[10px] font-mono font-bold leading-none opacity-90">
        <span className="text-white/85">{element.atomicNumber}</span>
        <div className="flex items-center gap-0.5">
          {isBookmarked && <Bookmark className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              element.state === 'gas'
                ? 'bg-sky-300'
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
      <div className="my-0.5 text-center flex items-center justify-center relative">
        <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-black tracking-tight text-white group-hover:text-cyan-200 transition-colors leading-none">
          {element.symbol}
        </span>
      </div>

      {/* Bottom Name & Atomic Mass or Heatmap Value */}
      <div className="w-full text-center overflow-hidden">
        {heatmapProperty !== 'none' ? (
          <div className="font-mono font-bold text-cyan-200 text-[9px] xl:text-[10px] truncate leading-tight">
            {heatmapValDisplay}
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="font-bold text-white/95 text-[8px] lg:text-[8.5px] xl:text-[9.5px] truncate group-hover:text-white leading-tight">
              {element.name}
            </div>
            <div className="text-white/65 font-mono font-medium text-[7px] xl:text-[8px] truncate leading-none hidden sm:block">
              {element.atomicMass.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Subtle Glow Effect on Hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-cyan-400/15 to-transparent pointer-events-none" />
    </button>
  );
});

