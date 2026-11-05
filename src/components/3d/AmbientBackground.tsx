import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext';

interface AmbientBackgroundProps {
  pm25Level?: number;
  windDirection?: number;
  windSpeed?: number;
}

interface DriftingParticlesProps {
  pm25Level: number;
  windDirection: number;
  windSpeed: number;
}

// Task 3: Ultra-Subtle 3D Round Particles using InstancedMesh with THREE.SphereGeometry (Taupe / Light Theme)
const RealisticSpheres: React.FC<DriftingParticlesProps> = ({ pm25Level, windDirection, windSpeed }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Particle count based on PM2.5 level (min 140, max 360 for minimal, light aesthetic)
  const particleCount = useMemo(() => {
    const normalized = Math.min(Math.max((pm25Level - 15) / 185, 0), 1);
    return Math.floor(140 + normalized * 220);
  }, [pm25Level]);

  // Store position, base velocities, scales, and random sine phases for wobble
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < particleCount; i++) {
      data.push({
        x: (Math.random() - 0.5) * 38,
        y: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 26,
        driftX: (Math.random() - 0.5) * 0.0002,
        driftY: (Math.random() - 0.5) * 0.0002,
        driftZ: (Math.random() - 0.5) * 0.0003,
        scale: 0.65 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.3 + Math.random() * 0.4
      });
    }
    return data;
  }, [particleCount]);

  // Frame update - Speed Nerfed by 10x: lazy dust motes floating in a sunbeam
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    // Task 3: Speed Nerf - multiply wind speed by 0.02 and cap idle threshold to 0.005
    const currentSpeed = Math.max(0.005, (windSpeed ?? 0) * 0.02);

    // Apply directional vectors with 10x slower velocity scalar
    const radians = (((windDirection ?? 0) * Math.PI) / 180);
    const speedFactor = 0.001; // Divided by 10 for barely noticeable, lazy floating dust
    const velX = Math.cos(radians) * currentSpeed * speedFactor;
    const velY = Math.sin(radians) * currentSpeed * speedFactor;

    // Ultra-subtle sine-wave wobble on vertical axis
    const small_value = 0.0006;

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];

      // Organic sine-wave wobble on vertical axis
      const wobbleY = Math.sin(time * p.wobbleSpeed + p.phase) * small_value;

      p.x += velX + p.driftX;
      p.y += velY + wobbleY + p.driftY;
      p.z += p.driftZ;

      // Wrap around bounds so particles smoothly loop through viewport
      if (p.x > 24) p.x = -24;
      if (p.x < -24) p.x = 24;
      if (p.y > 18) p.y = -18;
      if (p.y < -18) p.y = 18;
      if (p.z > 14) p.z = -14;
      if (p.z < -14) p.z = 14;

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Very gentle global rotation
    meshRef.current.rotation.y += delta * 0.004;
    meshRef.current.rotation.x = Math.sin(time * 0.05) * 0.01;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      {/* Task 3: Soft, semi-transparent taupe or warm gray dust motes */}
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#a8a29e"
        emissive="#d6d3d1"
        emissiveIntensity={0.05}
        roughness={0.9}
        metalness={0.05}
        transparent
        opacity={0.15}
      />
    </instancedMesh>
  );
};

// Fallback if WebGL is unavailable
const WebGLFallback: React.FC<{ pm25Level: number }> = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none transition-colors duration-1000"
      style={{
        zIndex: 0,
        background: 'radial-gradient(ellipse at top, rgba(168, 162, 158, 0.08) 0%, rgba(249, 248, 246, 0.98) 80%)'
      }}
    />
  );
};

export const AmbientBackground: React.FC<AmbientBackgroundProps> = (props) => {
  const context = useApp();
  const pm25Level = props.pm25Level ?? context.pm25Level;
  const windDirection = props.windDirection ?? context.windDirection;
  const windSpeed = props.windSpeed ?? context.windSpeed;
  const [hasWebGL, setHasWebGL] = React.useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return <WebGLFallback pm25Level={pm25Level} />;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          background: 'radial-gradient(circle at 50% 15%, rgba(168, 162, 158, 0.07) 0%, transparent 65%)'
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <RealisticSpheres
          pm25Level={pm25Level}
          windDirection={windDirection}
          windSpeed={windSpeed}
        />
      </Canvas>
    </div>
  );
};

export default AmbientBackground;
