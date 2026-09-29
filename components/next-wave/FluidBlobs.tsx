import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ACCENTS } from "./accents";

const CLUSTERS = [
  { color: ACCENTS.coral.bright, cx: 14, cy: 24, count: 16, depth: 30, scrollDepth: 0.12 },
  { color: ACCENTS.turquoise.bright, cx: 88, cy: 18, count: 15, depth: -22, scrollDepth: -0.08 },
  { color: ACCENTS.sunny.bright, cx: 18, cy: 84, count: 15, depth: -26, scrollDepth: 0.18 },
  { color: ACCENTS.lavender.bright, cx: 86, cy: 82, count: 16, depth: 34, scrollDepth: -0.15 },
];

type Dot = { size: number; left: number; top: number; duration: number; delay: number };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Dot layout is only generated after mount (client-only), scaled to the
// viewport's smaller dimension so dots aren't oversized on phones.
function makeDots(count: number, unit: number): Dot[] {
  return Array.from({ length: count }, () => ({
    size: rand(0.14, 0.27) * unit,
    left: rand(-0.06, 0.06) * unit,
    top: rand(-0.06, 0.06) * unit,
    duration: rand(5, 9),
    delay: rand(0, 9),
  }));
}

function Cluster({
  cluster,
  dots,
  pointerX,
  pointerY,
  scrollY,
}: {
  cluster: (typeof CLUSTERS)[number];
  dots: Dot[];
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollY: MotionValue<number>;
}) {
  const px = useTransform(pointerX, (v) => v * cluster.depth);
  const py = useTransform(pointerY, (v) => v * cluster.depth * 0.7);
  const sy = useTransform(scrollY, (v) => v * cluster.scrollDepth);
  const x = useSpring(px, { stiffness: 45, damping: 20 });
  const y = useSpring(useTransform([py, sy], ([a, b]) => (a as number) + (b as number)), {
    stiffness: 45,
    damping: 20,
  });

  return (
    <motion.div className="nw-fluid-cluster" style={{ left: `${cluster.cx}%`, top: `${cluster.cy}%`, x, y }}>
      {dots.map((dot, i) => (
        <span
          key={i}
          className="nw-fluid-dot"
          style={{
            width: dot.size,
            height: dot.size,
            background: cluster.color,
            left: `${dot.left}px`,
            top: `${dot.top}px`,
            animationDuration: `${dot.duration}s`,
            animationDelay: `-${dot.delay}s`,
          }}
        />
      ))}
    </motion.div>
  );
}

export default function FluidBlobs() {
  const reduce = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const { scrollY } = useScroll();
  const [dotsByCluster, setDotsByCluster] = useState<Dot[][] | null>(null);

  useEffect(() => {
    const unit = Math.min(window.innerWidth, window.innerHeight);
    setDotsByCluster(CLUSTERS.map((c) => makeDots(c.count, unit)));

    let resizeTimer: number;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const u = Math.min(window.innerWidth, window.innerHeight);
        setDotsByCluster(CLUSTERS.map((c) => makeDots(c.count, u)));
      }, 200);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  useEffect(() => {
    if (reduce) return;
    function onMove(e: PointerEvent) {
      pointerX.set((e.clientX / window.innerWidth) * 2 - 1);
      pointerY.set((e.clientY / window.innerHeight) * 2 - 1);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, pointerX, pointerY]);

  if (!dotsByCluster) return <div className="nw-fluid-layer" aria-hidden="true" />;

  return (
    <div className="nw-fluid-layer" aria-hidden="true">
      {CLUSTERS.map((cluster, ci) => (
        <Cluster key={ci} cluster={cluster} dots={dotsByCluster[ci]} pointerX={pointerX} pointerY={pointerY} scrollY={scrollY} />
      ))}
    </div>
  );
}
