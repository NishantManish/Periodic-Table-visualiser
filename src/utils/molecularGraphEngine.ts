import {
  MoleculeDossier,
  MoleculeAtomNode,
  MoleculeBondEdge,
  IsomerClassification,
} from '../types';

// ============================================================================
// 1. ELEMENT VALENCE, ELECTRONEGATIVITY & COVALENT RADIUS REFERENCE TABLE
// ============================================================================
export interface ElementGraphSpec {
  symbol: string;
  name: string;
  atomicMass: number;
  valenceElectrons: number;
  typicalValence: number;
  electronegativity: number;
  covalentRadiusAngstrom: number;
  period: number;
}

export const GRAPH_ELEMENT_SPECS: Record<string, ElementGraphSpec> = {
  H: { symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, valenceElectrons: 1, typicalValence: 1, electronegativity: 2.20, covalentRadiusAngstrom: 0.31, period: 1 },
  He: { symbol: 'He', name: 'Helium', atomicMass: 4.0026, valenceElectrons: 2, typicalValence: 0, electronegativity: 0.0, covalentRadiusAngstrom: 0.28, period: 1 },
  Li: { symbol: 'Li', name: 'Lithium', atomicMass: 6.94, valenceElectrons: 1, typicalValence: 1, electronegativity: 0.98, covalentRadiusAngstrom: 1.28, period: 2 },
  Be: { symbol: 'Be', name: 'Beryllium', atomicMass: 9.0122, valenceElectrons: 2, typicalValence: 2, electronegativity: 1.57, covalentRadiusAngstrom: 0.96, period: 2 },
  B: { symbol: 'B', name: 'Boron', atomicMass: 10.81, valenceElectrons: 3, typicalValence: 3, electronegativity: 2.04, covalentRadiusAngstrom: 0.84, period: 2 },
  C: { symbol: 'C', name: 'Carbon', atomicMass: 12.011, valenceElectrons: 4, typicalValence: 4, electronegativity: 2.55, covalentRadiusAngstrom: 0.76, period: 2 },
  N: { symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, valenceElectrons: 5, typicalValence: 3, electronegativity: 3.04, covalentRadiusAngstrom: 0.71, period: 2 },
  O: { symbol: 'O', name: 'Oxygen', atomicMass: 15.999, valenceElectrons: 6, typicalValence: 2, electronegativity: 3.44, covalentRadiusAngstrom: 0.66, period: 2 },
  F: { symbol: 'F', name: 'Fluorine', atomicMass: 18.998, valenceElectrons: 7, typicalValence: 1, electronegativity: 3.98, covalentRadiusAngstrom: 0.57, period: 2 },
  Na: { symbol: 'Na', name: 'Sodium', atomicMass: 22.99, valenceElectrons: 1, typicalValence: 1, electronegativity: 0.93, covalentRadiusAngstrom: 1.66, period: 3 },
  Mg: { symbol: 'Mg', name: 'Magnesium', atomicMass: 24.305, valenceElectrons: 2, typicalValence: 2, electronegativity: 1.31, covalentRadiusAngstrom: 1.41, period: 3 },
  Al: { symbol: 'Al', name: 'Aluminium', atomicMass: 26.982, valenceElectrons: 3, typicalValence: 3, electronegativity: 1.61, covalentRadiusAngstrom: 1.21, period: 3 },
  Si: { symbol: 'Si', name: 'Silicon', atomicMass: 28.085, valenceElectrons: 4, typicalValence: 4, electronegativity: 1.90, covalentRadiusAngstrom: 1.11, period: 3 },
  P: { symbol: 'P', name: 'Phosphorus', atomicMass: 30.974, valenceElectrons: 5, typicalValence: 3, electronegativity: 2.19, covalentRadiusAngstrom: 1.07, period: 3 },
  S: { symbol: 'S', name: 'Sulfur', atomicMass: 32.06, valenceElectrons: 6, typicalValence: 2, electronegativity: 2.58, covalentRadiusAngstrom: 1.05, period: 3 },
  Cl: { symbol: 'Cl', name: 'Chlorine', atomicMass: 35.45, valenceElectrons: 7, typicalValence: 1, electronegativity: 3.16, covalentRadiusAngstrom: 1.02, period: 3 },
  K: { symbol: 'K', name: 'Potassium', atomicMass: 39.098, valenceElectrons: 1, typicalValence: 1, electronegativity: 0.82, covalentRadiusAngstrom: 2.03, period: 4 },
  Ca: { symbol: 'Ca', name: 'Calcium', atomicMass: 40.078, valenceElectrons: 2, typicalValence: 2, electronegativity: 1.00, covalentRadiusAngstrom: 1.76, period: 4 },
  Fe: { symbol: 'Fe', name: 'Iron', atomicMass: 55.845, valenceElectrons: 8, typicalValence: 3, electronegativity: 1.83, covalentRadiusAngstrom: 1.32, period: 4 },
  Cu: { symbol: 'Cu', name: 'Copper', atomicMass: 63.546, valenceElectrons: 11, typicalValence: 2, electronegativity: 1.90, covalentRadiusAngstrom: 1.32, period: 4 },
  Zn: { symbol: 'Zn', name: 'Zinc', atomicMass: 65.38, valenceElectrons: 2, typicalValence: 2, electronegativity: 1.65, covalentRadiusAngstrom: 1.22, period: 4 },
  Br: { symbol: 'Br', name: 'Bromine', atomicMass: 79.904, valenceElectrons: 7, typicalValence: 1, electronegativity: 2.96, covalentRadiusAngstrom: 1.20, period: 4 },
  I: { symbol: 'I', name: 'Iodine', atomicMass: 126.90, valenceElectrons: 7, typicalValence: 1, electronegativity: 2.66, covalentRadiusAngstrom: 1.39, period: 5 },
  Xe: { symbol: 'Xe', name: 'Xenon', atomicMass: 131.29, valenceElectrons: 8, typicalValence: 0, electronegativity: 2.60, covalentRadiusAngstrom: 1.40, period: 5 },
};

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

const UNICODE_TO_ASCII_DIGITS: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
};

export function toSubscriptNumber(n: number): string {
  if (n <= 1) return '';
  return String(n)
    .split('')
    .map((d) => SUBSCRIPT_DIGITS[d] || d)
    .join('');
}

export function normalizeAsciiFormula(formula: string): string {
  return formula
    .split('')
    .map((ch) => UNICODE_TO_ASCII_DIGITS[ch] ?? ch)
    .join('')
    .replace(/\s+/g, '');
}

// ============================================================================
// 2. STOICHIOMETRIC & CONSTITUTIONAL ISOMER ENUMERATION ENGINE
//    IHD = C - H/2 - X/2 + N/2 + 1
// ============================================================================
export function parseChemicalFormulaCounts(formula: string): Record<string, number> {
  const ascii = normalizeAsciiFormula(formula);
  const counts: Record<string, number> = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(ascii)) !== null) {
    const sym = match[1];
    const qty = match[2] ? parseInt(match[2], 10) : 1;
    counts[sym] = (counts[sym] || 0) + qty;
  }
  return counts;
}

/**
 * Calculates the exact Index of Hydrogen Deficiency (IHD / Degree of Unsaturation):
 *   IHD = C - H/2 - X/2 + N/2 + 1
 * where C = tetravalent atoms (C, Si), H = monovalent hydrogens,
 * X = halogens (F, Cl, Br, I), N = trivalent pnictogens (N, P).
 * Returns 0 for pure inorganic/elemental species without carbon/silicon backbones
 * unless topological rings/pi-bonds are supplied.
 */
export function calculateFormulaIHD(counts: Record<string, number>, fallbackTopologicalIHD = 0): number {
  const cCount = (counts['C'] || 0) + (counts['Si'] || 0);
  const hCount = counts['H'] || 0;
  const xCount = (counts['F'] || 0) + (counts['Cl'] || 0) + (counts['Br'] || 0) + (counts['I'] || 0);
  const nCount = (counts['N'] || 0) + (counts['P'] || 0);

  if (cCount === 0) {
    return Math.max(0, fallbackTopologicalIHD);
  }

  const rawIHD = cCount - hCount / 2 - xCount / 2 + nCount / 2 + 1;
  return Math.max(0, Math.round(rawIHD * 2) / 2);
}

export interface IsomerFamilyGroup {
  isomerGroupKey: string;
  displayFormula: string;
  ihd: number;
  totalIsomers: number;
  constitutionalCount: number;
  stereoisomerCount: number;
  allotropeCount: number;
  members: MoleculeDossier[];
  structuralSummary: string;
}

/**
 * Groups all constitutional isomers (chain, positional, functional group, ring-chain, tautomer),
 * geometric stereoisomers (cis/trans, E/Z), optical enantiomers (R/S), and elemental allotropes
 * (O₂/O₃, P₄, S₈, Carbon) for a given molecule or formula.
 */
export function enumerateIsomerFamily(
  activeMolecule: MoleculeDossier,
  library: MoleculeDossier[]
): IsomerFamilyGroup {
  const counts = parseChemicalFormulaCounts(activeMolecule.formula);
  const ihd = calculateFormulaIHD(counts, activeMolecule.degreeOfUnsaturation);

  const members = library.filter(
    (m) =>
      m.isomerGroup === activeMolecule.isomerGroup ||
      normalizeAsciiFormula(m.formula) === normalizeAsciiFormula(activeMolecule.formula)
  );

  let constitutionalCount = 0;
  let stereoisomerCount = 0;
  let allotropeCount = 0;

  for (const m of members) {
    if (m.isomerType === 'Allotrope') {
      allotropeCount++;
    } else if (m.isomerType.includes('Geometric')) {
      stereoisomerCount++;
    } else {
      constitutionalCount++;
    }
  }

  let structuralSummary = `IHD = ${ihd} (${
    ihd === 0
      ? 'saturated acyclic skeleton — zero rings or π bonds'
      : `${ihd} ring(s) and/or π double/triple bond equivalent(s)`
  }).`;

  if (allotropeCount > 1) {
    structuralSummary = `Elemental Allotrope Family (${members.map((m) => m.formula).join(' / ')}): differs in atom nuclearity, catenation ring size, and hybridization while composed of a single element.`;
  } else if (members.length > 1) {
    const types = Array.from(new Set(members.map((m) => m.isomerType))).join(' + ');
    structuralSummary = `Same atomic composition (${activeMolecule.formula}, IHD = ${ihd}) arranged into ${members.length} distinct structures via ${types}.`;
  }

  return {
    isomerGroupKey: activeMolecule.isomerGroup,
    displayFormula: activeMolecule.formula,
    ihd,
    totalIsomers: members.length,
    constitutionalCount,
    stereoisomerCount,
    allotropeCount,
    members,
    structuralSummary,
  };
}

// ============================================================================
// 3. DELOCALIZED PI RESONANCE DETECTOR
//    Detects O₃, SO₂, NO₂⁻, CO₃²⁻, NO₃⁻, C₆H₆, and carboxylate (-COO⁻)
//    and assigns fractional bond orders (1.33, 1.5).
// ============================================================================
export interface ResonanceAnalysisResult {
  hasResonance: boolean;
  effectiveEdges: Array<{ source: number; target: number; order: 1 | 1.33 | 1.5 | 2 | 3 }>;
  description: string;
}

export function detectDelocalizedPiResonance(
  nodes: Array<{ id: number; symbol: string }>,
  edges: Array<{ source: number; target: number; order: 1 | 1.33 | 1.5 | 2 | 3 }>
): ResonanceAnalysisResult {
  const effectiveEdges = edges.map((e) => ({ ...e }));
  const nodeMap = new Map(nodes.map((n) => [n.id, n.symbol]));

  // Build adjacency list
  const adj = new Map<number, number[]>();
  for (const n of nodes) adj.set(n.id, []);
  effectiveEdges.forEach((e, idx) => {
    adj.get(e.source)?.push(idx);
    adj.get(e.target)?.push(idx);
  });

  const resonanceNotes: string[] = [];

  // 1. Check 6-membered conjugated carbon/nitrogen rings (e.g. Benzene C6H6)
  if (nodes.length >= 6) {
    const cNodes = nodes.filter((n) => n.symbol === 'C' || n.symbol === 'N');
    if (cNodes.length === 6) {
      // Check if the 6 C/N atoms form a cycle with alternating single/double or 1.5 bonds
      const ringEdgeIndices: number[] = [];
      let doubleCount = 0;
      let singleCount = 0;
      let halfCount = 0;

      effectiveEdges.forEach((e, idx) => {
        const s1 = nodeMap.get(e.source);
        const s2 = nodeMap.get(e.target);
        if ((s1 === 'C' || s1 === 'N') && (s2 === 'C' || s2 === 'N')) {
          ringEdgeIndices.push(idx);
          if (e.order === 2) doubleCount++;
          else if (e.order === 1) singleCount++;
          else if (e.order === 1.5) halfCount++;
        }
      });

      if (ringEdgeIndices.length === 6 && ((doubleCount === 3 && singleCount === 3) || halfCount === 6)) {
        for (const idx of ringEdgeIndices) {
          effectiveEdges[idx].order = 1.5;
        }
        resonanceNotes.push(
          'Aromatic 6π Hückel Sextet (4n+2, n=1): 6 p_z orbitals delocalize around the planar ring, equalizing all 6 ring bonds to fractional bond order 1.5 (1.397 Å).'
        );
      }
    }
  }

  // 2. Check central atoms with terminal oxygens (O₃, SO₂, CO₃²⁻, NO₃⁻, -COO⁻, NO₂⁻)
  for (const centerNode of nodes) {
    const incidentIdx = adj.get(centerNode.id) || [];
    if (incidentIdx.length < 2) continue;

    // Find terminal oxygen neighbors bonded to this center
    const terminalOxygenEdges: number[] = [];
    for (const eIdx of incidentIdx) {
      const e = effectiveEdges[eIdx];
      const otherId = e.source === centerNode.id ? e.target : e.source;
      const otherSym = nodeMap.get(otherId);
      const otherDegree = (adj.get(otherId) || []).length;
      if (otherSym === 'O' && otherDegree === 1) {
        terminalOxygenEdges.push(eIdx);
      }
    }

    if (terminalOxygenEdges.length === 3 && (centerNode.symbol === 'C' || centerNode.symbol === 'N' || centerNode.symbol === 'S')) {
      // 3 equivalent terminal oxygens: e.g. CO3(2-), NO3(-), SO3
      const hasAtLeastOnePi = terminalOxygenEdges.some((idx) => effectiveEdges[idx].order >= 1.33);
      if (hasAtLeastOnePi) {
        const totalOrder = terminalOxygenEdges.reduce((acc, idx) => acc + effectiveEdges[idx].order, 0);
        // For carbonate/nitrate (1 double + 2 single = 4 total bond order across 3 centers -> 1.33)
        if (totalOrder <= 4.5) {
          for (const idx of terminalOxygenEdges) {
            effectiveEdges[idx].order = 1.33;
          }
          resonanceNotes.push(
            `3-Center 4-Electron (3c–4e) Delocalized π Resonance on ${centerNode.symbol}O₃: three equivalent resonance hybrids equalize all three ${centerNode.symbol}–O bonds to fractional bond order 1.33.`
          );
        }
      }
    } else if (terminalOxygenEdges.length === 2 && ['O', 'S', 'N', 'C'].includes(centerNode.symbol)) {
      // 2 terminal oxygens: e.g. O₃, SO₂, NO₂⁻, R-COO⁻
      const orders = terminalOxygenEdges.map((idx) => effectiveEdges[idx].order);
      const hasDoubleAndSingle =
        (orders[0] === 2 && orders[1] === 1) ||
        (orders[0] === 1 && orders[1] === 2) ||
        (orders[0] === 1.5 && orders[1] === 1.5);

      if (hasDoubleAndSingle) {
        for (const idx of terminalOxygenEdges) {
          effectiveEdges[idx].order = 1.5;
        }
        resonanceNotes.push(
          `3-Center Delocalized π System (${centerNode.symbol}O₂ moiety): two equivalent resonance contributors average both ${centerNode.symbol}–O bonds to fractional bond order 1.5.`
        );
      }
    }
  }

  return {
    hasResonance: resonanceNotes.length > 0,
    effectiveEdges,
    description:
      resonanceNotes.length > 0
        ? resonanceNotes.join(' ')
        : 'Localized valence-bond σ/π electron pairs; no fractional bond-order delocalization required.',
  };
}

// ============================================================================
// 4. PER-CENTER VSEPR & HYBRIDIZATION GRAPH SOLVER + VFF 3D RELAXATION ENGINE
// ============================================================================
export interface ComposerNode2D {
  id: number;
  symbol: string;
  x2d: number;
  y2d: number;
}

export interface ComposerEdge2D {
  source: number;
  target: number;
  order: 1 | 1.33 | 1.5 | 2 | 3;
}

export interface AtomVseprDiagnostic {
  index: number;
  symbol: string;
  bondedAtoms: number; // m_i (sigma domains)
  bondOrderSum: number; // B_i
  lonePairs: number; // n_i
  stericNumber: number; // SN_i = m_i + n_i
  vseprNotation: string; // AX_m E_n
  hybridization: string; // sp, sp², sp³, sp³d, sp³d²
  geometry: string;
  electronicGeometry: string;
  idealAngleDeg: number;
  formalCharge: number; // FC_i = V_i - 2*n_i - B_i
  partialCharge: number;
  octetStatus: 'Valid' | 'Electron-Deficient' | 'Hypervalent' | 'Over-Valenced';
}

export interface BondDipoleArrow3D {
  sourceIndex: number;
  targetIndex: number;
  from: [number, number, number]; // δ+ end
  to: [number, number, number]; // δ- end
  magnitudeDebye: number;
}

export interface MolecularDipoleResult3D {
  netVectorDebye: [number, number, number];
  magnitudeDebye: number;
  bondDipoles: BondDipoleArrow3D[];
  lonePairDipoleContributionDebye: [number, number, number];
}

export interface SolvedMoleculeGraph3D {
  dossier: MoleculeDossier;
  atomDiagnostics: AtomVseprDiagnostic[];
  dipole3D: MolecularDipoleResult3D;
  isConnected: boolean;
  ihd: number;
}

/**
 * Returns ideal 3D VSEPR unit vectors for a given steric number (SN = m + n).
 */
export function getIdealVseprUnitVectors(stericNumber: number): Array<[number, number, number]> {
  if (stericNumber <= 1) return [[1, 0, 0]];
  if (stericNumber === 2) {
    return [
      [1, 0, 0],
      [-1, 0, 0],
    ];
  }
  if (stericNumber === 3) {
    return [
      [0, 1, 0],
      [Math.cos((210 * Math.PI) / 180), Math.sin((210 * Math.PI) / 180), 0],
      [Math.cos((330 * Math.PI) / 180), Math.sin((330 * Math.PI) / 180), 0],
    ];
  }
  if (stericNumber === 4) {
    return [
      [0, 1, 0],
      [0.9428, -0.3333, 0],
      [-0.4714, -0.3333, 0.8165],
      [-0.4714, -0.3333, -0.8165],
    ];
  }
  if (stericNumber === 5) {
    return [
      [1, 0, 0],
      [-0.5, 0.866, 0],
      [-0.5, -0.866, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
  }
  return [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
}

/**
 * Computes the 3D Molecular Dipole Vector (μ_net) and individual bond dipoles:
 *   μ_vec = Σ_{bonds (i,j)} q_{ij} (r_j - r_i) + Σ_{lone pairs k} μ_{LP, k}
 */
export function calculateMolecularDipole3D(
  atoms: MoleculeAtomNode[],
  bonds: MoleculeBondEdge[]
): MolecularDipoleResult3D {
  let muBondsX = 0;
  let muBondsY = 0;
  let muBondsZ = 0;
  const bondDipoles: BondDipoleArrow3D[] = [];

  for (const b of bonds) {
    const a1 = atoms[b.source];
    const a2 = atoms[b.target];
    if (!a1 || !a2) continue;

    const en1 = GRAPH_ELEMENT_SPECS[a1.symbol]?.electronegativity ?? 2.2;
    const en2 = GRAPH_ELEMENT_SPECS[a2.symbol]?.electronegativity ?? 2.2;
    const deltaEN = en2 - en1;

    const dx = a2.x - a1.x;
    const dy = a2.y - a1.y;
    const dz = a2.z - a1.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;

    // Effective bond dipole magnitude in Debye: q_ij * r_ij ≈ 0.88 * |ΔEN| * r_ij
    const mag = Math.abs(deltaEN) * dist * 0.88;
    // Direction points from less electronegative (δ+) to more electronegative (δ-)
    const sign = deltaEN >= 0 ? 1 : -1;
    const vx = (dx / dist) * mag * sign;
    const vy = (dy / dist) * mag * sign;
    const vz = (dz / dist) * mag * sign;

    muBondsX += vx;
    muBondsY += vy;
    muBondsZ += vz;

    if (mag > 0.08) {
      const fromAtom = deltaEN >= 0 ? a1 : a2;
      const toAtom = deltaEN >= 0 ? a2 : a1;
      bondDipoles.push({
        sourceIndex: deltaEN >= 0 ? b.source : b.target,
        targetIndex: deltaEN >= 0 ? b.target : b.source,
        from: [fromAtom.x, fromAtom.y, fromAtom.z],
        to: [toAtom.x, toAtom.y, toAtom.z],
        magnitudeDebye: Number(mag.toFixed(2)),
      });
    }
  }

  // Add directional lone-pair dipole contributions (Σ_k μ_{LP, k})
  // For any atom with lone pairs > 0, its lone pairs project opposite to the resultant of its bonded neighbors
  let muLpX = 0;
  let muLpY = 0;
  let muLpZ = 0;

  atoms.forEach((atom, idx) => {
    const lp = atom.lonePairs ?? 0;
    if (lp <= 0) return;

    const neighborEdges = bonds.filter((b) => b.source === idx || b.target === idx);
    if (neighborEdges.length === 0) return;

    let bx = 0;
    let by = 0;
    let bz = 0;
    for (const edge of neighborEdges) {
      const otherIdx = edge.source === idx ? edge.target : edge.source;
      const other = atoms[otherIdx];
      if (!other) continue;
      const dx = other.x - atom.x;
      const dy = other.y - atom.y;
      const dz = other.z - atom.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      bx += dx / len;
      by += dy / len;
      bz += dz / len;
    }

    const bNorm = Math.sqrt(bx * bx + by * by + bz * bz);
    // Only asymmetric centers (bNorm > 0.15) contribute net lone-pair dipole
    if (bNorm > 0.15) {
      const lpScale = 0.28 * Math.min(lp, 2); // ~0.28 D per asymmetric lone pair
      muLpX += (-bx / bNorm) * lpScale;
      muLpY += (-by / bNorm) * lpScale;
      muLpZ += (-bz / bNorm) * lpScale;
    }
  });

  const netX = muBondsX + muLpX;
  const netY = muBondsY + muLpY;
  const netZ = muBondsZ + muLpZ;
  const netMag = Math.sqrt(netX * netX + netY * netY + netZ * netZ);

  return {
    netVectorDebye: [Number(netX.toFixed(3)), Number(netY.toFixed(3)), Number(netZ.toFixed(3))],
    magnitudeDebye: Number((netMag < 0.04 ? 0 : netMag).toFixed(2)),
    bondDipoles,
    lonePairDipoleContributionDebye: [
      Number(muLpX.toFixed(3)),
      Number(muLpY.toFixed(3)),
      Number(muLpZ.toFixed(3)),
    ],
  };
}

/**
 * Full Cheminformatics Graph Solver:
 * - Detects delocalized π resonance (assigning 1.33 / 1.5 fractional bond orders)
 * - Evaluates per-center VSEPR (m_i, n_i, SN_i, AX_mE_n, hybridization, formal charge FC_i)
 * - Places 3D coordinates via VSEPR unit vectors and runs 50 iterations of damped VFF relaxation:
 *     E_total = Σ k_b(r_ij - r_0)^2 + Σ k_θ(θ_ijk - θ_0)^2 + Σ A / r_ij^6
 * - Computes 3D molecular dipole vector μ_vec and individual bond dipoles
 */
export function solveMolecularGraph3D(
  nodes: ComposerNode2D[],
  rawEdges: ComposerEdge2D[]
): SolvedMoleculeGraph3D {
  const n = nodes.length;
  const idToIndex = new Map<number, number>();
  nodes.forEach((node, idx) => idToIndex.set(node.id, idx));

  // 1. Detect delocalized π resonance first
  const resonance = detectDelocalizedPiResonance(nodes, rawEdges);

  const validEdges: MoleculeBondEdge[] = [];
  for (const edge of resonance.effectiveEdges) {
    const s = idToIndex.get(edge.source);
    const t = idToIndex.get(edge.target);
    if (s !== undefined && t !== undefined && s !== t) {
      validEdges.push({ source: s, target: t, order: edge.order });
    }
  }

  // Adjacency list
  const adj: Array<Array<{ to: number; order: 1 | 1.33 | 1.5 | 2 | 3 }>> = Array.from(
    { length: n },
    () => []
  );
  for (const e of validEdges) {
    adj[e.source].push({ to: e.target, order: e.order });
    adj[e.target].push({ to: e.source, order: e.order });
  }

  // Connectedness check via BFS
  const visited = new Array(n).fill(false);
  if (n > 0) {
    const queue = [0];
    visited[0] = true;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const nb of adj[curr]) {
        if (!visited[nb.to]) {
          visited[nb.to] = true;
          queue.push(nb.to);
        }
      }
    }
  }
  const isConnected = visited.every(Boolean);

  // 2. Per-Center VSEPR & Hybridization Evaluation
  const atomDiagnostics: AtomVseprDiagnostic[] = nodes.map((node, i) => {
    const spec = GRAPH_ELEMENT_SPECS[node.symbol] || GRAPH_ELEMENT_SPECS['C'];
    const m = adj[i].length; // sigma bond domains m_i
    const B = adj[i].reduce((acc, nb) => acc + nb.order, 0); // total bond order B_i
    const V = spec.valenceElectrons;

    const rawUnshared = Math.max(0, V - Math.round(B));
    const lonePairs = Math.floor(rawUnshared / 2); // n_i = floor((V_i - B_i)/2)
    const stericNumber = m + lonePairs; // SN_i = m_i + n_i
    const formalCharge = Math.round((V - 2 * lonePairs - B) * 100) / 100; // FC_i = V_i - 2n_i - B_i

    let hybridization = 's';
    let electronicGeometry = 'Linear';
    if (stericNumber === 2) {
      hybridization = 'sp';
      electronicGeometry = 'Linear';
    } else if (stericNumber === 3) {
      hybridization = 'sp²';
      electronicGeometry = 'Trigonal Planar';
    } else if (stericNumber === 4) {
      hybridization = 'sp³';
      electronicGeometry = 'Tetrahedral';
    } else if (stericNumber === 5) {
      hybridization = 'sp³d';
      electronicGeometry = 'Trigonal Bipyramidal';
    } else if (stericNumber >= 6) {
      hybridization = 'sp³d²';
      electronicGeometry = 'Octahedral';
    }

    const vseprNotation =
      m === 0
        ? 'Isolated Atom'
        : `AX${toSubscriptNumber(m)}${lonePairs > 0 ? `E${toSubscriptNumber(lonePairs)}` : ''}`;

    let geometry = 'Terminal';
    let idealAngleDeg = 109.5;
    if (m <= 1) {
      geometry = m === 1 ? 'Linear / Terminal' : 'Monoatomic';
      idealAngleDeg = 180.0;
    } else if (stericNumber === 2) {
      geometry = 'Linear (180°)';
      idealAngleDeg = 180.0;
    } else if (stericNumber === 3) {
      if (lonePairs === 0) {
        geometry = 'Trigonal Planar (120°)';
        idealAngleDeg = 120.0;
      } else {
        geometry = 'Bent / Angular (~119°)';
        idealAngleDeg = 119.0;
      }
    } else if (stericNumber === 4) {
      if (lonePairs === 0) {
        geometry = 'Tetrahedral (109.5°)';
        idealAngleDeg = 109.5;
      } else if (lonePairs === 1) {
        geometry = 'Trigonal Pyramidal (~107°)';
        idealAngleDeg = 107.0;
      } else {
        geometry = 'Bent / Angular (~104.5°)';
        idealAngleDeg = 104.5;
      }
    } else if (stericNumber === 5) {
      if (lonePairs === 0) {
        geometry = 'Trigonal Bipyramidal (90°/120°)';
        idealAngleDeg = 90.0;
      } else if (lonePairs === 1) {
        geometry = 'Seesaw / Disphenoidal';
        idealAngleDeg = 101.6;
      } else if (lonePairs === 2) {
        geometry = 'T-Shaped (~87.5°)';
        idealAngleDeg = 87.5;
      } else {
        geometry = 'Linear (180°)';
        idealAngleDeg = 180.0;
      }
    } else {
      if (lonePairs === 0) {
        geometry = 'Octahedral (90°)';
        idealAngleDeg = 90.0;
      } else if (lonePairs === 1) {
        geometry = 'Square Pyramidal';
        idealAngleDeg = 84.8;
      } else {
        geometry = 'Square Planar (90°)';
        idealAngleDeg = 90.0;
      }
    }

    // Electronegativity-derived partial charge δ_i
    let partialCharge = 0;
    for (const nb of adj[i]) {
      const nbSpec = GRAPH_ELEMENT_SPECS[nodes[nb.to].symbol] || GRAPH_ELEMENT_SPECS['C'];
      partialCharge += (nbSpec.electronegativity - spec.electronegativity) * 0.18;
    }
    partialCharge = Math.round(partialCharge * 100) / 100;

    // Valence shell rule validation
    const totalShellElectrons = Math.round(2 * B + 2 * lonePairs);
    let octetStatus: AtomVseprDiagnostic['octetStatus'] = 'Valid';
    if (node.symbol === 'H' || node.symbol === 'He') {
      octetStatus = totalShellElectrons <= 2 ? 'Valid' : 'Over-Valenced';
    } else if (spec.period === 2) {
      if (totalShellElectrons > 8) octetStatus = 'Over-Valenced';
      else if (totalShellElectrons < 8 && ['B', 'Be', 'Li'].includes(node.symbol))
        octetStatus = 'Electron-Deficient';
    } else {
      if (totalShellElectrons > 8) octetStatus = 'Hypervalent';
    }

    return {
      index: i,
      symbol: node.symbol,
      bondedAtoms: m,
      bondOrderSum: Number(B.toFixed(2)),
      lonePairs,
      stericNumber,
      vseprNotation,
      hybridization,
      geometry,
      electronicGeometry,
      idealAngleDeg,
      formalCharge,
      partialCharge,
      octetStatus,
    };
  });

  // 3. Initial 3D Coordinate Placement via Spanning-Tree VSEPR Unit Vectors
  const coords: Array<[number, number, number]> = Array.from({ length: n }, () => [0, 0, 0]);
  const placed = new Array(n).fill(false);

  // Pick central atom (highest degree) as root at (0,0,0)
  let rootIdx = 0;
  let maxDeg = -1;
  for (let i = 0; i < n; i++) {
    if (adj[i].length > maxDeg) {
      maxDeg = adj[i].length;
      rootIdx = i;
    }
  }

  if (n > 0) {
    placed[rootIdx] = true;
    coords[rootIdx] = [0, 0, 0];
    const bfs = [rootIdx];

    while (bfs.length > 0) {
      const u = bfs.shift()!;
      const uDiag = atomDiagnostics[u];
      const uSpec = GRAPH_ELEMENT_SPECS[nodes[u].symbol] || GRAPH_ELEMENT_SPECS['C'];
      const dirs = getIdealVseprUnitVectors(Math.max(uDiag.stericNumber, adj[u].length));

      let dirCursor = 0;
      for (const nb of adj[u]) {
        const v = nb.to;
        if (placed[v]) continue;

        const vSpec = GRAPH_ELEMENT_SPECS[nodes[v].symbol] || GRAPH_ELEMENT_SPECS['C'];
        const bondShrink =
          nb.order === 3 ? 0.80 : nb.order === 2 ? 0.88 : nb.order >= 1.33 ? 0.92 : 1.0;
        const r0 = (uSpec.covalentRadiusAngstrom + vSpec.covalentRadiusAngstrom) * bondShrink;

        const d = dirs[dirCursor % dirs.length];
        dirCursor++;

        // Slight deterministic staggered offset for multi-center chains
        const stagger = u === rootIdx ? 0 : (u % 2 === 0 ? 1 : -1) * 0.16;
        coords[v] = [
          coords[u][0] + d[0] * r0,
          coords[u][1] + d[1] * r0 + stagger,
          coords[u][2] + d[2] * r0,
        ];
        placed[v] = true;
        bfs.push(v);
      }
    }

    // Place any disconnected atoms
    let discOffset = 2.8;
    for (let i = 0; i < n; i++) {
      if (!placed[i]) {
        coords[i] = [discOffset, 0, 0];
        discOffset += 2.2;
      }
    }

    // 4. 50 Iterations of Damped VFF (Valence Force Field) Relaxation:
    //    E_total = Σ_bonds k_b (r_ij - r_0)^2 + Σ_angles k_θ (θ_ijk - θ_0)^2 + Σ_{nonbonded} A / r_ij^6
    const kb = 0.22; // harmonic bond-stretch stiffness
    const kTheta = 0.14; // harmonic angle-bending stiffness
    const vdwA = 0.035; // van der Waals r^-6 repulsion constant

    for (let iter = 0; iter < 50; iter++) {
      const damping = 1 - iter * 0.012; // gradually cool step size
      const forces: Array<[number, number, number]> = Array.from({ length: n }, () => [0, 0, 0]);

      // (a) Harmonic Bond-Stretching Forces: -∂/∂r [k_b (r_ij - r_0)^2]
      for (const edge of validEdges) {
        const i = edge.source;
        const j = edge.target;
        const specI = GRAPH_ELEMENT_SPECS[nodes[i].symbol] || GRAPH_ELEMENT_SPECS['C'];
        const specJ = GRAPH_ELEMENT_SPECS[nodes[j].symbol] || GRAPH_ELEMENT_SPECS['C'];
        const shrink =
          edge.order === 3 ? 0.80 : edge.order === 2 ? 0.88 : edge.order >= 1.33 ? 0.92 : 1.0;
        const r0 = (specI.covalentRadiusAngstrom + specJ.covalentRadiusAngstrom) * shrink;

        const dx = coords[j][0] - coords[i][0];
        const dy = coords[j][1] - coords[i][1];
        const dz = coords[j][2] - coords[i][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
        const diff = (dist - r0) * kb;

        const fx = (dx / dist) * diff;
        const fy = (dy / dist) * diff;
        const fz = (dz / dist) * diff;

        forces[i][0] += fx;
        forces[i][1] += fy;
        forces[i][2] += fz;
        forces[j][0] -= fx;
        forces[j][1] -= fy;
        forces[j][2] -= fz;
      }

      // (b) Harmonic Angle-Bending Forces around each non-terminal center j: k_θ (θ_ijk - θ_0)^2
      for (let j = 0; j < n; j++) {
        const nbs = adj[j];
        if (nbs.length < 2) continue;

        const theta0Rad = (atomDiagnostics[j].idealAngleDeg * Math.PI) / 180;
        const targetCos = Math.cos(theta0Rad);

        for (let a = 0; a < nbs.length; a++) {
          for (let b = a + 1; b < nbs.length; b++) {
            const i = nbs[a].to;
            const k = nbs[b].to;

            const v1x = coords[i][0] - coords[j][0];
            const v1y = coords[i][1] - coords[j][1];
            const v1z = coords[i][2] - coords[j][2];
            const r1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z) || 0.1;

            const v2x = coords[k][0] - coords[j][0];
            const v2y = coords[k][1] - coords[j][1];
            const v2z = coords[k][2] - coords[j][2];
            const r2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z) || 0.1;

            const u1x = v1x / r1;
            const u1y = v1y / r1;
            const u1z = v1z / r1;
            const u2x = v2x / r2;
            const u2y = v2y / r2;
            const u2z = v2z / r2;

            const cosTheta = Math.max(-0.999, Math.min(0.999, u1x * u2x + u1y * u2y + u1z * u2z));
            const deltaCos = cosTheta - targetCos;

            // Push terminal atoms i and k toward the ideal angle separation
            const chordX = coords[i][0] - coords[k][0];
            const chordY = coords[i][1] - coords[k][1];
            const chordZ = coords[i][2] - coords[k][2];
            const chordLen = Math.sqrt(chordX * chordX + chordY * chordY + chordZ * chordZ) || 0.1;

            // Ideal 1-3 chord distance from law of cosines
            const targetChord = Math.sqrt(Math.max(0.1, r1 * r1 + r2 * r2 - 2 * r1 * r2 * targetCos));
            const anglePush = (targetChord - chordLen) * kTheta * (1 + Math.abs(deltaCos));

            const afx = (chordX / chordLen) * anglePush;
            const afy = (chordY / chordLen) * anglePush;
            const afz = (chordZ / chordLen) * anglePush;

            forces[i][0] += afx;
            forces[i][1] += afy;
            forces[i][2] += afz;
            forces[k][0] -= afx;
            forces[k][1] -= afy;
            forces[k][2] -= afz;
          }
        }
      }

      // (c) Non-Bonded van der Waals Repulsion (r^-6 steric avoidance)
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const isBonded = adj[i].some((nb) => nb.to === j);
          if (isBonded) continue;

          const dx = coords[j][0] - coords[i][0];
          const dy = coords[j][1] - coords[i][1];
          const dz = coords[j][2] - coords[i][2];
          const distSq = dx * dx + dy * dy + dz * dz + 0.04;
          const dist = Math.sqrt(distSq);

          if (dist < 2.8) {
            const r6 = distSq * distSq * distSq;
            const rep = Math.min(0.18, (6 * vdwA) / Math.max(0.15, r6 * dist));
            const rx = (dx / dist) * rep;
            const ry = (dy / dist) * rep;
            const rz = (dz / dist) * rep;

            forces[i][0] -= rx;
            forces[i][1] -= ry;
            forces[i][2] -= rz;
            forces[j][0] += rx;
            forces[j][1] += ry;
            forces[j][2] += rz;
          }
        }
      }

      for (let i = 0; i < n; i++) {
        coords[i][0] += Math.max(-0.25, Math.min(0.25, forces[i][0] * damping));
        coords[i][1] += Math.max(-0.25, Math.min(0.25, forces[i][1] * damping));
        coords[i][2] += Math.max(-0.25, Math.min(0.25, forces[i][2] * damping));
      }
    }

    // Center centroid at origin
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let i = 0; i < n; i++) {
      cx += coords[i][0];
      cy += coords[i][1];
      cz += coords[i][2];
    }
    cx /= n;
    cy /= n;
    cz /= n;
    for (let i = 0; i < n; i++) {
      coords[i][0] = Number((coords[i][0] - cx).toFixed(3));
      coords[i][1] = Number((coords[i][1] - cy).toFixed(3));
      coords[i][2] = Number((coords[i][2] - cz).toFixed(3));
    }
  }

  // Compute exact Hill formula & Molecular Weight
  const counts: Record<string, number> = {};
  let mw = 0;
  for (const node of nodes) {
    counts[node.symbol] = (counts[node.symbol] || 0) + 1;
    mw += (GRAPH_ELEMENT_SPECS[node.symbol] || GRAPH_ELEMENT_SPECS['C']).atomicMass;
  }

  const orderedSymbols: string[] = [];
  if (counts['C']) {
    orderedSymbols.push('C');
    if (counts['H']) orderedSymbols.push('H');
    Object.keys(counts)
      .filter((s) => s !== 'C' && s !== 'H')
      .sort()
      .forEach((s) => orderedSymbols.push(s));
  } else {
    Object.keys(counts)
      .sort()
      .forEach((s) => orderedSymbols.push(s));
  }

  const hillFormula =
    orderedSymbols.map((s) => `${s}${toSubscriptNumber(counts[s])}`).join('') || 'Empty';
  const rawKey = orderedSymbols.map((s) => `${s}${counts[s] > 1 ? counts[s] : ''}`).join('');

  const atoms3D: MoleculeAtomNode[] = nodes.map((node, i) => ({
    symbol: node.symbol,
    x: coords[i][0],
    y: coords[i][1],
    z: coords[i][2],
    partialCharge: atomDiagnostics[i].partialCharge,
    formalCharge: atomDiagnostics[i].formalCharge,
    hybridization: atomDiagnostics[i].hybridization,
    lonePairs: atomDiagnostics[i].lonePairs,
  }));

  const bonds3D: MoleculeBondEdge[] = validEdges.map((e) => {
    const a1 = atoms3D[e.source];
    const a2 = atoms3D[e.target];
    const dist = Math.sqrt((a2.x - a1.x) ** 2 + (a2.y - a1.y) ** 2 + (a2.z - a1.z) ** 2);
    return {
      source: e.source,
      target: e.target,
      order: e.order,
      lengthAngstrom: Number(dist.toFixed(2)),
    };
  });

  // Compute 3D Molecular Dipole Vector & Individual Bond Dipoles
  const dipole3D = calculateMolecularDipole3D(atoms3D, bonds3D);

  const primaryDiag = atomDiagnostics[rootIdx] || {
    vseprNotation: 'AX',
    stericNumber: 1,
    hybridization: 's',
    geometry: 'Linear',
    electronicGeometry: 'Linear',
    idealAngleDeg: 180,
  };

  // Topological + Stoichiometric IHD
  const topologicalIHD = Math.max(
    0,
    validEdges.length - n + 1 + validEdges.reduce((acc, e) => acc + Math.max(0, e.order - 1), 0)
  );
  const ihd = calculateFormulaIHD(counts, Math.round(topologicalIHD));

  const sigmaBonds = validEdges.length;
  const piBonds = Math.round(
    validEdges.reduce((acc, e) => acc + (e.order >= 2 ? e.order - 1 : e.order > 1 ? 0.5 : 0), 0)
  );
  const lonePairsTotal = atomDiagnostics.reduce((acc, d) => acc + d.lonePairs, 0);

  const dossier: MoleculeDossier = {
    id: `custom-${rawKey.toLowerCase()}`,
    name: `Custom Topology (${hillFormula})`,
    iupacName: `User-Composed ${hillFormula} Structure`,
    commonNames: [hillFormula],
    casNumber: 'Custom Topology',
    smiles: rawKey,
    formula: hillFormula,
    condensedFormula: hillFormula,
    isomerGroup: rawKey,
    isomerType: 'Canonical' as IsomerClassification,
    category: counts['C'] ? 'Organic' : 'Inorganic',
    molecularWeight: Number(mw.toFixed(3)),
    degreeOfUnsaturation: ihd,
    pointGroup: dipole3D.magnitudeDebye < 0.05 ? 'Symmetric' : 'C₁ / Polar',
    bondType: resonance.hasResonance
      ? 'Delocalized Aromatic'
      : dipole3D.magnitudeDebye > 0.1
      ? 'Polar Covalent'
      : 'Covalent',
    geometry: primaryDiag.geometry,
    electronicGeometry: primaryDiag.electronicGeometry,
    vseprNotation: primaryDiag.vseprNotation,
    stericNumber: primaryDiag.stericNumber,
    bondAngle: `${primaryDiag.idealAngleDeg}° (Primary Center #${rootIdx + 1} ${nodes[rootIdx]?.symbol || ''})`,
    hybridization: primaryDiag.hybridization,
    polarity: dipole3D.magnitudeDebye >= 0.08 ? 'Polar' : 'Nonpolar',
    dipoleMomentDebye: dipole3D.magnitudeDebye,
    description: `Live 3D VSEPR & Valence Force Field (VFF) relaxed structure for ${hillFormula} (${n} atoms, ${sigmaBonds} σ bonds, ${piBonds} π bonds, IHD = ${ihd}).`,
    formationCriteria: {
      octetRuleStatus: atomDiagnostics.every((d) => d.octetStatus === 'Valid')
        ? 'All atoms satisfy octet/duet valence shell completion.'
        : 'Contains hypervalent, electron-deficient, or non-standard formal charge centers (inspect table below).',
      deltaEN: `Vectorial sum of bond dipoles + lone-pair vectors yields μ = ${dipole3D.magnitudeDebye.toFixed(2)} D`,
      sigmaBonds,
      piBonds,
      lonePairsTotal,
      resonanceDescription: resonance.description,
    },
    thermodynamics: {
      deltaHf: 'Computed via AI Dossier',
      deltaGf: 'Computed via AI Dossier',
      entropyS: 'Computed via AI Dossier',
      bondEnergies: bonds3D.slice(0, 6).map((b) => ({
        bond: `${atoms3D[b.source].symbol}${
          b.order === 3 ? '≡' : b.order === 2 ? '=' : b.order > 1 ? '⋯' : '–'
        }${atoms3D[b.target].symbol}`,
        lengthAngstrom: b.lengthAngstrom || 1.4,
        energyKjMol: b.order === 3 ? 839 : b.order === 2 ? 614 : b.order > 1 ? 518 : 348,
      })),
    },
    synthesisMethods: {
      industrial: {
        processName: 'Click "Generate Full AI Dossier" to synthesize industrial routes',
        equation: hillFormula,
        conditions: 'Standard catalytic or thermal conditions',
        catalyst: 'Dependent on functional group',
        mechanismSummary: 'Use the AI Synthesizer button to retrieve full synthesis pathways.',
      },
      laboratory: {
        methodName: 'Laboratory Preparation',
        equation: hillFormula,
        reagents: 'Stoichiometric precursors',
        conditions: 'Controlled laboratory glassware',
        procedureNotes: 'Use the AI Synthesizer button to retrieve laboratory procedures.',
      },
    },
    physicalProperties: {
      stateAtSTP: mw < 45 ? 'Gas' : mw < 160 ? 'Liquid' : 'Solid',
      appearance: 'Colorless / Crystalline',
      meltingPointC: '—',
      boilingPointC: '—',
      density: '—',
      solubility: dipole3D.magnitudeDebye > 0.4 ? 'Soluble in polar solvents' : 'Soluble in nonpolar solvents',
      pKa: '—',
      intermolecularForces:
        dipole3D.magnitudeDebye > 0.4
          ? ['Dipole–dipole interactions', 'London dispersion forces']
          : ['London dispersion forces'],
    },
    spectroscopy: {
      irBands: [],
      nmrShifts: [],
    },
    applications: {
      industrial: [],
      laboratory: [],
      biologicalAndMedical: [],
    },
    safety: {
      ghsHazards: ['Verify safety profile via AI Dossier'],
      nfpa704: { health: 1, flammability: 1, instability: 0 },
      handling: 'Standard laboratory PPE.',
    },
    atoms: atoms3D,
    bonds: bonds3D,
  };

  return {
    dossier,
    atomDiagnostics,
    dipole3D,
    isConnected,
    ihd,
  };
}
