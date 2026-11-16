import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ElementData } from '../../types';
import { useAppStore } from '../../store/useAppStore';

import {
  ISOTOPE_COLORS,
  RADIOISOTOPE_DECAY_DATA,
  VERIFIED_ISOTOPE_TABLE,
} from '../../data/isotopesData';

interface IsotopeData {
  isotope: string;
  abundance: number;
  color: string;
  halfLife?: string;
  decayMode?: string;
  note?: string;
}

function getVerifiedIsotopes(element: ElementData): IsotopeData[] {
  const realEntries = VERIFIED_ISOTOPE_TABLE[element.atomicNumber];
  const decayMeta = RADIOISOTOPE_DECAY_DATA[element.atomicNumber];

  if (realEntries) {
    return realEntries.map(([mass, abundance], idx) => ({
      isotope: `${element.symbol}-${mass}`,
      abundance,
      color: ISOTOPE_COLORS[idx % ISOTOPE_COLORS.length],
      halfLife: decayMeta && decayMeta.mass === mass ? decayMeta.halfLife : undefined,
      decayMode: decayMeta && decayMeta.mass === mass ? decayMeta.decayMode : undefined,
      note: decayMeta?.note,
    }));
  }

  const longestMass = decayMeta ? decayMeta.mass : Math.round(element.atomicMass);
  return [
    {
      isotope: `${element.symbol}-${longestMass}`,
      abundance: 100,
      color: '#f43f5e',
      halfLife: decayMeta?.halfLife || 'Short-lived',
      decayMode: decayMeta?.decayMode || 'α / SF',
      note: decayMeta?.note || 'Longest-lived reference radioisotope (100% radioactive)',
    },
  ];
}

export const AbundanceChart: React.FC<{ element: ElementData }> = ({ element }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useAppStore();
  const [tooltipData, setTooltipData] = useState<{ isotope: string; abundance: number; x: number; y: number } | null>(null);

  const isotopes = getVerifiedIsotopes(element);
  const decayMeta = RADIOISOTOPE_DECAY_DATA[element.atomicNumber];
  const isExclusivelyRadioactive = !VERIFIED_ISOTOPE_TABLE[element.atomicNumber];

  useEffect(() => {
    if (!svgRef.current) return;
    
    const data = isotopes;
    const isLight = theme === 'light';
    const axisLabelColor = isLight ? '#0f172a' : '#e2e8f0';
    const yTickColor = isLight ? '#334155' : '#94a3b8';
    const gridStrokeColor = isLight ? '#cbd5e1' : '#1e293b';
    const tickLineColor = isLight ? '#94a3b8' : '#334155';
    
    const margin = { top: 25, right: 30, bottom: 45, left: 55 };
    const svgWidth = Math.max(380, data.length * 90);
    const svgHeight = 240;
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous
    
    svg
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    const x = d3.scaleBand()
      .domain(data.map(d => d.isotope))
      .range([0, width])
      .padding(0.35);
      
    const y = d3.scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height, 0]);
      
    // Add X axis
    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", axisLabelColor)
      .attr("font-family", "monospace")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");
      
    // Add Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text")
      .attr("fill", yTickColor)
      .attr("font-family", "monospace")
      .attr("font-size", "11px");
      
    // Remove domain axis lines but keep ticks
    chart.selectAll(".domain").remove();
    chart.selectAll(".tick line").attr("stroke", tickLineColor);
    
    // Add grid lines
    chart.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => "")
      )
      .selectAll(".tick line")
      .attr("stroke", gridStrokeColor)
      .attr("stroke-dasharray", "3,3");
      
    // Bars
    chart.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar cursor-pointer")
      .attr("x", d => x(d.isotope) || 0)
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", d => d.color)
      .attr("rx", 6) // Rounded corners on top
      .on("mouseenter", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.8);
        const rect = event.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setTooltipData({
            isotope: d.isotope,
            abundance: d.abundance,
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top - 10,
          });
        }
      })
      .on("mouseleave", (event) => {
        d3.select(event.currentTarget).attr("opacity", 1);
        setTooltipData(null);
      })
      .transition()
      .duration(600)
      .delay((_d, i) => i * 80)
      .attr("y", d => y(d.abundance))
      .attr("height", d => height - y(d.abundance));

  }, [element, theme]);

  return (
    <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-lg">
      {/* Legend Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <span className="text-slate-400 font-semibold">Isotope Distribution Legend:</span>
        <div className="flex flex-wrap items-center gap-3">
          {isotopes.map((iso) => (
            <div key={iso.isotope} className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <div className="w-3 h-3 rounded-md shadow-sm" style={{ backgroundColor: iso.color }} />
              <span className="font-mono font-bold text-slate-200">{iso.isotope}</span>
              <span className="font-mono text-cyan-400">({iso.abundance}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontally Scrollable Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 rounded-xl bg-slate-950/90 p-2 border border-slate-800/80 flex justify-start sm:justify-center">
        <svg ref={svgRef} className="shrink-0 min-w-[360px]"></svg>

        {/* Hover Tooltip Overlay */}
        {tooltipData && (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-full pointer-events-none bg-slate-900/95 text-slate-100 text-xs px-3 py-1.5 rounded-xl border border-cyan-500/50 shadow-xl backdrop-blur-md flex flex-col items-center gap-0.5"
            style={{ left: `${tooltipData.x}px`, top: `${tooltipData.y}px` }}
          >
            <span className="font-mono font-bold text-cyan-300">{tooltipData.isotope}</span>
            <span className="text-slate-300 font-mono text-[11px]">
              {isExclusivelyRadioactive ? 'Reference Radioisotope' : `${tooltipData.abundance}% Natural Abundance`}
            </span>
            <div className="w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-cyan-500/50 -mb-2 mt-0.5" />
          </div>
        )}
      </div>

      {/* NuDat Radioisotope Half-Life & Primary Decay Mode Badges */}
      {decayMeta && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/30 font-mono font-bold">
              Nuclide: {element.symbol}-{decayMeta.mass}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30 font-mono font-bold">
              Half-Life (t₁/₂): {decayMeta.halfLife}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 font-mono font-bold">
              Decay Mode: {decayMeta.decayMode}
            </span>
          </div>
          {decayMeta.note && (
            <span className="text-slate-400 italic text-[11px]">{decayMeta.note}</span>
          )}
        </div>
      )}
    </div>
  );
};

