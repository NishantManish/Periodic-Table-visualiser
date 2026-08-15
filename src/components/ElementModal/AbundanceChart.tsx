import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ElementData } from '../../types';

interface IsotopeData {
  isotope: string;
  abundance: number;
  color: string;
}

const ISOTOPE_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#fbbf24', '#34d399'];

// Generate deterministic isotope data based on atomic mass
function generateMockIsotopes(element: ElementData): IsotopeData[] {
  const baseMass = Math.round(element.atomicMass);
  
  if (element.atomicNumber > 92 || element.state === 'synthetic' || !element.abundanceEarth) {
    return [{ isotope: `${element.symbol}-${baseMass}`, abundance: 100, color: ISOTOPE_COLORS[0] }];
  }

  const isotopes: IsotopeData[] = [];
  
  if (element.atomicNumber % 2 === 0) {
    const a1 = Number((70 + (element.atomicNumber % 15)).toFixed(2));
    const a2 = Number((10 + (element.atomicNumber % 8)).toFixed(2));
    const a3 = Number((100 - a1 - a2).toFixed(2));
    isotopes.push({ isotope: `${element.symbol}-${baseMass}`, abundance: a1, color: ISOTOPE_COLORS[0] });
    isotopes.push({ isotope: `${element.symbol}-${baseMass + 1}`, abundance: a2, color: ISOTOPE_COLORS[1] });
    isotopes.push({ isotope: `${element.symbol}-${baseMass + 2}`, abundance: a3, color: ISOTOPE_COLORS[2] });
  } else {
    const a1 = Number((90 + (element.atomicNumber % 8)).toFixed(2));
    const a2 = Number((100 - a1).toFixed(2));
    isotopes.push({ isotope: `${element.symbol}-${baseMass}`, abundance: a1, color: ISOTOPE_COLORS[0] });
    isotopes.push({ isotope: `${element.symbol}-${baseMass + 1}`, abundance: a2, color: ISOTOPE_COLORS[1] });
  }
  
  return isotopes.sort((a, b) => b.abundance - a.abundance);
}

export const AbundanceChart: React.FC<{ element: ElementData }> = ({ element }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<{ isotope: string; abundance: number; x: number; y: number } | null>(null);

  const isotopes = generateMockIsotopes(element);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const data = isotopes;
    
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
      .attr("fill", "#cbd5e1")
      .attr("font-family", "monospace")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");
      
    // Add Y axis
    chart.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-family", "monospace")
      .attr("font-size", "11px");
      
    // Remove domain axis lines but keep ticks
    chart.selectAll(".domain").remove();
    chart.selectAll(".tick line").attr("stroke", "#334155");
    
    // Add grid lines
    chart.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => "")
      )
      .selectAll(".tick line")
      .attr("stroke", "#1e293b")
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
      .delay((d, i) => i * 80)
      .attr("y", d => y(d.abundance))
      .attr("height", d => height - y(d.abundance));

  }, [element]);

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
            <span className="text-slate-300 font-mono text-[11px]">{tooltipData.abundance}% Abundance</span>
            <div className="w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-cyan-500/50 -mb-2 mt-0.5" />
          </div>
        )}
      </div>
    </div>
  );
};

