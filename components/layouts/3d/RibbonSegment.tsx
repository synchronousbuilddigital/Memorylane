"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

interface RibbonSegmentProps {
  curve: THREE.Curve<THREE.Vector3>;
  t0: number; // Start fraction (0 to 1)
  t1: number; // End fraction (0 to 1)
  width: number;
  imageUrl: string;
}

export default function RibbonSegment({ curve, t0, t1, width, imageUrl }: RibbonSegmentProps) {
  // Load the texture. useTexture suspends until loaded.
  const texture = useTexture(imageUrl);
  
  // Ensure the texture maps properly to our custom geometry
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const geometry = useMemo(() => {
    const segments = 20; // Number of subdivisions for smooth curving
    
    // We need 2 vertices (top and bottom) for each step along the curve segment
    const vertexCount = (segments + 1) * 2;
    const positions = new Float32Array(vertexCount * 3);
    const uvsFront = new Float32Array(vertexCount * 2);
    const uvsBack = new Float32Array(vertexCount * 2);
    const indices = [];

    // computeFrenetFrames helps us calculate the 3D twist (Normal/Binormal) of the curve
    const frenetFrames = curve.computeFrenetFrames(1000, false);

    for (let i = 0; i <= segments; i++) {
      // Current progress along this specific segment
      const segmentProgress = i / segments;
      // Global progress along the entire curve
      const t = t0 + (t1 - t0) * segmentProgress;
      
      // Clamp t to prevent errors if animation pushes it slightly out of bounds
      const clampedT = Math.max(0, Math.min(1, t));

      // Get exact 3D position on the spline
      const pos = curve.getPointAt(clampedT);
      
      // Get exact Tangent, Normal, Binormal for twisting
      // We manually interpolate from the frenetFrames array
      const frameIndex = Math.min(
        Math.floor(clampedT * frenetFrames.normals.length),
        frenetFrames.normals.length - 1
      );
      
      const binormal = frenetFrames.binormals[frameIndex];

      // To make a flat ribbon, we sweep left and right along the BINORMAL vector
      // Top vertex
      const topPos = new THREE.Vector3().copy(pos).addScaledVector(binormal, width / 2);
      // Bottom vertex
      const bottomPos = new THREE.Vector3().copy(pos).addScaledVector(binormal, -width / 2);

      const vertexIndex = i * 2;
      
      // Assign Top Vertex
      positions[vertexIndex * 3 + 0] = topPos.x;
      positions[vertexIndex * 3 + 1] = topPos.y;
      positions[vertexIndex * 3 + 2] = topPos.z;

      // Assign Bottom Vertex
      positions[(vertexIndex + 1) * 3 + 0] = bottomPos.x;
      positions[(vertexIndex + 1) * 3 + 1] = bottomPos.y;
      positions[(vertexIndex + 1) * 3 + 2] = bottomPos.z;
      
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

      // Create triangles (indices)
      if (i < segments) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;

        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    const geoFront = new THREE.BufferGeometry();
    geoFront.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geoFront.setAttribute("uv", new THREE.BufferAttribute(uvsFront, 2));
    geoFront.setIndex(indices);
    geoFront.computeVertexNormals();
    
    const geoBack = new THREE.BufferGeometry();
    geoBack.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geoBack.setAttribute("uv", new THREE.BufferAttribute(uvsBack, 2));
    geoBack.setIndex(indices);
    geoBack.computeVertexNormals();

    return { geoFront, geoBack };
  }, [curve, t0, t1, width]);

  return (
    <group>
      <mesh geometry={geometry.geoFront}>
        <meshStandardMaterial 
          map={texture} 
          side={THREE.FrontSide} 
          transparent={true}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <mesh geometry={geometry.geoBack}>
        <meshStandardMaterial 
          map={texture} 
          side={THREE.BackSide} 
          transparent={true}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
