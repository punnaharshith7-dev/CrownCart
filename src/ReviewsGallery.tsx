import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  useCursor,
  MeshReflectorMaterial,
  Image,
  Text,
  Environment,
} from "@react-three/drei";
import { easing } from "maath";
import adamsbridgeHdr from "./adamsbridge.hdr?url";

const GOLDENRATIO = 1.61803398875;

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  rating: number;
  review: string;
  date: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export const reviewsData: ReviewItem[] = [
  // Front
  {
    id: "review-1",
    name: "Elena Rostova",
    role: "Verified VIP Client",
    rating: 5,
    review:
      "The tactile lacquer finish is breathtaking. Unmatched precision in packaging and craftsmanship.",
    date: "2 days ago",
    position: [0, 0, 1.5],
    rotation: [0, 0, 0],
    url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
  },
  // Back
  {
    id: "review-2",
    name: "Marcus Vance",
    role: "Verified Buyer",
    rating: 5,
    review:
      "CrownCart's bespoke concierge service exceeded every expectation. The timepiece is sublime.",
    date: "1 week ago",
    position: [-0.8, 0, -0.6],
    rotation: [0, 0, 0],
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "review-3",
    name: "Sophia Chen",
    role: "Architect & Collector",
    rating: 5,
    review:
      "Pure luxury. The attention to weight, materials, and form is truly exceptional.",
    date: "2 weeks ago",
    position: [0.8, 0, -0.6],
    rotation: [0, 0, 0],
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
  },
  // Left
  {
    id: "review-4",
    name: "Liam Montgomery",
    role: "Verified Buyer",
    rating: 5,
    review:
      "A masterclass in modern minimalism. The craftsmanship and durability are unmatched.",
    date: "3 weeks ago",
    position: [-1.75, 0, 0.25],
    rotation: [0, Math.PI / 2.5, 0],
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "review-5",
    name: "Aria Takahashi",
    role: "Creative Director",
    rating: 5,
    review:
      "The 01 series capsule arrived flawlessly. In love with the aesthetic and glossy finish.",
    date: "1 month ago",
    position: [-2.15, 0, 1.5],
    rotation: [0, Math.PI / 2.5, 0],
    url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "review-6",
    name: "Oliver Hayes",
    role: "Verified Buyer",
    rating: 5,
    review:
      "Seamless ordering, lightning fast global shipping, and stunning presentation.",
    date: "1 month ago",
    position: [-2, 0, 2.75],
    rotation: [0, Math.PI / 2.5, 0],
    url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
  },
  // Right
  {
    id: "review-7",
    name: "Claire Delacroix",
    role: "Interior Stylist",
    rating: 5,
    review:
      "Remarkable sculptural quality. CrownCart sets the gold standard for luxury online.",
    date: "2 months ago",
    position: [1.75, 0, 0.25],
    rotation: [0, -Math.PI / 2.5, 0],
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "review-8",
    name: "Julian Sterling",
    role: "Verified Buyer",
    rating: 5,
    review:
      "Flawless in every metric. The unboxing alone was an unforgettable experience.",
    date: "2 months ago",
    position: [2.15, 0, 1.5],
    rotation: [0, -Math.PI / 2.5, 0],
    url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "review-9",
    name: "Amara Okafor",
    role: "Verified Buyer",
    rating: 5,
    review:
      "Impeccable style and high-end feel. Will definitely be ordering from future drops.",
    date: "3 months ago",
    position: [2, 0, 2.75],
    rotation: [0, -Math.PI / 2.5, 0],
    url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
  },
];

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
          {"★".repeat(item.rating)} 5.0
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
  const activeReview = reviewsData.find((r) => r.id === activeId);

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
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#191920"]} />
        <fog attach="fog" args={["#191920", 0, 15]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <directionalLight position={[-10, 10, -5]} intensity={1.5} color="#e8c07d" />
        <group position={[0, -0.5, 0]}>
          <Frames
            items={reviewsData}
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
          <div
            style={{
              fontFamily: "'Antonio', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -1.5,
              textTransform: "uppercase",
            }}
          >
            CrownCart
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#aaaaaa",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            Client Reviews & 3D Gallery &mdash; 5.0 ★ (9 Curated Stories)
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

      {/* Reviewer Quick Navigation Pills at Bottom */}
      <div
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
        className="no-scrollbar"
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
        {reviewsData.map((rev) => (
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
            {rev.name} ★ 5.0
          </button>
        ))}
      </div>

      {/* Zoomed-in Active Review Detail Card */}
      {activeReview && (
        <div
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
              &#10003; Verified Purchase
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
