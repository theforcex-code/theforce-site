import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { useScroll, type MotionValue } from "motion/react";
import * as THREE from "three";

// A neon accent for the closing mark — distinct from the pink brand palette.
const NEON = "#39FF14";

const BALL_RADIUS = 0.58;
const RING_RADIUS = 1.4;
const RING_TUBE = 0.24;

// Scroll-progress thresholds (0..1). Below FINALE_START the mark spins with
// scroll; from FINALE_START to 1 it adds whole extra turns while settling
// front-on. Both turn counts stay integers so it lands facing front.
const FINALE_START = 0.6;
const SCROLL_TURNS = 1;
const FINALE_EXTRA_TURNS = 1;
const ROTATION_DAMPING = 0.04;

type Touch = { point: THREE.Vector3; active: boolean };

// Injected into the ball/ring's MeshPhysicalMaterial: a small constant ripple
// plus a soft local bulge wherever the cursor rests on the surface.
function makeLiquidInjector(uniforms: {
  uTouch: { value: THREE.Vector3 };
  uTouchStrength: { value: number };
}) {
  return (shader: { uniforms: Record<string, unknown>; vertexShader: string }) => {
    shader.uniforms.uTouch = uniforms.uTouch;
    shader.uniforms.uTouchStrength = uniforms.uTouchStrength;
    shader.vertexShader = `
      uniform vec3 uTouch;
      uniform float uTouchStrength;
      ${shader.vertexShader}
    `
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
         float touchDistN = length(position - uTouch);
         float touchFalloffN = exp(-touchDistN * touchDistN / 1.8);
         vec3 touchOutN = normalize(position - uTouch + 1e-4);
         objectNormal = normalize(mix(objectNormal, touchOutN, touchFalloffN * uTouchStrength * 0.35));
        `,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float touchDist = length(position - uTouch);
         float touchFalloff = exp(-touchDist * touchDist / 1.8);
         vec3 touchOut = normalize(position - uTouch + 1e-4);
         transformed += touchOut * touchFalloff * uTouchStrength * 0.16;
        `,
      );
  };
}

// The ball + ring (no face): a glossy, wet-look material with sharp specular
// highlights so it reads as liquid rather than matte plastic.
function SolidLogo({ touch }: { touch: React.RefObject<Touch> }) {
  const uniforms = useMemo(
    () => ({
      uTouch: { value: new THREE.Vector3(999, 999, 999) },
      uTouchStrength: { value: 0 },
    }),
    [],
  );
  const liquid = useMemo(() => makeLiquidInjector(uniforms), [uniforms]);
  const displayTouch = useRef(new THREE.Vector3(999, 999, 999));

  useFrame(() => {
    displayTouch.current.lerp(touch.current!.point, 0.08);
    uniforms.uTouch.value.copy(displayTouch.current);
    const target = touch.current!.active ? 1 : 0;
    uniforms.uTouchStrength.value += (target - uniforms.uTouchStrength.value) * 0.06;
  });

  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const mesh = e.eventObject as THREE.Mesh;
    touch.current!.point.copy(mesh.worldToLocal(e.point.clone()));
    touch.current!.active = true;
  }

  function onPointerLeave() {
    touch.current!.active = false;
  }

  return (
    <>
      <mesh onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <sphereGeometry args={[BALL_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          color={NEON}
          emissive={NEON}
          emissiveIntensity={0.55}
          roughness={0.16}
          metalness={0.0}
          clearcoat={1}
          clearcoatRoughness={0.12}
          reflectivity={1}
          toneMapped={false}
          onBeforeCompile={liquid}
        />
      </mesh>
      <mesh onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <torusGeometry args={[RING_RADIUS, RING_TUBE, 48, 160]} />
        <meshPhysicalMaterial
          color={NEON}
          emissive={NEON}
          emissiveIntensity={0.55}
          roughness={0.16}
          metalness={0.0}
          clearcoat={1}
          clearcoatRoughness={0.12}
          reflectivity={1}
          toneMapped={false}
          onBeforeCompile={liquid}
        />
      </mesh>
    </>
  );
}

function FinaleScene({ scrollYProgress, touch }: { scrollYProgress: MotionValue<number>; touch: React.RefObject<Touch> }) {
  const spinRef = useRef<THREE.Group>(null);
  const displayRotation = useRef(0);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useFrame(() => {
    if (!spinRef.current) return;

    if (reduceRef.current) {
      spinRef.current.rotation.y = 0;
      return;
    }

    const progress = scrollYProgress.get();
    const finaleT = Math.max(0, Math.min(1, (progress - FINALE_START) / (1 - FINALE_START)));
    const eased = finaleT * finaleT * (3 - 2 * finaleT);

    const normalScroll = Math.min(progress, FINALE_START) / FINALE_START;
    const scrollSpin = normalScroll * Math.PI * 2 * SCROLL_TURNS;
    const finaleSpin = eased * Math.PI * 2 * FINALE_EXTRA_TURNS;

    const target = scrollSpin + finaleSpin;
    displayRotation.current += (target - displayRotation.current) * ROTATION_DAMPING;
    spinRef.current.rotation.y = displayRotation.current;
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-3, 4, 5]} intensity={0.7} />
      <directionalLight position={[3, -1, -3]} intensity={0.25} />
      <pointLight position={[-1.5, 1.8, 3]} intensity={7} distance={9} color="#ffffff" />
      <pointLight position={[2, -1.2, 2.5]} intensity={3.5} distance={9} color="#eaffe0" />
      <group ref={spinRef}>
        <SolidLogo touch={touch} />
      </group>
    </>
  );
}

export default function LogoFinale({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { scrollYProgress } = useScroll();
  const touch = useRef<Touch>({ point: new THREE.Vector3(999, 999, 999), active: false });

  return (
    <div className={className} style={style}>
      <Canvas camera={{ position: [0, -0.15, 9.3], fov: 30 }} gl={{ alpha: true }} style={{ background: "transparent" }} dpr={[1, 2]}>
        <FinaleScene scrollYProgress={scrollYProgress} touch={touch} />
      </Canvas>
    </div>
  );
}
