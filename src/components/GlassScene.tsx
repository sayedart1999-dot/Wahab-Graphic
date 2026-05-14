import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useScroll, useTransform } from 'motion/react';

// Performance detection
const useLowerPerf = () => {
  const [isLowPerf, setIsLowPerf] = useState(false);
  
  useEffect(() => {
    const checkPerf = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
      const isLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
      
      if (isMobile || isLowMemory || isLowCores) {
        setIsLowPerf(true);
      }
    };
    checkPerf();
  }, []);
  
  return isLowPerf;
};

const GlassPlus = ({ scrollProgress, isLowPerf }: { scrollProgress: any, isLowPerf: boolean }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  const rotationX = useTransform(scrollProgress, [0, 1], [0, Math.PI * 2]);
  const rotationY = useTransform(scrollProgress, [0, 1], [0, Math.PI]);
  const scale = useTransform(scrollProgress, [0, 0.5, 1], [1, 1.5, 1]);
  const xPos = useTransform(scrollProgress, [0, 0.33, 0.66, 1], [0, 5, -5, 0]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = rotationX.get() + state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = rotationY.get() + state.clock.getElapsedTime() * 0.3;
      meshRef.current.scale.setScalar(scale.get());
      meshRef.current.position.x = xPos.get();
    }
  });

  const Material = isLowPerf ? 'meshStandardMaterial' : MeshTransmissionMaterial;
  const materialProps = isLowPerf ? { 
    transparent: true, 
    opacity: 0.4, 
    roughness: 0.1, 
    metalness: 1, 
    color: "#e0f2fe" 
  } : {
    backside: true,
    samples: 4,
    thickness: 1,
    chromaticAberration: 0.1,
    anisotropy: 0.1,
    distortion: 0.1,
    distortionScale: 0.1,
    temporalDistortion: 0.1,
    clearcoat: 1,
    attenuationDistance: 0.5,
    attenuationColor: "#ffffff",
    color: "#e0f2fe"
  };

  return (
    <group ref={meshRef}>
      <mesh>
        <boxGeometry args={[4, 1, 1]} />
        {/* @ts-ignore */}
        <Material {...materialProps} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[4, 1, 1]} />
        {/* @ts-ignore */}
        <Material {...materialProps} />
      </mesh>
    </group>
  );
};

const FloatingCube = ({ index, totalCount, scrollProgress, isLowPerf }: { index: number, totalCount: number, scrollProgress: any, isLowPerf: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const initialPos = useMemo(() => [
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 10
  ], []);

  const angle = (index / totalCount) * Math.PI * 2;
  const rotation = useTransform(scrollProgress, [0, 1], [0, Math.PI * 4]);
  const xShift = useTransform(scrollProgress, [0, 0.33, 0.66, 1], [0, 5, -5, 0]);

  useFrame((state) => {
    if (meshRef.current) {
      const orbitSpeed = isLowPerf ? 0.3 : 0.5;
      const currentAngle = angle + state.clock.getElapsedTime() * orbitSpeed;
      const radius = 6 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
      const orbitX = Math.cos(currentAngle) * radius;
      const orbitY = Math.sin(currentAngle) * radius;

      meshRef.current.position.set(orbitX + xShift.get(), orbitY, 0);
      meshRef.current.rotation.x = rotation.get() + state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.y = rotation.get() + state.clock.getElapsedTime() * 0.3;
    }
  });

  const Material = isLowPerf ? 'meshStandardMaterial' : MeshTransmissionMaterial;
  const materialProps = isLowPerf ? { 
    transparent: true, 
    opacity: 0.3, 
    roughness: 0.2, 
    color: "#ffffff" 
  } : {
    backside: true,
    thickness: 0.5,
    chromaticAberration: 0.05,
    color: "#ffffff"
  };

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      {/* @ts-ignore */}
      <Material {...materialProps} />
    </mesh>
  );
};

export const GlassScene = () => {
  const { scrollYProgress } = useScroll();
  const isLowPerf = useLowerPerf();

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60">
      <Canvas 
        dpr={isLowPerf ? [1, 1] : [1, 2]} 
        gl={{ 
          antialias: !isLowPerf, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
        <ambientLight intensity={isLowPerf ? 1.5 : 0.8} />
        <spotLight position={[20, 20, 20]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-20, -20, -20]} intensity={0.5} />
        
        <React.Suspense fallback={null}>
          <Float speed={isLowPerf ? 1 : 1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <GlassPlus scrollProgress={scrollYProgress} isLowPerf={isLowPerf} />
          </Float>

          {Array.from({ length: isLowPerf ? 3 : 6 }).map((_, i) => (
            <FloatingCube key={i} index={i} totalCount={isLowPerf ? 3 : 6} scrollProgress={scrollYProgress} isLowPerf={isLowPerf} />
          ))}

          <Environment preset="city" />
        </React.Suspense>
      </Canvas>
    </div>
  );
};

