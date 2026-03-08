import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { motion, useScroll, useTransform } from 'motion/react';

const GlassPlus = ({ scrollProgress }: { scrollProgress: any }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Create a '+' shape using two boxes
  const rotationX = useTransform(scrollProgress, [0, 1], [0, Math.PI * 2]);
  const rotationY = useTransform(scrollProgress, [0, 1], [0, Math.PI]);
  const scale = useTransform(scrollProgress, [0, 0.5, 1], [1, 1.5, 1]);
  
  // Horizontal movement: Center -> Right -> Left -> Center
  const xPos = useTransform(scrollProgress, [0, 0.33, 0.66, 1], [0, 5, -5, 0]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = rotationX.get() + state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = rotationY.get() + state.clock.getElapsedTime() * 0.3;
      meshRef.current.scale.setScalar(scale.get());
      meshRef.current.position.x = xPos.get();
    }
  });

  return (
    <group ref={meshRef}>
      {/* Horizontal bar */}
      <mesh>
        <boxGeometry args={[4, 1, 1]} />
        <MeshTransmissionMaterial 
          backside 
          samples={4} 
          thickness={1} 
          chromaticAberration={0.1} 
          anisotropy={0.1} 
          distortion={0.1} 
          distortionScale={0.1} 
          temporalDistortion={0.1} 
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
          color="#e0f2fe"
        />
      </mesh>
      {/* Vertical bar */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[4, 1, 1]} />
        <MeshTransmissionMaterial 
          backside 
          samples={4} 
          thickness={1} 
          chromaticAberration={0.1} 
          anisotropy={0.1} 
          distortion={0.1} 
          distortionScale={0.1} 
          temporalDistortion={0.1} 
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
          color="#e0f2fe"
        />
      </mesh>
    </group>
  );
};

const FloatingCube = ({ index, totalCount, scrollProgress }: { index: number, totalCount: number, scrollProgress: any }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Random initial positions
  const initialPos = useMemo(() => [
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 10
  ], []);

  // Target positions (forming a perfect circle)
  const angle = (index / totalCount) * Math.PI * 2;
  const targetPos = [
    Math.cos(angle) * 6,
    Math.sin(angle) * 6,
    0
  ];

  const x = useTransform(scrollProgress, [0, 0.5, 1], [initialPos[0], targetPos[0], initialPos[0] * -1]);
  const y = useTransform(scrollProgress, [0, 0.5, 1], [initialPos[1], targetPos[1], initialPos[1] * -1]);
  const z = useTransform(scrollProgress, [0, 0.5, 1], [initialPos[2], targetPos[2], initialPos[2] * -1]);
  const rotation = useTransform(scrollProgress, [0, 1], [0, Math.PI * 4]);

  const xShift = useTransform(scrollProgress, [0, 0.33, 0.66, 1], [0, 5, -5, 0]);

  useFrame((state) => {
    if (meshRef.current) {
      // Continuous orbital rotation
      const orbitSpeed = 0.5;
      const currentAngle = angle + state.clock.getElapsedTime() * orbitSpeed;
      
      // Calculate orbital position with a slight radius pulse for extra "life"
      const radius = 6 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
      const orbitX = Math.cos(currentAngle) * radius;
      const orbitY = Math.sin(currentAngle) * radius;

      // Always stay in orbit to maintain perfect alignment
      meshRef.current.position.set(orbitX + xShift.get(), orbitY, 0);
      meshRef.current.rotation.x = rotation.get() + state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.y = rotation.get() + state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <MeshTransmissionMaterial 
        backside 
        thickness={0.5} 
        chromaticAberration={0.05} 
        color="#ffffff"
      />
    </mesh>
  );
};

export const GlassScene = () => {
  const { scrollYProgress } = useScroll();

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
        <ambientLight intensity={0.8} />
        <spotLight position={[20, 20, 20]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-20, -20, -20]} intensity={0.5} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <GlassPlus scrollProgress={scrollYProgress} />
        </Float>

        {Array.from({ length: 6 }).map((_, i) => (
          <FloatingCube key={i} index={i} totalCount={6} scrollProgress={scrollYProgress} />
        ))}

        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
