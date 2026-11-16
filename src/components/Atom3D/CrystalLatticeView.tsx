import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  AlertCircle,
  Box,
  CheckCircle2,
  Eye,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { ElementData } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import {
  computeCustomMillerPlane,
  computeSitePlaneMask,
  CustomMillerPlaneResult,
  expandSupercell,
  inferElementLatticeSystem,
  LATTICE_METADATA,
  LatticeSite,
  LatticeSystemType,
  XRAY_SOURCES,
  XraySourceId,
} from '../../utils/CrystalLatticeEngine';

const PRIMARY_STRUCTURES: LatticeSystemType[] = ['BCC', 'FCC', 'Diamond Cubic'];
const ALL_STRUCTURES: LatticeSystemType[] = [
  'BCC',
  'FCC',
  'Diamond Cubic',
  'HCP',
  'Simple Cubic',
  'Rhombohedral',
  'Orthorhombic',
];

const SHOWCASE_ELEMENTS = [
  { symbol: 'Fe', name: 'Iron', crystalStructure: 'Body-Centered Cubic (BCC)', atomicRadius: 126, system: 'BCC' as LatticeSystemType },
  { symbol: 'Cu', name: 'Copper', crystalStructure: 'Face-Centered Cubic (FCC)', atomicRadius: 128, system: 'FCC' as LatticeSystemType },
  { symbol: 'C', name: 'Carbon (Diamond)', crystalStructure: 'Diamond Cubic', atomicRadius: 77, system: 'Diamond Cubic' as LatticeSystemType },
  { symbol: 'Si', name: 'Silicon', crystalStructure: 'Diamond Cubic', atomicRadius: 111, system: 'Diamond Cubic' as LatticeSystemType },
  { symbol: 'W', name: 'Tungsten', crystalStructure: 'Body-Centered Cubic (BCC)', atomicRadius: 139, system: 'BCC' as LatticeSystemType },
  { symbol: 'Au', name: 'Gold', crystalStructure: 'Face-Centered Cubic (FCC)', atomicRadius: 144, system: 'FCC' as LatticeSystemType },
];

const _dummyObj = new THREE.Object3D();
const _tmpColor = new THREE.Color();

const StudioEnvironment: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    return () => {
      scene.environment = null;
      envTex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

interface BatchedSegmentsProps {
  segments: Array<[[number, number, number], [number, number, number]]>;
  color: string;
  opacity: number;
}

const BatchedSegments: React.FC<BatchedSegmentsProps> = ({ segments, color, opacity }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(segments.length * 6);
    for (let i = 0; i < segments.length; i++) {
      const [a, b] = segments[i];
      const base = i * 6;
      positions[base] = a[0];
      positions[base + 1] = a[1];
      positions[base + 2] = a[2];
      positions[base + 3] = b[0];
      positions[base + 4] = b[1];
      positions[base + 5] = b[2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [segments]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (segments.length === 0) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
};

interface InstancedAtomsProps {
  sites: LatticeSite[];
  planeMask: boolean[];
  highlightPlaneAtoms: boolean;
  planeActive: boolean;
  baseRadius: number;
}

const InstancedAtoms: React.FC<InstancedAtomsProps> = ({
  sites,
  planeMask,
  highlightPlaneAtoms,
  planeActive,
  baseRadius,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const roleHex = (role: LatticeSite['role'], onPlane: boolean): string => {
    if (planeActive && highlightPlaneAtoms) {
      if (onPlane) return '#f472b6';
    }
    switch (role) {
      case 'corner':
        return '#38bdf8';
      case 'face':
        return '#a855f7';
      case 'body':
        return '#f59e0b';
      case 'tetrahedral':
        return '#10b981';
      default:
        return '#f43f5e';
    }
  };

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      const onPlane = Boolean(planeMask[i]);
      const radiusScale =
        planeActive && highlightPlaneAtoms
          ? onPlane
            ? baseRadius * 1.18
            : baseRadius * 0.72
          : baseRadius;

      _dummyObj.position.set(site.pos[0], site.pos[1], site.pos[2]);
      _dummyObj.rotation.set(0, 0, 0);
      _dummyObj.scale.setScalar(radiusScale);
      _dummyObj.updateMatrix();
      mesh.setMatrixAt(i, _dummyObj.matrix);

      _tmpColor.set(roleHex(site.role, onPlane));
      mesh.setColorAt(i, _tmpColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [sites, planeMask, highlightPlaneAtoms, planeActive, baseRadius]);

  if (sites.length === 0) return null;

  return (
    <instancedMesh
      key={`sites-${sites.length}`}
      ref={meshRef}
      args={[undefined, undefined, sites.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 28, 28]} />
      <meshPhysicalMaterial
        roughness={0.22}
        metalness={0.28}
        clearcoat={0.75}
        clearcoatRoughness={0.14}
      />
    </instancedMesh>
  );
};

interface LatticeStageSceneProps {
  system: LatticeSystemType;
  supercell: 1 | 2 | 3;
  sites: LatticeSite[];
  bonds: Array<[[number, number, number], [number, number, number]]>;
  wireframeLines: Array<[[number, number, number], [number, number, number]]>;
  boundingBoxLines: Array<[[number, number, number], [number, number, number]]>;
  planeResult: CustomMillerPlaneResult;
  planeMask: boolean[];
  highlightPlaneAtoms: boolean;
  showWireframe: boolean;
  showCoordinationBonds: boolean;
  spaceFillingPacking: boolean;
  autoRotate: boolean;
  showAxisVectors: boolean;
}

const LatticeStageScene: React.FC<LatticeStageSceneProps> = ({
  system,
  supercell,
  sites,
  bonds,
  wireframeLines,
  boundingBoxLines,
  planeResult,
  planeMask,
  highlightPlaneAtoms,
  showWireframe,
  showCoordinationBonds,
  spaceFillingPacking,
  autoRotate,
  showAxisVectors,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += Math.min(delta, 0.05) * 0.35;
    }
  });

  const scaleFactor = supercell === 1 ? 1.0 : supercell === 2 ? 0.62 : 0.44;
  const baseRadius = spaceFillingPacking ? 0.48 : 0.21;
  const originCoord = -0.825 * supercell;

  const axisSegments = useMemo(() => {
    const len = 1.65;
    return {
      a: [[0, 0, 0], [len, 0, 0]] as [[number, number, number], [number, number, number]],
      b: [[0, 0, 0], [0, 0, len]] as [[number, number, number], [number, number, number]],
      c: [[0, 0, 0], [0, len, 0]] as [[number, number, number], [number, number, number]],
    };
  }, []);

  const planeOutlineGeometry = useMemo(() => {
    const half = planeResult.planeSize * 0.5;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      -half, -half, 0,
      half, -half, 0,
      half, half, 0,
      -half, half, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [planeResult.planeSize]);

  useEffect(() => () => planeOutlineGeometry.dispose(), [planeOutlineGeometry]);

  return (
    <group ref={groupRef} scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {showWireframe && (
        <>
          <BatchedSegments segments={wireframeLines} color="#64748b" opacity={0.42} />
          <BatchedSegments segments={boundingBoxLines} color="#94a3b8" opacity={0.85} />
        </>
      )}

      {showAxisVectors && system !== 'HCP' && (
        <group position={[originCoord, originCoord, originCoord]}>
          <BatchedSegments segments={[axisSegments.a]} color="#ef4444" opacity={0.95} />
          <BatchedSegments segments={[axisSegments.c]} color="#22c55e" opacity={0.95} />
          <BatchedSegments segments={[axisSegments.b]} color="#3b82f6" opacity={0.95} />
          <Html position={[1.82, 0, 0]} center distanceFactor={9}>
            <span className="px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold pointer-events-none">
              a⃗
            </span>
          </Html>
          <Html position={[0, 1.82, 0]} center distanceFactor={9}>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold pointer-events-none">
              c⃗
            </span>
          </Html>
          <Html position={[0, 0, 1.82]} center distanceFactor={9}>
            <span className="px-1.5 py-0.5 rounded bg-blue-950/90 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold pointer-events-none">
              b⃗
            </span>
          </Html>
        </group>
      )}

      {showCoordinationBonds && !spaceFillingPacking && (
        <BatchedSegments segments={bonds} color="#cbd5e1" opacity={0.55} />
      )}

      {planeResult.active && (
        <group position={planeResult.position} quaternion={planeResult.quaternion}>
          <mesh>
            <planeGeometry args={[planeResult.planeSize, planeResult.planeSize]} />
            <meshPhysicalMaterial
              color={planeResult.color}
              transparent
              opacity={0.34}
              side={THREE.DoubleSide}
              roughness={0.2}
              depthWrite={false}
            />
          </mesh>
          <lineLoop geometry={planeOutlineGeometry}>
            <lineBasicMaterial color={planeResult.color} transparent opacity={0.9} />
          </lineLoop>
        </group>
      )}

      <InstancedAtoms
        sites={sites}
        planeMask={planeMask}
        highlightPlaneAtoms={highlightPlaneAtoms}
        planeActive={planeResult.active}
        baseRadius={baseRadius}
      />
    </group>
  );
};

export interface CrystalLatticeViewProps {
  element?: ElementData;
}

export const CrystalLatticeView: React.FC<CrystalLatticeViewProps> = ({ element }) => {
  const { reducedMotion } = useAppStore();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const isSoftwareGl = useMemo(() => {
    if (typeof document === 'undefined') return false;
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return false;
    }
  }, []);

  const nativeLattice = useMemo<LatticeSystemType>(() => {
    if (element) {
      return inferElementLatticeSystem(element.crystalStructure, element.symbol);
    }
    return 'FCC';
  }, [element]);

  const [selectedOverride, setSelectedOverride] = useState<LatticeSystemType | null>(null);
  const activeSystem = selectedOverride ?? nativeLattice;
  const meta = LATTICE_METADATA[activeSystem];

  // Reset override if element changes
  useEffect(() => {
    setSelectedOverride(null);
  }, [element?.atomicNumber]);

  const [supercell, setSupercell] = useState<1 | 2 | 3>(1);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showAxisVectors, setShowAxisVectors] = useState(true);
  const [showCoordinationBonds, setShowCoordinationBonds] = useState(true);
  const [spaceFillingPacking, setSpaceFillingPacking] = useState(false);
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);
  const [highlightPlaneAtoms, setHighlightPlaneAtoms] = useState(true);

  // Miller plane controls (h, k, l) + fractional slice offset + X-ray source
  const [planeEnabled, setPlaneEnabled] = useState(true);
  const [millerH, setMillerH] = useState(1);
  const [millerK, setMillerK] = useState(1);
  const [millerL, setMillerL] = useState(1);
  const [planeOffset, setPlaneOffset] = useState(0);
  const [xraySource, setXraySource] = useState<XraySourceId>('CuKa');

  // Estimate lattice parameter a in pm from element radius (or allow manual override)
  const defaultLatticeAPm = useMemo(() => {
    const r = element?.atomicRadius || 128;
    if (activeSystem === 'FCC') return Math.round(2 * Math.SQRT2 * r);
    if (activeSystem === 'BCC') return Math.round((4 / Math.sqrt(3)) * r);
    if (activeSystem === 'Diamond Cubic') return Math.round((8 / Math.sqrt(3)) * r * 0.75);
    return Math.round(2 * r);
  }, [element?.atomicRadius, activeSystem]);

  const [customLatticeAPm, setCustomLatticeAPm] = useState<number | null>(null);
  useEffect(() => {
    setCustomLatticeAPm(null);
  }, [element?.atomicNumber, activeSystem]);

  const latticeAPm = customLatticeAPm ?? defaultLatticeAPm;

  // Build supercell geometry via CrystalLatticeEngine
  const supercellData = useMemo(
    () => expandSupercell(activeSystem, supercell),
    [activeSystem, supercell]
  );

  // Compute Miller plane & Bragg diffraction
  const planeResult = useMemo(
    () =>
      computeCustomMillerPlane(
        activeSystem,
        planeEnabled ? millerH : 0,
        planeEnabled ? millerK : 0,
        planeEnabled ? millerL : 0,
        planeOffset,
        supercell,
        latticeAPm,
        xraySource
      ),
    [activeSystem, planeEnabled, millerH, millerK, millerL, planeOffset, supercell, latticeAPm, xraySource]
  );

  const planeMask = useMemo(() => {
    if (!planeResult.active) return supercellData.sites.map(() => false);
    return computeSitePlaneMask(
      supercellData.sites,
      planeResult.normal,
      planeResult.position,
      0.16
    );
  }, [supercellData.sites, planeResult]);

  const intersectedCount = useMemo(
    () => planeMask.filter(Boolean).length,
    [planeMask]
  );

  const applyMillerPreset = (preset: 'off' | '100' | '110' | '111' | '200' | '220') => {
    if (preset === 'off') {
      setPlaneEnabled(false);
      return;
    }
    setPlaneEnabled(true);
    setPlaneOffset(0);
    if (preset === '100') {
      setMillerH(1);
      setMillerK(0);
      setMillerL(0);
    } else if (preset === '110') {
      setMillerH(1);
      setMillerK(1);
      setMillerL(0);
    } else if (preset === '111') {
      setMillerH(1);
      setMillerK(1);
      setMillerL(1);
    } else if (preset === '200') {
      setMillerH(2);
      setMillerK(0);
      setMillerL(0);
    } else if (preset === '220') {
      setMillerH(2);
      setMillerK(2);
      setMillerL(0);
    }
  };

  const resetCameraView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const clampMiller = (val: number) => Math.max(-3, Math.min(3, Math.round(val)));

  const visibleStructures = useMemo(() => {
    if (PRIMARY_STRUCTURES.includes(nativeLattice)) {
      return ALL_STRUCTURES;
    }
    return [nativeLattice, ...ALL_STRUCTURES.filter((s) => s !== nativeLattice)];
  }, [nativeLattice]);

  const isPresetActive = (h: number, k: number, l: number) =>
    planeEnabled && millerH === h && millerK === k && millerL === l;

  const subjectLabel = element
    ? `${element.name} (${element.symbol})`
    : activeSystem === 'BCC'
      ? 'BCC Showcase (Fe / W)'
      : activeSystem === 'FCC'
        ? 'FCC Showcase (Cu / Au)'
        : activeSystem === 'Diamond Cubic'
          ? 'Diamond Cubic (C / Si)'
          : meta.title;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* LEFT 8 COLUMNS: 3D CRYSTAL STAGE & INTERACTIVE CONTROLS */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        {/* Lattice System & Supercell Selector Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleStructures.map((sys) => {
              const isPrimary = PRIMARY_STRUCTURES.includes(sys);
              const isNative = Boolean(element && sys === nativeLattice);
              const isActive = sys === activeSystem;
              return (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSelectedOverride(element && sys === nativeLattice ? null : sys)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : isPrimary
                        ? 'bg-slate-950 text-slate-200 border border-slate-700 hover:border-cyan-500/50'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <span>{sys}</span>
                  {isNative && (
                    <span
                      className={`text-[10px] font-extrabold ${
                        isActive ? 'text-slate-900' : 'text-cyan-400'
                      }`}
                    >
                      · {element?.symbol} Native
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 1x1x1 to 3x3x3 Supercell Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Supercell:</span>
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSupercell(n)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  supercell === n
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-cyan-400'
                }`}
              >
                {n}×{n}×{n}
              </button>
            ))}
          </div>
        </div>

        {/* 3D WebGL Viewport */}
        <div
          data-dark-stage="true"
          className="relative w-full h-[460px] xl:h-[500px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 overflow-hidden shadow-2xl"
        >
          {/* Top-Left Crystallography Telemetry Header */}
          <div className="absolute top-3.5 left-3.5 right-3.5 z-10 pointer-events-none flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-white shadow-lg">
                <Box className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-extrabold text-xs sm:text-sm">
                  {subjectLabel} — {meta.title}
                </span>
              </div>
              <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/85 border border-white/10 text-[11px] font-mono tabular-nums text-slate-300">
                <span>
                  Space Group: <strong className="text-cyan-300">{meta.spaceGroup}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Z = <strong className="text-amber-300">{meta.atomsPerUnitCell}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  CN = <strong className="text-emerald-300">{meta.coordinationNumber}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  APF = <strong className="text-purple-300">{meta.packingEfficiencyPercent}%</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Sites: <strong className="text-white">{supercellData.sites.length}</strong>
                </span>
              </div>
            </div>

            {/* Reset View Button */}
            <button
              type="button"
              onClick={resetCameraView}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Reset View
            </button>
          </div>

          {/* Bottom-Left Site Color Legend */}
          <div className="absolute bottom-3.5 left-3.5 z-10 pointer-events-none flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Corner (1/8)
            </span>
            {(activeSystem === 'FCC' || activeSystem === 'Diamond Cubic' || activeSystem === 'HCP' || activeSystem === 'Orthorhombic') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Face (1/2)
              </span>
            )}
            {(activeSystem === 'BCC' || activeSystem === 'Rhombohedral') && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Body (1)
              </span>
            )}
            {activeSystem === 'Diamond Cubic' && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Tetrahedral sp³ (1)
              </span>
            )}
            {planeResult.active && highlightPlaneAtoms && (
              <span className="flex items-center gap-1.5 font-semibold text-pink-300">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
                On {planeResult.label} ({intersectedCount})
              </span>
            )}
          </div>

          {contextLost ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-slate-300 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-sm font-bold text-white">3D WebGL Context Interrupted</p>
              <p className="text-xs text-slate-400">
                Hardware graphics context was suspended. Switch tabs or reload to restore the 3D crystal stage.
              </p>
            </div>
          ) : (
            <Canvas
              camera={{ position: [3.4, 2.6, 3.8], fov: 42 }}
              dpr={isSoftwareGl ? 1 : [1, 2]}
              gl={{ antialias: !isSoftwareGl, powerPreference: 'high-performance' }}
              onCreated={({ gl }) => {
                const canvas = gl.domElement;
                canvas.addEventListener('webglcontextlost', (e) => {
                  e.preventDefault();
                  setContextLost(true);
                });
                canvas.addEventListener('webglcontextrestored', () => {
                  setContextLost(false);
                });
              }}
            >
              <StudioEnvironment />
              <hemisphereLight args={['#e0f2fe', '#0f172a', 0.65]} />
              <directionalLight position={[6, 8, 6]} intensity={1.35} color="#fff7ed" />
              <directionalLight position={[-6, -4, -5]} intensity={0.65} color="#38bdf8" />
              <pointLight position={[0, 5, -5]} intensity={0.45} color="#a855f7" />

              <LatticeStageScene
                system={activeSystem}
                supercell={supercell}
                sites={supercellData.sites}
                bonds={supercellData.bonds}
                wireframeLines={supercellData.wireframeLines}
                boundingBoxLines={supercellData.boundingBoxLines}
                planeResult={planeResult}
                planeMask={planeMask}
                highlightPlaneAtoms={highlightPlaneAtoms}
                showWireframe={showWireframe}
                showCoordinationBonds={showCoordinationBonds}
                spaceFillingPacking={spaceFillingPacking}
                autoRotate={autoRotate}
                showAxisVectors={showAxisVectors}
              />

              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate
                enableDamping={!isSoftwareGl}
                dampingFactor={0.08}
                minDistance={2.0}
                maxDistance={12}
              />
            </Canvas>
          )}
        </div>

        {/* Display & Geometry Toolbar */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSpaceFillingPacking((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                spaceFillingPacking
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {spaceFillingPacking ? 'Close-Packed Spheres' : 'Ball & Coordination Stick'}
            </button>

            <button
              type="button"
              onClick={() => setShowWireframe((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showWireframe
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Unit Cell Wireframe
            </button>

            <button
              type="button"
              onClick={() => setShowAxisVectors((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showAxisVectors
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Basis Vectors (a⃗,b⃗,c⃗)
            </button>

            <button
              type="button"
              onClick={() => setShowCoordinationBonds((v) => !v)}
              disabled={spaceFillingPacking}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                showCoordinationBonds && !spaceFillingPacking
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Coordination Bonds
            </button>

            <button
              type="button"
              onClick={() => setAutoRotate((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                autoRotate
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {autoRotate ? 'Rotating' : 'Paused'}
            </button>
          </div>

          {!element && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-slate-400 mr-1">Reference:</span>
              {SHOWCASE_ELEMENTS.slice(0, 3).map((ex) => (
                <button
                  key={ex.symbol}
                  type="button"
                  onClick={() => setSelectedOverride(ex.system)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer ${
                    activeSystem === ex.system
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {ex.symbol} ({ex.system === 'Diamond Cubic' ? 'Diamond' : ex.system})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Miller Plane (hkl) & Real-Time Slice Control Deck */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-400" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                Real-Time Miller Plane (h k l) &amp; Slice Inspector
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyMillerPreset('off')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer border ${
                  !planeEnabled
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-rose-500/40'
                }`}
              >
                Off
              </button>
              {(['100', '110', '111', '200', '220'] as const).map((preset) => {
                const [ph, pk, pl] = preset.split('').map(Number);
                const active = isPresetActive(ph, pk, pl);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyMillerPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer border ${
                      active
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-rose-500/40'
                    }`}
                  >
                    ({preset})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Custom h, k, l Integer Steppers */}
            <div className="md:col-span-5 flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Custom (hkl):</span>
              {(
                [
                  { label: 'h', val: millerH, setter: setMillerH },
                  { label: 'k', val: millerK, setter: setMillerK },
                  { label: 'l', val: millerL, setter: setMillerL },
                ] as const
              ).map((axis) => (
                <label key={axis.label} className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-[11px] font-mono font-bold text-cyan-400">{axis.label}</span>
                  <input
                    type="number"
                    min={-3}
                    max={3}
                    step={1}
                    value={axis.val}
                    onChange={(e) => {
                      setPlaneEnabled(true);
                      axis.setter(clampMiller(parseInt(e.target.value || '0', 10)));
                    }}
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-pink-500"
                  />
                </label>
              ))}
            </div>

            {/* Fractional Slice Offset Slider */}
            <div className="md:col-span-5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 font-sans font-bold">Plane Slice Offset</span>
                <span className="text-pink-300 font-bold tabular-nums">
                  {planeOffset >= 0 ? '+' : ''}
                  {planeOffset.toFixed(2)} d
                </span>
              </div>
              <input
                type="range"
                min={-0.85}
                max={0.85}
                step={0.05}
                value={planeOffset}
                disabled={!planeEnabled}
                onChange={(e) => setPlaneOffset(parseFloat(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Highlight Intersected Atoms Toggle */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setHighlightPlaneAtoms((v) => !v)}
                disabled={!planeResult.active}
                className={`w-full px-2.5 py-2.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                  highlightPlaneAtoms && planeResult.active
                    ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>Hit Atoms ({intersectedCount})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT 4 COLUMNS: CRYSTALLOGRAPHY & BRAGG DIFFRACTION DOSSIER */}
      <div className="lg:col-span-4 space-y-4">
        {/* Lattice Parameters Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
              Solid-State Crystallography Dossier
            </span>
            <h3 className="text-lg font-extrabold text-white mt-0.5">{meta.title}</h3>
            {element && (
              <p className="text-xs text-slate-400 mt-0.5">
                Native STP Phase of {element.name}:{' '}
                <strong className="text-cyan-300">{element.crystalStructure}</strong>
              </p>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            {meta.description}
          </p>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
                Space Group
              </span>
              <span className="font-bold text-cyan-300 mt-0.5 block">{meta.spaceGroup}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
                Coordination (CN)
              </span>
              <span className="font-bold text-emerald-400 mt-0.5 block">
                {meta.coordinationNumber} Neighbors
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
                Packing (APF)
              </span>
              <span className="font-bold text-amber-400 mt-0.5 block">
                {meta.packingEfficiencyPercent}% Volume
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
                Atoms / Cell (Z)
              </span>
              <span className="font-bold text-purple-400 mt-0.5 block">
                Z = {meta.atomsPerUnitCell}
              </span>
            </div>
            <div className="col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans uppercase font-bold text-slate-400">
                  Lattice Constant a (pm)
                </span>
                <span className="text-[11px] text-slate-400">{meta.latticeRelation}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={150}
                  max={1000}
                  step={1}
                  value={latticeAPm}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    if (Number.isFinite(parsed) && parsed > 0) setCustomLatticeAPm(parsed);
                  }}
                  className="w-24 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-400">
                  pm ({(latticeAPm / 100).toFixed(3)} Å)
                </span>
                {customLatticeAPm !== null && (
                  <button
                    type="button"
                    onClick={() => setCustomLatticeAPm(null)}
                    className="ml-auto text-[11px] font-sans font-bold text-cyan-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bragg Diffraction & Interplanar d-Spacing Analyzer */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 font-bold block">
                Bragg&apos;s Law (nλ = 2d sin θ)
              </span>
              <h4 className="text-sm font-extrabold text-white">
                XRD Plane &amp; d-Spacing Readout
              </h4>
            </div>
            <select
              value={xraySource}
              onChange={(e) => setXraySource(e.target.value as XraySourceId)}
              aria-label="X-ray wavelength source"
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-cyan-300 cursor-pointer"
            >
              {Object.values(XRAY_SOURCES).map((src) => (
                <option key={src.id} value={src.id}>
                  {src.label}
                </option>
              ))}
            </select>
          </div>

          {planeResult.active ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
                    Interplanar d{planeResult.label}
                  </span>
                  <span className="text-base font-black text-cyan-300 block mt-0.5">
                    {planeResult.dSpacingPm.toFixed(1)} pm
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {planeResult.dSpacingAngstrom.toFixed(4)} Å
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-sans uppercase font-bold text-slate-400 block">
                    Bragg Peak (2θ / θ)
                  </span>
                  {planeResult.braggWithinEwaldSphere &&
                  planeResult.braggTwoThetaDeg !== null &&
                  planeResult.braggThetaDeg !== null ? (
                    <>
                      <span className="text-base font-black text-amber-300 block mt-0.5">
                        2θ = {planeResult.braggTwoThetaDeg.toFixed(2)}°
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        θ = {planeResult.braggThetaDeg.toFixed(2)}°
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-rose-400 block mt-1">
                      λ &gt; 2d (No Diffraction)
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  planeResult.xrdReflectionStatus === 'Allowed'
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/60 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {planeResult.xrdReflectionStatus === 'Allowed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>XRD Selection Rule: {planeResult.xrdReflectionStatus}</span>
                </div>
                <p className="text-[11px] opacity-90">{planeResult.xrdRuleNote}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              Enable a Miller plane preset or enter non-zero `(h k l)` indices above to slice the unit cell and compute d-spacing and Bragg 2θ diffraction angles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
