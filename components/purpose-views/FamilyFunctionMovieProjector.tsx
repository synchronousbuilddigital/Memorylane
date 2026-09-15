"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment, Sparkles } from "@react-three/drei";
import * as THREE from "three";

// Simple global scroll state
const scrollState = {
  progress: 0,
  targetProgress: 0,
};

export default function FamilyFunctionMovieProjector({ images = [] }: { images: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract URLs safely handling both string and object image formats, wrapped in useMemo to prevent infinite render loops
  const safeImages = useMemo(() => {
    const extracted = images.map((i) => {
      if (typeof i === 'string') return i;
      return i?.displayUrl || i?.originalUrl || i?.url || i?.src || i?.file?.preview || i?.preview || '';
    }).filter((i) => typeof i === 'string' && i.length > 0);
    
    if (extracted.length === 0) {
      extracted.push(
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop"
      );
    }
    return extracted;
  }, [images]);

  // Handle scroll capture
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const isScrollDown = e.deltaY > 0;
      const isScrollUp = e.deltaY < 0;
      
      // If we are at the start of the cinematic and the section hasn't fully scrolled to the top of the screen yet, 
      // let the page scroll naturally! (Fixes the "getting stuck halfway" bug).
      const rect = el.getBoundingClientRect();
      if (Math.abs(rect.top) > 50 && scrollState.targetProgress === 0 && isScrollDown) {
        return; 
      }

      const prev = scrollState.targetProgress;
      scrollState.targetProgress = Math.max(0, Math.min(1, prev + e.deltaY * 0.0008));
      
      // Block page scroll if we are actively inside the cinematic journey
      if (scrollState.targetProgress > 0 && scrollState.targetProgress < 1) {
        e.preventDefault();
      } else if (scrollState.targetProgress === 0 && isScrollDown) {
        // Just entering
        e.preventDefault();
      } else if (scrollState.targetProgress === 1 && isScrollUp) {
        // Just leaving backwards
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0a0705] overflow-hidden"
    >
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        shadows
      >
        <ProjectorScene images={safeImages} />
      </Canvas>

      {/* Cinematic overlay text */}
      <div className="absolute top-1/2 -translate-y-1/2 left-12 md:left-24 text-white/80 font-serif z-10 pointer-events-none drop-shadow-2xl max-w-md">
        <h3 className="text-6xl md:text-8xl font-black tracking-widest text-amber-500/90 uppercase drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] leading-tight">
          Movie<br/>Night
        </h3>
        <div className="w-24 h-1 bg-amber-500/60 my-8"></div>
        <p className="text-xl md:text-2xl italic tracking-wide text-white/80 drop-shadow-md">
          A timeless collection of {safeImages.length} cherished memories.
        </p>
        <p className="text-sm md:text-base mt-4 text-white/40 tracking-wider uppercase">
          [ Scroll to roll the film ]
        </p>
      </div>
    </div>
  );
}

function ProjectorScene({ images }: { images: string[] }) {
  return (
    <group>
      <Environment preset="night" />
      {/* Rich cinematic room lighting - MUCH brighter and warmer */}
      <ambientLight intensity={1.5} color="#ffedd6" />
      <hemisphereLight args={['#ffedd6', '#5c3a21', 1.5]} />
      {/* Stronger floor lamp in the corner for warm ambiance */}
      <pointLight position={[-4, 3, -1]} intensity={2.5} color="#ffb766" distance={15} decay={1.5} castShadow />

      <LivingRoom images={images} />
      
      <group position={[0, 0, 0]}>
        <VintageProjector />
        <VolumetricBeam images={images} />
      </group>
      
      <ProjectionScreen images={images} />
      
      <CinematicCamera />
    </group>
  );
}

// Create a persistent blank texture to ensure shaders compile with USE_MAP
const blankCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (blankCanvas) {
  blankCanvas.width = 2; blankCanvas.height = 2;
  const ctx = blankCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 2, 2);
  }
}
const defaultTex = blankCanvas ? new THREE.CanvasTexture(blankCanvas) : new THREE.Texture();

function LivingRoom({ images = [] }: { images?: string[] }) {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  
  const matRef1 = useRef<THREE.MeshStandardMaterial>(null);
  const matRef2 = useRef<THREE.MeshStandardMaterial>(null);
  const matRef3 = useRef<THREE.MeshStandardMaterial>(null);
  const mats = [matRef1, matRef2, matRef3];

  useEffect(() => {
    if (!images || images.length === 0) return;
    Promise.all(images.map(url => loadTexturePromise(url))).then(loaded => {
      setTextures(loaded);
      
      // Initialize frame color to white so images appear brightly
      mats.forEach(ref => {
        if (ref.current) ref.current.color.setHex(0xffffff);
      });
    });
  }, [images]);

  useFrame((state) => {
    if (textures.length === 0) return;

    // Change frames every 4 seconds (0.25 fps)
    const slideProgress = state.clock.elapsedTime * 0.25; 
    const slideNumber = Math.floor(slideProgress);

    mats.forEach((matRef, i) => {
      if (matRef.current) {
        // Ensure they always display DIFFERENT images by offsetting their index evenly
        const offset = Math.floor((textures.length / 3) * i);
        const imageIndex = (slideNumber + offset) % textures.length;
        const newTex = textures[imageIndex];

        if (matRef.current.map !== newTex) {
          matRef.current.map = newTex;
          matRef.current.needsUpdate = true;
        }
      }
    });
  });

  return (
    <group>
      {/* Wooden Floor - Richer, brighter mahogany color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a1205" roughness={0.15} metalness={0.4} />
      </mesh>
      
      {/* Persian-style Rug under the projector */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.5]} receiveShadow>
        <planeGeometry args={[4.5, 5.5]} />
        <meshStandardMaterial color="#6b2b2b" roughness={0.9} />
      </mesh>
      {/* Rug inner border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2.5]} receiveShadow>
        <planeGeometry args={[4.1, 5.1]} />
        <meshStandardMaterial color="#8b3a3a" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 2.5]} receiveShadow>
        <planeGeometry args={[3.8, 4.8]} />
        <meshStandardMaterial color="#3d1414" roughness={0.9} />
      </mesh>
      
      {/* Back Wall - Deep cinematic color */}
      <mesh position={[0, 4, -8]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#1a1c1a" roughness={0.9} />
      </mesh>

      {/* Wainscoting on back wall */}
      <mesh position={[0, 1.2, -7.95]} receiveShadow>
        <planeGeometry args={[30, 2.4]} />
        <meshStandardMaterial color="#110d0a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.4, -7.9]} receiveShadow>
        <boxGeometry args={[30, 0.1, 0.1]} />
        <meshStandardMaterial color="#2a1508" roughness={0.6} />
      </mesh>

      {/* Decorative Picture Frames on the Wall */}
      {[-3, 0, 3].map((x, i) => (
        <group key={`frame-${i}`} position={[x, 4.5, -7.9]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 2, 0.1]} />
            <meshStandardMaterial color="#8c7a51" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[1.4, 1.8]} />
            <meshStandardMaterial 
              ref={mats[i]}
              color="#050505" 
              roughness={0.9} 
            />
          </mesh>
        </group>
      ))}

      {/* Magical Ambient Sparkles filling the room */}
      <Sparkles count={150} scale={15} size={2} speed={0.2} opacity={0.4} color="#ffe2b5" position={[0, 2, -2]} />

      {/* Left Wall with a massive glowing window (Moonlight spilling in) */}
      <group position={[-6, 3, -2]} rotation={[0, Math.PI / 2, 0]}>
        {/* Wall */}
        <mesh position={[0, 1, 0]} receiveShadow>
          <planeGeometry args={[20, 10]} />
          <meshStandardMaterial color="#1a1c1a" roughness={0.9} />
        </mesh>
        
        {/* Window Hole / Glow - Deep night sky color */}
        <mesh position={[0, 1, 0.05]}>
          <planeGeometry args={[4, 5]} />
          <meshBasicMaterial color="#0a1224" />
        </mesh>
        {/* Window Frame Panes */}
        <mesh position={[0, 1, 0.1]}><boxGeometry args={[4.2, 0.1, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 1, 0.1]}><boxGeometry args={[0.1, 5.2, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[-2, 1, 0.1]}><boxGeometry args={[0.1, 5.2, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[2, 1, 0.1]}><boxGeometry args={[0.1, 5.2, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, -1.5, 0.1]}><boxGeometry args={[4.2, 0.1, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 3.5, 0.1]}><boxGeometry args={[4.2, 0.1, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
        
        {/* Moonlight coming through window */}
        <spotLight position={[0, 1, 2]} target-position={[0, -2, -10]} intensity={1.5} color="#88bbff" angle={Math.PI / 4} penumbra={0.8} castShadow />
      </group>

      {/* Beautiful Floor Lamp in the corner */}
      <group position={[-4, 0, -6]}>
        {/* Base & Pole */}
        <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.4, 0.4, 0.2, 32]} /><meshStandardMaterial color="#b59a5b" metalness={0.8} /></mesh>
        <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 3, 16]} /><meshStandardMaterial color="#b59a5b" metalness={0.8} /></mesh>
        {/* Lampshade */}
        <mesh position={[0, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.5, 0.6, 32, 1, true]} />
          <meshStandardMaterial color="#ffeedd" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        {/* Glowing bulb inside */}
        <mesh position={[0, 3.2, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffaa55" />
        </mesh>
      </group>

      {/* Coffee Table / Projector Stand - Highly detailed */}
      <group position={[0, 0, 2.5]}>
        {/* Table Top */}
        <mesh position={[0, 0.7, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.2, 0.1, 1.4]} />
          <meshStandardMaterial color="#3a1e09" roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Table Drawer Rim */}
        <mesh position={[0, 0.6, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.0, 0.1, 1.2]} />
          <meshStandardMaterial color="#1a0d04" roughness={0.6} />
        </mesh>
        {/* Decorative Legs */}
        {[-1.0, 1.0].map(x => [-0.6, 0.6].map(z => (
          <group key={`${x}-${z}`} position={[x, 0.35, z]}>
             <mesh castShadow><cylinderGeometry args={[0.06, 0.04, 0.7, 16]} /><meshStandardMaterial color="#2a1508" /></mesh>
             <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.08, 0.08, 0.05, 16]} /><meshStandardMaterial color="#b59a5b" metalness={0.8} /></mesh>
          </group>
        )))}
        
        {/* Props on Table (Film boxes, old books) */}
        <mesh position={[0.6, 0.78, 0.2]} rotation={[0, Math.PI/6, 0]} castShadow>
          <boxGeometry args={[0.4, 0.05, 0.5]} />
          <meshStandardMaterial color="#662222" roughness={0.8} />
        </mesh>
        <mesh position={[0.62, 0.83, 0.18]} rotation={[0, Math.PI/4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.05, 0.5]} />
          <meshStandardMaterial color="#224422" roughness={0.8} />
        </mesh>
        <mesh position={[-0.7, 0.8, -0.2]} rotation={[0, -Math.PI/8, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 32]} />
          <meshStandardMaterial color="#555" metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function VintageProjector() {
  const reelRef1 = useRef<THREE.Group>(null);
  const reelRef2 = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (reelRef1.current && reelRef2.current) {
      // Sync reels directly to strict absolute clock time. Loops infinitely.
      const filmProgress = state.clock.elapsedTime * 0.4;
      const speedMultiplier = Math.PI * 2; 
      reelRef1.current.rotation.z = -filmProgress * speedMultiplier;
      reelRef2.current.rotation.z = -filmProgress * speedMultiplier; 
    }
  });

  return (
    <group position={[0, 0.75, 2.5]} castShadow>
      {/* Projector Body Base - Vintage Brass & Steel */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.5]} />
        <meshStandardMaterial color="#4a4238" metalness={0.9} roughness={0.3} />
      </mesh>
      
      {/* Brass accents */}
      <mesh position={[0, 0.2, 0.26]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial color="#b59a5b" metalness={1.0} roughness={0.2} />
      </mesh>

      {/* Projector Lens Tube */}
      <mesh position={[0, 0.3, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.3, 16]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Lens Glass */}
      <mesh position={[0, 0.3, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={1} roughness={0} emissive="#ffddaa" emissiveIntensity={3} />
      </mesh>

      {/* Front Reel (Feed) - Brass */}
      <group ref={reelRef1} position={[0, 0.7, -0.1]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.02, 32]} />
          <meshStandardMaterial color="#8c7a51" metalness={0.9} roughness={0.4} />
        </mesh>
        {/* Film on reel */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.021, 32]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>

      {/* Back Reel (Take-up) - Brass */}
      <group ref={reelRef2} position={[0, 0.7, 0.25]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.02, 32]} />
          <meshStandardMaterial color="#8c7a51" metalness={0.9} roughness={0.4} />
        </mesh>
        {/* Film on reel */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.021, 32]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>
      
      {/* Film Path (Connecting the reels and lens) */}
      <mesh position={[0, 0.5, 0.08]} rotation={[-Math.PI/4, 0, 0]}>
         <planeGeometry args={[0.02, 0.5]} />
         <meshBasicMaterial color="#111" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function VolumetricBeam({ images = [] }: { images?: string[] }) {
  const dustRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const [textures, setTextures] = useState<THREE.Texture[]>([]);

  // Preload textures identically to the screen
  useEffect(() => {
    if (!images || images.length === 0) return;
    Promise.all(images.map(url => loadTexturePromise(url))).then(loadedTextures => {
      setTextures(loadedTextures);
    });
  }, [images]);
  
  // Create 150 dust particles positioned randomly within a cone shape
  const dustParticles = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const count = 150;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Z distance from projector (0 to -6)
      const z = -(Math.random() * 5 + 0.5); 
      // Beam spread increases with distance
      const spread = Math.abs(z) * 0.3; 
      
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * spread;
      
      positions[i * 3] = Math.cos(angle) * radius; // x
      positions[i * 3 + 1] = Math.sin(angle) * radius; // y
      positions[i * 3 + 2] = z; // z
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (dustRef.current) {
      // Slowly float and rotate the dust
      dustRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      dustRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }

    if (textures.length > 0 && materialRef.current) {
      // Sync the particle images to the exact same clock as the projector screen
      const filmProgress = state.clock.elapsedTime * 0.4;
      const frameNumber = Math.floor(filmProgress);
      const currentImageIndex = frameNumber % textures.length;
      const newTex = textures[currentImageIndex];

      if (materialRef.current.map !== newTex) {
        materialRef.current.map = newTex;
        materialRef.current.needsUpdate = true;
      }
    }
  });

  return (
    <group position={[0, 1.05, 2.2]}>
      {/* The actual light casting onto the screen */}
      <spotLight
        position={[0, 0, 0]}
        target-position={[0, 0.5, -10]}
        angle={Math.PI / 8}
        penumbra={0.5}
        intensity={6}
        color="#ffebd4"
        castShadow
        distance={20}
      />
      
      {/* Visual beam cone using additive blending */}
      <mesh position={[0, -0.2, -3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 0.05, 6, 32, 1, true]} />
        <meshBasicMaterial 
          color="#ffebd4" 
          transparent 
          opacity={0.12} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Dust Particles */}
      <points ref={dustRef} geometry={dustParticles}>
        <pointsMaterial
          ref={materialRef}
          size={0.1}
          color="#ffffff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
}

const projectorState = {
  filmProgress: 0,
  currentImageIndex: 0,
  isTransitioning: false,
};

// Simple global texture cache to prevent reloading/suspense loops
const textureCache = new Map<string, THREE.Texture>();

function loadTexturePromise(url: string): Promise<THREE.Texture> {
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url)!);
  }

  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    
    // CRITICAL: Only set crossOrigin for external URLs. 
    // Setting it for 'blob:' or 'data:' URIs will cause strict CORS failures in some browsers.
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      loader.setCrossOrigin('anonymous');
    }
    
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(url, tex);
        resolve(tex);
      },
      undefined,
      (err) => {
        console.error("Failed to load texture", url, err);
        // Fallback to a visible grey texture on error
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#fff';
        ctx.font = '40px sans-serif';
        ctx.fillText('Image Error', 150, 256);
        const fallbackTex = new THREE.CanvasTexture(canvas);
        textureCache.set(url, fallbackTex);
        resolve(fallbackTex);
      }
    );
  });
}

function ProjectionScreen({ images }: { images: string[] }) {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  
  // Preload all textures asynchronously
  useEffect(() => {
    if (!images || images.length === 0) return;
    
    Promise.all(images.map(url => loadTexturePromise(url))).then(loadedTextures => {
      setTextures(loadedTextures);
    });
  }, [images]);

  useFrame((state) => {
    if (textures.length === 0) return;

    // Advance film progress continuously based on strict clock time
    const filmProgress = state.clock.elapsedTime * 0.4; // 0.4 frames per second
    const frameNumber = Math.floor(filmProgress);
    const frameFraction = filmProgress - frameNumber;
    
    // Looping infinitely through images
    const currentImageIndex = frameNumber % textures.length;
    const newTex = textures[currentImageIndex];
    
    if (materialRef.current) {
      // Directly mutate the material for maximum performance, only when it changes
      if (materialRef.current.map !== newTex) {
        materialRef.current.map = newTex;
        materialRef.current.needsUpdate = true;
      }
      // Authentic analog flicker (brightness variations)
      const baseColor = new THREE.Color(0xffffff);
      const flickerAmt = Math.random() * 0.15;
      
      // Mechanical shutter effect: darkens during the transition phase (e.g. fraction 0.9 to 1.0)
      if (frameFraction > 0.9) {
        // Deep shutter blink
        materialRef.current.color.setHex(0x222222);
      } else {
        // Slight color flicker
        baseColor.lerp(new THREE.Color(0xdddddd), flickerAmt);
        materialRef.current.color.copy(baseColor);
      }
    }

    if (screenRef.current) {
      // Subtle vertical jitter typical of old projectors
      const jitterY = (Math.random() - 0.5) * 0.005;
      
      // When transitioning, simulate the physical film pulling down rapidly
      let pullDown = 0;
      if (frameFraction > 0.9) {
        const t = (frameFraction - 0.9) * 10;
        pullDown = -t * 0.5;
      }
      screenRef.current.position.y = jitterY + pullDown;
    }
  });

  return (
    <group position={[0, 1.5, -4.9]}>
      {/* The physical screen fabric */}
      <mesh ref={screenRef} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 3.1, 8, 8]} />
        <meshBasicMaterial 
          ref={materialRef}
          color="#ffffff"
          map={defaultTex} 
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Projection Screen Frame / Stand */}
      <mesh position={[0, -1.8, -0.05]}>
        <boxGeometry args={[4.4, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Stand Legs */}
      <mesh position={[-2, -2.8, -0.05]}><cylinderGeometry args={[0.05, 0.05, 2]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[2, -2.8, -0.05]}><cylinderGeometry args={[0.05, 0.05, 2]} /><meshStandardMaterial color="#1a1a1a" /></mesh>


    </group>
  );
}

function CinematicCamera() {
  // Define a cinematic camera path that flies through the room
  const cameraPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.8, 7),      // 1. Scene entrance (high up)
    new THREE.Vector3(1.5, 1.2, 3.5),  // 2. Fly right, look at projector side
    new THREE.Vector3(0.5, 0.9, 2.3),  // 3. Inspecting film reels closely
    new THREE.Vector3(-0.2, 1.1, 1.8), // 4. Move around to the front lens
    new THREE.Vector3(0, 1.5, 0),      // 5. Enter the volumetric light beam
    new THREE.Vector3(0, 1.5, -3.5),   // 6. Arrive right in front of the screen
  ]), []);

  // Define where the camera should look at each step of the path
  const lookAtPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.8, 2.5),    // 1. Look down at projector on table
    new THREE.Vector3(0, 0.8, 2.5),    // 2. Keep looking at projector
    new THREE.Vector3(0, 0.8, 2.5),    // 3. Focus on reels
    new THREE.Vector3(0, 1.5, -6),     // 4. Suddenly look down the beam at the screen
    new THREE.Vector3(0, 1.5, -6),     // 5. Keep looking at screen
    new THREE.Vector3(0, 1.5, -6),     // 6. Focus on the memory
  ]), []);

  useFrame(({ camera }) => {
    // Smoothly interpolate scroll progress for buttery animation
    scrollState.progress += (scrollState.targetProgress - scrollState.progress) * 0.05;
    
    // Evaluate the splines based on progress (0 to 1)
    const pos = cameraPath.getPointAt(scrollState.progress);
    const lookAtPos = lookAtPath.getPointAt(scrollState.progress);
    
    camera.position.copy(pos);
    camera.lookAt(lookAtPos);
  });
  
  return null;
}
