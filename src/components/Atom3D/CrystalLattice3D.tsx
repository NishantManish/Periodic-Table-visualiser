import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ElementData } from '../../types';
import { Box } from 'lucide-react';
import {
  LatticeSystemType,
  MillerPlaneType,
  LatticeSite,
  LATTICE_METADATA,
  inferElementLatticeSystem,
  expandSupercell,
} from '../../utils/CrystalLatticeEngine';

export type { LatticeSystemType, MillerPlaneType };
export { inferElementLatticeSystem };

interface LatticeSceneProps {
  system: LatticeSystemType;
  supercell: 1 | 2 | 3;
  showWireframe: boolean;
  showCoordinationBonds: boolean;
  spaceFillingPacking: boolean;
  millerPlane: MillerPlaneType;
  autoRotate: boolean;
}

const LatticeScene: React.FC<LatticeSceneProps> = ({
  system,
  supercell,
  showWireframe,
  showCoordinationBonds,
  spaceFillingPacking,
  millerPlane,
  autoRotate,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { sites, bonds, wireframeLines } = useMemo(
    () => expandSupercell(system, supercell),
    [system, supercell]
  );

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  const roleColor = (role: LatticeSite['role']) => {
    switch (role) {
      case 'corner':
        return '#38bdf8'; // Cyan for corner sites (1/8 contribution)
      case 'face':
        return '#a855f7'; // Purple for face-centered sites (1/2 contribution)
      case 'body':
        return '#f59e0b'; // Amber for body-centered site (1 contribution)
      case 'tetrahedral':
        return '#10b981'; // Emerald for tetrahedral diamond sites
      default:
        return '#f43f5e'; // Rose for HCP interior B-layer sites
    }
  };

  const baseRadius = spaceFillingPacking ? 0.48 : 0.22;
  const scaleFactor = supercell === 2 ? 0.62 : 1.0;

  return (
    <group ref={groupRef} scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {/* Unit Cell Wireframe Cage */}
      {showWireframe &&
        wireframeLines.map((seg, idx) => (
          <Line
            key={`wf-${idx}`}
            points={seg}
            color="#64748b"
            lineWidth={1.5}
            transparent
            opacity={0.65}
          />
        ))}

      {/* Crystallographic Basis Vectors (a, b, c) */}
      {showWireframe && supercell === 1 && system !== 'HCP' && (
        <group position={[-0.825, -0.825, -0.825]}>
          <Line points={[[0, 0, 0], [1.65, 0, 0]]} color="#ef4444" lineWidth={3} />
          <Line points={[[0, 0, 0], [0, 1.65, 0]]} color="#22c55e" lineWidth={3} />
          <Line points={[[0, 0, 0], [0, 0, 1.65]]} color="#3b82f6" lineWidth={3} />
          <Html position={[1.8, 0, 0]} center distanceFactor={8}>
            <span className="px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
              a⃗
            </span>
          </Html>
          <Html position={[0, 1.8, 0]} center distanceFactor={8}>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
              c⃗
            </span>
          </Html>
          <Html position={[0, 0, 1.8]} center distanceFactor={8}>
            <span className="px-1.5 py-0.5 rounded bg-blue-950/90 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
              b⃗
            </span>
          </Html>
        </group>
      )}

      {/* Nearest-Neighbor Coordination Bonds */}
      {showCoordinationBonds &&
        !spaceFillingPacking &&
        bonds.map((seg, idx) => (
          <Line
            key={`bond-${idx}`}
            points={seg}
            color="#cbd5e1"
            lineWidth={2}
            transparent
            opacity={0.55}
          />
        ))}

      {/* Miller Index Planes (100), (110), (111) */}
      {millerPlane === '100' && (
        <mesh position={[0.4, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.65 * supercell, 1.65 * supercell]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            roughness={0.2}
          />
        </mesh>
      )}
      {millerPlane === '110' && (
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
          <planeGeometry args={[2.33 * supercell, 1.65 * supercell]} />
          <meshPhysicalMaterial
            color="#f59e0b"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            roughness={0.2}
          />
        </mesh>
      )}
      {millerPlane === '111' && (
        <mesh
          position={[0, 0, 0]}
          quaternion={new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(1, 1, 1).normalize()
          )}
        >
          <circleGeometry args={[1.15 * supercell, 3]} />
          <meshPhysicalMaterial
            color="#ec4899"
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Atomic Lattice Sites */}
      {sites.map((site, idx) => (
        <mesh key={`site-${idx}`} position={site.pos}>
          <sphereGeometry args={[baseRadius, 28, 28]} />
          <meshPhysicalMaterial
            color={roleColor(site.role)}
            roughness={0.22}
            metalness={0.25}
            clearcoat={0.7}
            clearcoatRoughness={0.15}
          />
        </mesh>
      ))}
    </group>
  );
};

interface CrystalLattice3DProps {
  element: ElementData;
}

export const CrystalLattice3D: React.FC<CrystalLattice3DProps> = ({ element }) => {
  const nativeLattice = useMemo(
    () => inferElementLatticeSystem(element.crystalStructure, element.symbol),
    [element.crystalStructure, element.symbol]
  );

  const [selectedOverride, setSelectedOverride] = useState<LatticeSystemType | null>(null);
  const activeSystem = selectedOverride ?? nativeLattice;
  const meta = LATTICE_METADATA[activeSystem];

  const [supercell, setSupercell] = useState<1 | 2>(1);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showCoordinationBonds, setShowCoordinationBonds] = useState<boolean>(true);
  const [spaceFillingPacking, setSpaceFillingPacking] = useState<boolean>(false);
  const [millerPlane, setMillerPlane] = useState<MillerPlaneType>('none');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Estimate metallic/covalent lattice parameter a in pm from atomicRadius
  const estimatedLatticeA = useMemo(() => {
    const r = element.atomicRadius || 145;
    if (activeSystem === 'FCC') return Math.round(2 * Math.SQRT2 * r);
    if (activeSystem === 'BCC') return Math.round((4 / Math.sqrt(3)) * r);
    if (activeSystem === 'Diamond Cubic') return Math.round((8 / Math.sqrt(3)) * r * 0.75);
    return Math.round(2 * r);
  }, [element.atomicRadius, activeSystem]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT 8 COLUMNS: 3D WEBGL CRYSTALLOGRAPHY STAGE */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        {/* Lattice System Switcher Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'FCC',
                'BCC',
                'HCP',
                'Diamond Cubic',
                'Simple Cubic',
                'Rhombohedral',
                'Orthorhombic',
              ] as LatticeSystemType[]
            ).map((sys) => {
              const isNative = sys === nativeLattice;
              const isActive = sys === activeSystem;
              return (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSelectedOverride(sys === nativeLattice ? null : sys)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <span>{sys}</span>
                  {isNative && (
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] uppercase font-extrabold ${
                        isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {element.symbol} Native
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D WebGL Canvas */}
        <div
          data-dark-stage="true"
          className="relative w-full h-[460px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 overflow-hidden shadow-2xl"
        >
          {/* Top-Left Crystallography Badge */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-white shadow-lg">
              <Box className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-sm">
                {element.name} ({element.symbol}) — {meta.title}
              </span>
            </div>
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/75 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-slate-300">
              <span>
                Space Group: <strong className="text-cyan-300">{meta.spaceGroup}</strong>
              </span>
              <span>•</span>
              <span>
                Z = <strong className="text-amber-300">{meta.atomsPerUnitCell} atoms/cell</strong>
              </span>
              <span>•</span>
              <span>
                CN = <strong className="text-emerald-300">{meta.coordinationNumber}</strong>
              </span>
              <span>•</span>
              <span>
                APF = <strong className="text-purple-300">{meta.packingEfficiencyPercent}%</strong>
              </span>
            </div>
          </div>

          {/* Site Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Corner (1/8)
            </span>
            {(activeSystem === 'FCC' || activeSystem === 'Diamond Cubic' || activeSystem === 'HCP') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Face Center (1/2)
              </span>
            )}
            {(activeSystem === 'BCC' || activeSystem === 'Rhombohedral') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Body Center (1)
              </span>
            )}
            {activeSystem === 'Diamond Cubic' && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Tetrahedral Site (1)
              </span>
            )}
            {activeSystem === 'HCP' && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> B-Layer Interior (1)
              </span>
            )}
          </div>

          <Canvas camera={{ position: [3.2, 2.5, 3.6], fov: 42 }} gl={{ antialias: true }}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[6, 8, 6]} intensity={1.35} />
            <directionalLight position={[-6, -4, -5]} intensity={0.55} color="#38bdf8" />
            <pointLight position={[0, 5, -5]} intensity={0.45} color="#a855f7" />

            <LatticeScene
              system={activeSystem}
              supercell={supercell}
              showWireframe={showWireframe}
              showCoordinationBonds={showCoordinationBonds}
              spaceFillingPacking={spaceFillingPacking}
              millerPlane={millerPlane}
              autoRotate={autoRotate}
            />

            <OrbitControls enablePan enableZoom enableRotate minDistance={2.0} maxDistance={10} />
          </Canvas>
        </div>

        {/* Crystallographic Overlay & Miller Plane Controls */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSupercell((s) => (s === 1 ? 2 : 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                supercell === 2
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
            >
              {supercell === 1 ? '1×1×1 Unit Cell' : '2×2×2 Supercell (8 Cells)'}
            </button>
            <button
              type="button"
              onClick={() => setSpaceFillingPacking((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                spaceFillingPacking
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
            >
              {spaceFillingPacking ? 'Close-Packed Spheres' : 'Ball & Coordination Stick'}
            </button>
            <button
              type="button"
              onClick={() => setShowWireframe((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                showWireframe
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Unit Cell Cage (a⃗,b⃗,c⃗)
            </button>
            <button
              type="button"
              onClick={() => setAutoRotate((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                autoRotate
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {autoRotate ? 'Auto-Rotating' : 'Rotation Paused'}
            </button>
          </div>

          {/* Miller Index Diffraction Planes (hkl) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">Miller Plane (hkl):</span>
            {(['none', '100', '110', '111'] as MillerPlaneType[]).map((mp) => (
              <button
                key={mp}
                type="button"
                onClick={() => setMillerPlane(mp)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  millerPlane === mp
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {mp === 'none' ? 'Off' : `(${mp})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT 4 COLUMNS: CRYSTALLOGRAPHY & SOLID-STATE PHYSICS DOSSIER */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
            X-Ray Crystallography & Solid-State Physics
          </span>
          <h3 className="text-lg font-extrabold text-white mt-0.5">{meta.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Native STP Structure of {element.name}:{' '}
            <strong className="text-cyan-300">{element.crystalStructure}</strong>
          </p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          {meta.description}
        </p>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Hermann-Mauguin
            </span>
            <span className="font-mono font-bold text-cyan-300 mt-0.5 block">
              {meta.spaceGroup}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Coordination (CN)
            </span>
            <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
              {meta.coordinationNumber} Nearest Neighbors
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Atomic Packing (APF)
            </span>
            <span className="font-mono font-bold text-amber-400 mt-0.5 block">
              {meta.packingEfficiencyPercent}% Volume
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Atoms / Unit Cell (Z)
            </span>
            <span className="font-mono font-bold text-purple-400 mt-0.5 block">
              Z = {meta.atomsPerUnitCell}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Lattice Parameter
            </span>
            <span className="font-mono font-bold text-white mt-0.5 block">
              a ≈ {estimatedLatticeA} pm ({meta.latticeRelation})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Close-Packed Stacking
            </span>
            <span className="font-mono font-bold text-pink-300 mt-0.5 block">
              {meta.stackingSequence}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
