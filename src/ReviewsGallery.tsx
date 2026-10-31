import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Link } from "react-router-dom";
import {
  useCursor,
  MeshReflectorMaterial,
  Image,
  Text,
  Environment,
} from "@react-three/drei";
import { easing } from "maath";
import adamsbridgeHdr from "./adamsbridge.hdr?url";
import { homepageWordmarkStyle } from "./lib/brandStyles";
import { pageScrollBehavior } from "./lib/scroll";

const GOLDENRATIO = 1.61803398875;

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  rating: number;
  review: string;
  date: string;
  url: string;
  verifiedPurchase: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
}

/** The nine frame positions of the original gallery layout. */
const SLOTS: { position: [number, number, number]; rotation: [number, number, number] }[] = [
  { position: [0, 0, 1.5], rotation: [0, 0, 0] },
  { position: [-0.8, 0, -0.6], rotation: [0, 0, 0] },
  { position: [0.8, 0, -0.6], rotation: [0, 0, 0] },
  { position: [-1.75, 0, 0.25], rotation: [0, Math.PI / 2.5, 0] },
  { position: [-2.15, 0, 1.5], rotation: [0, Math.PI / 2.5, 0] },
  { position: [-2, 0, 2.75], rotation: [0, Math.PI / 2.5, 0] },
  { position: [1.75, 0, 0.25], rotation: [0, -Math.PI / 2.5, 0] },
  { position: [2.15, 0, 1.5], rotation: [0, -Math.PI / 2.5, 0] },
  { position: [2, 0, 2.75], rotation: [0, -Math.PI / 2.5, 0] },
];

interface FeaturedReviews {
  average: number | null;
  total: number;
  reviews: { id: string; name: string; product: string; rating: number; review: string; verifiedPurchase: boolean; createdAt: string; image: string }[];
}

/** Real published reviews only — customer reviews are never invented. */
function useFeaturedReviews() {
  const [data, setData] = useState<FeaturedReviews | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch("/api/catalog/reviews/featured")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);
  const items: ReviewItem[] = (data?.reviews ?? []).map((r, i) => ({
    id: r.id,
    name: r.name,
    role: r.product,
    rating: r.rating,
    review: r.review,
    date: new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    url: r.image,
    verifiedPurchase: r.verifiedPurchase,
    ...SLOTS[i],
  }));
  return { data, items, failed };
}

function Frame({
  item,
  activeId,
  onSelect,
}: {
  item: ReviewItem;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const image = useRef<
    THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial & { zoom: number }>
  >(null!);
  const frame = useRef<
    THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
  >(null!);
  const [hovered, hover] = useState(false);
  const isActive = activeId === item.id;

  useCursor(hovered);

  useFrame((state, dt) => {
    if (image.current?.material) {
      image.current.material.zoom =
        1.5 + Math.sin(state.clock.elapsedTime / 3) / 6;
      easing.damp3(
        image.current.scale,
        [
          0.85 * (!isActive && hovered ? 0.88 : 1),
          0.9 * (!isActive && hovered ? 0.92 : 1),
          1,
        ],
        0.1,
        dt
      );
    }
    if (frame.current?.material) {
      easing.dampC(
        frame.current.material.color,
        hovered || isActive ? "#e8c07d" : "#ffffff",
        0.1,
        dt
      );
    }
  });

  return (
    <group position={item.position} rotation={item.rotation}>
      <mesh
        name={item.id}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          hover(true);
        }}
        onPointerOut={() => hover(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(item.id);
        }}
        scale={[1, GOLDENRATIO, 0.05]}
        position={[0, GOLDENRATIO / 2, 0]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#151515"
          metalness={0.6}
          roughness={0.4}
          envMapIntensity={2}
        />
        <mesh
          ref={frame}
          raycast={() => null}
          scale={[0.9, 0.93, 0.9]}
          position={[0, 0, 0.2]}
        >
          <boxGeometry />
          <meshBasicMaterial toneMapped={false} fog={false} />
        </mesh>
        <Image
          raycast={() => null}
          ref={image}
          position={[0, 0, 0.7]}
          url={item.url}
        />
      </mesh>

      {/* Reviewer text & Stars beside frame */}
      <group position={[0.55, GOLDENRATIO, 0]}>
        <Text
          anchorX="left"
          anchorY="top"
          fontSize={0.06}
          color="#ffffff"
          letterSpacing={-0.02}
        >
          {item.name}
        </Text>
        <Text
          position={[0, -0.075, 0]}
          anchorX="left"
          anchorY="top"
          fontSize={0.038}
          color="#e8c07d"
          letterSpacing={0.05}
        >
          {"★".repeat(item.rating)} {item.rating}.0
        </Text>
        <Text
          position={[0, -0.13, 0]}
          anchorX="left"
          anchorY="top"
          fontSize={0.026}
          color="#888888"
          maxWidth={0.45}
          lineHeight={1.3}
        >
          {item.role}
        </Text>
      </group>
    </group>
  );
}

function Frames({
  items,
  activeId,
  onSelect,
  onReset,
}: {
  items: ReviewItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onReset: () => void;
}) {
  const ref = useRef<THREE.Group>(null!);
  const q = useRef(new THREE.Quaternion()).current;
  const p = useRef(new THREE.Vector3()).current;

  useEffect(() => {
    if (activeId && ref.current) {
      const activeObj = ref.current.getObjectByName(activeId);
      if (activeObj && activeObj.parent) {
        activeObj.parent.updateWorldMatrix(true, true);
        activeObj.parent.localToWorld(p.set(0, GOLDENRATIO / 2, 1.25));
        activeObj.parent.getWorldQuaternion(q);
        return;
      }
    }
    // Default camera view position in the gallery
    p.set(0, 0, 5.5);
    q.identity();
  }, [activeId, p, q]);

  useFrame((state, dt) => {
    easing.damp3(state.camera.position, p, 0.4, dt);
    easing.dampQ(state.camera.quaternion, q, 0.4, dt);
  });

  return (
    <group ref={ref} onPointerMissed={() => onReset()}>
      {items.map((item) => (
        <Frame
          key={item.id}
          item={item}
          activeId={activeId}
          onSelect={(id) => {
            onSelect(activeId === id ? "" : id);
          }}
        />
      ))}
    </group>
  );
}

export function ReviewsGallery({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data, items, failed } = useFeaturedReviews();
  const activeReview = items.find((r) => r.id === activeId);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeId) {
          setActiveId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeId, onClose]);

  return (
    <div
      className="reviews-gallery"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "#191920",
        overflow: "hidden",
        animation: "dropdownFadeIn 0.3s ease-out forwards",
      }}
    >
      {/* 3D Reflection Gallery Scene */}
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 70, position: [0, 2, 15] }}
        className="reviews-gallery__canvas"
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#191920"]} />
        <fog attach="fog" args={["#191920", 0, 15]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <directionalLight position={[-10, 10, -5]} intensity={1.5} color="#e8c07d" />
        <group position={[0, -0.5, 0]}>
          <Frames
            items={items}
            activeId={activeId}
            onSelect={(id) => setActiveId(id || null)}
            onReset={() => setActiveId(null)}
          />
          {/* Reflective Dark Mirror Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              blur={[300, 100]}
              resolution={2048}
              mixBlur={1}
              mixStrength={80}
              roughness={1}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#050505"
              metalness={0.5}
            />
          </mesh>
        </group>
        <Environment files={adamsbridgeHdr} />
      </Canvas>

      {/* Top Header Bar */}
      <div
        className="reviews-gallery__header"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          padding: "30px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 210,
        }}
      >
        <div>
          <Link
            to="/"
            aria-label="CrownCart home"
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, behavior: pageScrollBehavior() });
            }}
            style={{
              ...homepageWordmarkStyle,
              color: "#ffffff",
              display: "inline-block",
              paddingRight: 0,
              textDecoration: "none",
              cursor: "pointer",
              pointerEvents: "all",
            }}
          >
            CrownCart
          </Link>
          <div
            style={{
              fontFamily: "'Inter var', sans-serif",
              fontSize: 12,
              lineHeight: "1.5em",
              color: "#aaaaaa",
              letterSpacing: 0,
              marginTop: 2,
            }}
          >
            Client Reviews & 3D Gallery &mdash;{" "}
            {data == null
              ? failed
                ? "Reviews are unavailable right now"
                : "Loading reviews…"
              : data.total === 0
                ? "No reviews yet"
                : `${data.average} ★ average across ${data.total} published review${data.total === 1 ? "" : "s"}`}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            pointerEvents: "all",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            padding: "10px 22px",
            backgroundColor: "#ffffff",
            color: "#191920",
            border: "none",
            borderRadius: 24,
            transition: "all 0.2s ease",
            outline: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e8c07d";
            e.currentTarget.style.transform = "scale(1.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          &larr; Back to Showcase
        </button>
      </div>

      {data && data.total === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 205,
            color: "#dddddd",
            textAlign: "center",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <div>
            <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 28, color: "#ffffff" }}>No reviews yet</div>
            Reviews from CrownCart customers will appear here once they are published.
          </div>
        </div>
      )}

      {/* Reviewer Quick Navigation Pills at Bottom */}
      <div
        className="reviews-gallery__quick-nav no-scrollbar"
        style={{
          position: "absolute",
          bottom: 24,
          left: 40,
          right: activeReview ? 420 : 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          pointerEvents: "all",
          zIndex: 215,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveId(null)}
          style={{
            pointerEvents: "all",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: 16,
            backgroundColor: activeId === null ? "#e8c07d" : "rgba(255,255,255,0.08)",
            color: activeId === null ? "#191920" : "#ffffff",
            border: "none",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          Overview (All Frames)
        </button>
        {items.map((rev) => (
          <button
            key={rev.id}
            type="button"
            onClick={() => setActiveId(rev.id)}
            style={{
              pointerEvents: "all",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              padding: "6px 14px",
              borderRadius: 16,
              backgroundColor:
                activeId === rev.id ? "#e8c07d" : "rgba(255,255,255,0.06)",
              color: activeId === rev.id ? "#191920" : "#cccccc",
              border: "1px solid rgba(255,255,255,0.06)",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (activeId !== rev.id) {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeId !== rev.id) {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
              }
            }}
          >
            {rev.name} ★ {rev.rating}.0
          </button>
        ))}
      </div>

      {/* Zoomed-in Active Review Detail Card */}
      {activeReview && (
        <div
          className="reviews-gallery__detail"
          style={{
            position: "absolute",
            bottom: 24,
            right: 40,
            width: 360,
            backgroundColor: "rgba(25, 25, 32, 0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(232, 192, 125, 0.35)",
            borderRadius: 16,
            padding: 24,
            color: "#ffffff",
            pointerEvents: "all",
            zIndex: 220,
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            animation: "dropdownFadeIn 0.25s ease-out forwards",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: -0.5,
                }}
              >
                {activeReview.name}
              </div>
              <div style={{ fontSize: 11, color: "#888888", marginTop: 2 }}>
                {activeReview.role} &middot; {activeReview.date}
              </div>
            </div>
            <div style={{ color: "#e8c07d", fontSize: 16, letterSpacing: 1 }}>
              {"★".repeat(activeReview.rating)}
            </div>
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#dddddd",
              fontStyle: "italic",
              margin: "12px 0",
            }}
          >
            &ldquo;{activeReview.review}&rdquo;
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#e8c07d",
                letterSpacing: 1,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {activeReview.verifiedPurchase ? <>&#10003; Verified Purchase</> : null}
            </span>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#aaaaaa",
                fontSize: 11,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Zoom Out &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ReviewsGallery;
