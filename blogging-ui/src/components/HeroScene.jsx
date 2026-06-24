import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

function seededNoise(index, axis) {
  const value = Math.sin(index * 91.7 + axis * 37.3) * 10000;
  return value - Math.floor(value);
}

function FloatingCard({ position, rotation, color, speed = 1 }) {
  const meshRef = useRef(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime * speed;
    meshRef.current.position.y = position[1] + Math.sin(t) * 0.18;
    meshRef.current.rotation.x = rotation[0] + Math.sin(t * 0.7) * 0.05;
    meshRef.current.rotation.y = rotation[1] + Math.cos(t * 0.6) * 0.07;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={[1.65, 1.08, 0.045]} />
      <meshStandardMaterial color={color} roughness={0.42} metalness={0.18} transparent opacity={0.9} />
    </mesh>
  );
}

function ParticleField() {
  const pointsRef = useRef(null);
  const { positions, colors } = useMemo(() => {
    const particleCount = 70;
    const nextPositions = new Float32Array(particleCount * 3);
    const nextColors = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      nextPositions[index * 3] = (seededNoise(index, 0) - 0.5) * 7;
      nextPositions[index * 3 + 1] = (seededNoise(index, 1) - 0.5) * 4.6;
      nextPositions[index * 3 + 2] = (seededNoise(index, 2) - 0.5) * 3;

      const cool = index % 3 === 0;
      nextColors[index * 3] = cool ? 0.2 : 0.55;
      nextColors[index * 3 + 1] = cool ? 0.72 : 0.38;
      nextColors[index * 3 + 2] = cool ? 0.96 : 0.95;
    }

    return { positions: nextPositions, colors: nextColors };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.elapsedTime * 0.025;
    pointsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.035;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.72} depthWrite={false} />
    </points>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={[1, 1.5]}
      frameloop="always"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.82} />
      <directionalLight position={[3, 4, 5]} intensity={1.15} />
      <pointLight position={[-3, -1, 3]} intensity={2.2} color="#38bdf8" />
      <ParticleField />
      <FloatingCard position={[-1.35, 0.72, 0]} rotation={[0.12, 0.34, -0.1]} color="#38bdf8" speed={0.8} />
      <FloatingCard position={[0.62, -0.02, 0.25]} rotation={[-0.06, -0.28, 0.08]} color="#8b5cf6" speed={1.08} />
      <FloatingCard position={[1.45, 0.88, -0.45]} rotation={[0.16, -0.48, 0.14]} color="#34d399" speed={0.68} />
      <mesh position={[0.05, -0.98, -0.35]} rotation={[-0.5, 0.04, 0]}>
        <torusGeometry args={[1.55, 0.012, 8, 96]} />
        <meshStandardMaterial color="#d946ef" transparent opacity={0.42} />
      </mesh>
    </Canvas>
  );
}
