"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  MotionValue,
} from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Piece {
  id: string;
  image: string;
  alt: string;
  // Position (% of container)
  left: string;
  top: string;
  // Size
  w: number; // base width in px
  aspect: string; // CSS aspect-ratio
  // Visual character
  rotate: number; // degrees
  radius: string; // border-radius
  // Parallax depth: 0 = back (slow), 1 = mid, 2 = front (fast)
  layer: 0 | 1 | 2;
  z: number;
  opacity?: number;
  // Idle float
  floatY: number; // amplitude in px
  floatT: number; // period in seconds
  floatD: number; // delay in seconds
  // Entry reveal delay
  reveal: number;
  // Hide on narrow mobile
  hideXs?: boolean;
}

// ─── Collage layout ─────────────────────────────────────────────────────────
// Objects are intentionally scattered — varying size, rotation, depth.
// Positions are percentages so they scale with the container.

const PIECES: Piece[] = [
  // ─── BACKGROUND (layer 0) — drifts the least ────────────────────────
  {
    id: "bg1",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=520&auto=format&fit=crop&q=80",
    alt: "Leather journal open on desk",
    left: "1%", top: "14%",
    w: 200, aspect: "3/4",
    rotate: -13, radius: "18px",
    layer: 0, z: 1, opacity: 0.82,
    floatY: 10, floatT: 7.2, floatD: 0,
    reveal: 0.05,
  },
  {
    id: "bg2",
    image:
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=520&auto=format&fit=crop&q=80",
    alt: "Watercolour palette with vivid colours",
    left: "71%", top: "6%",
    w: 265, aspect: "4/3",
    rotate: 9, radius: "20px",
    layer: 0, z: 1, opacity: 0.88,
    floatY: 8, floatT: 9.8, floatD: 1.3,
    reveal: 0.18,
  },
  {
    id: "bg3",
    image:
      "https://images.unsplash.com/photo-1528716321680-815a8cdb8cbe?w=520&auto=format&fit=crop&q=80",
    alt: "Open notebook with handwriting",
    left: "28%", top: "63%",
    w: 285, aspect: "4/3",
    rotate: 5, radius: "16px",
    layer: 0, z: 1, opacity: 0.78,
    floatY: 7, floatT: 11.5, floatD: 3.0,
    reveal: 0.38, hideXs: true,
  },
  {
    id: "bg4",
    image:
      "https://images.unsplash.com/photo-1580565807673-c5b6b80bc5c3?w=520&auto=format&fit=crop&q=80",
    alt: "Art pens and brushes laid flat",
    left: "84%", top: "53%",
    w: 175, aspect: "3/4",
    rotate: -19, radius: "14px",
    layer: 0, z: 1, opacity: 0.72,
    floatY: 9, floatT: 8.7, floatD: 0.6,
    reveal: 0.28, hideXs: true,
  },

  // ─── MIDGROUND (layer 1) — medium drift ─────────────────────────────
  {
    id: "mid1",
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=520&auto=format&fit=crop&q=80",
    alt: "Sketchbook with pencil illustration",
    left: "53%", top: "21%",
    w: 240, aspect: "3/4",
    rotate: -7, radius: "18px",
    layer: 1, z: 3,
    floatY: 13, floatT: 8.1, floatD: 0.4,
    reveal: 0.10,
  },
  {
    id: "mid2",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=520&auto=format&fit=crop&q=80",
    alt: "Calligraphy pen on parchment",
    left: "14%", top: "52%",
    w: 180, aspect: "2/3",
    rotate: 21, radius: "14px",
    layer: 1, z: 3,
    floatY: 15, floatT: 6.6, floatD: 1.9,
    reveal: 0.22,
  },
  {
    id: "mid3",
    image:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=520&auto=format&fit=crop&q=80",
    alt: "Vintage art supplies and paint brushes",
    left: "75%", top: "47%",
    w: 220, aspect: "4/3",
    rotate: -15, radius: "16px",
    layer: 1, z: 3,
    floatY: 11, floatT: 10.2, floatD: 3.2,
    reveal: 0.31, hideXs: true,
  },
  {
    id: "mid4",
    image:
      "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=520&auto=format&fit=crop&q=80",
    alt: "Fountain pen writing on paper",
    left: "6%", top: "71%",
    w: 185, aspect: "4/3",
    rotate: -4, radius: "13px",
    layer: 1, z: 3, opacity: 0.9,
    floatY: 9, floatT: 7.9, floatD: 1.0,
    reveal: 0.20, hideXs: true,
  },

  // ─── FOREGROUND (layer 2) — moves most ──────────────────────────────
  {
    id: "fg1",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=520&auto=format&fit=crop&q=80",
    alt: "Brush markers with vivid ink",
    left: "0%", top: "4%",
    w: 158, aspect: "3/4",
    rotate: 25, radius: "14px",
    layer: 2, z: 5,
    floatY: 19, floatT: 5.6, floatD: 0.3,
    reveal: 0.08,
  },
  {
    id: "fg2",
    image:
      "https://plus.unsplash.com/premium_photo-1723618952424-e72e62d3119e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzd8fGNvbG9yJTIwcGVuY2lsJTIwc2V0fGVufDB8fDB8fHww",
    alt: "Coloured pencil set",
    left: "42%", top: "4%",
    w: 148, aspect: "4/3",
    rotate: -20, radius: "12px",
    layer: 2, z: 5,
    floatY: 21, floatT: 6.9, floatD: 2.2,
    reveal: 0.13,
  },
  {
    id: "fg3",
    image:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=520&auto=format&fit=crop&q=80",
    alt: "Luxury fountain pen close-up",
    left: "88%", top: "18%",
    w: 140, aspect: "3/4",
    rotate: -27, radius: "12px",
    layer: 2, z: 5,
    floatY: 23, floatT: 5.3, floatD: 1.5,
    reveal: 0.30, hideXs: true,
  },
  {
    id: "fg4",
    image:
      "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=520&auto=format&fit=crop&q=80",
    alt: "Premium brass scissors and rules",
    left: "61%", top: "70%",
    w: 162, aspect: "1/1",
    rotate: 12, radius: "50%",
    layer: 2, z: 5,
    floatY: 15, floatT: 7.7, floatD: 0.9,
    reveal: 0.42, hideXs: true,
  },
];

// Parallax Y ranges per layer [enter, exit] in px - tightened for smooth motion
const LAYER_RANGE: Record<0 | 1 | 2, [number, number]> = {
  0: [0, 20],    // background — almost still
  1: [-10, 45],  // midground
  2: [-20, 75],  // foreground — moves most
};

// ─── Single floating cutout piece ───────────────────────────────────────────

function FloatingPiece({
  p,
  scrollY,
  visible,
}: {
  p: Piece;
  scrollY: MotionValue<number>;
  visible: boolean;
}) {
  const [yFrom, yTo] = LAYER_RANGE[p.layer];
  const parallaxY = useTransform(scrollY, [0, 1], [yFrom, yTo]);

  // Scale the width responsively using clamp-like logic
  const wClamped = `clamp(${Math.round(p.w * 0.6)}px, ${(p.w / 14).toFixed(1)}vw, ${p.w}px)`;

  return (
    <motion.div
      className={p.hideXs ? "hidden sm:block" : undefined}
      style={{
        position: "absolute",
        left: p.left,
        top: p.top,
        width: wClamped,
        aspectRatio: p.aspect,
        zIndex: p.z,
        y: parallaxY,
      }}
      // Entry reveal
      initial={{ opacity: 0, scale: 0.78, rotate: p.rotate * 0.6 }}
      animate={
        visible
          ? { opacity: p.opacity ?? 1, scale: 1, rotate: p.rotate }
          : {}
      }
      transition={{
        duration: 1.2,
        delay: p.reveal,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Idle float — nested so it doesn't fight the parallax y */}
      <motion.div
        className="relative w-full h-full"
        animate={{ y: [0, -p.floatY, 0] }}
        transition={{
          duration: p.floatT,
          repeat: Infinity,
          ease: "easeInOut",
          delay: p.floatD,
          repeatType: "loop",
        }}
      >
        <Image
          src={p.image}
          alt={p.alt}
          fill
          sizes={`(max-width: 640px) ${Math.round(p.w * 0.6)}px, ${p.w}px`}
          loading="lazy"
          className="w-full h-full object-cover select-none"
          style={{
            borderRadius: p.radius,
            boxShadow: [
              "0 50px 120px rgba(0,0,0,0.75)",
              "0 20px 50px rgba(0,0,0,0.55)",
              "0 0 0 1px rgba(255,255,255,0.06)",
            ].join(", "),
            willChange: "transform",
          }}
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Main Section ────────────────────────────────────────────────────────────

export default function InfiniteShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-6%" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden select-none"
      style={{
        background: "#0F0F10",
        height: "clamp(640px, 75vw, 900px)",
      }}
      aria-label="Creator's workspace"
    >
      {/* ── Atmospheric light blobs ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <motion.div
          className="absolute rounded-full"
          style={{
            left: "-10%", top: "10%",
            width: 600, height: 600,
            background:
              "radial-gradient(circle, rgba(229,60,60,0.28) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            right: "-12%", bottom: "5%",
            width: 700, height: 700,
            background:
              "radial-gradient(circle, rgba(74,197,209,0.2) 0%, transparent 70%)",
            filter: "blur(110px)",
          }}
          animate={{ scale: [1, 1.09, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            left: "40%", top: "30%",
            width: 500, height: 500,
            background:
              "radial-gradient(circle, rgba(255,184,0,0.14) 0%, transparent 70%)",
            filter: "blur(130px)",
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [1, 0.55, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        />
      </div>

      {/* ── Floating cutout objects ── */}
      {PIECES.map((p) => (
        <FloatingPiece
          key={p.id}
          p={p}
          scrollY={scrollYProgress}
          visible={isInView}
        />
      ))}

      {/* ── Central editorial text ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-6 text-center"
      >
        {/* Radial vignette behind text only — so images show through the rest */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 65% at 50% 52%, rgba(15,15,16,0.72) 0%, transparent 100%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.0, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Eyebrow rule */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.3 }}
            animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 mb-6"
          >
            <span
              className="h-px w-10 sm:w-14"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(229,60,60,0.8))",
              }}
            />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.28em] text-[#E53C3C]">
              The Collection
            </span>
            <span
              className="h-px w-10 sm:w-14"
              style={{
                background:
                  "linear-gradient(to left, transparent, rgba(229,60,60,0.8))",
              }}
            />
          </motion.div>

          {/* Main title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.0, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-black text-white leading-[1.03] tracking-tight"
            style={{ fontSize: "clamp(2.1rem, 5.5vw, 5rem)" }}
          >
            Crafted For{" "}
            <br className="hidden xs:block sm:hidden" />
            <span
              style={{
                backgroundImage:
                  "linear-gradient(125deg, #E53C3C 0%, #FFB800 48%, #4AC5D1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Every Creator
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.9 }}
            className="mt-4 sm:mt-5 max-w-xs sm:max-w-sm text-white/48 text-[13px] sm:text-sm leading-[1.7]"
          >
            From everyday writing to professional artistry — discover tools
            that inspire ideas and bring creativity to life.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 sm:mt-8 pointer-events-auto"
          >
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold text-sm text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.14)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.3)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 16px 48px rgba(0,0,0,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.18)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 32px rgba(0,0,0,0.3)";
              }}
            >
              <span>Explore Collection</span>
              <ArrowUpRight
                size={15}
                strokeWidth={2.5}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FFB800] transition-all duration-200"
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Edge dissolve masks ── */}
      {/* Bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-36 z-20"
        style={{
          background: "linear-gradient(to top, #0F0F10 0%, rgba(15, 15, 16, 0) 100%)",
        }}
      />
      {/* Left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-32 z-20"
        style={{
          background: "linear-gradient(to right, #0F0F10 0%, rgba(15, 15, 16, 0) 100%)",
        }}
      />
      {/* Right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-32 z-20"
        style={{
          background: "linear-gradient(to left, #0F0F10 0%, rgba(15, 15, 16, 0) 100%)",
        }}
      />
      {/* Top - seamless gradient mask bridging light & dark modes to deep dark #0F0F10 without grey dead-zone */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-32 z-20 bg-gradient-to-b from-[#F8F7F4] to-[#F8F7F4]/0 dark:from-neutral-950 dark:to-neutral-950/0"
      />
    </section>
  );
}
