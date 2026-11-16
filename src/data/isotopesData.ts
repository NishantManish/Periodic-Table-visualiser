export interface VerifiedIsotopeEntry {
  massNumber: number;
  abundance: number; // Natural CIAAW abundance %
  exactMass: number; // Exact AME2020 / IUPAC atomic mass in Da (u)
}

export interface RadioisotopeMeta {
  mass: number;
  exactMass: number;
  halfLife: string;
  decayMode: string;
  note?: string;
}

export interface IsotopePresetScenario {
  id: string;
  label: string;
  description: string;
  isotopes: Array<{
    massNumber: number;
    exactMass: number;
    abundance: number;
  }>;
}

export const ISOTOPE_COLORS = [
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

/**
 * IUPAC / CIAAW natural isotopic abundances paired with AME2020 / NIST exact isotopic masses (u).
 * Format: atomicNumber -> Array<[massNumber, naturalAbundancePercent, exactIsotopicMassU]>
 */
export const VERIFIED_ISOTOPE_TABLE: Record<number, [number, number, number][]> = {
  1: [[1, 99.9885, 1.007825], [2, 0.0115, 2.014102]],
  2: [[4, 99.99986, 4.002603], [3, 0.00014, 3.016029]],
  3: [[7, 92.41, 7.016003], [6, 7.59, 6.015123]],
  4: [[9, 100, 9.012183]],
  5: [[11, 80.1, 11.009305], [10, 19.9, 10.012937]],
  6: [[12, 98.93, 12.000000], [13, 1.07, 13.003355]],
  7: [[14, 99.636, 14.003074], [15, 0.364, 15.000109]],
  8: [[16, 99.757, 15.994915], [18, 0.205, 17.999160], [17, 0.038, 16.999132]],
  9: [[19, 100, 18.998403]],
  10: [[20, 90.48, 19.992440], [22, 9.25, 21.991385], [21, 0.27, 20.993847]],
  11: [[23, 100, 22.989769]],
  12: [[24, 78.99, 23.985042], [26, 11.01, 25.982593], [25, 10.00, 24.985837]],
  13: [[27, 100, 26.981539]],
  14: [[28, 92.223, 27.976927], [29, 4.685, 28.976495], [30, 3.092, 29.973770]],
  15: [[31, 100, 30.973762]],
  16: [[32, 94.99, 31.972071], [34, 4.25, 33.967867], [33, 0.75, 32.971459], [36, 0.01, 35.967081]],
  17: [[35, 75.76, 34.968853], [37, 24.24, 36.965903]],
  18: [[40, 99.604, 39.962383], [36, 0.334, 35.967545], [38, 0.063, 37.962732]],
  19: [[39, 93.258, 38.963707], [41, 6.730, 40.961826], [40, 0.012, 39.963998]],
  20: [[40, 96.941, 39.962591], [44, 2.086, 43.955482], [42, 0.647, 41.958618], [48, 0.187, 47.952523], [43, 0.135, 42.958767], [46, 0.004, 45.953689]],
  21: [[45, 100, 44.955908]],
  22: [[48, 73.72, 47.947942], [46, 8.25, 45.952627], [47, 7.44, 46.951759], [49, 5.41, 48.947866], [50, 5.18, 49.944787]],
  23: [[51, 99.75, 50.943957], [50, 0.25, 49.947156]],
  24: [[52, 83.789, 51.940506], [53, 9.501, 52.940648], [50, 4.345, 49.946042], [54, 2.365, 53.938879]],
  25: [[55, 100, 54.938043]],
  26: [[56, 91.754, 55.934936], [54, 5.845, 53.939609], [57, 2.119, 56.935393], [58, 0.282, 57.933274]],
  27: [[59, 100, 58.933194]],
  28: [[58, 68.077, 57.935342], [60, 26.223, 59.930785], [62, 3.635, 61.928345], [61, 1.140, 60.931055], [64, 0.926, 63.927966]],
  29: [[63, 69.15, 62.929598], [65, 30.85, 64.927790]],
  30: [[64, 49.17, 63.929142], [66, 27.73, 65.926033], [68, 18.45, 67.924844], [67, 4.04, 66.927127], [70, 0.61, 69.925319]],
  31: [[69, 60.108, 68.925574], [71, 39.892, 70.924703]],
  32: [[74, 36.28, 73.921178], [72, 27.54, 71.922076], [70, 20.84, 69.924249], [73, 7.73, 72.923459], [76, 7.61, 75.921403]],
  33: [[75, 100, 74.921595]],
  34: [[80, 49.61, 79.916522], [78, 23.77, 77.917309], [76, 9.37, 75.919214], [82, 8.73, 81.916699], [77, 7.63, 76.919914], [74, 0.89, 73.922476]],
  35: [[79, 50.69, 78.918338], [81, 49.31, 80.916290]],
  36: [[84, 56.99, 83.911498], [86, 17.28, 85.910611], [82, 11.59, 81.913483], [83, 11.50, 82.914127], [80, 2.29, 79.916379], [78, 0.36, 77.920365]],
  37: [[85, 72.17, 84.911790], [87, 27.83, 86.909181]],
  38: [[88, 82.58, 87.905612], [86, 9.86, 85.909261], [87, 7.00, 86.908877], [84, 0.56, 83.913419]],
  39: [[89, 100, 88.905840]],
  40: [[90, 51.45, 89.904698], [94, 17.38, 93.906311], [92, 17.15, 91.905036], [91, 11.22, 90.905640], [96, 2.80, 95.908271]],
  41: [[93, 100, 92.906373]],
  42: [[98, 24.29, 97.905404], [96, 16.67, 95.904676], [95, 15.87, 94.905838], [92, 14.65, 91.906808], [100, 9.74, 99.907472], [97, 9.58, 96.906018], [94, 9.19, 93.905085]],
  44: [[102, 31.55, 101.904344], [104, 18.62, 103.905427], [101, 17.06, 100.905577], [99, 12.76, 98.905934], [100, 12.60, 99.904214], [96, 5.54, 95.907590], [98, 1.87, 97.905287]],
  45: [[103, 100, 102.905498]],
  46: [[106, 27.33, 105.903480], [108, 26.46, 107.903892], [105, 22.33, 104.905080], [110, 11.72, 109.905172], [104, 11.14, 103.904031], [102, 1.02, 101.905602]],
  47: [[107, 51.839, 106.905092], [109, 48.161, 108.904755]],
  48: [[114, 28.73, 113.903365], [112, 24.13, 111.902763], [111, 12.80, 110.904183], [110, 12.49, 109.903007], [113, 12.22, 112.904408], [116, 7.49, 115.904763], [106, 1.25, 105.906460], [108, 0.89, 107.904183]],
  49: [[115, 95.71, 114.903879], [113, 4.29, 112.904062]],
  50: [[120, 32.58, 119.902202], [118, 24.22, 117.901607], [116, 14.54, 115.901743], [119, 8.59, 118.903311], [117, 7.68, 116.902954], [124, 5.79, 123.905277], [122, 4.63, 121.903444], [112, 0.97, 111.904824], [114, 0.66, 113.902783], [115, 0.34, 114.903345]],
  51: [[121, 57.21, 120.903812], [123, 42.79, 122.904213]],
  52: [[130, 34.08, 129.906223], [128, 31.74, 127.904461], [126, 18.84, 125.903311], [125, 7.07, 124.904430], [124, 4.74, 123.902817], [122, 2.55, 121.903044], [123, 0.89, 122.904270], [120, 0.09, 119.904060]],
  53: [[127, 100, 126.904472]],
  54: [[132, 26.91, 131.904155], [129, 26.40, 128.904781], [131, 21.23, 130.905084], [134, 10.44, 133.905395], [136, 8.86, 135.907214], [130, 4.07, 129.903509], [128, 1.91, 127.903531], [124, 0.095, 123.905892], [126, 0.089, 125.904298]],
  55: [[133, 100, 132.905452]],
  56: [[138, 71.70, 137.905247], [137, 11.23, 136.905827], [136, 7.85, 135.904576], [135, 6.59, 134.905689], [134, 2.42, 133.904508], [130, 0.106, 129.906321], [132, 0.101, 131.905061]],
  57: [[139, 99.911, 138.906356], [138, 0.089, 137.907119]],
  58: [[140, 88.45, 139.905443], [142, 11.11, 141.909250], [138, 0.25, 137.905991], [136, 0.19, 135.907129]],
  59: [[141, 100, 140.907658]],
  60: [[142, 27.15, 141.907729], [144, 23.80, 143.910093], [146, 17.19, 145.913123], [143, 12.17, 142.909820], [145, 8.29, 144.912579], [148, 5.76, 147.916899], [150, 5.64, 149.920897]],
  62: [[152, 26.75, 151.919739], [154, 22.75, 153.922215], [147, 14.99, 146.914904], [149, 13.82, 148.917191], [148, 11.24, 147.914829], [150, 7.38, 149.917282], [144, 3.07, 143.912006]],
  63: [[153, 52.19, 152.921238], [151, 47.81, 150.919858]],
  64: [[158, 24.84, 157.924112], [160, 21.86, 159.927062], [156, 20.47, 155.922131], [157, 15.65, 156.923969], [155, 14.80, 154.922630], [154, 2.18, 153.920874], [152, 0.20, 151.919799]],
  65: [[159, 100, 158.925355]],
  66: [[164, 28.26, 163.929182], [162, 25.48, 161.926806], [163, 24.90, 162.928738], [161, 18.89, 160.926940], [160, 2.33, 159.925205], [158, 0.095, 157.924416], [156, 0.056, 155.924285]],
  67: [[165, 100, 164.930329]],
  68: [[166, 33.50, 165.930299], [168, 26.98, 167.932377], [167, 22.87, 166.932055], [170, 14.91, 169.935470], [164, 1.60, 163.929206], [162, 0.139, 161.928787]],
  69: [[169, 100, 168.934219]],
  70: [[174, 31.90, 173.938867], [172, 21.83, 171.936387], [173, 16.10, 172.938217], [171, 14.22, 170.936332], [176, 12.89, 175.942579], [170, 3.02, 169.934767], [168, 0.123, 167.933891]],
  71: [[175, 97.40, 174.940778], [176, 2.60, 175.942692]],
  72: [[180, 35.08, 179.946557], [178, 27.28, 177.943706], [177, 18.60, 176.943228], [179, 13.62, 178.945823], [176, 5.26, 175.941410], [174, 0.16, 173.940046]],
  73: [[181, 99.988, 180.948001], [180, 0.012, 179.947465]],
  74: [[184, 30.64, 183.950931], [186, 28.43, 185.954363], [182, 26.50, 181.948204], [183, 14.31, 182.950223], [180, 0.12, 179.946711]],
  75: [[187, 62.60, 186.955750], [185, 37.40, 184.952955]],
  76: [[192, 40.78, 191.961481], [190, 26.26, 189.958447], [189, 16.15, 188.958148], [188, 13.24, 187.955838], [187, 1.96, 186.955751], [186, 1.59, 185.953838], [184, 0.02, 183.952491]],
  77: [[193, 62.7, 192.962922], [191, 37.3, 190.960589]],
  78: [[195, 33.78, 194.964791], [194, 32.86, 193.962680], [196, 25.21, 195.964952], [198, 7.36, 197.967893], [192, 0.78, 191.961038], [190, 0.012, 189.959932]],
  79: [[197, 100, 196.966569]],
  80: [[202, 29.86, 201.970643], [200, 23.10, 199.968326], [199, 16.87, 198.968280], [201, 13.18, 200.970302], [198, 9.97, 197.966769], [204, 6.87, 203.973494], [196, 0.15, 195.965833]],
  81: [[205, 70.48, 204.974428], [203, 29.52, 202.972344]],
  82: [[208, 52.4, 207.976652], [206, 24.1, 205.974465], [207, 22.1, 206.975897], [204, 1.4, 203.973044]],
  83: [[209, 100, 208.980399]],
  90: [[232, 100, 232.038055]],
  91: [[231, 100, 231.035884]],
  92: [[238, 99.2745, 238.050788], [235, 0.7200, 235.043930], [234, 0.0055, 234.040952]],
};

// NuDat 3.0 / ENSDF verified longest-lived radioisotopes & trace cosmogenic nuclides
export const RADIOISOTOPE_DECAY_DATA: Record<number, RadioisotopeMeta> = {
  1: { mass: 3, exactMass: 3.016049, halfLife: '12.32 y', decayMode: 'β⁻', note: 'Trace cosmogenic/synthetic ³H (Tritium, ~10⁻¹⁶%)' },
  6: { mass: 14, exactMass: 14.003242, halfLife: '5,730 y', decayMode: 'β⁻', note: 'Trace cosmogenic ¹⁴C (Radiocarbon, ~10⁻¹⁰%)' },
  19: { mass: 40, exactMass: 39.963998, halfLife: '1.248 × 10⁹ y', decayMode: 'β⁻ (89.3%) / EC (10.7%)', note: 'Primordial radioisotope ⁴⁰K (0.0117%)' },
  37: { mass: 87, exactMass: 86.909181, halfLife: '4.97 × 10¹⁰ y', decayMode: 'β⁻', note: 'Primordial ⁸⁷Rb used in Rb–Sr geochronology' },
  43: { mass: 98, exactMass: 97.907212, halfLife: '4.2 × 10⁶ y', decayMode: 'β⁻', note: 'Lightest element with no stable isotopes (⁹⁹ᵐTc t₁/₂ = 6.01 h, IT)' },
  49: { mass: 115, exactMass: 114.903879, halfLife: '4.41 × 10¹⁴ y', decayMode: 'β⁻', note: 'Primordial ¹¹⁵In (95.71% natural abundance)' },
  61: { mass: 145, exactMass: 144.912756, halfLife: '17.7 y', decayMode: 'EC (Electron Capture)', note: 'Only lanthanide with zero stable isotopes' },
  71: { mass: 176, exactMass: 175.942692, halfLife: '3.76 × 10¹⁰ y', decayMode: 'β⁻', note: 'Primordial ¹⁷⁶Lu used in Lu–Hf dating' },
  75: { mass: 187, exactMass: 186.955750, halfLife: '4.12 × 10¹⁰ y', decayMode: 'β⁻', note: 'Primordial ¹⁸⁷Re (62.6% natural abundance)' },
  83: { mass: 209, exactMass: 208.980399, halfLife: '2.01 × 10¹⁹ y', decayMode: 'α', note: 'Quasi-stable primordial ²⁰⁹Bi (t₁/₂ > 10⁹ × age of universe)' },
  84: { mass: 209, exactMass: 208.982430, halfLife: '125.2 y', decayMode: 'α / EC', note: 'Natural trace ²¹⁰Po (t₁/₂ = 138.38 d, α)' },
  85: { mass: 210, exactMass: 209.987148, halfLife: '8.1 h', decayMode: 'EC (99.8%) / α (0.18%)', note: 'Rarest natural element in Earth’s crust' },
  86: { mass: 222, exactMass: 222.017578, halfLife: '3.8235 d', decayMode: 'α', note: 'Radiogenic gas from ²³⁸U decay chain' },
  87: { mass: 223, exactMass: 223.019736, halfLife: '22.00 min', decayMode: 'β⁻ (99.994%) / α (0.006%)', note: 'From ²³⁵U actinium decay series' },
  88: { mass: 226, exactMass: 226.025410, halfLife: '1,600 y', decayMode: 'α', note: 'Decays directly into Radon-222 gas' },
  89: { mass: 227, exactMass: 227.027752, halfLife: '21.772 y', decayMode: 'β⁻ (98.62%) / α (1.38%)', note: 'Parent of the Actinium series' },
  90: { mass: 232, exactMass: 232.038055, halfLife: '1.405 × 10¹⁰ y', decayMode: 'α', note: 'Primordial fertile actinide (100% ²³²Th)' },
  91: { mass: 231, exactMass: 231.035884, halfLife: '32,760 y', decayMode: 'α', note: 'Natural trace ²³¹Pa in pitchblende ores' },
  92: { mass: 238, exactMass: 238.050788, halfLife: '4.468 × 10⁹ y', decayMode: 'α / SF', note: '²³⁵U (t₁/₂ = 7.04 × 10⁸ y, α/fissile), ²³⁴U (t₁/₂ = 245,500 y, α)' },
  93: { mass: 237, exactMass: 237.048173, halfLife: '2.144 × 10⁶ y', decayMode: 'α', note: 'First synthetic transuranium actinide' },
  94: { mass: 244, exactMass: 244.064204, halfLife: '8.00 × 10⁷ y', decayMode: 'α / SF', note: '²³⁹Pu (t₁/₂ = 24,110 y, α) & ²³⁸Pu (t₁/₂ = 87.7 y, α RTG)' },
  95: { mass: 243, exactMass: 243.061381, halfLife: '7,370 y', decayMode: 'α', note: '²⁴¹Am (t₁/₂ = 432.2 y, α) used in ionization smoke detectors' },
  96: { mass: 247, exactMass: 247.070354, halfLife: '1.56 × 10⁷ y', decayMode: 'α', note: '²⁴⁴Cm (t₁/₂ = 18.1 y, α) powers Mars rover APXS spectrometers' },
  97: { mass: 247, exactMass: 247.070307, halfLife: '1,380 y', decayMode: 'α', note: '²⁴⁹Bk (t₁/₂ = 330 d, β⁻) target for Tennessine synthesis' },
  98: { mass: 251, exactMass: 251.079587, halfLife: '898 y', decayMode: 'α', note: '²⁵²Cf (t₁/₂ = 2.645 y, α 96.9% / SF 3.09% neutron emitter)' },
  99: { mass: 252, exactMass: 252.08298, halfLife: '471.7 d', decayMode: 'α (78%) / EC (22%)', note: 'Discovered in 1952 Ivy Mike fallout' },
  100: { mass: 257, exactMass: 257.095106, halfLife: '100.5 d', decayMode: 'α (99.8%) / SF (0.21%)', note: 'Heaviest element reachable by neutron capture' },
  101: { mass: 258, exactMass: 258.098431, halfLife: '51.5 d', decayMode: 'EC / α', note: 'First element synthesized one atom at a time' },
  102: { mass: 259, exactMass: 259.10103, halfLife: '58 min', decayMode: 'α (75%) / EC (25%)', note: 'Features uniquely stable +2 f¹⁴ oxidation state' },
  103: { mass: 266, exactMass: 266.11983, halfLife: '11 h', decayMode: 'SF (Spontaneous Fission)', note: 'Completes the 5f actinide block' },
  104: { mass: 267, exactMass: 267.12179, halfLife: '1.3 h', decayMode: 'SF (Spontaneous Fission)', note: 'First transactinide (6d block, Group 4)' },
  105: { mass: 268, exactMass: 268.12567, halfLife: '28 h', decayMode: 'SF / EC', note: 'Longest-lived superheavy d-block nuclide' },
  106: { mass: 269, exactMass: 269.12863, halfLife: '14 min', decayMode: 'α / SF', note: 'Forms volatile hexacarbonyl Sg(CO)₆' },
  107: { mass: 270, exactMass: 270.13336, halfLife: '61 s', decayMode: 'α', note: 'Forms volatile oxychloride BhO₃Cl' },
  108: { mass: 277, exactMass: 277.1519, halfLife: '11 min', decayMode: 'SF', note: '²⁷⁰Hs sits on deformed nuclear shell closure N = 162' },
  109: { mass: 278, exactMass: 278.1563, halfLife: '4.5 s', decayMode: 'α', note: 'Group 9 superheavy transition metal' },
  110: { mass: 281, exactMass: 281.1645, halfLife: '12.7 s', decayMode: 'SF (85%) / α (15%)', note: 'Relativistic 6d⁸ 7s² ground state' },
  111: { mass: 282, exactMass: 282.1691, halfLife: '100 s', decayMode: 'SF / α', note: 'Superheavy congener of Gold (Group 11)' },
  112: { mass: 285, exactMass: 285.1771, halfLife: '29 s', decayMode: 'α', note: 'Volatile noble-gas-like Group 12 metal' },
  113: { mass: 286, exactMass: 286.1822, halfLife: '19.6 s', decayMode: 'α', note: 'First 7p-block superheavy element discovered in Asia (RIKEN)' },
  114: { mass: 289, exactMass: 289.1904, halfLife: '1.9 s', decayMode: 'α', note: 'Proton magic number Z = 114 (Island of Stability)' },
  115: { mass: 290, exactMass: 290.1960, halfLife: '0.65 s', decayMode: 'α', note: 'Synthesized via ⁴⁸Ca + ²⁴³Am hot fusion' },
  116: { mass: 293, exactMass: 293.2045, halfLife: '53 ms', decayMode: 'α', note: 'Superheavy chalcogen (Group 16)' },
  117: { mass: 294, exactMass: 294.2108, halfLife: '51 ms', decayMode: 'α', note: 'Heaviest Group 17 element (discovered 2010)' },
  118: { mass: 294, exactMass: 294.2139, halfLife: '0.69 ms', decayMode: 'α', note: 'Completes Period 7 (Z = 118)' },
};

/**
 * Curated real-world isotopic enrichment and laboratory reference presets keyed by atomic number.
 */
export const CURATED_ISOTOPE_PRESETS: Record<number, IsotopePresetScenario[]> = {
  1: [
    {
      id: 'heavy-water',
      label: 'Heavy Water (D₂O / 99.8% ²H)',
      description: 'Deuterated NMR solvent and CANDU heavy-water nuclear moderator grade.',
      isotopes: [
        { massNumber: 1, exactMass: 1.007825, abundance: 0.2 },
        { massNumber: 2, exactMass: 2.014102, abundance: 99.8 },
      ],
    },
    {
      id: 'dt-fusion',
      label: 'D–T Fusion Fuel (50/50 ²H–³H)',
      description: 'Equimolar Deuterium–Tritium plasma mixture used in tokamak fusion research.',
      isotopes: [
        { massNumber: 2, exactMass: 2.014102, abundance: 50.0 },
        { massNumber: 3, exactMass: 3.016049, abundance: 50.0 },
      ],
    },
  ],
  3: [
    {
      id: 'li6-absorber',
      label: 'Enriched ⁶Li (95% ⁶Li)',
      description: 'High thermal-neutron capture cross-section (940 barns) for tritium breeding.',
      isotopes: [
        { massNumber: 6, exactMass: 6.015123, abundance: 95.0 },
        { massNumber: 7, exactMass: 7.016003, abundance: 5.0 },
      ],
    },
    {
      id: 'li7-pwr',
      label: 'Enriched ⁷Li (99.95% ⁷Li)',
      description: 'Lithium hydroxide pH buffer for pressurized-water reactors to minimize tritium production.',
      isotopes: [
        { massNumber: 7, exactMass: 7.016003, abundance: 99.95 },
        { massNumber: 6, exactMass: 6.015123, abundance: 0.05 },
      ],
    },
  ],
  5: [
    {
      id: 'b10-shielding',
      label: 'Enriched ¹⁰B Neutron Shield (96%)',
      description: 'Boric acid coolant and B₄C control-rod enrichment for thermal neutron absorption.',
      isotopes: [
        { massNumber: 10, exactMass: 10.012937, abundance: 96.0 },
        { massNumber: 11, exactMass: 11.009305, abundance: 4.0 },
      ],
    },
    {
      id: 'b11-semiconductor',
      label: 'Semiconductor ¹¹B (99.5%)',
      description: 'Low-neutron-capture BF₃ ion implantation gas for CMOS wafer doping.',
      isotopes: [
        { massNumber: 11, exactMass: 11.009305, abundance: 99.5 },
        { massNumber: 10, exactMass: 10.012937, abundance: 0.5 },
      ],
    },
  ],
  6: [
    {
      id: 'c13-nmr',
      label: '¹³C NMR Uniform Labeling (99%)',
      description: 'Spin-1/2 enriched carbon for multidimensional protein NMR and metabolic flux analysis.',
      isotopes: [
        { massNumber: 12, exactMass: 12.000000, abundance: 1.0 },
        { massNumber: 13, exactMass: 13.003355, abundance: 99.0 },
      ],
    },
    {
      id: 'c14-tracer',
      label: '¹⁴C Tracer Cocktail (85/10/5)',
      description: 'Synthetic ¹⁴C radiolabeling scenario alongside stable ¹²C and ¹³C carriers.',
      isotopes: [
        { massNumber: 12, exactMass: 12.000000, abundance: 85.0 },
        { massNumber: 13, exactMass: 13.003355, abundance: 10.0 },
        { massNumber: 14, exactMass: 14.003242, abundance: 5.0 },
      ],
    },
  ],
  7: [
    {
      id: 'n15-nmr',
      label: '¹⁵N Isotope Labeling (98%)',
      description: 'Enriched ammonium salts used in structural biology NMR and soil nitrogen tracing.',
      isotopes: [
        { massNumber: 14, exactMass: 14.003074, abundance: 2.0 },
        { massNumber: 15, exactMass: 15.000109, abundance: 98.0 },
      ],
    },
  ],
  8: [
    {
      id: 'o18-pet',
      label: '¹⁸O PET Target Water (98% H₂¹⁸O)',
      description: 'Cyclotron target for synthesizing ¹⁸F-FDG medical positron emission tomography tracers.',
      isotopes: [
        { massNumber: 16, exactMass: 15.994915, abundance: 1.8 },
        { massNumber: 17, exactMass: 16.999132, abundance: 0.2 },
        { massNumber: 18, exactMass: 17.999160, abundance: 98.0 },
      ],
    },
  ],
  17: [
    {
      id: 'cl-equimolar',
      label: 'Equimolar MS Standard (50/50)',
      description: 'Synthetic 1:1 ³⁵Cl/³⁷Cl mass spectrometry calibration standard.',
      isotopes: [
        { massNumber: 35, exactMass: 34.968853, abundance: 50.0 },
        { massNumber: 37, exactMass: 36.965903, abundance: 50.0 },
      ],
    },
  ],
  92: [
    {
      id: 'leu-power',
      label: 'Commercial LEU Fuel (4.5% ²³⁵U)',
      description: 'Low-enriched uranium dioxide (UO₂) used in commercial light-water power reactors.',
      isotopes: [
        { massNumber: 238, exactMass: 238.050788, abundance: 95.46 },
        { massNumber: 235, exactMass: 235.043930, abundance: 4.50 },
        { massNumber: 234, exactMass: 234.040952, abundance: 0.04 },
      ],
    },
    {
      id: 'haleu-research',
      label: 'HALEU / Research Reactor (19.75% ²³⁵U)',
      description: 'High-Assay Low-Enriched Uranium used in medical isotope production and compact reactors.',
      isotopes: [
        { massNumber: 238, exactMass: 238.050788, abundance: 80.10 },
        { massNumber: 235, exactMass: 235.043930, abundance: 19.75 },
        { massNumber: 234, exactMass: 234.040952, abundance: 0.15 },
      ],
    },
    {
      id: 'depleted-u',
      label: 'Depleted Uranium Tailings (0.20% ²³⁵U)',
      description: 'High-density enrichment byproduct (19.1 g/cm³) used in radiation shielding and ballast.',
      isotopes: [
        { massNumber: 238, exactMass: 238.050788, abundance: 99.80 },
        { massNumber: 235, exactMass: 235.043930, abundance: 0.20 },
        { massNumber: 234, exactMass: 234.040952, abundance: 0.00 },
      ],
    },
  ],
};

export function getElementIsotopes(
  atomicNumber: number,
  fallbackNominalMass: number
): VerifiedIsotopeEntry[] {
  const entries = VERIFIED_ISOTOPE_TABLE[atomicNumber];
  if (entries && entries.length > 0) {
    return entries.map(([massNumber, abundance, exactMass]) => ({
      massNumber,
      abundance,
      exactMass,
    }));
  }

  const radio = RADIOISOTOPE_DECAY_DATA[atomicNumber];
  if (radio) {
    return [
      {
        massNumber: radio.mass,
        abundance: 100,
        exactMass: radio.exactMass,
      },
    ];
  }

  const rounded = Math.max(1, Math.round(fallbackNominalMass));
  return [
    {
      massNumber: rounded,
      abundance: 100,
      exactMass: fallbackNominalMass,
    },
  ];
}

export function getPresetsForElement(
  atomicNumber: number,
  symbol: string,
  fallbackNominalMass: number
): IsotopePresetScenario[] {
  const natural = getElementIsotopes(atomicNumber, fallbackNominalMass);
  const naturalPreset: IsotopePresetScenario = {
    id: 'natural-ciaaw',
    label: 'Natural IUPAC / CIAAW',
    description: `Verified terrestrial isotopic distribution for ${symbol}.`,
    isotopes: natural.map((item) => ({
      massNumber: item.massNumber,
      exactMass: item.exactMass,
      abundance: item.abundance,
    })),
  };

  const curated = CURATED_ISOTOPE_PRESETS[atomicNumber] ?? [];
  const scenarios: IsotopePresetScenario[] = [naturalPreset, ...curated];

  if (natural.length >= 2) {
    const equalShare = Number((100 / natural.length).toFixed(4));
    const equimolarIsotopes = natural.map((item, idx) => ({
      massNumber: item.massNumber,
      exactMass: item.exactMass,
      abundance:
        idx === natural.length - 1
          ? Number((100 - equalShare * (natural.length - 1)).toFixed(4))
          : equalShare,
    }));
    scenarios.push({
      id: 'equimolar',
      label: `Equimolar Mix (${natural.length} Isotopes)`,
      description: 'Equal molar fraction across all naturally occurring isotopes.',
      isotopes: equimolarIsotopes,
    });

    const heaviest = natural.reduce((a, b) => (b.massNumber > a.massNumber ? b : a), natural[0]);
    scenarios.push({
      id: 'pure-heaviest',
      label: `100% Pure ${symbol}-${heaviest.massNumber}`,
      description: `Monoisotopic enrichment to the heaviest natural nuclide (${heaviest.exactMass.toFixed(4)} u).`,
      isotopes: natural.map((item) => ({
        massNumber: item.massNumber,
        exactMass: item.exactMass,
        abundance: item.massNumber === heaviest.massNumber ? 100 : 0,
      })),
    });
  }

  return scenarios;
}
