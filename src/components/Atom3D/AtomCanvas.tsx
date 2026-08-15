import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ElementData } from '../../types';

const SHELL_NAMES = ['K (n=1)', 'L (n=2)', 'M (n=3)', 'N (n=4)', 'O (n=5)', 'P (n=6)', 'Q (n=7)'];

interface AtomCanvasProps {
  element: ElementData;
  renderStyle: 'neon' | 'wireframe' | 'xray' | 'bohr' | 'standard';
  orbitalType: 'bohr' | 's' | 'p' | 'd' | 'f' | 'all';
  showNucleus: boolean;
  showShells: boolean;
  showLabels: boolean;
  isPlaying: boolean;
  rotationSpeed: number;
}

export interface AtomCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
}

// --- Declarative Materials (Prevents Memory Leaks & Crashes) ---
const ParticleMaterial = ({ isProton, renderStyle }: { isProton: boolean, renderStyle: string }) => {
  if (renderStyle === 'neon') return <meshBasicMaterial color={isProton ? '#ff0055' : '#0088ff'} />;
  if (renderStyle === 'wireframe') return <meshBasicMaterial color={isProton ? '#ef4444' : '#3b82f6'} wireframe />;
  if (renderStyle === 'xray') return <meshStandardMaterial color={isProton ? '#f87171' : '#60a5fa'} transparent opacity={0.45} roughness={0.1} />;
  if (renderStyle === 'bohr') return <meshBasicMaterial color={isProton ? '#d97706' : '#2563eb'} />;
  return <meshStandardMaterial color={isProton ? '#ef4444' : '#3b82f6'} roughness={0.2} metalness={0.6} emissive={isProton ? '#7f1d1d' : '#1e3a8a'} emissiveIntensity={0.3} />;
};

const RingMaterial = ({ renderStyle }: { renderStyle: string }) => (
  <meshBasicMaterial
    color={renderStyle === 'neon' ? '#a855f7' : '#38bdf8'}
    side={THREE.DoubleSide}
    transparent
    opacity={renderStyle === 'wireframe' ? 0.6 : 0.35}
    wireframe={renderStyle === 'wireframe'}
  />
);

const ElectronMaterial = ({ renderStyle }: { renderStyle: string }) => {
  if (renderStyle === 'neon') return <meshBasicMaterial color="#00ffff" />;
  if (renderStyle === 'wireframe') return <meshBasicMaterial color="#38bdf8" wireframe />;
  if (renderStyle === 'xray') return <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} />;
  if (renderStyle === 'bohr') return <meshBasicMaterial color="#06b6d4" />;
  return <meshBasicMaterial color="#38bdf8" />;
};

const OrbitalMaterial = ({ color = "#60a5fa", opacity = 0.15 }: { color?: string, opacity?: number }) => (
  <meshStandardMaterial
    color={color}
    transparent
    opacity={opacity}
    roughness={0.4}
    depthWrite={false}
    blending={THREE.AdditiveBlending}
    side={THREE.DoubleSide}
  />
);

// --- Components ---

const Nucleus: React.FC<{ element: ElementData; renderStyle: string; showNucleus: boolean; showLabels: boolean; isMobile: boolean }> = ({ element, renderStyle, showNucleus, showLabels, isMobile }) => {
  const protonRef = useRef<THREE.InstancedMesh>(null);
  const neutronRef = useRef<THREE.InstancedMesh>(null);

  const protonCount = element.atomicNumber;
  const neutronCount = Math.round(element.atomicMass) - protonCount;
  const maxDisplayed = isMobile ? 40 : 80;
  const totalParticles = Math.min(protonCount + neutronCount, maxDisplayed);
  const numProtons = Math.ceil(totalParticles / 2);
  const numNeutrons = totalParticles - numProtons;

  useEffect(() => {
    if (!showNucleus || !protonRef.current || !neutronRef.current) return;
    
    const dummy = new THREE.Object3D();
    let pIdx = 0;
    let nIdx = 0;
    
    for (let i = 0; i < totalParticles; i++) {
      const isProton = i % 2 === 0;
      const phi = Math.acos(-1 + (2 * i) / totalParticles);
      const theta = Math.sqrt(totalParticles * Math.PI) * phi;
      const radius = 0.52 * Math.pow(i / totalParticles, 0.35) + 0.12;
      
      dummy.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );
      dummy.updateMatrix();
      
      if (isProton && pIdx < numProtons) {
        protonRef.current.setMatrixAt(pIdx++, dummy.matrix);
      } else if (nIdx < numNeutrons) {
        neutronRef.current.setMatrixAt(nIdx++, dummy.matrix);
      }
    }
    
    protonRef.current.instanceMatrix.needsUpdate = true;
    neutronRef.current.instanceMatrix.needsUpdate = true;
  }, [totalParticles, numProtons, numNeutrons, showNucleus]);

  if (!showNucleus) return null;

  const radius = isMobile ? 0.28 : 0.22;
  const segments = isMobile ? 10 : 16;

  return (
    <group>
      <instancedMesh ref={protonRef} args={[null as any, null as any, numProtons]}>
        <sphereGeometry args={[radius, segments, segments]} />
        <ParticleMaterial isProton={true} renderStyle={renderStyle} />
      </instancedMesh>
      <instancedMesh ref={neutronRef} args={[null as any, null as any, numNeutrons]}>
        <sphereGeometry args={[radius, segments, segments]} />
        <ParticleMaterial isProton={false} renderStyle={renderStyle} />
      </instancedMesh>
      {showLabels && (
        <Html position={[0, 1.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="px-2 py-1 bg-slate-900/90 text-[10px] text-slate-200 rounded border border-slate-700 shadow-xl backdrop-blur-sm whitespace-nowrap transition-all">
            Nucleus ({protonCount}P⁺, {neutronCount}N⁰)
          </div>
        </Html>
      )}
    </group>
  );
};

const ElectronShells: React.FC<{ element: ElementData; renderStyle: string; showShells: boolean; showLabels: boolean; isPlaying: boolean; rotationSpeed: number; isMobile: boolean }> = ({ element, renderStyle, showShells, showLabels, isPlaying, rotationSpeed, isMobile }) => {
  const electronGroups = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    if (!isPlaying) return;
    electronGroups.current.forEach((group, i) => {
      if (group) {
        const speed = (2.5 / (i + 1)) * 0.05 * rotationSpeed;
        group.rotation.z -= speed; 
      }
    });
  });

  if (!showShells) return null;

  return (
    <group>
      {element.bohrShells.map((electronCount, sIndex) => {
        const shellRadius = 1.8 + sIndex * 1.35;
        const ringSegments = isMobile ? 32 : 64;
        const electronSegments = isMobile ? 12 : 16;

        const electrons = Array.from({ length: electronCount }).map((_, eIndex) => {
          const angle = (eIndex / electronCount) * Math.PI * 2;
          return {
            x: shellRadius * Math.cos(angle),
            y: shellRadius * Math.sin(angle), // Using Y because the parent is rotated by X (Math.PI/2)
          };
        });

        return (
          <group key={sIndex} rotation-x={Math.PI / 2}>
            {/* Static Orbit Ring */}
            <mesh>
              <ringGeometry args={[shellRadius - 0.025, shellRadius + 0.025, ringSegments]} />
              <RingMaterial renderStyle={renderStyle} />
            </mesh>
            
            {/* Revolving Electrons Group */}
            <group ref={(el) => { electronGroups.current[sIndex] = el; }}>
              {electrons.map((pos, eIndex) => (
                <mesh key={eIndex} position={[pos.x, pos.y, 0]}>
                  <sphereGeometry args={[0.13, electronSegments, electronSegments]} />
                  <ElectronMaterial renderStyle={renderStyle} />
                </mesh>
              ))}
            </group>

            {/* Static Labels */}
            {showLabels && (
              <Html position={[shellRadius * Math.cos(sIndex), shellRadius * Math.sin(sIndex), 0]} center style={{ pointerEvents: 'none' }}>
                <div className="px-2 py-1 bg-slate-900/90 text-[10px] text-cyan-300 font-mono rounded border border-cyan-800/50 shadow-xl backdrop-blur-sm whitespace-nowrap transition-all">
                  Shell {SHELL_NAMES[sIndex]} ({electronCount}e⁻)
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

const QuantumOrbitals: React.FC<{ element: ElementData; orbitalType: string; isMobile: boolean }> = ({ element, orbitalType, isMobile }) => {
  const orbitalGroup = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (orbitalGroup.current) {
      orbitalGroup.current.rotation.y = state.clock.elapsedTime * 0.1;
      orbitalGroup.current.rotation.z = state.clock.elapsedTime * 0.05;
    }
  });

  if (orbitalType === 'bohr') return null;

  const segments = isMobile ? 24 : 32;

  const showS = ['s', 'all'].includes(orbitalType);
  const showP = ['p', 'all'].includes(orbitalType);
  const showD = ['d', 'all'].includes(orbitalType);
  const showF = ['f', 'all'].includes(orbitalType);

  return (
    <group ref={orbitalGroup}>
      {element.bohrShells.map((count, i) => {
        const n = i + 1; // Principal quantum number
        const shellRadius = 1.8 + i * 1.35; // Matches Bohr shell radius exactly!
        
        // Only render orbitals that this shell actually has
        const hasS = count > 0;
        const hasP = n >= 2 && count > 2;
        const hasD = n >= 3 && count > 8;
        const hasF = n >= 4 && count > 18;

        return (
          <group key={`shell-${n}`}>
            {/* s-Orbital (Spherical probability cloud) */}
            {(showS || orbitalType === 'all') && hasS && (
              <mesh>
                <sphereGeometry args={[shellRadius * 0.95, segments, segments]} />
                <OrbitalMaterial color="#38bdf8" opacity={0.08 + (0.02 * n)} />
              </mesh>
            )}
            
            {/* p-Orbital (Dumbbells) */}
            {(showP || orbitalType === 'all') && hasP && (
              <group>
                {[ 
                  [shellRadius, 0, 0], [-shellRadius, 0, 0], 
                  [0, shellRadius, 0], [0, -shellRadius, 0], 
                  [0, 0, shellRadius], [0, 0, -shellRadius] 
                ].map((pos, j) => (
                  <mesh key={`p-${n}-${j}`} position={pos as [number, number, number]}>
                    <sphereGeometry args={[shellRadius * 0.45, segments/2, segments/2]} />
                    <OrbitalMaterial color="#a855f7" opacity={0.12} />
                  </mesh>
                ))}
              </group>
            )}

            {/* d-Orbital (Cloverleaves) */}
            {(showD || orbitalType === 'all') && hasD && (
              <group>
                {[ 
                  [shellRadius*0.7, shellRadius*0.7, 0], [shellRadius*0.7, -shellRadius*0.7, 0], [-shellRadius*0.7, shellRadius*0.7, 0], [-shellRadius*0.7, -shellRadius*0.7, 0],
                  [shellRadius*0.7, 0, shellRadius*0.7], [shellRadius*0.7, 0, -shellRadius*0.7], [-shellRadius*0.7, 0, shellRadius*0.7], [-shellRadius*0.7, 0, -shellRadius*0.7],
                  [0, shellRadius*0.7, shellRadius*0.7], [0, shellRadius*0.7, -shellRadius*0.7], [0, -shellRadius*0.7, shellRadius*0.7], [0, -shellRadius*0.7, -shellRadius*0.7]
                ].map((pos, j) => (
                  <mesh key={`d-${n}-${j}`} position={pos as [number, number, number]}>
                    <sphereGeometry args={[shellRadius * 0.35, segments/2, segments/2]} />
                    <OrbitalMaterial color="#4ade80" opacity={0.10} />
                  </mesh>
                ))}
              </group>
            )}

            {/* f-Orbital (Complex shapes) */}
            {(showF || orbitalType === 'all') && hasF && (
              <group>
                {[
                  [shellRadius*0.6, shellRadius*0.6, shellRadius*0.6], [shellRadius*0.6, shellRadius*0.6, -shellRadius*0.6], 
                  [shellRadius*0.6, -shellRadius*0.6, shellRadius*0.6], [shellRadius*0.6, -shellRadius*0.6, -shellRadius*0.6],
                  [-shellRadius*0.6, shellRadius*0.6, shellRadius*0.6], [-shellRadius*0.6, shellRadius*0.6, -shellRadius*0.6], 
                  [-shellRadius*0.6, -shellRadius*0.6, shellRadius*0.6], [-shellRadius*0.6, -shellRadius*0.6, -shellRadius*0.6]
                ].map((pos, j) => (
                  <mesh key={`f-${n}-${j}`} position={pos as [number, number, number]}>
                    <sphereGeometry args={[shellRadius * 0.25, segments/2, segments/2]} />
                    <OrbitalMaterial color="#facc15" opacity={0.10} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

const SceneController = forwardRef<AtomCanvasRef>((_, ref) => {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      camera.position.multiplyScalar(0.85);
      controlsRef.current?.update();
      invalidate();
    },
    zoomOut: () => {
      camera.position.multiplyScalar(1.18);
      controlsRef.current?.update();
      invalidate();
    },
    resetCamera: () => {
      camera.position.set(0, 4, 13);
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.update();
      invalidate();
    }
  }));

  return (
    <OrbitControls 
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={1.0}
      zoomSpeed={1.2}
      panSpeed={0.8}
      minDistance={2}
      maxDistance={50}
    />
  );
});

export const AtomCanvas = forwardRef<AtomCanvasRef, AtomCanvasProps>(({ element, renderStyle, orbitalType, showNucleus, showShells, showLabels, isPlaying, rotationSpeed }, ref) => {
  const isMobile = window.innerWidth < 768;

  return (
    <Canvas
      camera={{ position: [0, 4, 13], fov: 50 }}
      dpr={[1, isMobile ? 1.25 : 2]}
      gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
      frameloop={isPlaying ? "always" : "demand"}
    >
      <fogExp2 attach="fog" color={0x020617} density={0.015} />
      <ambientLight intensity={renderStyle === 'neon' ? 1.2 : 0.8} />
      <pointLight color={0x38bdf8} intensity={3} distance={60} position={[0, 0, 0]} />
      <directionalLight color={0xffffff} intensity={1.5} position={[10, 15, 10]} />
      
      <SceneController ref={ref} />
      
      <group>
        <Nucleus element={element} renderStyle={renderStyle} showNucleus={showNucleus} showLabels={showLabels} isMobile={isMobile} />
        <ElectronShells element={element} renderStyle={renderStyle} showShells={showShells} showLabels={showLabels} isPlaying={isPlaying} rotationSpeed={rotationSpeed} isMobile={isMobile} />
        <QuantumOrbitals element={element} orbitalType={orbitalType} isMobile={isMobile} />
      </group>
    </Canvas>
  );
});
