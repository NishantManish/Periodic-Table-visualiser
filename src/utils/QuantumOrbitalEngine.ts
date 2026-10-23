import * as THREE from 'three';

export type QuantumOrbitalType =
  | 'bohr'
  | 'all'
  | 's'
  | 'p'
  | 'px'
  | 'py'
  | 'pz'
  | 'd'
  | 'dz2'
  | 'dx2-y2'
  | 'dxy'
  | 'dxz'
  | 'dyz'
  | 'f';

export type SpecificOrbitalSubshell = Exclude<QuantumOrbitalType, 'bohr' | 'all' | 'p' | 'd'>;

export interface SphericalHarmonicCoefficientInfo {
  orbital: SpecificOrbitalSubshell;
  l: number;
  m: number;
  normalizationConstant: number;
  symbolicExpression: string;
  angularNodes: number;
}

/**
 * Exact real spherical harmonic Y_l^m(θ, φ) normalization constants and quantum numbers (l, m).
 */
export const SPHERICAL_HARMONIC_COEFFICIENTS: Record<
  SpecificOrbitalSubshell,
  SphericalHarmonicCoefficientInfo
> = {
  s: {
    orbital: 's',
    l: 0,
    m: 0,
    normalizationConstant: 0.5 * Math.sqrt(1 / Math.PI), // ≈ 0.282095
    symbolicExpression: 'Y₀⁰ = ½√(1/π)',
    angularNodes: 0,
  },
  pz: {
    orbital: 'pz',
    l: 1,
    m: 0,
    normalizationConstant: 0.5 * Math.sqrt(3 / Math.PI), // ≈ 0.488603
    symbolicExpression: 'Y₁⁰ = ½√(3/π) cos(θ)',
    angularNodes: 1,
  },
  px: {
    orbital: 'px',
    l: 1,
    m: 1,
    normalizationConstant: 0.5 * Math.sqrt(3 / Math.PI),
    symbolicExpression: 'Y₁¹(c) = ½√(3/π) sin(θ) cos(φ)',
    angularNodes: 1,
  },
  py: {
    orbital: 'py',
    l: 1,
    m: -1,
    normalizationConstant: 0.5 * Math.sqrt(3 / Math.PI),
    symbolicExpression: 'Y₁⁻¹(s) = ½√(3/π) sin(θ) sin(φ)',
    angularNodes: 1,
  },
  dz2: {
    orbital: 'dz2',
    l: 2,
    m: 0,
    normalizationConstant: 0.25 * Math.sqrt(5 / Math.PI), // ≈ 0.315392
    symbolicExpression: 'Y₂⁰ = ¼√(5/π) (3cos²θ − 1)',
    angularNodes: 2,
  },
  dxz: {
    orbital: 'dxz',
    l: 2,
    m: 1,
    normalizationConstant: 0.5 * Math.sqrt(15 / Math.PI), // ≈ 1.092548
    symbolicExpression: 'Y₂¹(c) = ½√(15/π) sin(θ) cos(θ) cos(φ)',
    angularNodes: 2,
  },
  dyz: {
    orbital: 'dyz',
    l: 2,
    m: -1,
    normalizationConstant: 0.5 * Math.sqrt(15 / Math.PI),
    symbolicExpression: 'Y₂⁻¹(s) = ½√(15/π) sin(θ) cos(θ) sin(φ)',
    angularNodes: 2,
  },
  dxy: {
    orbital: 'dxy',
    l: 2,
    m: -2,
    normalizationConstant: 0.25 * Math.sqrt(15 / Math.PI), // ≈ 0.546274
    symbolicExpression: 'Y₂⁻²(s) = ¼√(15/π) sin²(θ) sin(2φ)',
    angularNodes: 2,
  },
  'dx2-y2': {
    orbital: 'dx2-y2',
    l: 2,
    m: 2,
    normalizationConstant: 0.25 * Math.sqrt(15 / Math.PI),
    symbolicExpression: 'Y₂²(c) = ¼√(15/π) sin²(θ) cos(2φ)',
    angularNodes: 2,
  },
  f: {
    orbital: 'f',
    l: 3,
    m: 0,
    normalizationConstant: 0.25 * Math.sqrt(7 / Math.PI), // ≈ 0.373176
    symbolicExpression: 'Y₃⁰ = ¼√(7/π) cos(θ)(5cos²θ − 3)',
    angularNodes: 3,
  },
};

/**
 * Returns the spherical harmonic metadata and normalization coefficient for a given orbital.
 */
export function getSphericalHarmonicCoefficients(
  orbital: SpecificOrbitalSubshell
): SphericalHarmonicCoefficientInfo {
  return SPHERICAL_HARMONIC_COEFFICIENTS[orbital] || SPHERICAL_HARMONIC_COEFFICIENTS.s;
}

/**
 * Evaluates the normalized angular spherical harmonic amplitude Y_l^m(θ, φ) for 3D rendering.
 */
export function evaluateSphericalHarmonic(
  orbital: SpecificOrbitalSubshell,
  theta: number,
  phi: number
): number {
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const sinP = Math.sin(phi);
  const cosP = Math.cos(phi);

  switch (orbital) {
    case 's':
      return 0.5;
    case 'pz':
      return cosT;
    case 'px':
      return sinT * cosP;
    case 'py':
      return sinT * sinP;
    case 'dz2':
      return 0.5 * (3 * cosT * cosT - 1);
    case 'dxz':
      return Math.sqrt(3) * sinT * cosT * cosP;
    case 'dyz':
      return Math.sqrt(3) * sinT * cosT * sinP;
    case 'dxy':
      return Math.sqrt(3) * 0.5 * sinT * sinT * Math.sin(2 * phi);
    case 'dx2-y2':
      return Math.sqrt(3) * 0.5 * sinT * sinT * Math.cos(2 * phi);
    case 'f':
      return 0.5 * cosT * (5 * cosT * cosT - 3);
    default:
      return 0.5;
  }
}

/**
 * Builds a parametric 3D THREE.BufferGeometry for a real spherical harmonic Y_l^m(θ, φ)
 * where radial distance r(θ, φ) = scale * |Y_l^m(θ, φ)| and vertex color encodes wavefunction phase:
 *   ψ > 0 -> Electric Cyan (#38bdf8)
 *   ψ < 0 -> Magenta / Rose (#f43f5e)
 */
export function buildSphericalHarmonicGeometry(
  orbital: SpecificOrbitalSubshell,
  scale: number
): THREE.BufferGeometry {
  const nTheta = 56;
  const nPhi = 72;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const posColor = new THREE.Color('#38bdf8'); // ψ > 0
  const negColor = new THREE.Color('#f43f5e'); // ψ < 0

  for (let i = 0; i <= nTheta; i++) {
    const theta = (i / nTheta) * Math.PI;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    for (let j = 0; j <= nPhi; j++) {
      const phi = (j / nPhi) * Math.PI * 2;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);

      const yVal = evaluateSphericalHarmonic(orbital, theta, phi);
      const r = Math.abs(yVal) * scale;

      const x = r * sinT * cosP;
      const y = r * cosT;
      const z = r * sinT * sinP;

      positions.push(x, y, z);

      const c = yVal >= 0 ? posColor : negColor;
      colors.push(c.r, c.g, c.b);
    }
  }

  for (let i = 0; i < nTheta; i++) {
    for (let j = 0; j < nPhi; j++) {
      const a = i * (nPhi + 1) + j;
      const b = (i + 1) * (nPhi + 1) + j;
      const c = (i + 1) * (nPhi + 1) + (j + 1);
      const d = i * (nPhi + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setIndex(indices);
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  return geom;
}

export interface OrbitalCloudBufferData {
  positions: Float32Array;
  colors: Float32Array;
  phases: Int8Array;
  coefficientInfo: SphericalHarmonicCoefficientInfo;
}

/**
 * Samples a Monte Carlo probability density cloud |ψ_{nlm}(r, θ, φ)|² for s, p, d, f orbitals.
 * Output typed arrays (`positions`, `colors`, `phases`) are formatted for direct ingestion by
 * Three.js `BufferGeometry` or `@react-three/fiber` `<points>` components.
 */
export function sampleOrbitalProbabilityCloud(
  orbital: QuantumOrbitalType,
  principalN: number,
  scale: number = 5.2,
  numPoints: number = 15000
): OrbitalCloudBufferData {
  const posArr = new Float32Array(numPoints * 3);
  const colArr = new Float32Array(numPoints * 3);
  const phaseArr = new Int8Array(numPoints);

  const posColor = new THREE.Color('#38bdf8'); // ψ > 0
  const negColor = new THREE.Color('#f43f5e'); // ψ < 0

  const targetOrbital: SpecificOrbitalSubshell =
    orbital === 'all' || orbital === 'bohr'
      ? principalN >= 6
        ? 'f'
        : principalN >= 3
        ? 'dz2'
        : principalN >= 2
        ? 'pz'
        : 's'
      : orbital === 'p'
      ? 'pz'
      : orbital === 'd'
      ? 'dz2'
      : orbital;

  const coefficientInfo = getSphericalHarmonicCoefficients(targetOrbital);

  // Deterministic LCG sequence so Monte Carlo cloud never flickers across React renders
  let seed = principalN * 9973 + targetOrbital.charCodeAt(0) * 313;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  let accepted = 0;
  let attempts = 0;
  const maxR = scale * 1.35;

  while (accepted < numPoints && attempts < numPoints * 25) {
    attempts++;
    const u = nextRand() * 2 - 1; // cos(theta) in [-1, 1]
    const theta = Math.acos(u);
    const phi = nextRand() * Math.PI * 2;
    const rNorm = Math.pow(nextRand(), 0.65);
    const r = rNorm * maxR;

    // Radial wavefunction R_{nl}(r) with radial nodes (n - l - 1)
    let radialAmp = Math.exp(-rNorm * 2.2);
    if (targetOrbital === 's' && principalN >= 2) {
      radialAmp *= Math.cos(rNorm * (principalN - 0.5) * Math.PI);
    } else if (targetOrbital !== 's') {
      radialAmp *= Math.pow(rNorm, Math.min(2, coefficientInfo.l * 0.65)) * 1.85;
    }

    const angularAmp = evaluateSphericalHarmonic(targetOrbital, theta, phi);
    const psi = radialAmp * angularAmp;
    const probDensity = psi * psi;

    if (nextRand() * 0.48 <= probDensity) {
      const sinT = Math.sin(theta);
      const x = r * sinT * Math.cos(phi);
      const y = r * u;
      const z = r * sinT * Math.sin(phi);

      posArr[accepted * 3] = x;
      posArr[accepted * 3 + 1] = y;
      posArr[accepted * 3 + 2] = z;

      const isPositive = psi >= 0;
      phaseArr[accepted] = isPositive ? 1 : -1;

      const c = isPositive ? posColor : negColor;
      colArr[accepted * 3] = c.r;
      colArr[accepted * 3 + 1] = c.g;
      colArr[accepted * 3 + 2] = c.b;
      accepted++;
    }
  }

  return {
    positions: posArr,
    colors: colArr,
    phases: phaseArr,
    coefficientInfo,
  };
}
