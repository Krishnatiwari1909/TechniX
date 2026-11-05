import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DriftingParticlesProps {
  pm25Level: number;
}

// Particle field inside R3F Canvas
const DriftingParticles: React.FC<DriftingParticlesProps> = ({ pm25Level }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  // Particle count based on PM2.5 level (min 400, max 2000)
  const particleCount = useMemo(() => {
    const normalized = Math.min(Math.max((pm25Level - 15) / 185, 0), 1);
    return Math.floor(400 + normalized * 1600);
  }, [pm25Level]);

  // Positions and velocities
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 45;       // X
      pos[i3 + 1] = (Math.random() - 0.5) * 35;   // Y
      pos[i3 + 2] = (Math.random() - 0.5) * 30;   // Z

      spd[i3] = (Math.random() - 0.5) * 0.015;    // X drift
      spd[i3 + 1] = 0.008 + Math.random() * 0.02; // Upward / floating
      spd[i3 + 2] = (Math.random() - 0.5) * 0.015; // Z drift
    }
    return [pos, spd];
  }, [particleCount]);

  // Target color interpolates from soft blue (#38bdf8) to warning red (#ef4444)
  const targetColor = useMemo(() => {
    const c = new THREE.Color();
    if (pm25Level <= 35) {
      c.set('#38bdf8'); // Soft clean blue
    } else if (pm25Level <= 75) {
      const t = (pm25Level - 35) / 40;
      c.set('#38bdf8').lerp(new THREE.Color('#f59e0b'), t); // Amber
    } else if (pm25Level <= 130) {
      const t = (pm25Level - 75) / 55;
      c.set('#f59e0b').lerp(new THREE.Color('#ef4444'), t); // Warning Red
    } else {
      c.set('#dc2626'); // Severe Red
    }
    return c;
  }, [pm25Level]);

  // Frame update
  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array as Float32Array;
    const speedMultiplier = 1 + (pm25Level / 200) * 0.8;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      array[i3] += speeds[i3] * speedMultiplier;
      array[i3 + 1] += speeds[i3 + 1] * speedMultiplier;
      array[i3 + 2] += speeds[i3 + 2] * speedMultiplier;

      // Wrap around bounds
      if (array[i3 + 1] > 20) array[i3 + 1] = -20;
      if (array[i3] > 25) array[i3] = -25;
      if (array[i3] < -25) array[i3] = 25;
      if (array[i3 + 2] > 15) array[i3 + 2] = -15;
      if (array[i3 + 2] < -15) array[i3 + 2] = 15;
    }
    posAttr.needsUpdate = true;

    pointsRef.current.rotation.y += delta * 0.03;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;

    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, 0.05);
    }
  });

  const particleSize = useMemo(() => {
    return 0.12 + Math.min(pm25Level / 250, 0.22);
  }, [pm25Level]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={particleSize}
        color={targetColor}
        transparent
        opacity={Math.min(0.45 + (pm25Level / 250) * 0.45, 0.9)}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
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
          ? 'radial-gradient(ellipse at top, rgba(239, 68, 68, 0.12) 0%, rgba(10, 17, 40, 0.95) 80%)'
          : 'radial-gradient(ellipse at top, rgba(56, 189, 248, 0.12) 0%, rgba(10, 17, 40, 0.95) 80%)'
      }}
    />
  );
};

export const AmbientBackground: React.FC<{ pm25Level: number }> = ({ pm25Level }) => {
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
            : 'radial-gradient(circle at 50% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 60%)'
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <DriftingParticles pm25Level={pm25Level} />
      </Canvas>
    </div>
  );
};

export default AmbientBackground;

