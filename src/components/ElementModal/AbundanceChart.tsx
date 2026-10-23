import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ElementData } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface IsotopeData {
  isotope: string;
  abundance: number;
  color: string;
  halfLife?: string;
  decayMode?: string;
  note?: string;
}

interface RadioisotopeMeta {
  mass: number;
  halfLife: string;
  decayMode: string;
  note?: string;
}

const ISOTOPE_COLORS = [
  '#0284c7',
  '#6366f1',
  '#9333ea',
  '#e11d48',
  '#d97706',
  '#059669',
  '#0d9488',
  '#2563eb',
  '#7c3aed',
  '#db2777',
];

// IUPAC / CIAAW / NuDat verified natural isotopic abundance table (atomicNumber -> [massNumber, abundance%][])
const VERIFIED_ISOTOPES: Record<number, [number, number][]> = {
  1: [[1, 99.9885], [2, 0.0115]],
  2: [[4, 99.99986], [3, 0.00014]],
  3: [[7, 92.41], [6, 7.59]],
  4: [[9, 100]],
  5: [[11, 80.1], [10, 19.9]],
  6: [[12, 98.93], [13, 1.07]],
  7: [[14, 99.636], [15, 0.364]],
  8: [[16, 99.757], [18, 0.205], [17, 0.038]],
  9: [[19, 100]],
  10: [[20, 90.48], [22, 9.25], [21, 0.27]],
  11: [[23, 100]],
  12: [[24, 78.99], [26, 11.01], [25, 10.00]],
  13: [[27, 100]],
  14: [[28, 92.223], [29, 4.685], [30, 3.092]],
  15: [[31, 100]],
  16: [[32, 94.99], [34, 4.25], [33, 0.75], [36, 0.01]],
  17: [[35, 75.76], [37, 24.24]],
  18: [[40, 99.604], [36, 0.334], [38, 0.063]],
  19: [[39, 93.258], [41, 6.730], [40, 0.012]],
  20: [[40, 96.941], [44, 2.086], [42, 0.647], [48, 0.187], [43, 0.135], [46, 0.004]],
  21: [[45, 100]],
  22: [[48, 73.72], [46, 8.25], [47, 7.44], [49, 5.41], [50, 5.18]],
  23: [[51, 99.75], [50, 0.25]],
  24: [[52, 83.789], [53, 9.501], [50, 4.345], [54, 2.365]],
  25: [[55, 100]],
  26: [[56, 91.754], [54, 5.845], [57, 2.119], [58, 0.282]],
  27: [[59, 100]],
  28: [[58, 68.077], [60, 26.223], [62, 3.635], [61, 1.140], [64, 0.926]],
  29: [[63, 69.15], [65, 30.85]],
  30: [[64, 49.17], [66, 27.73], [68, 18.45], [67, 4.04], [70, 0.61]],
  31: [[69, 60.108], [71, 39.892]],
  32: [[74, 36.28], [72, 27.54], [70, 20.84], [73, 7.73], [76, 7.61]],
  33: [[75, 100]],
  34: [[80, 49.61], [78, 23.77], [76, 9.37], [82, 8.73], [77, 7.63], [74, 0.89]],
  35: [[79, 50.69], [81, 49.31]],
  36: [[84, 56.99], [86, 17.28], [82, 11.59], [83, 11.50], [80, 2.29], [78, 0.36]],
  37: [[85, 72.17], [87, 27.83]],
  38: [[88, 82.58], [86, 9.86], [87, 7.00], [84, 0.56]],
  39: [[89, 100]],
  40: [[90, 51.45], [94, 17.38], [92, 17.15], [91, 11.22], [96, 2.80]],
  41: [[93, 100]],
  42: [[98, 24.29], [96, 16.67], [95, 15.87], [92, 14.65], [100, 9.74], [97, 9.58], [94, 9.19]],
  44: [[102, 31.55], [104, 18.62], [101, 17.06], [99, 12.76], [100, 12.60], [96, 5.54], [98, 1.87]],
  45: [[103, 100]],
  46: [[106, 27.33], [108, 26.46], [105, 22.33], [110, 11.72], [104, 11.14], [102, 1.02]],
  47: [[107, 51.839], [109, 48.161]],
  48: [[114, 28.73], [112, 24.13], [111, 12.80], [110, 12.49], [113, 12.22], [116, 7.49], [106, 1.25], [108, 0.89]],
  49: [[115, 95.71], [113, 4.29]],
  50: [[120, 32.58], [118, 24.22], [116, 14.54], [119, 8.59], [117, 7.68], [124, 5.79], [122, 4.63], [112, 0.97], [114, 0.66], [115, 0.34]],
  51: [[121, 57.21], [123, 42.79]],
  52: [[130, 34.08], [128, 31.74], [126, 18.84], [125, 7.07], [124, 4.74], [122, 2.55], [123, 0.89], [120, 0.09]],
  53: [[127, 100]],
  54: [[132, 26.91], [129, 26.40], [131, 21.23], [134, 10.44], [136, 8.86], [130, 4.07], [128, 1.91], [124, 0.095], [126, 0.089]],
  55: [[133, 100]],
  56: [[138, 71.70], [137, 11.23], [136, 7.85], [135, 6.59], [134, 2.42], [130, 0.106], [132, 0.101]],
  57: [[139, 99.911], [138, 0.089]],
  58: [[140, 88.45], [142, 11.11], [138, 0.25], [136, 0.19]],
  59: [[141, 100]],
  60: [[142, 27.15], [144, 23.80], [146, 17.19], [143, 12.17], [145, 8.29], [148, 5.76], [150, 5.64]],
  62: [[152, 26.75], [154, 22.75], [147, 14.99], [149, 13.82], [148, 11.24], [150, 7.38], [144, 3.07]],
  63: [[153, 52.19], [151, 47.81]],
  64: [[158, 24.84], [160, 21.86], [156, 20.47], [157, 15.65], [155, 14.80], [154, 2.18], [152, 0.20]],
  65: [[159, 100]],
  66: [[164, 28.26], [162, 25.48], [163, 24.90], [161, 18.89], [160, 2.33], [158, 0.095], [156, 0.056]],
  67: [[165, 100]],
  68: [[166, 33.50], [168, 26.98], [167, 22.87], [170, 14.91], [164, 1.60], [162, 0.139]],
  69: [[169, 100]],
  70: [[174, 31.90], [172, 21.83], [173, 16.10], [171, 14.22], [176, 12.89], [170, 3.02], [168, 0.123]],
  71: [[175, 97.40], [176, 2.60]],
  72: [[180, 35.08], [178, 27.28], [177, 18.60], [179, 13.62], [176, 5.26], [174, 0.16]],
  73: [[181, 99.988], [180, 0.012]],
  74: [[184, 30.64], [186, 28.43], [182, 26.50], [183, 14.31], [180, 0.12]],
  75: [[187, 62.60], [185, 37.40]],
  76: [[192, 40.78], [190, 26.26], [189, 16.15], [188, 13.24], [187, 1.96], [186, 1.59], [184, 0.02]],
  77: [[193, 62.7], [191, 37.3]],
  78: [[195, 33.78], [194, 32.86], [196, 25.21], [198, 7.36], [192, 0.78], [190, 0.012]],
  79: [[197, 100]],
  80: [[202, 29.86], [200, 23.10], [199, 16.87], [201, 13.18], [198, 9.97], [204, 6.87], [196, 0.15]],
  81: [[205, 70.48], [203, 29.52]],
  82: [[208, 52.4], [206, 24.1], [207, 22.1], [204, 1.4]],
  83: [[209, 100]],
  90: [[232, 100]],
  91: [[231, 100]],
  92: [[238, 99.2745], [235, 0.7200], [234, 0.0055]],
};

// NuDat 3.0 / ENSDF verified longest-lived radioisotopes & trace cosmogenic nuclides
const RADIOISOTOPE_DECAY_DATA: Record<number, RadioisotopeMeta> = {
  1: { mass: 3, halfLife: '12.32 y', decayMode: 'β⁻', note: 'Trace cosmogenic/synthetic ³H (Tritium, ~10⁻¹⁶%)' },
  6: { mass: 14, halfLife: '5,730 y', decayMode: 'β⁻', note: 'Trace cosmogenic ¹⁴C (Radiocarbon, ~10⁻¹⁰%)' },
  19: { mass: 40, halfLife: '1.248 × 10⁹ y', decayMode: 'β⁻ (89.3%) / EC (10.7%)', note: 'Primordial radioisotope ⁴⁰K (0.0117%)' },
  37: { mass: 87, halfLife: '4.97 × 10¹⁰ y', decayMode: 'β⁻', note: 'Primordial ⁸⁷Rb used in Rb–Sr geochronology' },
  43: { mass: 98, halfLife: '4.2 × 10⁶ y', decayMode: 'β⁻', note: 'Lightest element with no stable isotopes (⁹⁹ᵐTc t₁/₂ = 6.01 h, IT)' },
  49: { mass: 115, halfLife: '4.41 × 10¹⁴ y', decayMode: 'β⁻', note: 'Primordial ¹¹⁵In (95.71% natural abundance)' },
  61: { mass: 145, halfLife: '17.7 y', decayMode: 'EC (Electron Capture)', note: 'Only lanthanide with zero stable isotopes' },
  71: { mass: 176, halfLife: '3.76 × 10¹⁰ y', decayMode: 'β⁻', note: 'Primordial ¹⁷⁶Lu used in Lu–Hf dating' },
  75: { mass: 187, halfLife: '4.12 × 10¹⁰ y', decayMode: 'β⁻', note: 'Primordial ¹⁸⁷Re (62.6% natural abundance)' },
  83: { mass: 209, halfLife: '2.01 × 10¹⁹ y', decayMode: 'α', note: 'Quasi-stable primordial ²⁰⁹Bi (t₁/₂ > 10⁹ × age of universe)' },
  84: { mass: 209, halfLife: '125.2 y', decayMode: 'α / EC', note: 'Natural trace ²¹⁰Po (t₁/₂ = 138.38 d, α)' },
  85: { mass: 210, halfLife: '8.1 h', decayMode: 'EC (99.8%) / α (0.18%)', note: 'Rarest natural element in Earth’s crust' },
  86: { mass: 222, halfLife: '3.8235 d', decayMode: 'α', note: 'Radiogenic gas from ²³⁸U decay chain' },
  87: { mass: 223, halfLife: '22.00 min', decayMode: 'β⁻ (99.994%) / α (0.006%)', note: 'From ²³⁵U actinium decay series' },
  88: { mass: 226, halfLife: '1,600 y', decayMode: 'α', note: 'Decays directly into Radon-222 gas' },
  89: { mass: 227, halfLife: '21.772 y', decayMode: 'β⁻ (98.62%) / α (1.38%)', note: 'Parent of the Actinium series' },
  90: { mass: 232, halfLife: '1.405 × 10¹⁰ y', decayMode: 'α', note: 'Primordial fertile actinide (100% ²³²Th)' },
  91: { mass: 231, halfLife: '32,760 y', decayMode: 'α', note: 'Natural trace ²³¹Pa in pitchblende ores' },
  92: { mass: 238, halfLife: '4.468 × 10⁹ y', decayMode: 'α / SF', note: '²³⁵U (t₁/₂ = 7.04 × 10⁸ y, α/fissile), ²³⁴U (t₁/₂ = 245,500 y, α)' },
  93: { mass: 237, halfLife: '2.144 × 10⁶ y', decayMode: 'α', note: 'First synthetic transuranium actinide' },
  94: { mass: 244, halfLife: '8.00 × 10⁷ y', decayMode: 'α / SF', note: '²³⁹Pu (t₁/₂ = 24,110 y, α) & ²³⁸Pu (t₁/₂ = 87.7 y, α RTG)' },
  95: { mass: 243, halfLife: '7,370 y', decayMode: 'α', note: '²⁴¹Am (t₁/₂ = 432.2 y, α) used in ionization smoke detectors' },
  96: { mass: 247, halfLife: '1.56 × 10⁷ y', decayMode: 'α', note: '²⁴⁴Cm (t₁/₂ = 18.1 y, α) powers Mars rover APXS spectrometers' },
  97: { mass: 247, halfLife: '1,380 y', decayMode: 'α', note: '²⁴⁹Bk (t₁/₂ = 330 d, β⁻) target for Tennessine synthesis' },
  98: { mass: 251, halfLife: '898 y', decayMode: 'α', note: '²⁵²Cf (t₁/₂ = 2.645 y, α 96.9% / SF 3.09% neutron emitter)' },
  99: { mass: 252, halfLife: '471.7 d', decayMode: 'α (78%) / EC (22%)', note: 'Discovered in 1952 Ivy Mike fallout' },
  100: { mass: 257, halfLife: '100.5 d', decayMode: 'α (99.8%) / SF (0.21%)', note: 'Heaviest element reachable by neutron capture' },
  101: { mass: 258, halfLife: '51.5 d', decayMode: 'EC / α', note: 'First element synthesized one atom at a time' },
  102: { mass: 259, halfLife: '58 min', decayMode: 'α (75%) / EC (25%)', note: 'Features uniquely stable +2 f¹⁴ oxidation state' },
  103: { mass: 266, halfLife: '11 h', decayMode: 'SF (Spontaneous Fission)', note: 'Completes the 5f actinide block' },
  104: { mass: 267, halfLife: '1.3 h', decayMode: 'SF (Spontaneous Fission)', note: 'First transactinide (6d block, Group 4)' },
  105: { mass: 268, halfLife: '28 h', decayMode: 'SF / EC', note: 'Longest-lived superheavy d-block nuclide' },
  106: { mass: 269, halfLife: '14 min', decayMode: 'α / SF', note: 'Forms volatile hexacarbonyl Sg(CO)₆' },
  107: { mass: 270, halfLife: '61 s', decayMode: 'α', note: 'Forms volatile oxychloride BhO₃Cl' },
  108: { mass: 277, halfLife: '11 min', decayMode: 'SF', note: '²⁷⁰Hs sits on deformed nuclear shell closure N = 162' },
  109: { mass: 278, halfLife: '4.5 s', decayMode: 'α', note: 'Group 9 superheavy transition metal' },
  110: { mass: 281, halfLife: '12.7 s', decayMode: 'SF (85%) / α (15%)', note: 'Relativistic 6d⁸ 7s² ground state' },
  111: { mass: 282, halfLife: '100 s', decayMode: 'SF / α', note: 'Superheavy congener of Gold (Group 11)' },
  112: { mass: 285, halfLife: '29 s', decayMode: 'α', note: 'Volatile noble-gas-like Group 12 metal' },
  113: { mass: 286, halfLife: '19.6 s', decayMode: 'α', note: 'First 7p-block superheavy element discovered in Asia (RIKEN)' },
  114: { mass: 289, halfLife: '1.9 s', decayMode: 'α', note: 'Proton magic number Z = 114 (Island of Stability)' },
  115: { mass: 290, halfLife: '0.65 s', decayMode: 'α', note: 'Synthesized via ⁴⁸Ca + ²⁴³Am hot fusion' },
  116: { mass: 293, halfLife: '53 ms', decayMode: 'α', note: 'Superheavy chalcogen (Group 16)' },
  117: { mass: 294, halfLife: '51 ms', decayMode: 'α', note: 'Heaviest Group 17 element (discovered 2010)' },
  118: { mass: 294, halfLife: '0.69 ms', decayMode: 'α', note: 'Completes Period 7 (Z = 118)' },
};

function getVerifiedIsotopes(element: ElementData): IsotopeData[] {
  const realEntries = VERIFIED_ISOTOPES[element.atomicNumber];
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

  // Exclusively radioactive / synthetic elements (Z = 43, 61, 84..89, 93..118)
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
  const isExclusivelyRadioactive = !VERIFIED_ISOTOPES[element.atomicNumber];

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

