import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { BallCollider, CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { interests } from "../../lib/interests";
import { PHASE_LIGHTS, emitStage, phaseFor, stageBus } from "./stageBus";

type Kind = "shoe" | "watch" | "other";
interface Pick {
  slug: string;
  kind: Kind;
  mine?: boolean;
}

// Background cutouts: mostly sneakers and watches, with a few other pieces.
const PRODUCTS: Pick[] = [
  { slug: "air-jordan-1-retro-high-og-patent", kind: "shoe" },
  { slug: "rolex-submariner-date-126610ln-oystersteel", kind: "watch" },
  { slug: "nike-dunk-low-retro-panda-black-white", kind: "shoe" },
  { slug: "patek-philippe-nautilus-5711-1a-tiffany-blue", kind: "watch" },
  { slug: "air-jordan-4-retro-bred-reimagined", kind: "shoe" },
  { slug: "audemars-piguet-royal-oak-jumbo-16202st", kind: "watch" },
  { slug: "creed-aventus-eau-de-parfum-100ml", kind: "other" },
  { slug: "nike-kobe-6-protro-reverse-grinch", kind: "shoe" },
  { slug: "omega-speedmaster-professional-moonwatch-master-chronometer", kind: "watch" },
  { slug: "new-balance-550-retro-basketball-white-green", kind: "shoe" },
  { slug: "cartier-santos-de-cartier-large-model-steel", kind: "watch" },
  { slug: "sony-wh-1000xm5-wireless-noise-cancelling-headphones", kind: "other" },
  { slug: "adidas-yeezy-boost-350-v2-bone-primeknit", kind: "shoe" },
  { slug: "rolex-cosmograph-daytona-126500ln-panda", kind: "watch" },
  { slug: "balenciaga-triple-s-clear-sole-sneaker-white-grey", kind: "shoe" },
  { slug: "patek-philippe-nautilus-5980-1r-rose-gold", kind: "watch" },
  { slug: "dior-saddle-bag-black-grained-calfskin", kind: "other" },
  { slug: "dior-b23-high-top-sneaker-dior-oblique-canvas", kind: "shoe" },
  { slug: "omega-seamaster-diver-300m-co-axial-master-chronometer", kind: "watch" },
  { slug: "louis-vuitton-lv-trainer-sneaker-calfskin-green-white", kind: "shoe" },
  { slug: "audemars-piguet-royal-oak-offshore-chronograph-43mm", kind: "watch" },
  { slug: "tom-ford-oud-wood-eau-de-parfum-100ml", kind: "other" },
  { slug: "adidas-originals-samba-og-cloud-white-core-black", kind: "shoe" },
  { slug: "cartier-tank-must-extra-large-model-automatic", kind: "watch" },
];
const SIZE: Record<Kind, number> = { shoe: 2.5, watch: 1.65, other: 1.9 };

const kindOf = (slug: string): Kind =>
  /rolex|patek|omega|cartier|audemars|watch|chrono/.test(slug) ? "watch" : /sneaker|jordan|nike|dunk|yeezy|samba|new-balance|trainer|boot|kobe|shoe/.test(slug) ? "shoe" : "other";

/**
 * The base set plus products this browser looked at recently (that have a
 * transparent cutout). Recent picks are woven in every third drop.
 */
async function loadPicks(): Promise<Pick[]> {
  const mine = interests();
  if (!mine.length) return PRODUCTS;
  try {
    const index = (await fetch("/cutouts/index.json").then((r) => r.json())) as Record<string, { ok?: boolean }>;
    const own = mine.filter((s) => index[s]?.ok).map((slug) => ({ slug, kind: kindOf(slug), mine: true }));
    if (!own.length) return PRODUCTS;
    const rest = PRODUCTS.filter((p) => !own.some((o) => o.slug === p.slug));
    const out: Pick[] = [];
    let o = 0;
    let r = 0;
    while (r < rest.length || o < own.length) {
      if (out.length % 3 === 0 && own.length) out.push(own[o++ % own.length]);
      else if (r < rest.length) out.push(rest[r++]);
      else break;
    }
    emitStage("interests", own.length);
    return out;
  } catch {
    return PRODUCTS;
  }
}

const START_COUNT = 7;
const MAX_COUNT = 48;
const GROW_EVERY_MS = 5000;
const SLICES = 9;
const DEPTH = 0.22;

/** Pointer in normalised device coords. `hand` is true for a mouse, whose ghost ball nudges products. */
const pointer = { x: 0, y: 0, hand: false, inside: false };
/** The product being dragged, if any. */
const drag = { index: -1 };
let burstActive = false;

interface Bounds {
  w: number;
  h: number;
  scale: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * A flat cutout turned into a solid-looking slab: the same alpha-tested image
 * stacked SLICES times through the depth, bright on the two faces and darker
 * through the middle, so tumbling products show a thick edge instead of
 * vanishing edge-on. Merged into one geometry, so each product is one draw call.
 */
function slabGeometry(w: number, h: number) {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < SLICES; i++) {
    const t = i / (SLICES - 1);
    const g = new THREE.PlaneGeometry(w, h);
    g.translate(0, 0, (t - 0.5) * DEPTH);
    const face = i === 0 || i === SLICES - 1;
    const shade = face ? 1 : 0.32 + 0.12 * Math.sin(t * Math.PI);
    const colors = new Float32Array(g.attributes.position.count * 3).fill(shade);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

function randomQuat() {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(-0.5, 0.5), rand(-0.9, 0.9), rand(-Math.PI, Math.PI)));
}

function Product({ index, texture, pick, bounds }: { index: number; texture: THREE.Texture; pick: Pick; bounds: React.MutableRefObject<Bounds> }) {
  const body = useRef<RapierRigidBody>(null);
  const holder = useRef<THREE.Group>(null);
  const img = texture.image as { width: number; height: number };
  const { w, h } = useMemo(() => {
    const max = SIZE[pick.kind] * bounds.current.scale * (pick.mine ? 1.12 : 1);
    const aspect = img.width / img.height;
    return aspect >= 1 ? { w: max, h: max / aspect } : { w: max * aspect, h: max };
  }, [img, pick, bounds]);
  const geometry = useMemo(() => slabGeometry(w, h), [w, h]);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        vertexColors: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        roughness: 0.42,
        metalness: 0.08,
        envMapIntensity: 0.9,
        // Your own recent picks glow faintly gold.
        emissive: pick.mine ? new THREE.Color("#e8c07d") : new THREE.Color("#000000"),
        emissiveIntensity: pick.mine ? 0.12 : 0,
      }),
    [texture, pick],
  );
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);

  const life = useRef({ rest: 0, restLimit: rand(1.6, 4.2), shrink: -1 });
  const spawn = useMemo(() => {
    const b = bounds.current;
    return {
      position: [rand(-b.w / 2 + 1.5, b.w / 2 - 1.5), b.h / 2 + 2.5 + (index % 6) * 1.4, rand(-0.6, 0.6)] as [number, number, number],
      rotation: new THREE.Euler().setFromQuaternion(randomQuat()),
    };
  }, [index, bounds]);

  const respawn = () => {
    const rb = body.current;
    if (!rb || burstActive) return;
    const b = bounds.current;
    rb.setTranslation({ x: rand(-b.w / 2 + 1.5, b.w / 2 - 1.5), y: b.h / 2 + rand(2.5, 6), z: rand(-0.6, 0.6) }, true);
    const q = randomQuat();
    rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    rb.setLinvel({ x: rand(-1.2, 1.2), y: rand(-6, -2), z: 0 }, true);
    rb.setAngvel({ x: rand(-1.5, 1.5), y: rand(-2.5, 2.5), z: rand(-2.5, 2.5) }, true);
    life.current = { rest: 0, restLimit: rand(1.6, 4.2), shrink: -1 };
    holder.current?.scale.setScalar(1);
  };

  useEffect(() => {
    // Give each newcomer a little spin as it enters.
    body.current?.setAngvel({ x: rand(-1, 1), y: rand(-2, 2), z: rand(-2, 2) }, true);
    const quake = () => {
      const rb = body.current;
      if (!rb) return;
      const v = rb.linvel();
      rb.setLinvel({ x: v.x + rand(-4, 4), y: rand(9, 17), z: 0 }, true);
      rb.setAngvel({ x: rand(-6, 6), y: rand(-8, 8), z: rand(-8, 8) }, true);
      life.current.rest = 0;
      life.current.shrink = -1;
      holder.current?.scale.setScalar(1);
    };
    const burst = () => {
      const rb = body.current;
      if (!rb) return;
      const p = rb.translation();
      const d = new THREE.Vector2(p.x, p.y + 1).normalize();
      const speed = rand(18, 30);
      rb.setLinvel({ x: d.x * speed, y: d.y * speed + 10, z: rand(-2, 2) }, true);
      rb.setAngvel({ x: rand(-12, 12), y: rand(-12, 12), z: rand(-12, 12) }, true);
      rb.setGravityScale(0.35, true);
    };
    stageBus.addEventListener("quake", quake);
    stageBus.addEventListener("burst", burst);
    return () => {
      stageBus.removeEventListener("quake", quake);
      stageBus.removeEventListener("burst", burst);
    };
  }, []);

  useFrame((_, dt) => {
    const rb = body.current;
    if (!rb) return;
    const b = bounds.current;
    const p = rb.translation();
    const floor = -b.h / 2;
    if (drag.index === index) {
      // Spring toward the cursor; letting go keeps the velocity, so it flies.
      const tx = (pointer.x * b.w) / 2;
      const ty = (pointer.y * b.h) / 2;
      const k = 14;
      const vx = THREE.MathUtils.clamp((tx - p.x) * k, -45, 45);
      const vy = THREE.MathUtils.clamp((ty - p.y) * k, -45, 45);
      rb.setLinvel({ x: vx, y: vy, z: -p.z * 4 }, true);
      const av = rb.angvel();
      rb.setAngvel({ x: av.x * 0.9, y: av.y * 0.9, z: av.z * 0.9 + vx * -0.02 }, true);
      life.current.rest = 0;
      return;
    }
    if (burstActive) return;
    if (p.y < floor - 6 || Math.abs(p.x) > b.w) return respawn();
    const L = life.current;
    if (L.shrink < 0) {
      const v = rb.linvel();
      const still = Math.hypot(v.x, v.y, v.z) < 0.55 && p.y < floor + SIZE[pick.kind] * 1.6;
      L.rest = still ? L.rest + dt : Math.max(0, L.rest - dt * 0.5);
      if (L.rest > L.restLimit) L.shrink = 0;
    } else {
      // Settled long enough: sink away, then drop again from above the screen.
      L.shrink += dt;
      const k = Math.min(1, L.shrink / 0.5);
      holder.current?.scale.setScalar(Math.max(0.001, 1 - k * k * (3 - 2 * k)));
      if (k >= 1) respawn();
    }
  });

  const grab = (e: ThreeEvent<PointerEvent>) => {
    if (burstActive) return;
    e.stopPropagation();
    drag.index = index;
    life.current.shrink = -1;
    holder.current?.scale.setScalar(1);
    document.body.dataset.grabbing = "1";
  };

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={spawn.position}
      rotation={spawn.rotation}
      restitution={0.42}
      friction={0.55}
      linearDamping={0.12}
      angularDamping={0.35}
      ccd
    >
      <CuboidCollider args={[w * 0.4, h * 0.4, DEPTH / 2 + 0.06]} />
      <group ref={holder}>
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          onPointerDown={grab}
          onPointerOver={(e) => (e.stopPropagation(), (document.body.dataset.grabbable = "1"))}
          onPointerOut={() => delete document.body.dataset.grabbable}
        />
      </group>
    </RigidBody>
  );
}

/** A kinematic ball that follows the mouse, so products get shoved aside as you move. */
function Hand({ bounds }: { bounds: React.MutableRefObject<Bounds> }) {
  const body = useRef<RapierRigidBody>(null);
  const pos = useRef(new THREE.Vector3(0, 100, 0));
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const b = bounds.current;
    const live = pointer.hand && pointer.inside && drag.index < 0 && !burstActive;
    if (live) target.set((pointer.x * b.w) / 2, (pointer.y * b.h) / 2, 0);
    else target.set(0, b.h * 3, 0);
    pos.current.lerp(target, live ? 0.35 : 1);
    body.current?.setNextKinematicTranslation(pos.current);
  });
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[0, 100, 0]}>
      <BallCollider args={[0.9]} />
    </RigidBody>
  );
}

function Walls({ w, h }: { w: number; h: number }) {
  // On a successful sign-in the walls drop away so everything can fly off screen.
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const off = () => setGone(true);
    stageBus.addEventListener("burst", off);
    return () => stageBus.removeEventListener("burst", off);
  }, []);
  if (gone) return null;
  const t = 1;
  return (
    <RigidBody type="fixed" colliders={false} restitution={0.5} friction={0.7}>
      <CuboidCollider args={[w * 2, t, 4]} position={[0, -h / 2 - t, 0]} />
      <CuboidCollider args={[t, h * 3, 4]} position={[-w / 2 - t, h, 0]} />
      <CuboidCollider args={[t, h * 3, 4]} position={[w / 2 + t, h, 0]} />
      <CuboidCollider args={[w * 2, h * 3, t]} position={[0, h, -1.1 - t]} />
      <CuboidCollider args={[w * 2, h * 3, t]} position={[0, h, 1.1 + t]} />
    </RigidBody>
  );
}

function Rain({ picks, reduced }: { picks: Pick[]; reduced: boolean }) {
  const urls = useMemo(() => picks.map((p) => `/cutouts/${p.slug}.webp`), [picks]);
  const textures = useTexture(urls);
  const viewport = useThree((s) => s.viewport);
  const bounds = useRef<Bounds>({ w: viewport.width, h: viewport.height, scale: 1 });
  bounds.current = { w: viewport.width, h: viewport.height, scale: THREE.MathUtils.clamp(Math.min(viewport.width, viewport.height * 1.4) / 15, 0.55, 1.15) };
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.needsUpdate = true;
    });
  }, [textures, gl]);

  const [count, setCount] = useState(reduced ? 6 : START_COUNT);
  useEffect(() => {
    if (reduced) return;
    // One more product joins the rain every five seconds you wait.
    const id = window.setInterval(() => setCount((n) => Math.min(MAX_COUNT, n + 1)), GROW_EVERY_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <>
      <Walls w={viewport.width} h={viewport.height} />
      {!reduced && <Hand bounds={bounds} />}
      {Array.from({ length: count }, (_, i) => {
        const at = (i * 7) % picks.length;
        // Recent picks are spread through the list; make sure the very first drop is one of them.
        const pick = i === 0 && picks.some((p) => p.mine) ? picks.findIndex((p) => p.mine) : at;
        return <Product key={i} index={i} texture={textures[pick]} pick={picks[pick]} bounds={bounds} />;
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -viewport.height / 2 + 0.001, 0]} receiveShadow>
        <planeGeometry args={[viewport.width * 2, 8]} />
        <shadowMaterial transparent opacity={0.5} />
      </mesh>
    </>
  );
}

function KeyLight({ color, intensity }: { color: string; intensity: number }) {
  const viewport = useThree((s) => s.viewport);
  const light = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    const cam = light.current?.shadow.camera;
    if (!cam) return;
    cam.left = -viewport.width / 2 - 2;
    cam.right = viewport.width / 2 + 2;
    cam.top = viewport.height / 2 + 2;
    cam.bottom = -viewport.height / 2 - 2;
    cam.updateProjectionMatrix();
  }, [viewport.width, viewport.height]);
  return (
    <directionalLight
      ref={light}
      position={[4, 12, 9]}
      color={color}
      intensity={intensity}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
    />
  );
}

export default function FallingProducts() {
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const light = PHASE_LIGHTS[phaseFor()];
  const [picks, setPicks] = useState<Pick[] | null>(null);

  useEffect(() => {
    burstActive = false;
    drag.index = -1;
    loadPicks().then(setPicks);
    const onBurst = () => {
      burstActive = true;
      drag.index = -1;
    };
    const move = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.hand = e.pointerType === "mouse" || e.pointerType === "pen";
      pointer.inside = true;
    };
    const release = () => {
      drag.index = -1;
      delete document.body.dataset.grabbing;
    };
    const leave = () => (pointer.inside = false);
    stageBus.addEventListener("burst", onBurst);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      stageBus.removeEventListener("burst", onBurst);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      document.documentElement.removeEventListener("pointerleave", leave);
      release();
      delete document.body.dataset.grabbable;
    };
  }, []);

  return (
    <Canvas
      className="cc-auth-canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 22], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      aria-hidden="true"
    >
      <ambientLight intensity={light.ambient} />
      <KeyLight color={light.key} intensity={light.keyIntensity} />
      <pointLight position={[-9, 4, 4]} intensity={60} color={light.warm} distance={30} />
      <pointLight position={[9, -2, 5]} intensity={40} color={light.cool} distance={30} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} color={light.key} position={[0, 6, 6]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color={light.warm} position={[-8, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={1.2} color={light.cool} position={[7, 2, -4]} scale={4} />
      </Environment>
      {picks && (
        <Suspense fallback={null}>
          <Physics gravity={[0, -14, 0]} timeStep="vary">
            <Rain picks={picks} reduced={reduced} />
          </Physics>
        </Suspense>
      )}
    </Canvas>
  );
}
