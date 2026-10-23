import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { MoleculeDossier, MoleculeAtomNode } from '@/types';
import { RotateCcw, Eye, Compass, RefreshCw, Columns } from 'lucide-react';
import { calculateMolecularDipole3D } from '@/utils/molecularGraphEngine';

export type RenderStyle3D = 'ball-and-stick' | 'space-filling' | 'licorice' | 'esp-polarity';

interface MoleculeCanvas3DProps {
  molecule: MoleculeDossier;
  comparisonMolecule?: MoleculeDossier | null;
  renderStyle: RenderStyle3D;
  showLonePairs: boolean;
  showDipoleVector: boolean;
  showAtomLabels: boolean;
  showBondLengths: boolean;
  showBondAngles: boolean;
  selectedAtomIndex: number | null;
  onSelectAtom?: (index: number | null) => void;
}

// Scientific CPK Element Color & Radius Palette (in Ångströms)
export const CPK_PALETTE: Record<
  string,
  { color: string; covalentRadius: number; vdwRadius: number; electronegativity: number }
> = {
  H: { color: '#F8FAFC', covalentRadius: 0.31, vdwRadius: 1.20, electronegativity: 2.20 },
  B: { color: '#FB7185', covalentRadius: 0.84, vdwRadius: 1.92, electronegativity: 2.04 },
  C: { color: '#334155', covalentRadius: 0.76, vdwRadius: 1.70, electronegativity: 2.55 },
  N: { color: '#2563EB', covalentRadius: 0.71, vdwRadius: 1.55, electronegativity: 3.04 },
  O: { color: '#EF4444', covalentRadius: 0.66, vdwRadius: 1.52, electronegativity: 3.44 },
  F: { color: '#10B981', covalentRadius: 0.57, vdwRadius: 1.47, electronegativity: 3.98 },
  Na: { color: '#8B5CF6', covalentRadius: 1.66, vdwRadius: 2.27, electronegativity: 0.93 },
  Mg: { color: '#22C55E', covalentRadius: 1.41, vdwRadius: 1.73, electronegativity: 1.31 },
  Al: { color: '#94A3B8', covalentRadius: 1.21, vdwRadius: 1.84, electronegativity: 1.61 },
  Si: { color: '#D97706', covalentRadius: 1.11, vdwRadius: 2.10, electronegativity: 1.90 },
  P: { color: '#F97316', covalentRadius: 1.07, vdwRadius: 1.80, electronegativity: 2.19 },
  S: { color: '#EAB308', covalentRadius: 1.05, vdwRadius: 1.80, electronegativity: 2.58 },
  Cl: { color: '#16A34A', covalentRadius: 1.02, vdwRadius: 1.75, electronegativity: 3.16 },
  K: { color: '#7C3AED', covalentRadius: 2.03, vdwRadius: 2.75, electronegativity: 0.82 },
  Ca: { color: '#15803D', covalentRadius: 1.76, vdwRadius: 2.31, electronegativity: 1.00 },
  Cr: { color: '#60A5FA', covalentRadius: 1.39, vdwRadius: 2.00, electronegativity: 1.66 },
  Fe: { color: '#EA580C', covalentRadius: 1.32, vdwRadius: 2.00, electronegativity: 1.83 },
  Cu: { color: '#B45309', covalentRadius: 1.32, vdwRadius: 1.40, electronegativity: 1.90 },
  Br: { color: '#991B1B', covalentRadius: 1.20, vdwRadius: 1.85, electronegativity: 2.96 },
  I: { color: '#6B21A8', covalentRadius: 1.39, vdwRadius: 1.98, electronegativity: 2.66 },
  Xe: { color: '#06B6D4', covalentRadius: 1.40, vdwRadius: 2.16, electronegativity: 2.60 },
};

function getElementMeta(symbol: string) {
  return (
    CPK_PALETTE[symbol] || {
      color: '#6366F1',
      covalentRadius: 0.85,
      vdwRadius: 1.75,
      electronegativity: 2.2,
    }
  );
}

/**
 * Electrostatic Potential (ESP) color map:
 * Negative partial charge (δ−, electron rich) -> Crimson Red (#EF4444)
 * Neutral (0) -> Silver/White (#E2E8F0)
 * Positive partial charge (δ+, electron poor) -> Royal Blue (#2563EB)
 */
function getEspColor(partialCharge: number = 0): string {
  const clamped = Math.max(-0.8, Math.min(0.8, partialCharge));
  if (clamped < -0.05) {
    const t = Math.min(1, Math.abs(clamped) / 0.65);
    const c = new THREE.Color('#E2E8F0').lerp(new THREE.Color('#DC2626'), t);
    return `#${c.getHexString()}`;
  }
  if (clamped > 0.05) {
    const t = Math.min(1, clamped / 0.65);
    const c = new THREE.Color('#E2E8F0').lerp(new THREE.Color('#2563EB'), t);
    return `#${c.getHexString()}`;
  }
  return '#E2E8F0';
}

/**
 * Compute lone pair lobe direction vectors pointing away from bonded neighbors
 */
function computeLonePairDirections(
  atomIndex: number,
  atoms: MoleculeAtomNode[],
  bonds: MoleculeDossier['bonds']
): THREE.Vector3[] {
  const atom = atoms[atomIndex];
  const lpCount = atom.lonePairs || 0;
  if (lpCount <= 0) return [];

  const pos = new THREE.Vector3(atom.x, atom.y, atom.z);
  const neighborDirs: THREE.Vector3[] = [];

  for (const b of bonds) {
    if (b.source === atomIndex && atoms[b.target]) {
      const nPos = new THREE.Vector3(atoms[b.target].x, atoms[b.target].y, atoms[b.target].z);
      neighborDirs.push(nPos.sub(pos).normalize());
    } else if (b.target === atomIndex && atoms[b.source]) {
      const nPos = new THREE.Vector3(atoms[b.source].x, atoms[b.source].y, atoms[b.source].z);
      neighborDirs.push(nPos.sub(pos).normalize());
    }
  }

  // Sum of bonded neighbor unit vectors
  const sumBonded = new THREE.Vector3(0, 0, 0);
  neighborDirs.forEach((d) => sumBonded.add(d));

  // Primary anti-bonding axis
  let awayAxis = sumBonded.clone().negate();
  if (awayAxis.lengthSq() < 0.001) {
    // Symmetric center (e.g. XeF2 or XeF4)
    if (lpCount === 2) {
      // Trans lone pairs (e.g. XeF4 in XZ plane -> lone pairs on +Y and -Y)
      return [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)];
    }
    if (lpCount === 3) {
      // Trigonal equatorial belt (e.g. XeF2 along X -> 3 lone pairs in YZ plane)
      return [
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -0.5, 0.866),
        new THREE.Vector3(0, -0.5, -0.866),
      ];
    }
    awayAxis = new THREE.Vector3(0, 1, 0);
  } else {
    awayAxis.normalize();
  }

  if (lpCount === 1) {
    return [awayAxis];
  }

  // Find orthogonal vectors to awayAxis
  const ref = Math.abs(awayAxis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const ortho1 = new THREE.Vector3().crossVectors(awayAxis, ref).normalize();
  const ortho2 = new THREE.Vector3().crossVectors(awayAxis, ortho1).normalize();

  if (lpCount === 2) {
    // Spread two lone pairs ~112 degrees apart
    const halfSpread = (56 * Math.PI) / 180;
    const v1 = awayAxis
      .clone()
      .multiplyScalar(Math.cos(halfSpread))
      .add(ortho2.clone().multiplyScalar(Math.sin(halfSpread)))
      .normalize();
    const v2 = awayAxis
      .clone()
      .multiplyScalar(Math.cos(halfSpread))
      .add(ortho2.clone().multiplyScalar(-Math.sin(halfSpread)))
      .normalize();
    return [v1, v2];
  }

  // 3 lone pairs (e.g. terminal halogen F, Cl, Br) in a 3-fold cone around awayAxis
  const coneAngle = (62 * Math.PI) / 180;
  const results: THREE.Vector3[] = [];
  for (let k = 0; k < 3; k++) {
    const phi = (k * 2 * Math.PI) / 3;
    const radial = ortho1
      .clone()
      .multiplyScalar(Math.cos(phi))
      .add(ortho2.clone().multiplyScalar(Math.sin(phi)));
    const v = awayAxis
      .clone()
      .multiplyScalar(Math.cos(coneAngle))
      .add(radial.multiplyScalar(Math.sin(coneAngle)))
      .normalize();
    results.push(v);
  }
  return results;
}

/**
 * Compute representative bond angle arcs (up to 3 key central angles)
 */
function computeRepresentativeAngles(
  atoms: MoleculeAtomNode[],
  bonds: MoleculeDossier['bonds']
): Array<{
  centerIdx: number;
  armAIdx: number;
  armBIdx: number;
  angleDeg: number;
  arcPoints: [number, number, number][];
  labelPos: [number, number, number];
}> {
  const adjacency = new Map<number, number[]>();
  for (const b of bonds) {
    if (!adjacency.has(b.source)) adjacency.set(b.source, []);
    if (!adjacency.has(b.target)) adjacency.set(b.target, []);
    adjacency.get(b.source)!.push(b.target);
    adjacency.get(b.target)!.push(b.source);
  }

  const results: Array<{
    centerIdx: number;
    armAIdx: number;
    armBIdx: number;
    angleDeg: number;
    arcPoints: [number, number, number][];
    labelPos: [number, number, number];
  }> = [];

  for (const [centerIdx, neighbors] of adjacency.entries()) {
    if (neighbors.length < 2) continue;
    const cAtom = atoms[centerIdx];
    const cPos = new THREE.Vector3(cAtom.x, cAtom.y, cAtom.z);

    // Pick first two distinct neighbors (prefer heavy atoms if available, else H)
    const sorted = [...neighbors].sort((a, b) => {
      const aHeavy = atoms[a]?.symbol !== 'H' ? 0 : 1;
      const bHeavy = atoms[b]?.symbol !== 'H' ? 0 : 1;
      return aHeavy - bHeavy;
    });

    const armAIdx = sorted[0];
    const armBIdx = sorted[1];
    const aPos = new THREE.Vector3(atoms[armAIdx].x, atoms[armAIdx].y, atoms[armAIdx].z);
    const bPos = new THREE.Vector3(atoms[armBIdx].x, atoms[armBIdx].y, atoms[armBIdx].z);

    const vA = aPos.clone().sub(cPos).normalize();
    const vB = bPos.clone().sub(cPos).normalize();
    const dot = Math.max(-1, Math.min(1, vA.dot(vB)));
    const angleRad = Math.acos(dot);
    const angleDeg = (angleRad * 180) / Math.PI;

    const arcRadius = 0.62;
    const steps = 16;
    const arcPoints: [number, number, number][] = [];

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      let interp: THREE.Vector3;
      if (angleDeg > 177) {
        // Near-linear 180 deg arc
        const ortho = Math.abs(vA.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
        const normal = new THREE.Vector3().crossVectors(vA, ortho).normalize();
        const theta = t * Math.PI;
        interp = vA
          .clone()
          .multiplyScalar(Math.cos(theta))
          .add(normal.multiplyScalar(Math.sin(theta)))
          .normalize();
      } else {
        interp = vA.clone().lerp(vB, t).normalize();
      }
      const pt = cPos.clone().add(interp.multiplyScalar(arcRadius));
      arcPoints.push([pt.x, pt.y, pt.z]);
    }

    const midPoint = arcPoints[Math.floor(steps / 2)];
    const midDir = new THREE.Vector3(midPoint[0], midPoint[1], midPoint[2])
      .sub(cPos)
      .normalize();
    const labelVec = cPos.clone().add(midDir.multiplyScalar(arcRadius + 0.22));

    results.push({
      centerIdx,
      armAIdx,
      armBIdx,
      angleDeg,
      arcPoints,
      labelPos: [labelVec.x, labelVec.y, labelVec.z],
    });

    if (results.length >= 2) break;
  }

  return results;
}

interface MoleculeSceneContentProps {
  molecule: MoleculeDossier;
  renderStyle: RenderStyle3D;
  showLonePairs: boolean;
  showDipoleVector: boolean;
  showAtomLabels: boolean;
  showBondLengths: boolean;
  showBondAngles: boolean;
  selectedAtomIndex: number | null;
  onSelectAtom?: (index: number | null) => void;
  autoRotate: boolean;
}

const MoleculeSceneContent: React.FC<MoleculeSceneContentProps> = ({
  molecule,
  renderStyle,
  showLonePairs,
  showDipoleVector,
  showAtomLabels,
  showBondLengths,
  showBondAngles,
  selectedAtomIndex,
  onSelectAtom,
  autoRotate,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);

  // Center the molecule at (0,0,0)
  const { centeredAtoms, scaleFactor } = useMemo(() => {
    if (!molecule.atoms.length) return { centeredAtoms: [], scaleFactor: 1 };
    let cx = 0,
      cy = 0,
      cz = 0;
    molecule.atoms.forEach((a) => {
      cx += a.x;
      cy += a.y;
      cz += a.z;
    });
    cx /= molecule.atoms.length;
    cy /= molecule.atoms.length;
    cz /= molecule.atoms.length;

    let maxDist = 1.2;
    const shifted = molecule.atoms.map((a) => {
      const x = a.x - cx;
      const y = a.y - cy;
      const z = a.z - cz;
      const d = Math.sqrt(x * x + y * y + z * z);
      if (d > maxDist) maxDist = d;
      return { ...a, x, y, z };
    });

    // Normalize camera scale gently so both H2O and C4H10 fit comfortably in the viewport
    const scale = Math.min(1.45, Math.max(0.85, 2.3 / maxDist));
    return { centeredAtoms: shifted, scaleFactor: scale };
  }, [molecule]);

  // Subtle rotation if enabled
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  // Compute net 3D molecular dipole vector (bond dipoles + lone pair dipoles) and individual bond dipoles
  const dipole3D = useMemo(
    () => calculateMolecularDipole3D(centeredAtoms, molecule.bonds),
    [centeredAtoms, molecule.bonds]
  );

  const dipoleArrow = useMemo(() => {
    const netMag = molecule.dipoleMomentDebye > 0.05 ? molecule.dipoleMomentDebye : dipole3D.magnitudeDebye;
    if (netMag <= 0.05) return null;

    const [vx, vy, vz] = dipole3D.netVectorDebye;
    const vec = new THREE.Vector3(vx, vy, vz);
    if (vec.lengthSq() < 0.001) {
      centeredAtoms.forEach((a) => {
        const q = -(a.partialCharge || 0);
        vec.add(new THREE.Vector3(a.x * q, a.y * q, a.z * q));
      });
    }
    if (vec.lengthSq() < 0.001) {
      vec.set(0, 1, 0);
    } else {
      vec.normalize();
    }
    const len = Math.min(2.6, Math.max(1.4, 1.1 + netMag * 0.35));
    const start = vec.clone().multiplyScalar(-len * 0.45);
    const end = vec.clone().multiplyScalar(len * 0.55);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
    return { start, end, dir: vec, length: len, quat, netMag };
  }, [centeredAtoms, molecule.dipoleMomentDebye, dipole3D]);

  const representativeAngles = useMemo(
    () => (showBondAngles ? computeRepresentativeAngles(centeredAtoms, molecule.bonds) : []),
    [showBondAngles, centeredAtoms, molecule.bonds]
  );

  return (
    <group ref={groupRef} scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {/* 1. ATOMS */}
      {centeredAtoms.map((atom, idx) => {
        const meta = getElementMeta(atom.symbol);
        const isSelected = selectedAtomIndex === idx;
        const isHovered = hoveredAtom === idx;

        let radius = 0.38;
        if (renderStyle === 'space-filling') {
          radius = meta.vdwRadius * 0.62;
        } else if (renderStyle === 'licorice') {
          radius = 0.16;
        } else {
          // ball-and-stick or esp-polarity
          radius = Math.max(0.24, Math.min(0.56, meta.covalentRadius * 0.42 + 0.14));
        }

        const color =
          renderStyle === 'esp-polarity'
            ? getEspColor(atom.partialCharge)
            : meta.color;

        const lpDirs = showLonePairs
          ? computeLonePairDirections(idx, centeredAtoms, molecule.bonds)
          : [];

        return (
          <group key={`atom-${idx}`} position={[atom.x, atom.y, atom.z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectAtom?.(isSelected ? null : idx);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredAtom(idx);
              }}
              onPointerOut={() => setHoveredAtom(null)}
            >
              <sphereGeometry args={[radius, 36, 36]} />
              <meshPhysicalMaterial
                color={color}
                roughness={renderStyle === 'esp-polarity' ? 0.35 : 0.22}
                metalness={0.12}
                clearcoat={0.65}
                clearcoatRoughness={0.15}
                emissive={isSelected || isHovered ? '#38BDF8' : '#000000'}
                emissiveIntensity={isSelected ? 0.45 : isHovered ? 0.25 : 0}
              />
            </mesh>

            {/* Selection Halo Ring */}
            {isSelected && (
              <mesh>
                <sphereGeometry args={[radius * 1.22, 24, 24]} />
                <meshBasicMaterial color="#38BDF8" wireframe transparent opacity={0.45} />
              </mesh>
            )}

            {/* 3D Translucent Gold Lone Pair Electron Lobes */}
            {lpDirs.map((dir, lpIdx) => {
              const lobeDist = radius + 0.34;
              const lobePos = dir.clone().multiplyScalar(lobeDist);
              const quat = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir
              );
              const dotOffset = new THREE.Vector3(0.09, 0.06, 0).applyQuaternion(quat);
              const dotOffset2 = new THREE.Vector3(-0.09, 0.06, 0).applyQuaternion(quat);

              return (
                <group key={`lp-${idx}-${lpIdx}`} position={[lobePos.x, lobePos.y, lobePos.z]}>
                  <mesh quaternion={quat} scale={[0.72, 1.18, 0.72]}>
                    <sphereGeometry args={[0.22, 24, 24]} />
                    <meshPhysicalMaterial
                      color="#F59E0B"
                      emissive="#D97706"
                      emissiveIntensity={0.35}
                      transparent
                      opacity={0.42}
                      roughness={0.15}
                      clearcoat={0.8}
                    />
                  </mesh>
                  {/* Pair of electron dots inside the lobe */}
                  <mesh position={[dotOffset.x, dotOffset.y, dotOffset.z]}>
                    <sphereGeometry args={[0.042, 12, 12]} />
                    <meshBasicMaterial color="#FEF08A" />
                  </mesh>
                  <mesh position={[dotOffset2.x, dotOffset2.y, dotOffset2.z]}>
                    <sphereGeometry args={[0.042, 12, 12]} />
                    <meshBasicMaterial color="#FEF08A" />
                  </mesh>
                </group>
              );
            })}

            {/* Floating Atom Symbol, Hybridization & Partial Charge Badge */}
            {(showAtomLabels || isSelected || isHovered) && (
              <Html
                position={[0, radius + 0.22, 0]}
                center
                distanceFactor={8}
                zIndexRange={[10, 0]}
              >
                <div className="pointer-events-none select-none px-1.5 py-0.5 rounded-md bg-slate-900/85 dark:bg-slate-950/90 text-white border border-white/15 shadow-md whitespace-nowrap flex items-center gap-1 text-[10px] font-mono">
                  <span className="font-bold">{atom.symbol}</span>
                  {atom.formalCharge ? (
                    <span className="text-amber-300 font-bold">
                      {atom.formalCharge > 0 ? `+${atom.formalCharge}` : atom.formalCharge}
                    </span>
                  ) : null}
                  {atom.partialCharge !== undefined && Math.abs(atom.partialCharge) >= 0.05 && (
                    <span
                      className={
                        atom.partialCharge < 0 ? 'text-rose-300' : 'text-sky-300'
                      }
                    >
                      ({atom.partialCharge > 0 ? `δ+${atom.partialCharge.toFixed(2)}` : `δ${atom.partialCharge.toFixed(2)}`})
                    </span>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* 2. BONDS (Single, Aromatic 1.5, Double 2, Triple 3) */}
      {renderStyle !== 'space-filling' &&
        molecule.bonds.map((bond, bIdx) => {
          const a1 = centeredAtoms[bond.source];
          const a2 = centeredAtoms[bond.target];
          if (!a1 || !a2) return null;

          const p1 = new THREE.Vector3(a1.x, a1.y, a1.z);
          const p2 = new THREE.Vector3(a2.x, a2.y, a2.z);
          const diff = p2.clone().sub(p1);
          const length = diff.length();
          const mid = p1.clone().add(p2).multiplyScalar(0.5);
          const dir = diff.clone().normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir
          );

          // Perpendicular offset vector for double/triple/aromatic bonds
          const refVec =
            Math.abs(dir.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
          const perp = new THREE.Vector3().crossVectors(dir, refVec).normalize();

          const baseRadius = renderStyle === 'licorice' ? 0.14 : 0.068;
          const bondLengthText =
            bond.lengthAngstrom !== undefined
              ? `${bond.lengthAngstrom.toFixed(2)} Å`
              : `${length.toFixed(2)} Å`;

          return (
            <group key={`bond-${bIdx}`}>
              {bond.order === 1 && (
                <mesh position={[mid.x, mid.y, mid.z]} quaternion={quat}>
                  <cylinderGeometry args={[baseRadius, baseRadius, length, 20]} />
                  <meshStandardMaterial color="#94A3B8" roughness={0.35} metalness={0.25} />
                </mesh>
              )}

              {(bond.order === 1.5 || bond.order === 1.33) && (
                <>
                  <mesh
                    position={[
                      mid.x + perp.x * 0.07,
                      mid.y + perp.y * 0.07,
                      mid.z + perp.z * 0.07,
                    ]}
                    quaternion={quat}
                  >
                    <cylinderGeometry args={[baseRadius * 0.8, baseRadius * 0.8, length, 18]} />
                    <meshStandardMaterial color="#94A3B8" roughness={0.35} metalness={0.25} />
                  </mesh>
                  <mesh
                    position={[
                      mid.x - perp.x * 0.07,
                      mid.y - perp.y * 0.07,
                      mid.z - perp.z * 0.07,
                    ]}
                    quaternion={quat}
                  >
                    <cylinderGeometry args={[baseRadius * 0.65, baseRadius * 0.65, length * 0.85, 18]} />
                    <meshStandardMaterial
                      color="#38BDF8"
                      transparent
                      opacity={0.75}
                      roughness={0.3}
                    />
                  </mesh>
                </>
              )}

              {bond.order === 2 && (
                <>
                  <mesh
                    position={[
                      mid.x + perp.x * 0.085,
                      mid.y + perp.y * 0.085,
                      mid.z + perp.z * 0.085,
                    ]}
                    quaternion={quat}
                  >
                    <cylinderGeometry args={[baseRadius * 0.78, baseRadius * 0.78, length, 18]} />
                    <meshStandardMaterial color="#94A3B8" roughness={0.35} metalness={0.25} />
                  </mesh>
                  <mesh
                    position={[
                      mid.x - perp.x * 0.085,
                      mid.y - perp.y * 0.085,
                      mid.z - perp.z * 0.085,
                    ]}
                    quaternion={quat}
                  >
                    <cylinderGeometry args={[baseRadius * 0.78, baseRadius * 0.78, length, 18]} />
                    <meshStandardMaterial color="#64748B" roughness={0.35} metalness={0.25} />
                  </mesh>
                </>
              )}

              {bond.order === 3 && (
                <>
                  <mesh position={[mid.x, mid.y, mid.z]} quaternion={quat}>
                    <cylinderGeometry args={[baseRadius * 0.72, baseRadius * 0.72, length, 18]} />
                    <meshStandardMaterial color="#94A3B8" roughness={0.35} metalness={0.25} />
                  </mesh>
                  <mesh
                    position={[
                      mid.x + perp.x * 0.12,
                      mid.y + perp.y * 0.12,
                      mid.z + perp.z * 0.12,
                    ]}
                    quaternion={quat}
                  >
                    <cylinderGeometry args={[baseRadius * 0.65, baseRadius * 0.65, length, 16]} />
                    <meshStandardMaterial color="#64748B" roughness={0.35} metalness={0.25} />
                  </mesh>
                  <mesh
                    position={[
                      mid.x - perp.x * 0.12,
                      mid.y - perp.y * 0.12,
                      mid.z - perp.z * 0.12,
                    ]}
                    quaternion={quat}
                  >
                    <cylinderGeometry args={[baseRadius * 0.65, baseRadius * 0.65, length, 16]} />
                    <meshStandardMaterial color="#64748B" roughness={0.35} metalness={0.25} />
                  </mesh>
                </>
              )}

              {/* Bond Length Badge */}
              {showBondLengths && (
                <Html position={[mid.x, mid.y, mid.z]} center distanceFactor={8} zIndexRange={[5, 0]}>
                  <div className="pointer-events-none select-none px-1 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono shadow">
                    {bondLengthText}
                  </div>
                </Html>
              )}
            </group>
          );
        })}

      {/* 3. BOND ANGLE ARCS */}
      {showBondAngles &&
        representativeAngles.map((ang, aIdx) => (
          <group key={`angle-${aIdx}`}>
            <Line
              points={ang.arcPoints}
              color="#F59E0B"
              lineWidth={2}
              dashed={false}
            />
            <Html position={ang.labelPos} center distanceFactor={8} zIndexRange={[8, 0]}>
              <div className="pointer-events-none select-none px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-semibold shadow">
                {ang.angleDeg.toFixed(1)}°
              </div>
            </Html>
          </group>
        ))}

      {/* 4. INDIVIDUAL BOND DIPOLES + NET MOLECULAR DIPOLE VECTOR ARROW (μ) */}
      {showDipoleVector && (
        <group>
          {/* Individual Bond Dipole Vectors (q_ij * (r_j - r_i)) */}
          {dipole3D.bondDipoles.map((bd, bdIdx) => {
            const pFrom = new THREE.Vector3(...bd.from);
            const pTo = new THREE.Vector3(...bd.to);
            const mid = pFrom.clone().add(pTo).multiplyScalar(0.5);
            const bDir = pTo.clone().sub(pFrom).normalize();
            const arrowStart = mid.clone().addScaledVector(bDir, -0.22);
            const arrowEnd = mid.clone().addScaledVector(bDir, 0.24);
            const bQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bDir);
            return (
              <group key={`bond-dipole-${bdIdx}`}>
                <Line
                  points={[
                    [arrowStart.x, arrowStart.y, arrowStart.z],
                    [arrowEnd.x, arrowEnd.y, arrowEnd.z],
                  ]}
                  color="#38BDF8"
                  lineWidth={1.8}
                />
                <mesh position={[arrowEnd.x, arrowEnd.y, arrowEnd.z]} quaternion={bQuat}>
                  <coneGeometry args={[0.06, 0.15, 14]} />
                  <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.35} />
                </mesh>
              </group>
            );
          })}

          {/* Net Molecular Dipole Vector (μ_net) */}
          {dipoleArrow && (
            <group>
              <Line
                points={[
                  [dipoleArrow.start.x, dipoleArrow.start.y, dipoleArrow.start.z],
                  [dipoleArrow.end.x, dipoleArrow.end.y, dipoleArrow.end.z],
                ]}
                color="#EC4899"
                lineWidth={3.2}
              />
              <mesh
                position={[dipoleArrow.end.x, dipoleArrow.end.y, dipoleArrow.end.z]}
                quaternion={dipoleArrow.quat}
              >
                <coneGeometry args={[0.14, 0.34, 20]} />
                <meshStandardMaterial color="#EC4899" emissive="#BE185D" emissiveIntensity={0.45} />
              </mesh>
              <Html
                position={[
                  dipoleArrow.end.x + dipoleArrow.dir.x * 0.25,
                  dipoleArrow.end.y + dipoleArrow.dir.y * 0.25,
                  dipoleArrow.end.z + dipoleArrow.dir.z * 0.25,
                ]}
                center
                distanceFactor={8}
              >
                <div className="pointer-events-none select-none px-2 py-0.5 rounded-full bg-pink-950/90 text-pink-200 border border-pink-500/50 text-[10px] font-mono font-bold shadow-lg whitespace-nowrap">
                  μ = {dipoleArrow.netMag.toFixed(2)} D
                </div>
              </Html>
            </group>
          )}
        </group>
      )}
    </group>
  );
};

interface SingleViewportProps {
  molecule: MoleculeDossier;
  labelBadge?: string;
  renderStyle: RenderStyle3D;
  showLonePairs: boolean;
  showDipoleVector: boolean;
  showAtomLabels: boolean;
  showBondLengths: boolean;
  showBondAngles: boolean;
  selectedAtomIndex: number | null;
  onSelectAtom?: (index: number | null) => void;
  autoRotate: boolean;
  cameraPosition: [number, number, number];
  cameraResetKey: number;
}

const SingleViewport: React.FC<SingleViewportProps> = ({
  molecule,
  labelBadge,
  renderStyle,
  showLonePairs,
  showDipoleVector,
  showAtomLabels,
  showBondLengths,
  showBondAngles,
  selectedAtomIndex,
  onSelectAtom,
  autoRotate,
  cameraPosition,
  cameraResetKey,
}) => {
  return (
    <div
      data-dark-stage="true"
      className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-slate-200/80 dark:border-slate-800 shadow-inner"
    >
      {/* Top-left Molecule Identity Pill */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10 text-white shadow-md">
          {labelBadge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              {labelBadge}
            </span>
          )}
          <span className="font-bold text-sm">{molecule.name}</span>
          <span className="font-mono text-xs text-cyan-300">{molecule.condensedFormula}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/70 backdrop-blur-sm border border-white/10 text-[11px] text-slate-300">
          <span>
            VSEPR: <strong className="text-amber-300 font-mono">{molecule.vseprNotation}</strong>
          </span>
          <span>•</span>
          <span>
            Angle: <strong className="text-emerald-300 font-mono">{molecule.bondAngle}</strong>
          </span>
          <span>•</span>
          <span>
            μ = <strong className="text-pink-300 font-mono">{molecule.dipoleMomentDebye.toFixed(2)} D</strong>
          </span>
        </div>
      </div>

      {/* Three.js WebGL Canvas */}
      <Canvas
        key={`${molecule.id}-${cameraResetKey}`}
        camera={{ position: cameraPosition, fov: 42 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 8, 6]} intensity={1.35} />
        <directionalLight position={[-6, -5, -4]} intensity={0.55} color="#38BDF8" />
        <pointLight position={[0, 5, -5]} intensity={0.45} color="#A855F7" />

        <MoleculeSceneContent
          molecule={molecule}
          renderStyle={renderStyle}
          showLonePairs={showLonePairs}
          showDipoleVector={showDipoleVector}
          showAtomLabels={showAtomLabels}
          showBondLengths={showBondLengths}
          showBondAngles={showBondAngles}
          selectedAtomIndex={selectedAtomIndex}
          onSelectAtom={onSelectAtom}
          autoRotate={autoRotate}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2.2}
          maxDistance={14}
        />
      </Canvas>
    </div>
  );
};

export const MoleculeCanvas3D: React.FC<MoleculeCanvas3DProps> = ({
  molecule,
  comparisonMolecule = null,
  renderStyle,
  showLonePairs,
  showDipoleVector,
  showAtomLabels,
  showBondLengths,
  showBondAngles,
  selectedAtomIndex,
  onSelectAtom,
}) => {
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0.8, 5.2]);
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);

  const handleCameraPreset = (pos: [number, number, number]) => {
    setCameraPosition(pos);
    setCameraResetKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Viewport Container (Single or Side-by-Side Split Isomer View) */}
      <div
        className={`grid gap-3 w-full ${
          comparisonMolecule ? 'grid-cols-1 lg:grid-cols-2 h-[440px]' : 'grid-cols-1 h-[460px]'
        }`}
      >
        <SingleViewport
          molecule={molecule}
          labelBadge={comparisonMolecule ? 'Isomer A' : undefined}
          renderStyle={renderStyle}
          showLonePairs={showLonePairs}
          showDipoleVector={showDipoleVector}
          showAtomLabels={showAtomLabels}
          showBondLengths={showBondLengths}
          showBondAngles={showBondAngles}
          selectedAtomIndex={selectedAtomIndex}
          onSelectAtom={onSelectAtom}
          autoRotate={autoRotate}
          cameraPosition={cameraPosition}
          cameraResetKey={cameraResetKey}
        />

        {comparisonMolecule && (
          <SingleViewport
            molecule={comparisonMolecule}
            labelBadge="Isomer B"
            renderStyle={renderStyle}
            showLonePairs={showLonePairs}
            showDipoleVector={showDipoleVector}
            showAtomLabels={showAtomLabels}
            showBondLengths={showBondLengths}
            showBondAngles={showBondAngles}
            selectedAtomIndex={null}
            autoRotate={autoRotate}
            cameraPosition={cameraPosition}
            cameraResetKey={cameraResetKey}
          />
        )}
      </div>

      {/* Camera Presets & CPK Element Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            Camera:
          </span>
          <button
            type="button"
            onClick={() => handleCameraPreset([0, 0.8, 5.2])}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            Isometric
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset([0, 0, 5.4])}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            XY Front
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset([0, 5.4, 0.01])}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            XZ Top
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              autoRotate
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            Auto-Rotate
          </button>
          <button
            type="button"
            onClick={() => handleCameraPreset([0, 0.8, 5.2])}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Dynamic CPK Legend for Atoms Present */}
        <div className="flex flex-wrap items-center gap-2.5">
          {renderStyle === 'esp-polarity' ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">ESP Surface:</span>
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                δ− Electron-Rich
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                Neutral
              </span>
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                δ+ Electron-Poor
              </span>
            </div>
          ) : (
            Array.from(new Set(molecule.atoms.map((a) => a.symbol))).map((sym) => {
              const meta = getElementMeta(sym);
              return (
                <div key={sym} className="inline-flex items-center gap-1.5 text-[11px]">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-400/50 shadow-2xs"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {sym}
                  </span>
                </div>
              );
            })
          )}
          {showLonePairs && (
            <div className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-3 h-3 rounded-full bg-amber-400/70 border border-amber-500 inline-block" />
              Lone Pair (E)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
