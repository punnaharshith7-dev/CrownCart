import * as THREE from 'three';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import {
  Physics,
  RigidBody,
  BallCollider,
  type RapierRigidBody,
} from '@react-three/rapier';

// Shared geometries for performance and crisp reflections
const sphereGeometry = new THREE.SphereGeometry(1, 48, 48);
const capCylinderGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.16, 24);
const capTorusGeometry = new THREE.TorusGeometry(0.11, 0.024, 16, 32);

// Cap material (metalness 1, roughness 0.3, color #e8c07d)
const capMaterial = new THREE.MeshStandardMaterial({
  metalness: 1,
  roughness: 0.3,
  color: '#e8c07d',
});

// Palette round-robin: deep red #c0392b, cream #f5f1e8, forest green #1e5631, gold #d4a24c
const PALETTE = ['#c0392b', '#f5f1e8', '#1e5631', '#d4a24c'];

// Body materials: roughness 0, metalness 0.05, envMapIntensity 1 (wet-lacquer finish)
const bodyMaterials = PALETTE.map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0,
      metalness: 0.05,
      envMapIntensity: 1,
    })
);

interface BaubleData {
  id: number;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  materialIndex: number;
}

function Bauble({
  scale,
  position,
  rotation,
  materialIndex,
}: {
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  materialIndex: number;
}) {
  const api = useRef<RapierRigidBody>(null!);
  const impulseVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ viewport }) => {
    if (!api.current) return;
    const translation = api.current.translation();

    // Push each bauble toward the centre:
    // take its translation, negate it, multiply by 0.2 * scale, apply as an impulse.
    let fx = -translation.x * 0.2 * scale;
    let fy = -translation.y * 0.2 * scale;
    let fz = -translation.z * 0.2 * scale;

    // Viewport containment: ensure baubles never escape even on fast strikes
    const boundX = viewport.width / 2 + 1;
    const boundY = viewport.height / 2 + 1;
    if (Math.abs(translation.x) > boundX) {
      fx -= Math.sign(translation.x) * (Math.abs(translation.x) - boundX) * 1.5 * scale;
    }
    if (Math.abs(translation.y) > boundY) {
      fy -= Math.sign(translation.y) * (Math.abs(translation.y) - boundY) * 1.5 * scale;
    }

    impulseVec.set(fx, fy, fz);
    api.current.applyImpulse(impulseVec, false);
  });

  return (
    <RigidBody
      ref={api}
      colliders={false}
      linearDamping={4}
      angularDamping={1}
      friction={0.1}
      position={position}
      rotation={rotation}
    >
      <BallCollider args={[scale]} />
      <group scale={scale}>
        {/* Bauble body */}
        <mesh
          castShadow
          receiveShadow
          geometry={sphereGeometry}
          material={bodyMaterials[materialIndex]}
        />
        {/* Gold cap on top (cylinder + torus loop) */}
        <group position={[0, 0.96, 0]}>
          <mesh
            castShadow
            geometry={capCylinderGeometry}
            material={capMaterial}
          />
          <mesh
            castShadow
            position={[0, 0.17, 0]}
            geometry={capTorusGeometry}
            material={capMaterial}
          />
        </group>
      </group>
    </RigidBody>
  );
}

function Pointer() {
  const ref = useRef<RapierRigidBody>(null!);
  const vec = useMemo(() => new THREE.Vector3(100, 100, 100), []);
  const hasMoved = useRef(false);

  useEffect(() => {
    const handleActive = () => {
      hasMoved.current = true;
    };
    window.addEventListener('pointermove', handleActive, { passive: true });
    window.addEventListener('pointerdown', handleActive, { passive: true });
    window.addEventListener('touchmove', handleActive, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleActive);
      window.removeEventListener('pointerdown', handleActive);
      window.removeEventListener('touchmove', handleActive);
    };
  }, []);

  useFrame(({ pointer, viewport }) => {
    if (hasMoved.current) {
      // Unprojected mouse coords on the z=0 plane:
      // (vec3(mouse.x * viewport.width/2, mouse.y * viewport.height/2, 0))
      const targetX = (pointer.x * viewport.width) / 2;
      const targetY = (pointer.y * viewport.height) / 2;
      // Weighty momentum shove with lerp
      vec.lerp({ x: targetX, y: targetY, z: 0 }, 0.2);
    }
    ref.current?.setNextKinematicTranslation(vec);
  });

  return (
    <RigidBody
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

export function Scene() {
  // 12 baubles: random start position in a ~[-4..4] cube, random scale 0.7–1.3
  const [baubles] = useState<BaubleData[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      scale: 0.7 + Math.random() * 0.6, // random scale 0.7 to 1.3
      position: [
        (Math.random() - 0.5) * 8, // ~[-4..4] cube
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      ],
      rotation: [
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * Math.PI,
      ],
      materialIndex: i % PALETTE.length, // round-robin
    }))
  );

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 40 }}
      onCreated={(state) => {
        state.gl.toneMappingExposure = 1.2;
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight
        position={[20, 20, 25]}
        penumbra={1}
        angle={0.2}
        castShadow
        intensity={2}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[0, 5, -4]} intensity={4} />

      {/* Zero gravity physics world */}
      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {baubles.map((b) => (
          <Bauble
            key={b.id}
            scale={b.scale}
            position={b.position}
            rotation={b.rotation}
            materialIndex={b.materialIndex}
          />
        ))}
      </Physics>

      {/* Studio Environment with Custom Lightformers for glossy glass reflections */}
      <Environment resolution={512}>
        {/* Large white rect behind camera: key reflection strip */}
        <Lightformer
          form="rect"
          intensity={3}
          color="#ffffff"
          position={[0, 0, 15]}
          scale={[22, 10, 1]}
          target={[0, 0, 0]}
        />
        {/* Narrow vertical strip left for edge highlights */}
        <Lightformer
          form="rect"
          intensity={3.5}
          color="#ffffff"
          position={[-12, 0, 0]}
          scale={[2, 22, 1]}
          rotation={[0, Math.PI / 2, 0]}
        />
        {/* Narrow vertical strip right for edge highlights */}
        <Lightformer
          form="rect"
          intensity={3.5}
          color="#ffffff"
          position={[12, 0, 0]}
          scale={[2, 22, 1]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {/* Soft overhead fill */}
        <Lightformer
          form="rect"
          intensity={2}
          color="#ffffff"
          position={[0, 12, -2]}
          scale={[16, 6, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </Environment>

      {/* Post Processing: contact shadows and anti-aliasing */}
      <EffectComposer enableNormalPass={false}>
        <N8AO color="red" aoRadius={2} intensity={1} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
