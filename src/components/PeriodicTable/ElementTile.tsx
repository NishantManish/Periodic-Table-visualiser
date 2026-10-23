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
  const { setSelectedElement, selectedElement, bookmarks, theme } = useAppStore();
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
      const hue = (1 - norm) * 230; // 230 (cobalt blue) down to 0 (crimson)
      if (theme === 'dark') {
        heatmapColorStyle = {
          backgroundColor: `hsla(${hue}, 82%, 34%, 0.62)`,
          borderColor: `hsla(${hue}, 88%, 58%, 0.85)`,
        };
      } else {
        heatmapColorStyle = {
          backgroundColor: `hsla(${hue}, 85%, 86%, 0.92)`,
          borderColor: `hsla(${hue}, 78%, 45%, 0.75)`,
        };
      }
      heatmapValDisplay = String(rawVal);
    } else {
      heatmapColorStyle =
        theme === 'dark'
          ? {
              backgroundColor: 'rgba(30, 41, 59, 0.45)',
              borderColor: 'rgba(71, 85, 105, 0.4)',
            }
          : {
              backgroundColor: 'rgba(241, 245, 249, 0.9)',
              borderColor: 'rgba(203, 213, 225, 0.9)',
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
      className={`group relative flex flex-col justify-between w-full h-full min-h-[60px] lg:min-h-[68px] xl:min-h-[76px] 2xl:min-h-[82px] p-1 sm:p-1.5 xl:p-2 rounded-xl border transition-all duration-150 cursor-pointer text-left select-none focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs ${
        heatmapProperty === 'none'
          ? `${categoryStyle.bg} hover:border-sky-500 dark:hover:border-cyan-400 hover:shadow-md hover:-translate-y-0.5 hover:z-20 active:scale-95`
          : 'hover:-translate-y-0.5 hover:z-20 shadow-sm hover:border-sky-500 active:scale-95'
      } ${
        isSelected
          ? 'ring-2 ring-sky-500 dark:ring-cyan-400 border-sky-500 dark:border-cyan-400 -translate-y-0.5 z-30 shadow-lg'
          : ''
      }`}
    >
      {/* Top Header: Atomic Number & State Indicator */}
      <div className="flex items-center justify-between w-full text-[9px] xl:text-[10px] font-mono tabular-nums font-bold leading-none">
        <span className="text-slate-700 dark:text-slate-200">{element.atomicNumber}</span>
        <div className="flex items-center gap-0.5">
          {isBookmarked && <Bookmark className="w-2.5 h-2.5 text-amber-500 dark:text-amber-300 fill-amber-500 dark:fill-amber-300" />}
          <span
            className="text-[8px] font-mono uppercase px-1 rounded bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200"
            title={`State: ${element.state}`}
          >
            {element.state === 'gas'
              ? 'G'
              : element.state === 'liquid'
              ? 'L'
              : element.state === 'synthetic'
              ? 'Syn'
              : 'S'}
          </span>
        </div>
      </div>

      {/* Main Symbol */}
      <div className="my-0.5 text-center flex items-center justify-center relative">
        <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-cyan-200 transition-colors leading-none">
          {element.symbol}
        </span>
      </div>

      {/* Bottom Name & Atomic Mass or Heatmap Value */}
      <div className="w-full text-center overflow-hidden">
        {heatmapProperty !== 'none' ? (
          <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-cyan-200 text-[9px] xl:text-[10px] truncate leading-tight">
            {heatmapValDisplay}
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-[8px] lg:text-[8.5px] xl:text-[9.5px] truncate leading-tight">
              {element.name}
            </div>
            <div className="text-slate-600 dark:text-slate-300/80 font-mono tabular-nums font-medium text-[7px] xl:text-[8px] truncate leading-none hidden sm:block">
              {element.atomicMass.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </button>
  );
});
