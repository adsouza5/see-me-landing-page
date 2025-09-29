// site/src/components/OrbitCircles.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";

type OrbitCirclesProps = {
  state: "in" | "out";        // show / hide
  span: number;               // total width of the V container (px)
  drop: number;               // vertical drop of the outer-most avatar (px)
  count?: number;             // total avatars (even number -> same per side)
  size?: number;              // avatar diameter (px)
  images?: string[];          // avatar urls
};

export default function OrbitCircles({
  state,
  span,
  drop,
  count = 6,
  size = 44,
  images = [],
}: OrbitCirclesProps) {
  // enforce symmetry: split evenly left/right
  const perSide = Math.max(1, Math.floor(count / 2));
  const total = perSide * 2;

  // container is centered by parent with left-1/2 -translate-x-1/2
  // we set width=span so center is span/2
  const center = span / 2;

  // horizontal step from center to outside, vertical step downwards
  const dx = center / (perSide + 1);       // leave a bit of gap at the middle
  const dy = drop / (perSide);             // linear drop → nice V

  // build positions (left then right) — perfectly mirrored
  const positions: { x: number; y: number; img?: string; key: string }[] = [];
  for (let i = 1; i <= perSide; i++) {
    const xLeft = center - i * dx;
    const xRight = center + i * dx;
    const y = drop - (i - 1) * dy;                       // downward V (∨)
    positions.push({ x: xLeft, y, img: images[(i - 1) % images.length], key: `L${i}` });
    positions.push({ x: xRight, y, img: images[(perSide - 1 + i) % images.length], key: `R${i}` });
  }

  return (
    <AnimatePresence initial={false}>
      {state !== "out" && (
        <motion.div
          key="v"
          className="relative pointer-events-none"
          style={{ width: span, height: drop + size }}  // enough height for the V
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {positions.slice(0, total).map((p, i) => (
            <motion.div
              key={p.key}
              className="absolute rounded-full overflow-hidden shadow-lg ring-2 ring-black/40 bg-white"
              style={{ width: size, height: size, left: p.x - size / 2, top: p.y - size / 2 }}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.05 * i, ease: "easeOut" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.img ? <img src={p.img} alt="" className="w-full h-full object-cover" /> : null}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
