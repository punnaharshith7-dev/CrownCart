import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Image, ScrollControls, useScroll } from "@react-three/drei";
import { easing } from "maath";
import "../collections/geometry";
import type { MeshSineMaterial } from "../collections/geometry";
import { SiteHeader } from "../components/SiteHeader";
import { inr } from "../lib/format";
import { useTheme } from "../lib/theme";
import { useApi, useTitle } from "../lib/useApi";

interface Brand {
  name: string;
  slug: string;
  count: number;
  fromPaise: number | null;
  categories: string[];
  products: { slug: string; name: string; image: string | null }[];
}

/** The five houses on the ring, in order: two watchmakers, two couture maisons and one for technology. */
const FEATURED = ["patek-philippe", "louis-vuitton", "rolex", "dior", "apple"];
const CARD_COUNT = 10;

interface Slot {
  brand: Brand;
  image: string;
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Each house opens its own showcase page. */
const shopUrl = (b: Brand) => `/collections/${encodeURIComponent(b.slug)}`;

export default function Collections() {
  useTitle("Collections", { description: "Five houses CrownCart is proud to carry: Patek Philippe, Louis Vuitton, Rolex, Dior and Apple." });
  const { data } = useApi<{ brands: Brand[] }>("/catalog/brands");
  const [webgl] = useState(webglAvailable);
  const [active, setActive] = useState<Brand | null>(null);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const openBrand = useCallback((b: Brand) => navigateRef.current(shopUrl(b)), []);

  const featured = useMemo(() => FEATURED.map((slug) => data?.brands.find((b) => b.slug === slug)).filter((b): b is Brand => Boolean(b)), [data]);

  // Ten cards around the ring: each house appears twice, with two different pieces.
  const slots = useMemo<Slot[]>(() => {
    if (!featured.length) return [];
    return Array.from({ length: CARD_COUNT }, (_, i) => {
      const brand = featured[i % featured.length];
      const images = brand.products.map((p) => p.image).filter((src): src is string => Boolean(src));
      return { brand, image: images[Math.floor(i / featured.length) % images.length] ?? images[0] };
    }).filter((s) => s.image);
  }, [featured]);

  return (
    <div className="app cl-page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="cl-stage">
        {webgl && slots.length > 0 ? (
          <Scene slots={slots} onHover={setActive} onOpen={openBrand} />
        ) : (
          <FallbackGrid brands={featured} />
        )}

        <div className="cl-overlay">
          <header className="cl-head">
            <p className="cl-eyebrow">CrownCart · Collections</p>
            <h1 className="cl-title">
              Five houses, <em>in the round.</em>
            </h1>
          </header>

          <div className="cl-detail" aria-live="polite">
            {active ? (
              <div key={active.slug} className="cl-card">
                <p className="cl-card__cats">{active.categories.join(" · ")}</p>
                <h2 className="cl-card__name">{active.name}</h2>
                <p className="cl-card__meta">
                  {active.count} pieces{active.fromPaise != null && <> · from {inr(active.fromPaise)}</>}
                </p>
                <Link to={shopUrl(active)} className="cl-btn">
                  Enter {active.name} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : (
              <p className="cl-hint">Scroll to turn the ring · tap a card to enter a house</p>
            )}
          </div>

          <nav className="cl-houses" aria-label="Featured houses">
            {featured.map((b) => (
              <Link key={b.slug} to={shopUrl(b)} className={active?.slug === b.slug ? "is-active" : ""} onMouseEnter={() => setActive(b)} onFocus={() => setActive(b)}>
                {b.name}
              </Link>
            ))}
          </nav>
        </div>
      </main>
    </div>
  );
}

const RIG_ROTATION: [number, number, number] = [0, 0, 0.15];
const BANNER_POSITION: [number, number, number] = [0, -0.15, 0];

/**
 * The 3D scene, memoised so overlay state changes never re-render the Canvas:
 * a Canvas re-render reconnects pointer events to the canvas and stops ScrollControls from seeing the scroll.
 */
const Scene = memo(function Scene({ slots, onHover, onOpen }: { slots: Slot[]; onHover: (b: Brand | null) => void; onOpen: (b: Brand) => void }) {
  return (
    <Canvas className="cl-canvas" camera={{ position: [0, 0, 100], fov: 15 }} dpr={[1, 1.75]} gl={{ preserveDrawingBuffer: true }}>
      <fog attach="fog" args={["#a79", 8.5, 12]} />
      <Suspense fallback={null}>
        <ScrollControls pages={4} infinite>
          <KeepScrollConnected />
          <Rig rotation={RIG_ROTATION}>
            <Carousel slots={slots} onHover={onHover} onOpen={onOpen} />
          </Rig>
          <Banner position={BANNER_POSITION} />
        </ScrollControls>
        <Environment preset="dawn" background blur={0.5} />
      </Suspense>
    </Canvas>
  );
});

/** ScrollControls only listens for scrolling while pointer events are wired to its scroll layer; make sure they stay there. */
function KeepScrollConnected() {
  const scroll = useScroll();
  const events = useThree((s) => s.events);
  useEffect(() => {
    if (scroll.el && events.connected !== scroll.el) events.connect?.(scroll.el);
  }, [events, scroll.el]);
  return null;
}

/** Spins the ring with the scroll offset and lets the camera follow the pointer. */
function Rig(props: ComponentProps<"group">) {
  const ref = useRef<THREE.Group>(null);
  const scroll = useScroll();
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = -scroll.offset * (Math.PI * 2);
    state.events.update?.(); // Raycast every frame so hover follows the spinning cards
    // Back the camera off on narrow screens so the whole ring (about 3.2 units wide, slightly cropped at the sides) stays in frame.
    const aspect = state.size.width / state.size.height;
    const distance = Math.max(10, 3.2 / (2 * Math.tan(THREE.MathUtils.degToRad(7.5)) * aspect));
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y + 1.5, distance], 0.3, delta);
    // Keep the fog band (8.5 to 12 at the original distance of 10) around the ring as the camera moves back.
    if (state.scene.fog instanceof THREE.Fog) {
      state.scene.fog.near = distance - 1.5;
      state.scene.fog.far = distance + 2;
    }
    state.camera.lookAt(0, 0, 0);
  });
  return <group ref={ref} {...props} />;
}

function Carousel({ slots, radius = 1.4, onHover, onOpen }: { slots: Slot[]; radius?: number; onHover: (b: Brand | null) => void; onOpen: (b: Brand) => void }) {
  const count = slots.length;
  return (
    <>
      {slots.map((slot, i) => (
        <Card
          key={i}
          slot={slot}
          onHover={onHover}
          onOpen={onOpen}
          position={[Math.sin((i / count) * Math.PI * 2) * radius, 0, Math.cos((i / count) * Math.PI * 2) * radius]}
          rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
        />
      ))}
    </>
  );
}

type ImageMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material & { radius: number; zoom: number }>;

function Card({ slot, onHover, onOpen, ...props }: { slot: Slot; onHover: (b: Brand | null) => void; onOpen: (b: Brand) => void } & Pick<ComponentProps<"mesh">, "position" | "rotation">) {
  const ref = useRef<ImageMesh>(null);
  const [hovered, setHovered] = useState(false);

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHover(slot.brand);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };

  useFrame((_, delta) => {
    if (!ref.current) return;
    easing.damp3(ref.current.scale, hovered ? 1.15 : 1, 0.1, delta);
    easing.damp(ref.current.material, "radius", hovered ? 0.25 : 0.1, 0.2, delta);
    easing.damp(ref.current.material, "zoom", hovered ? 1 : 1.5, 0.2, delta);
  });

  return (
    <Image
      ref={ref}
      url={slot.image}
      transparent
      side={THREE.DoubleSide}
      onPointerOver={over}
      onPointerOut={out}
      onClick={(e) => (e.stopPropagation(), onOpen(slot.brand))}
      {...props}
    >
      <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
    </Image>
  );
}

/** A canvas-drawn "CROWNCART ✦ BEYOND ORDINARY" strip wrapped round the ring, rippling as you scroll. */
function Banner(props: ComponentProps<"mesh">) {
  const ref = useRef<THREE.Mesh<THREE.BufferGeometry, MeshSineMaterial>>(null);
  const scroll = useScroll();
  const { motion } = useTheme();

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 146;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    ctx.font = "700 92px Antonio, 'Arial Narrow', sans-serif";
    ctx.textBaseline = "middle";
    const text = "CROWNCART  ✦  BEYOND ORDINARY  ✦  ";
    const width = ctx.measureText(text).width;
    // Squeeze the phrase to exactly one tile so the repeat joins seamlessly.
    ctx.setTransform(canvas.width / width, 0, 0, 1, 0, 0);
    ctx.fillText(text, 0, canvas.height / 2 + 4);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame((_, delta) => {
    const m = ref.current?.material;
    if (!m) return;
    m.time.value += Math.abs(scroll.delta) * 4;
    if (motion !== "reduced" && m.map) m.map.offset.x += delta / 20;
  });

  return (
    <mesh ref={ref} {...props}>
      <cylinderGeometry args={[1.6, 1.6, 0.14, 128, 16, true]} />
      <meshSineMaterial map={texture} map-repeat={[5, 1]} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

/** Without WebGL the houses are shown as a simple grid of links. */
function FallbackGrid({ brands }: { brands: Brand[] }) {
  return (
    <div className="cl-fallback">
      {brands.map((b) => {
        const image = b.products.find((p) => p.image)?.image;
        return (
          <Link key={b.slug} to={shopUrl(b)} className="cl-fallback__card">
            {image && <img src={image} alt="" loading="lazy" />}
            <span>{b.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
