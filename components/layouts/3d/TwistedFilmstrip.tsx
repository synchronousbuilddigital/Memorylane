"use client";

import { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Image as PrismaImage } from "@prisma/client";
import { ErrorBoundary } from "react-error-boundary";
import { useInView } from "react-intersection-observer";

// Pure mathematical definition of our Gaussian-damped Cycloid
function evaluateRibbon(t: number, R: number, A: number) {
  const E = Math.exp(-Math.pow(t / 4.0, 2));
  const x = R * t - A * E * Math.sin(t);
  const y = A * E * Math.cos(t);
  // Increase Z depth to make the 3D twist more pronounced
  const z = A * E * Math.sin(t) * 0.8;
  return new THREE.Vector3(x, y, z);
}

// Compute the 3D twist (binormal) at any point t
function getRibbonFrame(t: number, R: number, A: number) {
  const p1 = evaluateRibbon(t, R, A);
  // Extremely small delta for perfectly precise tangent calculation
  const p2 = evaluateRibbon(t + 0.001, R, A);
  const tangent = new THREE.Vector3().subVectors(p2, p1).normalize();
  
  // Use Z-axis as the Up vector so the ribbon stands up like a wall 
  // and smoothly banks into the loop!
  const up = new THREE.Vector3(0, 0, 1);
  const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
  
  return { pos: p1, binormal };
}

interface DynamicRibbonSegmentProps {
  baseT0: number; 
  segmentLength: number; 
  trackLength: number;
  width: number;
  imageUrl: string;
  progressRef: React.MutableRefObject<number>;
  R: number;
  A: number;
}

function DynamicRibbonSegment({ 
  baseT0, 
  segmentLength, 
  trackLength, 
  width, 
  imageUrl, 
  progressRef,
  R,
  A
}: DynamicRibbonSegmentProps) {
  const texture = useTexture(imageUrl);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  
  const geoFrontRef = useRef<THREE.BufferGeometry>(null);
  const geoBackRef = useRef<THREE.BufferGeometry>(null);
  const segments = 40; 

  useFrame(() => {
    if (!geoFrontRef.current || !geoBackRef.current) return;
    const posFront = geoFrontRef.current.attributes.position.array as Float32Array;
    const posBack = geoBackRef.current.attributes.position.array as Float32Array;

    const offset = progressRef.current;
    
    const tStart = -trackLength / 2;
    let relativeT = (baseT0 + offset - tStart) % trackLength;
    if (relativeT < 0) relativeT += trackLength;
    
    const localT0 = tStart + relativeT;
    const localT1 = localT0 + segmentLength;

    for (let i = 0; i <= segments; i++) {
      const segmentProgress = i / segments;
      const t = localT0 + (localT1 - localT0) * segmentProgress;
      
      const { pos, binormal } = getRibbonFrame(t, R, A);

      const topPos = new THREE.Vector3().copy(pos).addScaledVector(binormal, width / 2);
      const bottomPos = new THREE.Vector3().copy(pos).addScaledVector(binormal, -width / 2);

      const vertexIndex = i * 2;
      
      // Update Front positions
      posFront[vertexIndex * 3 + 0] = topPos.x;
      posFront[vertexIndex * 3 + 1] = topPos.y;
      posFront[vertexIndex * 3 + 2] = topPos.z;

      posFront[(vertexIndex + 1) * 3 + 0] = bottomPos.x;
      posFront[(vertexIndex + 1) * 3 + 1] = bottomPos.y;
      posFront[(vertexIndex + 1) * 3 + 2] = bottomPos.z;
      
      // Mirror to Back positions
      posBack[vertexIndex * 3 + 0] = topPos.x;
      posBack[vertexIndex * 3 + 1] = topPos.y;
      posBack[vertexIndex * 3 + 2] = topPos.z;

      posBack[(vertexIndex + 1) * 3 + 0] = bottomPos.x;
      posBack[(vertexIndex + 1) * 3 + 1] = bottomPos.y;
      posBack[(vertexIndex + 1) * 3 + 2] = bottomPos.z;
    }

    geoFrontRef.current.attributes.position.needsUpdate = true;
    geoFrontRef.current.computeVertexNormals();
    
    geoBackRef.current.attributes.position.needsUpdate = true;
    geoBackRef.current.computeVertexNormals();
  });

  const { initialPositions, uvsFront, uvsBack, indices } = useMemo(() => {
    const vertexCount = (segments + 1) * 2;
    const initialPositions = new Float32Array(vertexCount * 3);
    const uvsFront = new Float32Array(vertexCount * 2);
    const uvsBack = new Float32Array(vertexCount * 2);
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const vertexIndex = i * 2;
      const segmentProgress = i / segments;
      
      // Front side UVs: Flipped U and V to rotate 180 degrees
      uvsFront[vertexIndex * 2 + 0] = 1 - segmentProgress;
      uvsFront[vertexIndex * 2 + 1] = 0;
      
      uvsFront[(vertexIndex + 1) * 2 + 0] = 1 - segmentProgress;
      uvsFront[(vertexIndex + 1) * 2 + 1] = 1;
      
      // Back side UVs: Flipped V but standard U to read normally from behind, rotated 180
      uvsBack[vertexIndex * 2 + 0] = segmentProgress;
      uvsBack[vertexIndex * 2 + 1] = 0;
      
      uvsBack[(vertexIndex + 1) * 2 + 0] = segmentProgress;
      uvsBack[(vertexIndex + 1) * 2 + 1] = 1;

      if (i < segments) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }
    return { initialPositions, uvsFront, uvsBack, indices };
  }, [segments]);

  return (
    <group>
      {/* Front Side Mesh */}
      <mesh frustumCulled={false}>
        <bufferGeometry ref={geoFrontRef}>
          <bufferAttribute attach="attributes-position" count={(segments + 1) * 2} array={initialPositions} itemSize={3} />
          <bufferAttribute attach="attributes-uv" count={(segments + 1) * 2} array={uvsFront} itemSize={2} />
          <bufferAttribute attach="index" array={new Uint16Array(indices)} count={indices.length} itemSize={1} />
        </bufferGeometry>
        <meshStandardMaterial 
          map={texture} 
          color={texture ? "#ffffff" : "#222222"}
          side={THREE.FrontSide} 
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      
      {/* Back Side Mesh (renders perfectly on the flip side with un-mirrored text) */}
      <mesh frustumCulled={false}>
        <bufferGeometry ref={geoBackRef}>
          <bufferAttribute attach="attributes-position" count={(segments + 1) * 2} array={initialPositions} itemSize={3} />
          <bufferAttribute attach="attributes-uv" count={(segments + 1) * 2} array={uvsBack} itemSize={2} />
          <bufferAttribute attach="index" array={new Uint16Array(indices)} count={indices.length} itemSize={1} />
        </bufferGeometry>
        <meshStandardMaterial 
          map={texture} 
          color={texture ? "#ffffff" : "#222222"}
          side={THREE.BackSide} 
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

function RibbonScene({ images }: { images: PrismaImage[] }) {
  const progressRef = useRef(0);

  // Track Parameters
  const R = 25; 
  const A = 25; 
  const WIDTH = 18; 
  const SEGMENT_LENGTH = 0.85; // Fixed size per photo to maintain perfect aspect ratio
  
  // We need the track to be AT LEAST 100 units long to cover the screen bounds (-50 to 50).
  const MIN_TRACK_LENGTH = 100;
  const MIN_IMAGES = Math.ceil(MIN_TRACK_LENGTH / SEGMENT_LENGTH); 
  
  // CRITICAL: We make TOTAL_IMAGES a perfect multiple of images.length
  // This guarantees that when a photo wraps around to the beginning, 
  // it flawlessly continues the exact same repeating sequence!
  const multiplier = Math.ceil(MIN_IMAGES / images.length);
  const TOTAL_IMAGES = images.length * multiplier;
  
  // Now we calculate the exact dynamic track length based on the images
  const TRACK_LENGTH = TOTAL_IMAGES * SEGMENT_LENGTH;
  const T_START = -TRACK_LENGTH / 2;

  useFrame((state, delta) => {
    // Slower, majestic cinematic speed
    progressRef.current += delta * 0.5; 
  });

  return (
    <group position={[0, -5, 0]} scale={[1.3, 1.3, 1.3]}>
      {Array.from({ length: TOTAL_IMAGES }).map((_, i) => {
        const baseT0 = T_START + i * SEGMENT_LENGTH;
        const image = images[i % images.length];

        return (
          <ErrorBoundary key={i} FallbackComponent={() => null}>
            <Suspense fallback={null}>
              <DynamicRibbonSegment 
                baseT0={baseT0} 
                segmentLength={SEGMENT_LENGTH} 
                trackLength={TRACK_LENGTH}
                width={WIDTH} 
                imageUrl={image.thumbUrl} 
                progressRef={progressRef}
                R={R}
                A={A}
              />
            </Suspense>
          </ErrorBoundary>
        );
      })}
    </group>
  );
}

export default function TwistedFilmstrip({ images, previewMode = false }: { images: PrismaImage[], previewMode?: boolean }) {
  const { ref, inView } = useInView({ threshold: 0 });

  if (!images || images.length === 0) return null;

  const containerClass = previewMode
    ? "w-full h-full relative overflow-hidden pointer-events-none bg-transparent rounded-3xl"
    : "w-[100vw] h-[85vh] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-8 overflow-hidden pointer-events-none";

  // In preview mode, pull the camera back to fit the twist beautifully inside the card
  const cameraZ = previewMode ? 120 : 80;
  const cameraX = 0;

  return (
    <div 
      ref={ref} 
      className={containerClass}
    >
      <Canvas frameloop={inView ? "always" : "demand"} camera={{ position: [cameraX, 5, cameraZ], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 30, 20]} intensity={1.5} />
        <Environment preset="city" />
        
        <RibbonScene images={images} />
      </Canvas>
    </div>
  );
}
