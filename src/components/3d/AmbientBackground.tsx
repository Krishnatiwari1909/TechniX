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

// Task 2: Realistic 3D Round Particles using InstancedMesh with THREE.SphereGeometry
const RealisticSpheres: React.FC<DriftingParticlesProps> = ({ pm25Level, windDirection, windSpeed }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Compute trigonometric wind vector
  const windVector = useMemo(() => {
    const rad = (windDirection * Math.PI) / 180;
    const baseScalar = Math.max(windSpeed, 2) * 0.0008; // Lowered velocity for gentle drift
    return {
      vx: Math.cos(rad) * baseScalar,
      vy: Math.sin(rad) * baseScalar
    };
  }, [windDirection, windSpeed]);

  // Particle count based on PM2.5 level (min 180, max 650 for smooth instanced rendering)
  const particleCount = useMemo(() => {
    const normalized = Math.min(Math.max((pm25Level - 15) / 185, 0), 1);
    return Math.floor(180 + normalized * 470);
  }, [pm25Level]);

  // Store position, base velocities, scales, and random sine phases for wobble
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < particleCount; i++) {
      data.push({
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 32,
        z: (Math.random() - 0.5) * 28,
        // Lowered base velocities for slow organic drift
        vx: (Math.random() - 0.5) * 0.004,
        vy: 0.002 + Math.random() * 0.005,
        vz: (Math.random() - 0.5) * 0.004,
        scale: 0.8 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.6 + Math.random() * 0.8
      });
    }
    return data;
  }, [particleCount]);

  // Target color interpolates from clean teal/emerald to amber to warning red
  const targetColor = useMemo(() => {
    const c = new THREE.Color();
    if (pm25Level <= 35) {
      c.set('#2dd4bf'); // Clean teal (#2dd4bf) to match forest theme
    } else if (pm25Level <= 75) {
      const t = (pm25Level - 35) / 40;
      c.set('#2dd4bf').lerp(new THREE.Color('#f59e0b'), t); // Amber
    } else if (pm25Level <= 130) {
      const t = (pm25Level - 75) / 55;
      c.set('#f59e0b').lerp(new THREE.Color('#ef4444'), t); // Warning Red
    } else {
      c.set('#dc2626'); // Hazardous Red
    }
    return c;
  }, [pm25Level]);

  // Frame update - combines lowered base velocity, sine-wave Y wobble, and wind drift
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const speedMultiplier = 1 + (pm25Level / 200) * 0.5;

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];

      // Task 2: Sine-wave wobble on Y-axis for organic suspended-in-air physics
      const wobbleY = Math.sin(time * p.wobbleSpeed + p.phase) * 0.005;

      p.x += (p.vx + windVector.vx) * speedMultiplier;
      p.y += (p.vy + windVector.vy + wobbleY) * speedMultiplier;
      p.z += p.vz * speedMultiplier;

      // Wrap around bounds
      if (p.y > 20) p.y = -20;
      if (p.y < -20) p.y = 20;
      if (p.x > 26) p.x = -26;
      if (p.x < -26) p.x = 26;
      if (p.z > 16) p.z = -16;
      if (p.z < -16) p.z = 16;

      dummy.position.set(p.x, p.y, p.z);
      const dynamicScale = p.scale * (1 + Math.min(pm25Level / 350, 0.4));
      dummy.scale.set(dynamicScale, dynamicScale, dynamicScale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Gentle global rotation
    meshRef.current.rotation.y += delta * 0.015;
    meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.03;

    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, 0.05);
      materialRef.current.emissive.lerp(targetColor, 0.05);
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      {/* Task 2: Perfectly round 3D spheres via THREE.SphereGeometry */}
      <sphereGeometry args={[0.09, 10, 10]} />
      <meshStandardMaterial
        ref={materialRef}
        color={targetColor}
        emissive={targetColor}
        emissiveIntensity={0.65}
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={Math.min(0.55 + (pm25Level / 250) * 0.35, 0.95)}
      />
    </instancedMesh>
  );
};

// Fallback if WebGL is unavailable
const WebGLFallback: React.FC<{ pm25Level: number }> = ({ pm25Level }) => {
  const isPolluted = pm25Level > 75;
  return (
    <div
      className="fixed inset-0 pointer-events-none transition-colors duration-1000"
      style={{
        zIndex: 0,
        background: isPolluted
          ? 'radial-gradient(ellipse at top, rgba(239, 68, 68, 0.15) 0%, rgba(4, 28, 26, 0.98) 80%)'
          : 'radial-gradient(ellipse at top, rgba(20, 184, 166, 0.15) 0%, rgba(4, 28, 26, 0.98) 80%)'
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
          background: pm25Level > 75
            ? 'radial-gradient(circle at 50% 15%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)'
            : 'radial-gradient(circle at 50% 15%, rgba(20, 184, 166, 0.14) 0%, transparent 60%)'
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
