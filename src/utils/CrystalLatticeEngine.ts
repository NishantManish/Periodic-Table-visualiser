import * as THREE from 'three';

export type LatticeSystemType =
  | 'FCC'
  | 'BCC'
  | 'HCP'
  | 'Diamond Cubic'
  | 'Simple Cubic'
  | 'Rhombohedral'
  | 'Orthorhombic';

export type MillerPlaneType = 'none' | '100' | '110' | '111';

export interface LatticeMetadata {
  id: LatticeSystemType;
  title: string;
  bravaisClass: string;
  spaceGroup: string;
  atomsPerUnitCell: number;
  coordinationNumber: number;
  packingEfficiencyPercent: number;
  latticeRelation: string;
  stackingSequence: string;
  description: string;
}

export interface LatticeSite {
  pos: [number, number, number];
  fractional: [number, number, number];
  role: 'corner' | 'face' | 'body' | 'tetrahedral' | 'interior';
}

export interface MillerPlaneDescriptor {
  hkl: [number, number, number];
  label: string;
  interplanarSpacingFormula: string;
  normalVector: [number, number, number];
  position: [number, number, number];
  quaternion: [number, number, number, number];
  color: string;
}

export interface SupercellGeometryData {
  sites: LatticeSite[];
  bonds: Array<[[number, number, number], [number, number, number]]>;
  wireframeLines: Array<[[number, number, number], [number, number, number]]>;
  boundingBoxLines: Array<[[number, number, number], [number, number, number]]>;
  millerPlanes: Record<Exclude<MillerPlaneType, 'none'>, MillerPlaneDescriptor>;
}

export const LATTICE_METADATA: Record<LatticeSystemType, LatticeMetadata> = {
  FCC: {
    id: 'FCC',
    title: 'Face-Centered Cubic (FCC / cF4)',
    bravaisClass: 'Cubic Close-Packed (CCP)',
    spaceGroup: 'Fm-3m (No. 225)',
    atomsPerUnitCell: 4,
    coordinationNumber: 12,
    packingEfficiencyPercent: 74.05,
    latticeRelation: 'a = 2√2 · r ≈ 2.828 r',
    stackingSequence: 'ABCABC… (along [111])',
    description:
      'Atoms occupy all 8 cube corners (8 × 1/8 = 1) and all 6 face centers (6 × 1/2 = 3), giving Z = 4 atoms per unit cell. Achieves the Kepler maximum sphere-packing density (74.05%) with 12 nearest neighbors and isotropic slip planes {111}, making FCC metals (Cu, Al, Au, Ag, Pt, Ni) highly ductile.',
  },
  BCC: {
    id: 'BCC',
    title: 'Body-Centered Cubic (BCC / cI2)',
    bravaisClass: 'Body-Centered Cubic',
    spaceGroup: 'Im-3m (No. 229)',
    atomsPerUnitCell: 2,
    coordinationNumber: 8,
    packingEfficiencyPercent: 68.02,
    latticeRelation: 'a = 4r / √3 ≈ 2.309 r',
    stackingSequence: 'ABAB… (along [110])',
    description:
      'Atoms sit at all 8 cube corners (8 × 1/8 = 1) plus 1 atom at the exact body center (1/2, 1/2, 1/2), totaling Z = 2 atoms per unit cell. Atoms touch along the body diagonal [111], yielding CN = 8 and APF = 68.02%. Characteristic of alkali metals (Li, Na, K) and refractory transition metals (Fe, Cr, W, Mo, V).',
  },
  HCP: {
    id: 'HCP',
    title: 'Hexagonal Close-Packed (HCP / hP2)',
    bravaisClass: 'Hexagonal Primitive Close-Packed',
    spaceGroup: 'P6₃/mmc (No. 194)',
    atomsPerUnitCell: 6,
    coordinationNumber: 12,
    packingEfficiencyPercent: 74.05,
    latticeRelation: 'a = 2r, c/a = √(8/3) ≈ 1.633',
    stackingSequence: 'ABABAB… (along [0001])',
    description:
      'Hexagonal prism containing 12 corner atoms (12 × 1/6 = 2), 2 basal face-center atoms (2 × 1/2 = 1), and 3 interior mid-plane atoms in trigonal interstices (3 × 1 = 3), giving Z = 6 atoms per hexagonal prism (2 per primitive cell), CN = 12, and 74.05% packing efficiency (Mg, Ti, Zn, Co, Zr, Be).',
  },
  'Diamond Cubic': {
    id: 'Diamond Cubic',
    title: 'Diamond Cubic / Tetrahedral (cF8)',
    bravaisClass: 'Two Interpenetrating FCC Lattices',
    spaceGroup: 'Fd-3m (No. 227)',
    atomsPerUnitCell: 8,
    coordinationNumber: 4,
    packingEfficiencyPercent: 34.01,
    latticeRelation: 'a = 8r / √3 ≈ 4.619 r',
    stackingSequence: 'sp³ Tetrahedral Network',
    description:
      'Consists of two interpenetrating FCC Bravais lattices offset by (1/4, 1/4, 1/4) along the body diagonal. Contains Z = 8 atoms per unit cell (1 from corners + 3 from faces + 4 inside tetrahedral sites). Directional sp³ covalent bonds enforce CN = 4 (109.5°) and an open APF of 34.01% (C-Diamond, Si, Ge, α-Sn).',
  },
  'Simple Cubic': {
    id: 'Simple Cubic',
    title: 'Simple / Primitive Cubic (SC / cP1)',
    bravaisClass: 'Primitive Cubic',
    spaceGroup: 'Pm-3m (No. 221)',
    atomsPerUnitCell: 1,
    coordinationNumber: 6,
    packingEfficiencyPercent: 52.36,
    latticeRelation: 'a = 2r',
    stackingSequence: 'AAAA… (along [100])',
    description:
      'Atoms sit only at the 8 corners of the cube (8 × 1/8 = 1 atom per unit cell) and touch along the cube edges. Yielding octahedral coordination CN = 6 and a low packing efficiency of 52.36%. Alpha-Polonium (α-Po) is the only element that crystallizes in a pure simple cubic lattice at STP.',
  },
  Rhombohedral: {
    id: 'Rhombohedral',
    title: 'Rhombohedral / Trigonal (hR2)',
    bravaisClass: 'Trigonal Rhombohedral',
    spaceGroup: 'R-3m (No. 166)',
    atomsPerUnitCell: 2,
    coordinationNumber: 6,
    packingEfficiencyPercent: 48.0,
    latticeRelation: 'a = b = c, α = β = γ ≠ 90°',
    stackingSequence: 'Puckered Bilayers (3+3 CN)',
    description:
      'A cube stretched or compressed along its [111] body diagonal so α = β = γ ≠ 90°. Adopted by Boron, Mercury, Arsenic, Antimony, Bismuth, and Samarium, often featuring 3 short covalent intralayer bonds and 3 longer van der Waals interlayer contacts.',
  },
  Orthorhombic: {
    id: 'Orthorhombic',
    title: 'Orthorhombic (oP / oF)',
    bravaisClass: 'Orthorhombic (a ≠ b ≠ c, 90°)',
    spaceGroup: 'Cmce / Fddd',
    atomsPerUnitCell: 4,
    coordinationNumber: 6,
    packingEfficiencyPercent: 54.5,
    latticeRelation: 'a ≠ b ≠ c, α = β = γ = 90°',
    stackingSequence: 'Anisotropic Rectangular Prism',
    description:
      'Three mutually perpendicular axes of unequal lengths (a ≠ b ≠ c, α = β = γ = 90°). Characteristic of Gallium (which contains Ga₂ dimers), Orthorhombic α-Sulfur (S₈ crowns), Phosphorus (black), Bromine, Iodine, and Uranium.',
  },
};

export function inferElementLatticeSystem(
  crystalStructure: string,
  symbol: string
): LatticeSystemType {
  const lower = (crystalStructure || '').toLowerCase();
  if (['C', 'Si', 'Ge'].includes(symbol) || lower.includes('diamond')) return 'Diamond Cubic';
  if (lower.includes('face-centered') || lower.includes('fcc')) return 'FCC';
  if (lower.includes('body-centered') || lower.includes('bcc')) return 'BCC';
  if (lower.includes('hexagonal') || lower.includes('hcp')) return 'HCP';
  if (lower.includes('rhombohedral') || lower.includes('trigonal')) return 'Rhombohedral';
  if (
    lower.includes('orthorhombic') ||
    lower.includes('monoclinic') ||
    lower.includes('tetragonal')
  )
    return 'Orthorhombic';
  if (lower.includes('simple cubic') || symbol === 'Po') return 'Simple Cubic';
  return 'FCC';
}

/**
 * Returns fractional basis positions within a single [0, 1]^3 unit cell for cubic/orthorhombic/rhombohedral systems.
 */
export function getUnitCellFractionalBasis(
  system: Exclude<LatticeSystemType, 'HCP'>
): Array<{ frac: [number, number, number]; role: LatticeSite['role'] }> {
  const basis: Array<{ frac: [number, number, number]; role: LatticeSite['role'] }> = [];

  // 8 Corners of unit cell
  for (let dx = 0; dx <= 1; dx++) {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dz = 0; dz <= 1; dz++) {
        basis.push({ frac: [dx, dy, dz], role: 'corner' });
      }
    }
  }

  // Body-centered atom at (1/2, 1/2, 1/2)
  if (system === 'BCC' || system === 'Rhombohedral') {
    basis.push({ frac: [0.5, 0.5, 0.5], role: 'body' });
  }

  // 6 Face-centered atoms
  if (system === 'FCC' || system === 'Diamond Cubic' || system === 'Orthorhombic') {
    basis.push(
      { frac: [0.5, 0.5, 0], role: 'face' },
      { frac: [0.5, 0.5, 1], role: 'face' },
      { frac: [0.5, 0, 0.5], role: 'face' },
      { frac: [0.5, 1, 0.5], role: 'face' },
      { frac: [0, 0.5, 0.5], role: 'face' },
      { frac: [1, 0.5, 0.5], role: 'face' }
    );
  }

  // 4 Interior tetrahedral sp3 sites for Diamond Cubic (Fd-3m)
  if (system === 'Diamond Cubic') {
    basis.push(
      { frac: [0.25, 0.25, 0.25], role: 'tetrahedral' },
      { frac: [0.75, 0.75, 0.25], role: 'tetrahedral' },
      { frac: [0.75, 0.25, 0.75], role: 'tetrahedral' },
      { frac: [0.25, 0.75, 0.75], role: 'tetrahedral' }
    );
  }

  return basis;
}

/**
 * Generates an outer wireframe bounding box for an N x N x N supercell.
 */
export function generateWireframeBoundingBox(
  supercell: number,
  toWorld: (fx: number, fy: number, fz: number) => [number, number, number]
): Array<[[number, number, number], [number, number, number]]> {
  const c000 = toWorld(0, 0, 0);
  const c100 = toWorld(supercell, 0, 0);
  const c010 = toWorld(0, supercell, 0);
  const c001 = toWorld(0, 0, supercell);
  const c110 = toWorld(supercell, supercell, 0);
  const c101 = toWorld(supercell, 0, supercell);
  const c011 = toWorld(0, supercell, supercell);
  const c111 = toWorld(supercell, supercell, supercell);

  return [
    [c000, c100],
    [c000, c010],
    [c000, c001],
    [c100, c110],
    [c100, c101],
    [c010, c110],
    [c010, c011],
    [c001, c101],
    [c001, c011],
    [c110, c111],
    [c101, c111],
    [c011, c111],
  ];
}

/**
 * Computes Miller plane descriptors (hkl) for (100), (110), and (111) crystallographic diffraction planes.
 */
export function generateMillerPlanes(): Record<
  Exclude<MillerPlaneType, 'none'>,
  MillerPlaneDescriptor
> {
  const q100 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  const q110 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0));
  const q111 = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 1, 1).normalize()
  );

  return {
    '100': {
      hkl: [1, 0, 0],
      label: '(100) Cube Face Plane',
      interplanarSpacingFormula: 'd₁₀₀ = a / √(1² + 0² + 0²) = a',
      normalVector: [1, 0, 0],
      position: [0.4, 0, 0],
      quaternion: [q100.x, q100.y, q100.z, q100.w],
      color: '#38bdf8',
    },
    '110': {
      hkl: [1, 1, 0],
      label: '(110) Diagonal Slip Plane (BCC Primary)',
      interplanarSpacingFormula: 'd₁₁₀ = a / √2 ≈ 0.707 a',
      normalVector: [Math.SQRT1_2, 0, Math.SQRT1_2],
      position: [0, 0, 0],
      quaternion: [q110.x, q110.y, q110.z, q110.w],
      color: '#f59e0b',
    },
    '111': {
      hkl: [1, 1, 1],
      label: '(111) Octahedral Close-Packed Plane (FCC Primary)',
      interplanarSpacingFormula: 'd₁₁₁ = a / √3 ≈ 0.577 a',
      normalVector: [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)],
      position: [0, 0, 0],
      quaternion: [q111.x, q111.y, q111.z, q111.w],
      color: '#ec4899',
    },
  };
}

/**
 * Expands a unit cell (BCC, FCC, HCP, Diamond Cubic, Simple Cubic, Rhombohedral, Orthorhombic)
 * into an N x N x N supercell with deduplicated atomic sites, nearest-neighbor coordination bonds,
 * unit-cell wireframe cages, outer bounding box, and Miller plane transforms.
 */
export function expandSupercell(
  system: LatticeSystemType,
  supercell: number = 1
): SupercellGeometryData {
  const n = Math.max(1, Math.min(3, Math.round(supercell)));
  const sites: LatticeSite[] = [];
  const wireframeLines: Array<[[number, number, number], [number, number, number]]> = [];
  let boundingBoxLines: Array<[[number, number, number], [number, number, number]]> = [];
  const cellScale = 1.65;

  if (system === 'HCP') {
    const rHex = cellScale * 0.95;
    const hHex = cellScale * 1.45;
    const numLayers = n + 1;
    const layers = Array.from(
      { length: numLayers },
      (_, idx) => (idx - (numLayers - 1) * 0.5) * hHex
    );

    const hexAngles = [0, 60, 120, 180, 240, 300].map((d) => (d * Math.PI) / 180);

    for (let lIdx = 0; lIdx < layers.length; lIdx++) {
      const y = layers[lIdx];
      sites.push({ pos: [0, y, 0], fractional: [0, lIdx, 0], role: 'face' });
      const ringPts: Array<[number, number, number]> = [];
      for (const ang of hexAngles) {
        const px = Number((rHex * Math.cos(ang)).toFixed(3));
        const pz = Number((rHex * Math.sin(ang)).toFixed(3));
        sites.push({
          pos: [px, y, pz],
          fractional: [Number((px / rHex).toFixed(2)), lIdx, Number((pz / rHex).toFixed(2))],
          role: 'corner',
        });
        ringPts.push([px, y, pz]);
      }
      for (let i = 0; i < 6; i++) {
        wireframeLines.push([ringPts[i], ringPts[(i + 1) % 6]]);
      }
    }

    for (const ang of hexAngles) {
      const px = Number((rHex * Math.cos(ang)).toFixed(3));
      const pz = Number((rHex * Math.sin(ang)).toFixed(3));
      wireframeLines.push([
        [px, layers[0], pz],
        [px, layers[layers.length - 1], pz],
      ]);
    }

    for (let l = 0; l < layers.length - 1; l++) {
      const yMid = (layers[l] + layers[l + 1]) * 0.5;
      const rMid = rHex * 0.577;
      for (const deg of [30, 150, 270]) {
        const rad = (deg * Math.PI) / 180;
        const px = Number((rMid * Math.cos(rad)).toFixed(3));
        const pz = Number((rMid * Math.sin(rad)).toFixed(3));
        sites.push({
          pos: [px, yMid, pz],
          fractional: [0.33, l + 0.5, 0.33],
          role: 'interior',
        });
      }
    }
    boundingBoxLines = [...wireframeLines];
  } else {
    const sx = system === 'Orthorhombic' ? 0.85 : 1.0;
    const sy = system === 'Orthorhombic' ? 1.22 : 1.0;
    const sz = system === 'Orthorhombic' ? 0.96 : 1.0;
    const shear = system === 'Rhombohedral' ? 0.22 : 0.0;

    const toWorld = (fx: number, fy: number, fz: number): [number, number, number] => {
      const cx = fx - n * 0.5;
      const cy = fy - n * 0.5;
      const cz = fz - n * 0.5;
      const wx = (cx * sx + cy * shear) * cellScale;
      const wy = cy * sy * cellScale;
      const wz = (cz * sz + cy * shear * 0.5) * cellScale;
      return [Number(wx.toFixed(3)), Number(wy.toFixed(3)), Number(wz.toFixed(3))];
    };

    const basis = getUnitCellFractionalBasis(system);
    const siteMap = new Map<string, LatticeSite>();

    const addSite = (fx: number, fy: number, fz: number, role: LatticeSite['role']) => {
      const key = `${fx.toFixed(2)},${fy.toFixed(2)},${fz.toFixed(2)}`;
      if (!siteMap.has(key)) {
        siteMap.set(key, {
          pos: toWorld(fx, fy, fz),
          fractional: [fx, fy, fz],
          role,
        });
      }
    };

    for (let ix = 0; ix < n; ix++) {
      for (let iy = 0; iy < n; iy++) {
        for (let iz = 0; iz < n; iz++) {
          for (const item of basis) {
            addSite(
              ix + item.frac[0],
              iy + item.frac[1],
              iz + item.frac[2],
              item.role
            );
          }

          // 12 edges per individual unit cell
          const c000 = toWorld(ix, iy, iz);
          const c100 = toWorld(ix + 1, iy, iz);
          const c010 = toWorld(ix, iy + 1, iz);
          const c001 = toWorld(ix, iy, iz + 1);
          const c110 = toWorld(ix + 1, iy + 1, iz);
          const c101 = toWorld(ix + 1, iy, iz + 1);
          const c011 = toWorld(ix, iy + 1, iz + 1);
          const c111 = toWorld(ix + 1, iy + 1, iz + 1);

          wireframeLines.push(
            [c000, c100],
            [c000, c010],
            [c000, c001],
            [c100, c110],
            [c100, c101],
            [c010, c110],
            [c010, c011],
            [c001, c101],
            [c001, c011],
            [c110, c111],
            [c101, c111],
            [c011, c111]
          );
        }
      }
    }

    sites.push(...Array.from(siteMap.values()));
    boundingBoxLines = generateWireframeBoundingBox(n, toWorld);
  }

  // Compute nearest-neighbor coordination bonds
  const bonds: Array<[[number, number, number], [number, number, number]]> = [];
  let minPairDist = Infinity;
  for (let i = 0; i < sites.length; i++) {
    for (let j = i + 1; j < sites.length; j++) {
      const dx = sites[i].pos[0] - sites[j].pos[0];
      const dy = sites[i].pos[1] - sites[j].pos[1];
      const dz = sites[i].pos[2] - sites[j].pos[2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > 0.1 && d < minPairDist) minPairDist = d;
    }
  }

  const cutoff = minPairDist * 1.16;
  for (let i = 0; i < sites.length; i++) {
    for (let j = i + 1; j < sites.length; j++) {
      const dx = sites[i].pos[0] - sites[j].pos[0];
      const dy = sites[i].pos[1] - sites[j].pos[1];
      const dz = sites[i].pos[2] - sites[j].pos[2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d <= cutoff) {
        bonds.push([sites[i].pos, sites[j].pos]);
      }
    }
  }

  return {
    sites,
    bonds,
    wireframeLines,
    boundingBoxLines,
    millerPlanes: generateMillerPlanes(),
  };
}
