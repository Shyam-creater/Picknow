import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const FloatingObject = ({ geometry, material, position, rotation, scale, floatIntensity }) => {
  const mesh = useRef();

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.2;
      mesh.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <Float floatIntensity={floatIntensity || 2} rotationIntensity={1} speed={2}>
      <mesh ref={mesh} geometry={geometry} material={material} position={position} rotation={rotation} scale={scale || 1} castShadow receiveShadow />
    </Float>
  );
};

const BackgroundElements = () => {
  // Memoize geometries and materials for performance
  const geometries = useMemo(() => ({
    sphere: new THREE.SphereGeometry(1, 32, 32),
    icosahedron: new THREE.IcosahedronGeometry(1, 0),
    torus: new THREE.TorusGeometry(1, 0.4, 16, 100)
  }), []);

  const materials = useMemo(() => ({
    greenGlass: new THREE.MeshPhysicalMaterial({
      color: '#4ade80',
      transmission: 0.9,
      opacity: 1,
      metalness: 0,
      roughness: 0.1,
      ior: 1.5,
      thickness: 0.5,
    }),
    yellowGlass: new THREE.MeshPhysicalMaterial({
      color: '#facc15',
      transmission: 0.9,
      opacity: 1,
      metalness: 0.1,
      roughness: 0.2,
    }),
    orangeMatte: new THREE.MeshStandardMaterial({
      color: '#fb923c',
      roughness: 0.8,
      metalness: 0.2,
    })
  }), []);

  return (
    <>
      <FloatingObject 
        geometry={geometries.icosahedron} 
        material={materials.greenGlass} 
        position={[-4, 2, -5]} 
        scale={1.5} 
        floatIntensity={3} 
      />
      <FloatingObject 
        geometry={geometries.torus} 
        material={materials.yellowGlass} 
        position={[5, -1, -3]} 
        scale={1.2} 
        rotation={[Math.PI / 4, Math.PI / 4, 0]}
      />
      <FloatingObject 
        geometry={geometries.sphere} 
        material={materials.orangeMatte} 
        position={[-3, -3, -4]} 
        scale={0.8} 
        floatIntensity={4} 
      />
      <FloatingObject 
        geometry={geometries.icosahedron} 
        material={materials.greenGlass} 
        position={[3, 3, -6]} 
        scale={1} 
      />
    </>
  );
};

const Organic3DBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: -1, pointerEvents: 'none', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)' }}>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment preset="forest" />
        <BackgroundElements />
        <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Canvas>
    </div>
  );
};

export default Organic3DBackground;
