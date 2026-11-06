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

/**
 * Phase 15: Enhanced High-Contrast Drifting Particles (PointsMaterial)
 * - Contrast & Size: 0x10b981 emerald green, size: 0.28, opacity: 0.6 with soft circular alpha mask.
 * - Density: 650 to 850 particles populated across the viewport.
 * - Base Velocity: Noticeable organic baseline drift + wind vector.
 */
const DriftingParticles: React.FC<DriftingParticlesProps> = ({ pm25Level, windDirection, windSpeed }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);

  // Task 2: Increase Density to 650 - 850 particles based on PM2.5 level
  const particleCount = useMemo(() => {
    const normalized = Math.min(Math.max((pm25Level - 15) / 185, 0), 1);
    return Math.floor(650 + normalized * 200); // 650 to 850 particles
  }, [pm25Level]);

  // Positions array & individual particle velocities
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = [];

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;     // X span
      pos[i * 3 + 1] = (Math.random() - 0.5) * 32; // Y span
      pos[i * 3 + 2] = (Math.random() - 0.5) * 28; // Z depth

      vel.push({
        baseX: (Math.random() - 0.5) * 0.008,
        baseY: (Math.random() - 0.5) * 0.006,
        baseZ: (Math.random() - 0.5) * 0.004,
        wobbleSpeed: 0.8 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2
      });
    }

    return [pos, vel];
  }, [particleCount]);

  // Soft circular alpha mask texture so particles look like floating air/dust motes, not solid square dots
  const circleTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Task 3: Boost Base Velocity (The "Wind" Effect)
  useFrame((state, delta) => {
    if (!pointsRef.current || !geomRef.current) return;

    const time = state.clock.elapsedTime;
    const posAttr = geomRef.current.getAttribute('position') as THREE.BufferAttribute;
    if (!posAttr) return;

    const posArray = posAttr.array as Float32Array;

    // Noticeable baseline drift speed + real wind speed vector
    const baselineSpeed = 0.022; // Always drifting noticeably even at 0 wind
    const dynamicWindSpeed = Math.max(0.005, (windSpeed || 10) * 0.0025);
    const totalSpeed = baselineSpeed + dynamicWindSpeed;

    const radians = (((windDirection ?? 65) * Math.PI) / 180);
    const velX = Math.cos(radians) * totalSpeed;
    const velY = Math.sin(radians) * totalSpeed * 0.5;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const v = velocities[i];

      // Organic vertical sine-wave wobble
      const wobble = Math.sin(time * v.wobbleSpeed + v.phase) * 0.004;

      posArray[idx] += velX + v.baseX;
      posArray[idx + 1] += velY + wobble + v.baseY;
      posArray[idx + 2] += v.baseZ;

      // Wrap-around bounds so particles loop smoothly across viewport
      if (posArray[idx] > 24) posArray[idx] = -24;
      if (posArray[idx] < -24) posArray[idx] = 24;
      if (posArray[idx + 1] > 18) posArray[idx + 1] = -18;
      if (posArray[idx + 1] < -18) posArray[idx + 1] = 18;
      if (posArray[idx + 2] > 14) posArray[idx + 2] = -14;
      if (posArray[idx + 2] < -14) posArray[idx + 2] = 14;
    }

    posAttr.needsUpdate = true;

    // Noticeable global rotation for atmospheric depth
    pointsRef.current.rotation.y += delta * 0.035;
    pointsRef.current.rotation.x = Math.sin(time * 0.15) * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      {/* Task 1: High-contrast emerald green (0x10b981), increased size, transparent: true, opacity: 0.6 */}
      <pointsMaterial
        color={0x10b981}
        size={0.28}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.6}
        map={circleTexture || undefined}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};

// Fallback if WebGL is unavailable
const WebGLFallback: React.FC<{ pm25Level: number }> = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none transition-colors duration-1000"
      style={{
        zIndex: 0,
        background: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.06) 0%, rgba(249, 248, 246, 0.98) 80%)'
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
    } catch {
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
          background: 'radial-gradient(circle at 50% 15%, rgba(16, 185, 129, 0.05) 0%, transparent 65%)'
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
        <DriftingParticles
          pm25Level={pm25Level}
          windDirection={windDirection}
          windSpeed={windSpeed}
        />
      </Canvas>
    </div>
  );
};

export default AmbientBackground;
