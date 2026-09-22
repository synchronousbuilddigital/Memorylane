"use client";

import React, { useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { TextureLoader, Mesh, DoubleSide } from "three";
import { OrbitControls, Environment } from "@react-three/drei";

function EarthMesh() {
  const meshRef = useRef<Mesh>(null);

  // Load Textures
  // 1. Earth Topography (Grayscale displacement map)
  const [heightMap] = useLoader(TextureLoader, [
    "https://unpkg.com/three-globe/example/img/earth-topology.png"
  ]);

  return (
    <mesh ref={meshRef} rotation={[-0.2, 0, 0]} receiveShadow castShadow>
      {/* Plane: width, height, widthSegments, heightSegments. High segments needed for displacement detail */}
      <planeGeometry args={[16, 8, 512, 256]} />
      <meshStandardMaterial 
        color="#8B5A2B"
        displacementMap={heightMap}
        displacementScale={0.8} // Extrude the continents!
        roughness={0.6}
        metalness={0.1}
        side={DoubleSide}
      />
    </mesh>
  );
}

export default function ThreeEarthPlane() {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#030910]">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        {/* Deep blue ocean background color (behind the plane) */}
        <color attach="background" args={["#030910"]} />
        
        {/* Lighting to cast dramatic shadows on the extruded wood */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={2048}
        />
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={0.5} 
        />
        
        {/* Environment reflections to make the wood look polished */}
        <Environment preset="city" />

        <EarthMesh />

        {/* Allow user to pan/zoom slightly if they want to inspect the 3D */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          maxPolarAngle={Math.PI / 1.5} 
          minPolarAngle={Math.PI / 3} 
          maxAzimuthAngle={Math.PI / 8}
          minAzimuthAngle={-Math.PI / 8}
        />
      </Canvas>
    </div>
  );
}
