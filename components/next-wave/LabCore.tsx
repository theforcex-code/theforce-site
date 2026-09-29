import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";

const BODY_COLOR = "#FF0FA0";
const CHEEK_COLOR = "#FFD9E8";
const EYE_COLOR = "#171417";
const MOUTH_COLOR = "#C93465";

// The THE FORCE mark is a dot inside a ring — the blob is the dot, this is
// the ring: same material and color as the blob itself, so the two read as
// one object (a ball resting inside its own ring) rather than two parts.
const RING_RADIUS = 1.48;
const RING_TUBE = 0.15;

// Blink with a touch of anticipation: eyes widen slightly just before they
// close, then snap through the blink and ease back to rest.
function blinkScale(t: number) {
  const cycle = t % 4.2;
  if (cycle > 3.75 && cycle < 4.0) {
    const p = (cycle - 3.75) / 0.25;
    return 1 + Math.sin(p * Math.PI) * 0.12;
  }
  if (cycle >= 4.0 && cycle < 4.2) {
    const p = (cycle - 4.0) / 0.2;
    return 1 - Math.sin(p * Math.PI) * 0.85;
  }
  return 1;
}

// A round, squishy little creature: soft body, big eyes, blushed cheeks,
// gentle idle bob and an occasional blink.
function CuteBlob({ reduceRef }: { reduceRef: React.RefObject<boolean> }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (reduceRef.current) return;
    const t = clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.scale.set(1 + Math.sin(t * 1.6) * -0.03, 0.9 + Math.sin(t * 1.6) * 0.04, 0.96);
    }
    const blink = blinkScale(t);
    if (eyeLRef.current) eyeLRef.current.scale.y = blink;
    if (eyeRRef.current) eyeRRef.current.scale.y = blink;
  });

  return (
    <mesh ref={bodyRef}>
      <sphereGeometry args={[0.78, 48, 48]} />
      <meshPhysicalMaterial
        color={BODY_COLOR}
        emissive={BODY_COLOR}
        emissiveIntensity={0.5}
        roughness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.06}
        reflectivity={1}
        toneMapped={false}
      />

      <mesh position={[-0.24, -0.28, 0.6]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0.24, -0.28, 0.6]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={CHEEK_COLOR} roughness={0.7} />
      </mesh>

      <mesh ref={eyeLRef} position={[-0.24, 0.08, 0.72]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={EYE_COLOR} roughness={0.15} />
      </mesh>
      <mesh ref={eyeRRef} position={[0.24, 0.08, 0.72]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={EYE_COLOR} roughness={0.15} />
      </mesh>
      <mesh position={[-0.28, 0.14, 0.79]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.2, 0.14, 0.79]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0, -0.16, 0.755]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color={MOUTH_COLOR} roughness={0.5} />
      </mesh>
    </mesh>
  );
}

// The ring stays in its default XY plane — facing the camera head-on as a
// round "O" — centered on the same origin as the blob.
function LogoRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.05;
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[RING_RADIUS, RING_TUBE, 32, 128]} />
      <meshPhysicalMaterial
        color={BODY_COLOR}
        emissive={BODY_COLOR}
        emissiveIntensity={0.5}
        roughness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.06}
        reflectivity={1}
        toneMapped={false}
      />
    </mesh>
  );
}

function Scene() {
  const { gl } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onMove(e: PointerEvent) {
      const rect = gl.domElement.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.42;
      pointer.current.x = (e.clientX - cx) / (rect.width / 2);
      pointer.current.y = (e.clientY - cy) / (rect.height / 2);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [gl]);

  useFrame(({ clock }) => {
    if (reduceRef.current || !groupRef.current) return;
    const t = clock.getElapsedTime();
    const idleY = Math.sin(t * 0.35) * 0.12;
    const idleX = Math.sin(t * 0.27 + 1.4) * 0.05;
    const targetY = Math.max(-0.5, Math.min(0.5, pointer.current.x * 0.5 + idleY));
    const targetX = Math.max(-0.3, Math.min(0.3, -pointer.current.y * 0.3 + idleX));
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.08;
    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[-3, 4, 5]} intensity={0.6} />
      <directionalLight position={[3, -1, -3]} intensity={0.2} />
      <pointLight position={[-1.2, 1.4, 2.4]} intensity={10} distance={7} color="#ffffff" />
      <pointLight position={[1.4, -0.8, 2]} intensity={5} distance={7} color="#ffe9f0" />
      <group ref={groupRef}>
        <LogoRing />
        <CuteBlob reduceRef={reduceRef} />
      </group>
    </>
  );
}

export default function LabCore({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style}>
      <Canvas camera={{ position: [0, 0.3, 5.6], fov: 34 }} gl={{ alpha: true }} style={{ background: "transparent" }} dpr={[1, 2]}>
        <Scene />
      </Canvas>
    </div>
  );
}
