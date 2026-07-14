import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { PALETTE } from "@/lib/theme";
import type { EyeShape, MouthShape } from "./rabbit-config";

// 体≒顔のドーム型ボディ(2026-07-15リニューアル: ちいかわ系のまんまる路線をやめ、
// たれ耳ロップイヤーに個性を持たせる方向へ変更。ユーザーフィードバック反映)。
export const BODY_PATH =
  "M120,76 C158,76 180,116 184,164 C187,194 168,212 120,212 C72,212 53,194 56,164 C60,116 82,76 120,76 Z";

// 目を大きく・中央寄りにして顔の余白を減らす(旧: 96/144の48px間隔 → 32px間隔)。
const EYE_LEFT_X = 104;
const EYE_RIGHT_X = 136;
const EYE_Y = 126;
const MOUTH_X = 120;
const MOUTH_Y = 150;

function starPath(cx: number, cy: number, s: number) {
  return `M${cx},${cy - 5 * s} L${cx + 1.3 * s},${cy - 1.3 * s} L${cx + 5 * s},${cy} L${cx + 1.3 * s},${cy + 1.3 * s} L${cx},${cy + 5 * s} L${cx - 1.3 * s},${cy + 1.3 * s} L${cx - 5 * s},${cy} L${cx - 1.3 * s},${cy - 1.3 * s} Z`;
}

function heartPath(scale: number) {
  const s = scale;
  return `M0,${2 * s} C${-6 * s},${-2 * s} ${-8 * s},${1 * s} ${-8 * s},${3 * s} C${-8 * s},${8 * s} ${-3 * s},${10 * s} 0,${14 * s} C${3 * s},${10 * s} ${8 * s},${8 * s} ${8 * s},${3 * s} C${8 * s},${1 * s} ${6 * s},${-2 * s} 0,${2 * s} Z`;
}

type EarProps = {
  side: "left" | "right";
  restDeg: number;
  wiggleDeg: number;
  wiggleDuration: number;
  bodyFill: string;
};

// たれ耳(ロップイヤー)。つけ根(頭側)を軸に、まっすぐ下に垂れた状態(restDeg=0)から
// 元気度が上がるほど外側・斜め上へリフトする(restDegが大きいほど元気=旧仕様から符号反転)。
// 楕円は原点(0,0)=つけ根を上端としてローカル座標で描き、motion.g の origin を
// バウンディングボックス比率(0.5,0)=上端中央に合わせることで、常につけ根を軸に回転させる。
export function Ear({ side, restDeg, wiggleDeg, wiggleDuration, bodyFill }: EarProps) {
  const sign = side === "left" ? 1 : -1;
  const rootX = side === "left" ? 85 : 155;
  const rest = sign * restDeg;
  const peak = rest + sign * wiggleDeg;
  return (
    <g transform={`translate(${rootX} 90)`}>
      <motion.g
        style={{ originX: 0.5, originY: 0 }}
        initial={{ rotate: rest }}
        animate={{ rotate: [rest, peak, rest] }}
        transition={{
          duration: wiggleDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ellipse
          cx={0}
          cy={42}
          rx={14}
          ry={42}
          fill={bodyFill}
          stroke={PALETTE.charcoal}
          strokeWidth={5}
        />
        <ellipse cx={0} cy={48} rx={7} ry={31} fill={PALETTE.pink} />
      </motion.g>
    </g>
  );
}

function BlinkPair({ duration, children }: { duration: number; children: ReactNode }) {
  return (
    <motion.g
      style={{ originX: 0.5, originY: 0.5 }}
      animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
      transition={{
        duration,
        repeat: Infinity,
        times: [0, 0.86, 0.9, 0.94, 1],
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.g>
  );
}

export function Sparkle({
  cx,
  cy,
  scale,
  delay = 0,
  fill = PALETTE.apricot,
}: {
  cx: number;
  cy: number;
  scale: number;
  delay?: number;
  fill?: string;
}) {
  return (
    <motion.path
      d={starPath(cx, cy, scale)}
      fill={fill}
      style={{ originX: 0.5, originY: 0.5 }}
      initial={{ opacity: 0.4, scale: 0.7 }}
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.7, 1.15, 0.7] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

export function Eyes({ shape, blinkDuration }: { shape: EyeShape; blinkDuration: number }) {
  if (shape === "dot" || shape === "dotHappy") {
    const r = shape === "dotHappy" ? 8.5 : 7.5;
    return (
      <BlinkPair duration={blinkDuration}>
        <circle cx={EYE_LEFT_X} cy={EYE_Y} r={r} fill={PALETTE.charcoal} />
        <circle cx={EYE_RIGHT_X} cy={EYE_Y} r={r} fill={PALETTE.charcoal} />
      </BlinkPair>
    );
  }

  if (shape === "teary") {
    return (
      <BlinkPair duration={blinkDuration}>
        <rect x={EYE_LEFT_X - 6} y={EYE_Y - 2} width={12} height={4} rx={2} fill={PALETTE.charcoal} />
        <rect x={EYE_RIGHT_X - 6} y={EYE_Y - 2} width={12} height={4} rx={2} fill={PALETTE.charcoal} />
        <circle cx={EYE_LEFT_X - 2} cy={EYE_Y - 3} r={1.4} fill={PALETTE.milk} opacity={0.9} />
        <circle cx={EYE_RIGHT_X - 2} cy={EYE_Y - 3} r={1.4} fill={PALETTE.milk} opacity={0.9} />
        <motion.path
          d={`M${EYE_RIGHT_X + 7},${EYE_Y + 2} C${EYE_RIGHT_X + 9},${EYE_Y + 6} ${EYE_RIGHT_X + 9},${EYE_Y + 9} ${EYE_RIGHT_X + 7},${EYE_Y + 11} C${EYE_RIGHT_X + 5},${EYE_Y + 9} ${EYE_RIGHT_X + 5},${EYE_Y + 6} ${EYE_RIGHT_X + 7},${EYE_Y + 2} Z`}
          fill={PALETTE.mint}
          style={{ originX: 0.5, originY: 0.5 }}
          initial={{ opacity: 0.7, scale: 0.9 }}
          animate={{ opacity: [0.7, 0.9, 0.7], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </BlinkPair>
    );
  }

  if (shape === "sadDown") {
    const dy = 5;
    return (
      <BlinkPair duration={blinkDuration}>
        <circle cx={EYE_LEFT_X} cy={EYE_Y + dy} r={7} fill={PALETTE.charcoal} />
        <circle cx={EYE_RIGHT_X} cy={EYE_Y + dy} r={7} fill={PALETTE.charcoal} />
        <line x1={EYE_LEFT_X - 7} y1={EYE_Y - 7} x2={EYE_LEFT_X + 4} y2={EYE_Y - 11} stroke={PALETTE.charcoal} strokeWidth={3} strokeLinecap="round" />
        <line x1={EYE_RIGHT_X - 4} y1={EYE_Y - 11} x2={EYE_RIGHT_X + 7} y2={EYE_Y - 7} stroke={PALETTE.charcoal} strokeWidth={3} strokeLinecap="round" />
      </BlinkPair>
    );
  }

  if (shape === "curveHappy") {
    return (
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        animate={{ scaleY: [1, 0.8, 1] }}
        transition={{ duration: blinkDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d={`M${EYE_LEFT_X - 7},${EYE_Y + 2} Q${EYE_LEFT_X},${EYE_Y - 6} ${EYE_LEFT_X + 7},${EYE_Y + 2}`}
          stroke={PALETTE.charcoal}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M${EYE_RIGHT_X - 7},${EYE_Y + 2} Q${EYE_RIGHT_X},${EYE_Y - 6} ${EYE_RIGHT_X + 7},${EYE_Y + 2}`}
          stroke={PALETTE.charcoal}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      </motion.g>
    );
  }

  return (
    <BlinkPair duration={blinkDuration}>
      <circle cx={EYE_LEFT_X} cy={EYE_Y} r={8} fill={PALETTE.charcoal} />
      <circle cx={EYE_RIGHT_X} cy={EYE_Y} r={8} fill={PALETTE.charcoal} />
      <circle cx={EYE_LEFT_X - 2} cy={EYE_Y - 2} r={2} fill={PALETTE.milk} />
      <circle cx={EYE_RIGHT_X - 2} cy={EYE_Y - 2} r={2} fill={PALETTE.milk} />
      <Sparkle cx={EYE_LEFT_X + 9} cy={EYE_Y - 9} scale={0.9} delay={0} />
      <Sparkle cx={EYE_RIGHT_X + 10} cy={EYE_Y - 11} scale={0.6} delay={0.4} />
    </BlinkPair>
  );
}

export function Mouth({ shape }: { shape: MouthShape }) {
  if (shape === "omega" || shape === "omegaSmall") {
    const s = shape === "omegaSmall" ? 0.8 : 1;
    return (
      <g transform={`translate(${MOUTH_X} ${MOUTH_Y}) scale(${s})`}>
        <path d="M-7,-1 C-7,3 -1,3 -1,-1" stroke={PALETTE.charcoal} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M1,-1 C1,3 7,3 7,-1" stroke={PALETTE.charcoal} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (shape === "he") {
    return (
      <path
        d={`M${MOUTH_X - 7},${MOUTH_Y + 2} Q${MOUTH_X},${MOUTH_Y - 3} ${MOUTH_X + 7},${MOUTH_Y + 2}`}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  const s = shape === "smileBig" ? 1.3 : 1;
  return (
    <g transform={`translate(${MOUTH_X} ${MOUTH_Y}) scale(${s})`}>
      <path d="M-7,0 Q0,9 7,0 Q0,4 -7,0 Z" fill={PALETTE.charcoal} />
    </g>
  );
}

// うさぎの鼻(2026-07-15リニューアル新要素)。表情段階によらず常時表示。
export function Nose() {
  return (
    <path
      d="M115.5,139.5 C117.5,138 122.5,138 124.5,139.5 C123.5,143 121.5,144.8 120,144.8 C118.5,144.8 116.5,143 115.5,139.5 Z"
      fill={PALETTE.pinkDeep}
    />
  );
}

export function Blush() {
  return (
    <>
      <ellipse cx={90} cy={147} rx={10} ry={7} fill={PALETTE.pink} opacity={0.8} />
      <ellipse cx={150} cy={147} rx={10} ry={7} fill={PALETTE.pink} opacity={0.8} />
    </>
  );
}

export function Paws({ bodyFill }: { bodyFill: string }) {
  return (
    <>
      <ellipse cx={98} cy={210} rx={13} ry={8} fill={bodyFill} stroke={PALETTE.charcoal} strokeWidth={4} />
      <ellipse cx={142} cy={210} rx={13} ry={8} fill={bodyFill} stroke={PALETTE.charcoal} strokeWidth={4} />
    </>
  );
}

// まるいしっぽ(2026-07-15リニューアル新要素)。体の右斜め後ろに固定表示。
export function Tail({ bodyFill }: { bodyFill: string }) {
  return <circle cx={186} cy={198} r={12} fill={bodyFill} stroke={PALETTE.charcoal} strokeWidth={5} />;
}

export function Ribbon({ color }: { color: string }) {
  return (
    <g transform="translate(120 180)">
      <path d="M0,0 C-4,-7 -20,-9 -24,0 C-20,9 -4,7 0,0 Z" fill={color} stroke={PALETTE.charcoal} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M0,0 C4,-7 20,-9 24,0 C20,9 4,7 0,0 Z" fill={color} stroke={PALETTE.charcoal} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M-3,10 C-6,16 -5,22 -2,26 L2,20 Z" fill={color} stroke={PALETTE.charcoal} strokeWidth={2} strokeLinejoin="round" />
      <path d="M3,10 C6,16 5,22 2,26 L-2,20 Z" fill={color} stroke={PALETTE.charcoal} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={0} cy={0} r={6.5} fill={color} stroke={PALETTE.charcoal} strokeWidth={2.5} />
    </g>
  );
}

export function GroundShadow() {
  return <ellipse cx={120} cy={224} rx={64} ry={10} fill={PALETTE.charcoal} opacity={0.12} />;
}

export function Blanket() {
  return (
    <g>
      <path
        d="M40,178 Q120,158 202,178 L202,204 Q202,224 176,226 L64,226 Q40,224 40,204 Z"
        fill={PALETTE.lavender}
        opacity={0.92}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path d="M52,186 Q120,170 190,186" stroke={PALETTE.milk} strokeWidth={3} fill="none" opacity={0.6} strokeLinecap="round" />
      <circle cx={78} cy={204} r={3} fill={PALETTE.milk} opacity={0.7} />
      <circle cx={120} cy={212} r={3} fill={PALETTE.milk} opacity={0.7} />
      <circle cx={162} cy={204} r={3} fill={PALETTE.milk} opacity={0.7} />
    </g>
  );
}

export function SpeechBubble({
  text,
  small = false,
  fadeInOut = false,
}: {
  text: string;
  small?: boolean;
  fadeInOut?: boolean;
}) {
  const w = small ? 74 : 96;
  const h = small ? 34 : 40;
  const x = 236 - w;
  const y = 8;
  const content = (
    <>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={PALETTE.milk} stroke={PALETTE.charcoalSoft} strokeWidth={2.5} />
      <path
        d={`M${x + 22},${y + h} L${x + 14},${y + h + 10} L${x + 32},${y + h - 2} Z`}
        fill={PALETTE.milk}
        stroke={PALETTE.charcoalSoft}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <text x={x + w / 2} y={y + h / 2 + 5} fontSize={13} fill={PALETTE.charcoal} textAnchor="middle">
        {text}
      </text>
    </>
  );
  if (!fadeInOut) {
    return (
      <motion.g
        initial={{ opacity: 0.85 }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {content}
      </motion.g>
    );
  }
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0, 1, 1, 0] }}
      transition={{ duration: 8, repeat: Infinity, times: [0, 0.35, 0.45, 0.8, 0.92], ease: "easeInOut" }}
    >
      {content}
    </motion.g>
  );
}

function Flower({ cx, cy, scale, delay = 0 }: { cx: number; cy: number; scale: number; delay?: number }) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const ang = (i / 5) * Math.PI * 2;
    const px = cx + Math.cos(ang) * 4 * scale;
    const py = cy + Math.sin(ang) * 4 * scale;
    return <circle key={i} cx={px} cy={py} r={3.2 * scale} fill={PALETTE.pink} />;
  });
  return (
    <motion.g
      style={{ originX: 0.5, originY: 0.5 }}
      initial={{ y: 0, opacity: 0.75 }}
      animate={{ y: [0, -6, 0], opacity: [0.75, 1, 0.75] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {petals}
      <circle cx={cx} cy={cy} r={2.2 * scale} fill={PALETTE.apricot} />
    </motion.g>
  );
}

export function SparkleField() {
  return (
    <g>
      <Sparkle cx={30} cy={46} scale={1} delay={0} fill={PALETTE.apricot} />
      <Sparkle cx={214} cy={40} scale={0.7} delay={0.5} fill={PALETTE.lavender} />
      <Sparkle cx={120} cy={16} scale={0.75} delay={0.9} fill={PALETTE.mint} />
      <Flower cx={20} cy={150} scale={0.9} delay={0.2} />
      <Flower cx={220} cy={162} scale={0.8} delay={0.7} />
    </g>
  );
}

export function HeartBurst() {
  const hearts = [
    { x: 90, y: 40, delay: 0, scale: 1.1 },
    { x: 150, y: 34, delay: 0.12, scale: 0.9 },
    { x: 120, y: 20, delay: 0.24, scale: 1.3 },
    { x: 70, y: 60, delay: 0.36, scale: 0.8 },
  ];
  return (
    <g>
      {hearts.map((h, i) => (
        <motion.path
          key={i}
          d={heartPath(h.scale)}
          fill={PALETTE.pinkDeep}
          initial={{ x: h.x, y: h.y, opacity: 0, scale: 0 }}
          animate={{
            y: [h.y, h.y - 20, h.y - 46],
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.7],
          }}
          transition={{ duration: 1.4, delay: h.delay, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
        />
      ))}
    </g>
  );
}

export function AmbientHeart() {
  return (
    <motion.path
      d={heartPath(0.9)}
      fill={PALETTE.pinkDeep}
      initial={{ x: 150, y: 50, opacity: 0, scale: 0 }}
      animate={{
        y: [50, 50, 30, 8],
        opacity: [0, 0, 1, 0],
        scale: [0, 0, 1, 0.8],
      }}
      transition={{ duration: 7, repeat: Infinity, times: [0, 0.82, 0.9, 1], ease: "easeOut" }}
    />
  );
}
