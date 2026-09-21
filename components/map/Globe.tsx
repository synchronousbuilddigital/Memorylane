"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import { ArrowUpRight } from "lucide-react";
import { useCoarsePointer } from "@/lib/useCoarsePointer";

/* An interactive globe. Pins sit at real latitude and longitude, so the texture
   underneath has to be a true equirectangular projection — see the bake script
   that produced /globe/earth.webp.

   The sphere carries the rotation, not the camera, so a pin's screen position
   is just its point on the sphere transformed by the sphere's own matrix. That
   keeps the maths for placing a pin and for reading one back symmetrical. */

export const GLOBE_R = 2;

/* How close the wheel may bring the camera. It must never reach the surface,
   so the nearest distance stays well clear of the radius; at 1.4x the globe
   covers roughly two and a half screens, which is as far in as 1:110m borders
   are worth pushing before they turn to mush. */
const MIN_DIST = GLOBE_R * 1.4;

/** The camera's vertical field of view. Shared with the Canvas below so the
    handoff maths and the actual camera can never drift apart. */
const FOV = 42;

/* How much ground the globe is showing when it is zoomed all the way in —
   about 1,950km across. The flat map takes over at exactly this width, which
   is what makes the two feel like one continuous zoom rather than a swap.
   Independent of GLOBE_R: the radius cancels. */
export const HANDOFF_WIDTH_M =
  2 * (MIN_DIST - GLOBE_R) * Math.tan((FOV * Math.PI) / 360) * (6_371_000 / GLOBE_R);

/** Shared by the wheel handler, the camera and the drag maths. `t` is 0 with
    the whole globe in frame and 1 at the closest zoom; `dragScale` is how much
    a pixel of drag should turn the globe at the current distance, and
    `pinScale` keeps a pin the same size on screen however far in you go. */
type View = {
  t: number; dragScale: number; pinScale: number; pinching: boolean;
  /** Where the globe is looking — the point facing the camera, kept current
      each frame so the flat map can pick up exactly where the globe left off. */
  lat: number; lng: number;
};

export type Place = {
  id: string;
  title: string;
  placeName: string | null;
  lat: number;
  lng: number;
  cover?: string | null;
};

/** Latitude and longitude to a point on the sphere, in the sphere's own space. */
export function latLngToVec(lat: number, lng: number, r = GLOBE_R) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** The sphere rotation that brings a place round to face the camera.

    Derived rather than guessed: the camera sits on +Z, so the place must end up
    at maximum +z. A point's horizontal angle is (PI - theta), and a Y rotation
    of `a` puts it at z = R*sin(angle - a), which peaks at a = angle - PI/2.
    The earlier version had the sign inverted and opened on the wrong ocean. */
export function faceLatLng(lat: number, lng: number) {
  return {
    y: Math.PI / 2 - ((lng + 180) * Math.PI) / 180,
    x: (lat * Math.PI) / 180,
  };
}

/** The inverse of faceLatLng: which place a given sphere rotation is showing. */
export function spinToLatLng(rotX: number, rotY: number) {
  const lat = THREE.MathUtils.clamp((rotX * 180) / Math.PI, -90, 90);
  const raw = ((Math.PI / 2 - rotY) * 180) / Math.PI - 180;
  return { lat, lng: ((((raw + 180) % 360) + 360) % 360) - 180 };   // wrapped to [-180,180]
}

/** The inverse: a point on the sphere back to latitude and longitude. */
export function vecToLatLng(v: THREE.Vector3) {
  const p = v.clone().normalize();
  const lat = 90 - Math.acos(p.y) * (180 / Math.PI);
  const lng = ((Math.atan2(p.z, -p.x) * (180 / Math.PI)) + 360) % 360 - 180;
  return { lat, lng };
}

/* Sits the camera back far enough that the whole sphere fits, whichever of
   the canvas's two sides is the tighter one. A fixed distance only ever suits
   one shape of box: the same number that framed the globe nicely on a wide
   screen cropped its left and right edges in a tall narrow column. The margin
   is the air left around the sphere, which pin heads stand up into. Kept
   tight so the sphere nearly fills the round window it now sits in. */
function FitCamera({ view, margin = 1.04 }: { view: MutableRefObject<View>; margin?: number }) {
  const { camera, size } = useThree();
  const shown = useRef(0);                     // eased, so the wheel glides
  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const halfV = (cam.fov * Math.PI) / 360;
    const halfH = Math.atan(Math.tan(halfV) * (size.width / size.height));
    const baseZ = (GLOBE_R * margin) / Math.sin(Math.min(halfV, halfH));

    const k = 1 - Math.pow(0.002, dt);
    shown.current += (view.current.t - shown.current) * k;
    cam.position.z = baseZ + (MIN_DIST - baseZ) * shown.current;

    /* Zoomed in, the same drag should turn the globe less — otherwise a small
       movement throws the map across the screen, which no real map does. */
    /* A pin is geometry sitting on the sphere, so without this it swells
       into a great gold disc as the camera comes in. Its apparent size goes
       as 1/(distance - radius), so scaling by that ratio holds it steady. */
    const reach = (cam.position.z - GLOBE_R) / (baseZ - GLOBE_R);
    view.current.dragScale = THREE.MathUtils.clamp(reach, 0.28, 1);
    view.current.pinScale = THREE.MathUtils.clamp(reach, 0.12, 1);
  });
  return null;
}

function Pin({ place, active, onPick, onOpen, view, drag, coarse }: {
  place: Place; active: boolean;
  onPick: (id: string) => void;
  onOpen?: (id: string) => void;
  view: MutableRefObject<View>;
  drag: MutableRefObject<{ on: boolean; x: number; y: number; moved: number }>;
  coarse: boolean;
}) {
  const pos = useMemo(() => latLngToVec(place.lat, place.lng, GLOBE_R + 0.02), [place.lat, place.lng]);
  const [hover, setHover] = useState(false);
  const group = useRef<THREE.Group>(null);

  // a pin should stand up off the surface, so point its local +Y outward
  const quat = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, pos.clone().normalize());
  }, [pos]);

  useFrame(() => { group.current?.scale.setScalar(view.current.pinScale); });

  const lit = active || hover;
  return (
    <group ref={group} position={pos} quaternion={quat}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
        onClick={(e) => {
          e.stopPropagation();
          /* A drag that happens to start on a pin is a drag, not a click.
             The sphere already ignored those; the pin did not, which merely
             mis-selected before but would now throw you onto another page. */
          if (drag.current.moved > 6) return;

          /* With a mouse the label is already up, because hover lights the
             pin, so a click can go straight to the album. Touch has no
             hover: the first tap shows which pin it is, the second opens. */
          if (!onOpen) return onPick(place.id);
          if (coarse && !active) return onPick(place.id);
          onOpen(place.id);
        }}
      >
        {/* a generous invisible hit area; the visible head is smaller */}
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Walnut at rest, brass when picked — the site's own active colour.
          On the parchment map a glowing pin would burn out to white, so the
          head carries only a trace of emissive. */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[lit ? 0.075 : 0.055, 20, 20]} />
        <meshStandardMaterial
          color={lit ? "#c9a24a" : "#6b4423"}
          emissive={lit ? "#8a6a1e" : "#000000"}
          emissiveIntensity={lit ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.09, 8]} />
        <meshStandardMaterial color="#5c3616" />
      </mesh>
      {/* Two things about the label. No distanceFactor, so it holds one
          screen size at every zoom — scaled with the camera it ballooned off
          the canvas on the way in. And it is lifted in screen space, not in
          3D: this group is turned so its +Y points straight out of the
          sphere, which for a pin facing the camera is towards the viewer,
          not up the screen, so a 3D offset left the label sitting on its
          own pin. */}
      {lit && (
        <Html center position={[0, 0, 0]} zIndexRange={[20, 0]}>
          {/* Solid, not translucent: over a pale globe a see-through pill let
              the map show through the text and the label became unreadable. */}
          <div className="pointer-events-none -translate-y-10 whitespace-nowrap rounded-full border border-[#c9a24a]/45 bg-[#1c1917] px-2.5 py-1 text-[12px] font-semibold text-[#f6e29a] shadow-[0_8px_20px_-8px_rgba(28,25,23,0.8)]">
            {place.title}
            {place.placeName && <span className="ml-1.5 font-normal text-white/70">{place.placeName}</span>}
            {onOpen && (
              <ArrowUpRight size={12} className="ml-1.5 inline-block -translate-y-px text-white/60" aria-hidden />
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function Earth({
  places, activeId, spinTo, onPick, onOpen, onDropPin, view, coarse,
}: {
  places: Place[]; activeId: string | null; spinTo: { lat: number; lng: number } | null;
  onPick: (id: string) => void; onOpen?: (id: string) => void;
  onDropPin?: (p: { lat: number; lng: number }) => void;
  view: MutableRefObject<View>; coarse: boolean;
}) {
  const tex = useTexture("/globe/earth.webp");
  const globe = useRef<THREE.Mesh>(null);
  const drag = useRef({ on: false, x: 0, y: 0, moved: 0 });
  // Start looking at the first pin. Otherwise the globe opens on whatever
  // longitude happens to be zero and the user sees no pins at all.
  const first = places[0];
  const spin = useRef(first ? faceLatLng(first.lat, first.lng) : { y: 0, x: 0 });
  const target = useRef<{ y: number; x: number } | null>(null);
  const { gl } = useThree();

  // colour space matters or the brass reads muddy
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; }, [tex]);

  // asked to look at a place: aim, then ease there in the frame loop
  useMemo(() => {
    if (!spinTo) return;
    target.current = faceLatLng(spinTo.lat, spinTo.lng);
  }, [spinTo]);

  useFrame((_, dt) => {
    const g = globe.current;
    if (!g) return;
    if (target.current) {
      const k = 1 - Math.pow(0.001, dt);
      spin.current.y += (target.current.y - spin.current.y) * k;
      spin.current.x += (target.current.x - spin.current.x) * k;
      if (Math.abs(target.current.y - spin.current.y) < 0.002) target.current = null;
    } else if (!drag.current.on) {
      spin.current.y += dt * 0.045 * view.current.dragScale;   // a slow idle drift
    }
    g.rotation.y = spin.current.y;
    g.rotation.x = THREE.MathUtils.clamp(spin.current.x, -1.1, 1.1);

    // read back off the applied rotation, so the clamp is accounted for
    const centre = spinToLatLng(g.rotation.x, g.rotation.y);
    view.current.lat = centre.lat;
    view.current.lng = centre.lng;
  });

  const down = (e: ThreeEvent<PointerEvent>) => {
    drag.current = { on: true, x: e.clientX, y: e.clientY, moved: 0 };
    target.current = null;
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current.on || view.current.pinching) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.moved += Math.abs(dx) + Math.abs(dy);
    const speed = 0.005 * view.current.dragScale;
    spin.current.y += dx * speed;
    spin.current.x += dy * speed;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    gl.domElement.style.cursor = "grabbing";
  };
  const up = () => { drag.current.on = false; gl.domElement.style.cursor = "grab"; };

  // a click that did not drag drops a pin where the ray met the sphere
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!onDropPin || drag.current.moved > 6 || !globe.current) return;
    e.stopPropagation();
    const local = globe.current.worldToLocal(e.point.clone());   // undo the sphere's rotation
    onDropPin(vecToLatLng(local));
  };

  return (
    <>
      {/* Mostly ambient on purpose. This is a map, not a planet: a realistic
          key light leaves half the land unreadable in shadow. The faint
          directional just keeps a hint of roundness.

          The numbers are derived, not dialled in. Three shades a Lambertian
          surface as irradiance x albedo / PI, so an ambient of PI (3.14) is
          what renders a texture at exactly its own colour. Sitting a little
          under it, and letting the directional carry the rest at the point
          facing the light, gives a map that is true in the middle and falls
          off just enough at the limb to read as a sphere. */}
      <ambientLight intensity={2.55} />
      <directionalLight position={[3, 2, 5]} intensity={0.62} />
      <mesh
        ref={globe}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        onClick={click}
      >
        <sphereGeometry args={[GLOBE_R, 64, 64]} />
        <meshStandardMaterial map={tex} roughness={0.95} metalness={0} />
        {places.map((p) => (
          <Pin key={p.id} place={p} active={p.id === activeId}
            onPick={onPick} onOpen={onOpen} view={view} drag={drag} coarse={coarse} />
        ))}
      </mesh>
      {/* A walnut edge, so a parchment sphere on a cream page still reads as
          an object with a boundary. Drawn on the inside of a slightly larger
          sphere, which shows only as a ring around the silhouette. */}
      <mesh scale={1.025}>
        <sphereGeometry args={[GLOBE_R, 48, 48]} />
        <meshBasicMaterial color="#8a755b" transparent opacity={0.26} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

export default function Globe({
  places, activeId = null, spinTo = null, onPick, onOpen, onDropPin, className,
  onZoomThrough, returnKey = 0,
}: {
  places: Place[]; activeId?: string | null; spinTo?: { lat: number; lng: number } | null;
  onPick: (id: string) => void;
  /** Clicking a pin opens its album. Left out, a click only selects. */
  onOpen?: (id: string) => void;
  onDropPin?: (p: { lat: number; lng: number }) => void; className?: string;
  /** Fired when someone keeps zooming in past the globe's limit — the point
      at which the flat map should take over, and where it should open. */
  onZoomThrough?: (centre: { lat: number; lng: number }) => void;
  /** Bumped when the flat map hands back, to restore the globe's zoom. */
  returnKey?: number;
}) {
  const coarse = useCoarsePointer();     // no hover on touch, so pins need two taps
  const view = useRef<View>({ t: 0, dragScale: 1, pinScale: 1, pinching: false, lat: 0, lng: 0 });
  const past = useRef(0);          // how far past the limit the wheel has pushed
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const spread = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  /* The wheel zooms the globe, the way it would on a map. The page keeps its
     own scroll at both ends of the range: once the globe is all the way out,
     scrolling further down moves the page on rather than trapping the pointer
     over a canvas that has nothing left to give. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      const next = Math.min(1, Math.max(0, view.current.t - px * 0.0012));

      if (next === view.current.t) {
        /* Nothing left to give. Scrolling further IN is the request to go
           past the globe entirely, so it hands over to the flat map rather
           than doing nothing. A little has to accumulate first, or one
           overshooting flick of a trackpad would dive through by accident.
           Scrolling OUT at the far end still belongs to the page. */
        if (view.current.t === 1 && px < 0 && onZoomThrough) {
          e.preventDefault();
          past.current += -px;
          if (past.current > 160) {
            past.current = 0;
            onZoomThrough({ lat: view.current.lat, lng: view.current.lng });
          }
        }
        return;
      }

      e.preventDefault();
      past.current = 0;
      view.current.t = next;
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    /* The touch equivalent. A wheel is not a gesture a phone has, so without
       this the globe simply could not be zoomed on one. Two fingers spreading
       do what scrolling up does; while they are down the drag handler stands
       aside, or the globe would spin as well as zoom. */
    const gap = () => {
      const [a, b] = Array.from(touches.current.values());
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.current.size === 2) {
        spread.current = gap();
        view.current.pinching = true;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!touches.current.has(e.pointerId)) return;
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.current.size !== 2) return;
      e.preventDefault();
      const now = gap();
      if (spread.current > 0) {
        const step = (now - spread.current) * 0.005;
        if (view.current.t === 1 && step > 0 && onZoomThrough) {
          past.current += step * 300;                 // same handover, by pinch
          if (past.current > 160) {
            past.current = 0;
            onZoomThrough({ lat: view.current.lat, lng: view.current.lng });
          }
        } else {
          view.current.t = Math.min(1, Math.max(0, view.current.t + step));
          past.current = 0;
        }
      }
      spread.current = now;
    };
    const onUp = (e: PointerEvent) => {
      touches.current.delete(e.pointerId);
      if (touches.current.size < 2) {
        spread.current = 0;
        view.current.pinching = false;
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: false });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      past.current = 0;
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [onZoomThrough]);

  useEffect(() => {
    if (returnKey > 0) {
      view.current.t = 0.92;
      past.current = 0;
    }
  }, [returnKey]);

  return (
    <div ref={box} className={className}>
      {/* No background colour and no stars: the canvas is transparent so the
          globe sits straight on the page. `flat` turns tone mapping off —
          the texture is a map whose colours are chosen, not a photograph to
          be graded. The camera's distance is set by FitCamera, so the sphere
          fills whatever shape of box it is given. */}
      <Canvas
        camera={{ position: [0, 0, 5.6], fov: FOV }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        flat
        style={{ cursor: "grab", touchAction: "pan-y" }}
      >
        <FitCamera view={view} />
        <Earth places={places} activeId={activeId} spinTo={spinTo} onPick={onPick} onOpen={onOpen}
          onDropPin={onDropPin} view={view} coarse={coarse} />
      </Canvas>
    </div>
  );
}
