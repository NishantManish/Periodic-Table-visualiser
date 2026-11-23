import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { ElementData } from '../../types';
import {
  buildSphericalHarmonicGeometry,
  sampleOrbitalProbabilityCloud,
  SpecificOrbitalSubshell,
} from '../../utils/QuantumOrbitalEngine';

export type AtomRenderStyle = 'bohr' | 'quantum' | 'realistic' | 'neon' | 'wireframe' | 'xray';
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
export type QuantumCloudMode = 'harmonics-lobes' | 'probability-cloud';

export interface AtomCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
}

interface AtomCanvasProps {
  element: ElementData;
  isPlaying: boolean;
  speed?: number;
  rotationSpeed?: number;
  showNucleus: boolean;
  showShells: boolean;
  showLabels: boolean;
  renderStyle: AtomRenderStyle;
  orbitalType?: QuantumOrbitalType;
  quantumCloudMode?: QuantumCloudMode;
  showNodalPlanes?: boolean;
}

const SHELL_COLORS = [
  '#38bdf8', // K (n=1)
  '#34d399', // L (n=2)
  '#fbbf24', // M (n=3)
  '#f87171', // N (n=4)
  '#a78bfa', // O (n=5)
  '#f472b6', // P (n=6)
  '#60a5fa', // Q (n=7)
];

const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

// ============================================================================
// 1. PROPORTIONAL STOICHIOMETRIC NUCLEUS (WITH PROTIUM ¹H N=0 GUARD)
// ============================================================================
const Nucleus = ({
  atomicNumber,
  atomicMass,
  isPlaying,
  speed,
  renderStyle,
}: {
  atomicNumber: number;
  atomicMass: number;
  isPlaying: boolean;
  speed: number;
  renderStyle: AtomRenderStyle;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const protonMeshRef = useRef<THREE.InstancedMesh>(null);
  const neutronMeshRef = useRef<THREE.InstancedMesh>(null);

  const { protons, neutrons, numProtons, numNeutrons } = useMemo(() => {
    const pCount = atomicNumber;
    const nCount = Math.max(0, Math.round(atomicMass) - atomicNumber);
    const totalReal = Math.max(1, pCount + nCount);
    const maxRender = Math.min(totalReal, 100);

    const renderedProtons =
      totalReal <= 100
        ? pCount
        : Math.max(1, Math.round((pCount / totalReal) * maxRender));
    const renderedNeutrons =
      nCount === 0
        ? 0
        : totalReal <= 100
        ? nCount
        : Math.max(0, maxRender - renderedProtons);

    const pPositions: [number, number, number][] = [];
    const nPositions: [number, number, number][] = [];

    const totalRendered = renderedProtons + renderedNeutrons;
    const radius = totalRendered === 1 ? 0 : Math.pow(totalRendered, 1 / 3) * 0.22;
    const phi = Math.PI * (3 - Math.sqrt(5));

    const nucleons: Array<'p' | 'n'> = [];
    for (let i = 0; i < renderedProtons; i++) nucleons.push('p');
    for (let i = 0; i < renderedNeutrons; i++) nucleons.push('n');

    for (let i = nucleons.length - 1; i > 0; i--) {
      const j = (i * 17 + atomicNumber * 31) % (i + 1);
      const tmp = nucleons[i];
      nucleons[i] = nucleons[j];
      nucleons[j] = tmp;
    }

    for (let i = 0; i < totalRendered; i++) {
      if (totalRendered === 1) {
        pPositions.push([0, 0, 0]);
        break;
      }
      const y = 1 - (i / (totalRendered - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const dist = radius * (0.78 + 0.22 * ((i % 5) / 4));
      const pos: [number, number, number] = [x * dist, y * dist, z * dist];

      if (nucleons[i] === 'p') {
        pPositions.push(pos);
      } else {
        nPositions.push(pos);
      }
    }

    return {
      protons: pPositions,
      neutrons: nPositions,
      numProtons: pPositions.length,
      numNeutrons: nPositions.length,
    };
  }, [atomicNumber, atomicMass]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (protonMeshRef.current) {
      protons.forEach((pos, i) => {
        dummy.position.set(...pos);
        dummy.updateMatrix();
        protonMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      protonMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (neutronMeshRef.current && numNeutrons > 0) {
      neutrons.forEach((pos, i) => {
        dummy.position.set(...pos);
        dummy.updateMatrix();
        neutronMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      neutronMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [protons, neutrons, numProtons, numNeutrons]);

  useFrame((_, delta) => {
    if (isPlaying && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4 * speed;
      groupRef.current.rotation.x += delta * 0.2 * speed;
    }
  });

  const isWireframe = renderStyle === 'wireframe';
  const isNeon = renderStyle === 'neon';
  const isXray = renderStyle === 'xray';

  return (
    <group ref={groupRef}>
      <instancedMesh
        key={`p-${numProtons}`}
        ref={protonMeshRef}
        args={[undefined, undefined, numProtons]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshPhysicalMaterial
          key={renderStyle}
          color={isXray ? '#38bdf8' : isNeon ? '#ff2e63' : '#ef4444'}
          roughness={isNeon ? 0.12 : 0.26}
          metalness={isXray ? 0.05 : 0.3}
          clearcoat={renderStyle === 'realistic' ? 0.75 : 0.2}
          emissive={isXray ? '#0ea5e9' : isNeon ? '#ff2e63' : '#ef4444'}
          emissiveIntensity={isNeon ? 2.0 : isXray ? 1.15 : 0.25}
          wireframe={isWireframe}
          transparent={isXray}
          opacity={isXray ? 0.36 : 1}
          depthWrite={!isXray}
        />
      </instancedMesh>
      {numNeutrons > 0 && (
        <instancedMesh
          key={`n-${numNeutrons}`}
          ref={neutronMeshRef}
          args={[undefined, undefined, numNeutrons]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshPhysicalMaterial
            key={renderStyle}
            color={isXray ? '#7dd3fc' : isNeon ? '#38bdf8' : renderStyle === 'bohr' ? '#cbd5e1' : '#64748b'}
            roughness={0.35}
            metalness={isXray ? 0.05 : 0.25}
            emissive={isXray ? '#0284c7' : isNeon ? '#0284c7' : '#000000'}
            emissiveIntensity={isNeon ? 0.9 : isXray ? 0.65 : 0}
            wireframe={isWireframe}
            transparent={isXray}
            opacity={isXray ? 0.28 : 1}
            depthWrite={!isXray}
          />
        </instancedMesh>
      )}
      <pointLight
        color={isXray ? '#38bdf8' : isNeon ? '#ff2e63' : '#ef4444'}
        intensity={isNeon ? 2.6 : 1.5}
        distance={isNeon ? 9 : 6}
      />
    </group>
  );
};

// ============================================================================
// 2. REAL SPHERICAL HARMONICS Y_l^m(θ, φ) & MONTE CARLO ENGINE
// ============================================================================
const ParametricHarmonicMesh = ({
  orbital,
  scale,
  opacity = 0.58,
  renderStyle = 'realistic',
}: {
  orbital: SpecificOrbitalSubshell;
  scale: number;
  opacity?: number;
  renderStyle?: AtomRenderStyle;
}) => {
  const geometry = useMemo(
    () => buildSphericalHarmonicGeometry(orbital, scale),
    [orbital, scale]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const isWireframe = renderStyle === 'wireframe';
  const isXray = renderStyle === 'xray';
  const isNeon = renderStyle === 'neon';

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        key={renderStyle}
        vertexColors
        transparent
        opacity={isXray ? Math.min(opacity, 0.26) : isNeon ? Math.min(0.82, opacity + 0.18) : opacity}
        roughness={isNeon ? 0.08 : 0.18}
        metalness={0.1}
        clearcoat={isNeon ? 1.0 : 0.75}
        side={THREE.DoubleSide}
        depthWrite={false}
        wireframe={isWireframe}
        blending={isNeon ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </mesh>
  );
};

// ============================================================================
// 3. 15,000-POINT GPU MONTE CARLO PROBABILITY CLOUD |ψ_{nlm}(r, θ, φ)|²
// ============================================================================
const QuantumProbabilityCloud = ({
  orbital,
  principalN,
  scale,
}: {
  orbital: QuantumOrbitalType;
  principalN: number;
  scale: number;
}) => {
  const { positions, colors } = useMemo(
    () => sampleOrbitalProbabilityCloud(orbital, principalN, scale, 15000),
    [orbital, principalN, scale]
  );

  return (
    <points>
      <bufferGeometry key={`${orbital}-${principalN}-${scale}`}>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        vertexColors
        transparent
        opacity={0.78}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ============================================================================
// 4. QUANTUM ORBITAL COMPOSITE VIEW (LOBES + CLOUD + NODAL PLANES)
// ============================================================================
const QuantumOrbitals = ({
  element,
  orbitalType,
  quantumCloudMode = 'harmonics-lobes',
  showNodalPlanes = false,
  isPlaying,
  speed,
  renderStyle,
}: {
  element: ElementData;
  orbitalType: QuantumOrbitalType;
  quantumCloudMode?: QuantumCloudMode;
  showNodalPlanes?: boolean;
  isPlaying: boolean;
  speed: number;
  renderStyle: AtomRenderStyle;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (isPlaying && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.32 * speed;
    }
  });

  const hasP = element.atomicNumber >= 5;
  const hasD = element.atomicNumber >= 21;
  const hasF = element.atomicNumber >= 57;
  const maxS = Math.min(element.period, 4);

  return (
    <group ref={groupRef}>
      {quantumCloudMode === 'probability-cloud' ? (
        <QuantumProbabilityCloud
          orbital={orbitalType}
          principalN={element.period}
          scale={5.2}
        />
      ) : (
        <>
          {/* s-Orbitals with concentric radial nodes (1s, 2s, 3s) */}
          {(orbitalType === 'all' || orbitalType === 's') &&
            Array.from({ length: maxS }).map((_, idx) => {
              const rScale = 1.9 + idx * 1.15;
              const isPositivePhase = idx % 2 === 0;
              return (
                <Sphere key={`s-${idx}`} args={[rScale, 40, 40]}>
                  <meshPhysicalMaterial
                    color={isPositivePhase ? '#38bdf8' : '#f43f5e'}
                    transparent
                    opacity={
                      renderStyle === 'xray'
                        ? 0.1
                        : orbitalType === 's'
                        ? 0.24 - idx * 0.04
                        : 0.12
                    }
                    roughness={0.2}
                    wireframe={renderStyle === 'wireframe' || (idx > 0 && orbitalType === 'all')}
                    depthWrite={false}
                  />
                </Sphere>
              );
            })}

          {/* p-Orbitals (pz, px, py) */}
          {orbitalType === 'pz' && <ParametricHarmonicMesh orbital="pz" scale={5.2} renderStyle={renderStyle} />}
          {orbitalType === 'px' && <ParametricHarmonicMesh orbital="px" scale={5.2} renderStyle={renderStyle} />}
          {orbitalType === 'py' && <ParametricHarmonicMesh orbital="py" scale={5.2} renderStyle={renderStyle} />}
          {(orbitalType === 'p' || (orbitalType === 'all' && hasP)) && (
            <group>
              <ParametricHarmonicMesh
                orbital="pz"
                scale={4.8}
                opacity={orbitalType === 'p' ? 0.55 : 0.35}
                renderStyle={renderStyle}
              />
              <ParametricHarmonicMesh
                orbital="px"
                scale={4.8}
                opacity={orbitalType === 'p' ? 0.55 : 0.35}
                renderStyle={renderStyle}
              />
              <ParametricHarmonicMesh
                orbital="py"
                scale={4.8}
                opacity={orbitalType === 'p' ? 0.55 : 0.35}
                renderStyle={renderStyle}
              />
            </group>
          )}

          {/* d-Orbitals (dz2, dx2-y2, dxy, dxz, dyz) */}
          {orbitalType === 'dz2' && <ParametricHarmonicMesh orbital="dz2" scale={5.6} renderStyle={renderStyle} />}
          {orbitalType === 'dx2-y2' && <ParametricHarmonicMesh orbital="dx2-y2" scale={5.6} renderStyle={renderStyle} />}
          {orbitalType === 'dxy' && <ParametricHarmonicMesh orbital="dxy" scale={5.6} renderStyle={renderStyle} />}
          {orbitalType === 'dxz' && <ParametricHarmonicMesh orbital="dxz" scale={5.6} renderStyle={renderStyle} />}
          {orbitalType === 'dyz' && <ParametricHarmonicMesh orbital="dyz" scale={5.6} renderStyle={renderStyle} />}
          {(orbitalType === 'd' || (orbitalType === 'all' && hasD)) && (
            <group>
              <ParametricHarmonicMesh
                orbital="dz2"
                scale={5.4}
                opacity={orbitalType === 'd' ? 0.56 : 0.38}
                renderStyle={renderStyle}
              />
              <ParametricHarmonicMesh
                orbital="dx2-y2"
                scale={5.2}
                opacity={orbitalType === 'd' ? 0.45 : 0.28}
                renderStyle={renderStyle}
              />
            </group>
          )}

          {/* f-Orbitals (l=3) */}
          {(orbitalType === 'f' || (orbitalType === 'all' && hasF)) && (
            <ParametricHarmonicMesh
              orbital="f"
              scale={6.0}
              opacity={orbitalType === 'f' ? 0.58 : 0.36}
              renderStyle={renderStyle}
            />
          )}
        </>
      )}

      {/* Translucent Nodal Planes & Radial Nodes (ψ = 0 surfaces) */}
      {showNodalPlanes && (
        <group>
          {/* xy Nodal Plane (for pz, dz2, dxz, dyz) */}
          {(orbitalType === 'pz' ||
            orbitalType === 'p' ||
            orbitalType === 'dz2' ||
            orbitalType === 'dxz' ||
            orbitalType === 'dyz' ||
            orbitalType === 'all') && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[9.5, 9.5]} />
              <meshBasicMaterial
                color="#fbbf24"
                transparent
                opacity={0.18}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}
          {/* yz Nodal Plane (for px, dxy, dxz) */}
          {(orbitalType === 'px' || orbitalType === 'dxy' || orbitalType === 'dxz') && (
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[9.5, 9.5]} />
              <meshBasicMaterial
                color="#34d399"
                transparent
                opacity={0.18}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}
          {/* Radial Node Sphere for 2s/3s */}
          {orbitalType === 's' && element.period >= 2 && (
            <Sphere args={[2.45, 32, 32]}>
              <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.35} />
            </Sphere>
          )}
        </group>
      )}
    </group>
  );
};

// ============================================================================
// 5. BOHR SHELLS & ELECTRONS
// ============================================================================
const ElectronShell = ({
  shellIndex,
  electronCount,
  radius,
  color,
  isPlaying,
  speed,
  showShells,
  showLabels,
  renderStyle,
}: {
  shellIndex: number;
  electronCount: number;
  radius: number;
  color: string;
  isPlaying: boolean;
  speed: number;
  showShells: boolean;
  showLabels: boolean;
  renderStyle: AtomRenderStyle;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const tilt = useMemo(() => {
    // Classic textbook Bohr mode: coplanar concentric circular shells
    if (renderStyle === 'bohr') {
      return new THREE.Euler(0, 0, 0);
    }
    const angle = (shellIndex * Math.PI) / 6;
    return new THREE.Euler(
      Math.sin(angle) * 0.35,
      Math.cos(angle) * 0.35,
      (shellIndex % 2 === 0 ? 1 : -1) * 0.2
    );
  }, [shellIndex, renderStyle]);

  useFrame((_, delta) => {
    if (isPlaying && groupRef.current) {
      const angularSpeed = (1.6 / Math.pow(shellIndex + 1, 0.75)) * speed;
      groupRef.current.rotation.z += delta * angularSpeed;
    }
  });

  const electrons = useMemo(() => {
    const arr = [];
    for (let i = 0; i < electronCount; i++) {
      const angle = (i / electronCount) * Math.PI * 2;
      arr.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        id: i,
      });
    }
    return arr;
  }, [electronCount, radius]);

  const isNeon = renderStyle === 'neon';
  const isWireframe = renderStyle === 'wireframe';
  const isXray = renderStyle === 'xray';
  const isBohr = renderStyle === 'bohr';

  const ringColor = isXray ? '#7dd3fc' : color;
  const ringOpacity = isNeon ? 0.82 : isBohr ? 0.62 : isXray ? 0.24 : 0.32;
  const ringTube = isNeon ? 0.036 : isBohr ? 0.032 : 0.025;

  return (
    <group rotation={tilt}>
      {showShells && (
        <Torus args={[radius, ringTube, 16, 100]}>
          <meshBasicMaterial
            key={renderStyle}
            color={ringColor}
            transparent
            opacity={ringOpacity}
            wireframe={isWireframe}
            depthWrite={!isXray}
            blending={isNeon ? THREE.AdditiveBlending : THREE.NormalBlending}
          />
        </Torus>
      )}

      {showLabels && showShells && (
        <Html position={[radius, 0, 0]} center distanceFactor={15}>
          <div
            className="px-1.5 py-0.5 rounded bg-slate-900/90 border text-[10px] font-mono whitespace-nowrap pointer-events-none select-none shadow-md"
            style={{ borderColor: `${ringColor}66`, color: ringColor }}
          >
            {SHELL_NAMES[shellIndex]} (n={shellIndex + 1}): {electronCount}e⁻
          </div>
        </Html>
      )}

      <group ref={groupRef}>
        {electrons.map((el) => (
          <group key={el.id} position={[el.x, el.y, 0]}>
            <Sphere args={[isNeon ? 0.16 : 0.14, 16, 16]}>
              <meshPhysicalMaterial
                key={renderStyle}
                color={isXray ? '#bae6fd' : color}
                emissive={isXray ? '#38bdf8' : color}
                emissiveIntensity={isNeon ? 2.6 : isXray ? 1.3 : renderStyle === 'realistic' ? 0.85 : 1.5}
                roughness={renderStyle === 'realistic' ? 0.14 : 0.1}
                metalness={renderStyle === 'realistic' ? 0.45 : 0.1}
                clearcoat={renderStyle === 'realistic' ? 0.85 : 0.2}
                wireframe={isWireframe}
                transparent={isXray}
                opacity={isXray ? 0.45 : 1}
                depthWrite={!isXray}
              />
            </Sphere>
            {!isWireframe && (
              <Sphere args={[isNeon ? 0.34 : 0.26, 12, 12]}>
                <meshBasicMaterial
                  key={renderStyle}
                  color={isXray ? '#38bdf8' : color}
                  transparent
                  opacity={isNeon ? 0.42 : isXray ? 0.18 : 0.25}
                  depthWrite={false}
                  blending={isNeon ? THREE.AdditiveBlending : THREE.NormalBlending}
                />
              </Sphere>
            )}
          </group>
        ))}
      </group>
    </group>
  );
};

/**
 * Demand-Driven Canvas Invalidator so orbitalType, renderStyle, and nodal toggles
 * re-render immediately even when isPlaying === false.
 */
const SceneInvalidator = ({ deps }: { deps: unknown[] }) => {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [invalidate, ...deps]);
  return null;
};

export const AtomCanvas = React.forwardRef<AtomCanvasRef, AtomCanvasProps>(
  (
    {
      element,
      isPlaying,
      speed = 1,
      rotationSpeed,
      showNucleus,
      showShells,
      showLabels,
      renderStyle,
      orbitalType = 'bohr',
      quantumCloudMode = 'harmonics-lobes',
      showNodalPlanes = false,
    },
    ref
  ) => {
    const effectiveSpeed = rotationSpeed ?? speed;
    const shells = element.bohrShells;
    const maxRadius = Math.max(shells.length * 1.45 + 1.5, 6);
    const defaultCameraZ = Math.max(11, maxRadius * 2.15);
    const controlsRef = useRef<any>(null);

    React.useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (controlsRef.current?.object) {
          controlsRef.current.object.position.multiplyScalar(0.84);
          controlsRef.current.update();
        }
      },
      zoomOut: () => {
        if (controlsRef.current?.object) {
          controlsRef.current.object.position.multiplyScalar(1.18);
          controlsRef.current.update();
        }
      },
      resetCamera: () => {
        if (controlsRef.current?.object) {
          controlsRef.current.object.position.set(0, 0, defaultCameraZ);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      },
    }));

    const showQuantumView = orbitalType !== 'bohr' || renderStyle === 'quantum';
    const effectiveOrbital: QuantumOrbitalType =
      orbitalType === 'bohr' ? 'all' : orbitalType;

    return (
      <div
        data-dark-stage="true"
        className="w-full h-full relative bg-radial from-slate-900 via-slate-950 to-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
      >
        <Canvas
          camera={{ position: [0, 0, defaultCameraZ], fov: 45 }}
          frameloop={isPlaying ? 'always' : 'demand'}
          dpr={[1, 2]}
        >
          <SceneInvalidator
            deps={[
              element.atomicNumber,
              renderStyle,
              orbitalType,
              quantumCloudMode,
              showNodalPlanes,
              showNucleus,
              showShells,
              showLabels,
            ]}
          />
          <ambientLight intensity={0.65} />
          <directionalLight position={[10, 10, 10]} intensity={1.2} />
          <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#38bdf8" />

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={40}
          />

          {showNucleus && (
            <Nucleus
              atomicNumber={element.atomicNumber}
              atomicMass={element.atomicMass}
              isPlaying={isPlaying}
              speed={effectiveSpeed}
              renderStyle={renderStyle}
            />
          )}

          {!showQuantumView ? (
            shells.map((electronCount, index) => (
              <ElectronShell
                key={index}
                shellIndex={index}
                electronCount={electronCount}
                radius={(index + 1) * 1.45 + 0.8}
                color={SHELL_COLORS[index % SHELL_COLORS.length]}
                isPlaying={isPlaying}
                speed={effectiveSpeed}
                showShells={showShells}
                showLabels={showLabels}
                renderStyle={renderStyle}
              />
            ))
          ) : (
            <QuantumOrbitals
              element={element}
              orbitalType={effectiveOrbital}
              quantumCloudMode={quantumCloudMode}
              showNodalPlanes={showNodalPlanes}
              isPlaying={isPlaying}
              speed={effectiveSpeed}
              renderStyle={renderStyle}
            />
          )}
        </Canvas>
      </div>
    );
  }
);
AtomCanvas.displayName = 'AtomCanvas';
