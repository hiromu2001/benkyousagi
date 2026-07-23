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

// おみせ(REQUIREMENTS.md 3-7節)で購入できるアクセサリー第1弾。装備スロットは
// 「あたま・かお」の1枠のみのため、常にEyes/Mouthより前面(最後)に描画すればよい。

export function Glasses() {
  return (
    <g>
      <circle cx={104} cy={126} r={13} fill="none" stroke={PALETTE.charcoal} strokeWidth={3.5} />
      <circle cx={136} cy={126} r={13} fill="none" stroke={PALETTE.charcoal} strokeWidth={3.5} />
      <path d="M117,126 L123,126" stroke={PALETTE.charcoal} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M91,124 L83,121" stroke={PALETTE.charcoal} strokeWidth={3} strokeLinecap="round" />
      <path d="M149,124 L157,121" stroke={PALETTE.charcoal} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export function Beret() {
  return (
    <g>
      <ellipse cx={124} cy={66} rx={34} ry={20} fill={PALETTE.pinkDeep} stroke={PALETTE.charcoal} strokeWidth={4} />
      <ellipse cx={118} cy={74} rx={32} ry={11} fill={PALETTE.pinkDeep} stroke={PALETTE.charcoal} strokeWidth={3.5} />
      <circle cx={150} cy={52} r={4.5} fill={PALETTE.pinkDeep} stroke={PALETTE.charcoal} strokeWidth={2.5} />
    </g>
  );
}

export function Nightcap() {
  return (
    <g>
      <path
        d="M86,86 C86,54 100,38 122,38 C146,38 158,56 156,80 C130,68 100,72 86,86 Z"
        fill={PALETTE.lavender}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M156,80 C168,86 176,96 172,104 C164,100 156,92 150,84 Z"
        fill={PALETTE.lavender}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <circle cx={172} cy={106} r={6} fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth={3} />
    </g>
  );
}

function CrownBud({ cx, cy }: { cx: number; cy: number }) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const ang = (i / 5) * Math.PI * 2;
    const px = cx + Math.cos(ang) * 4.5;
    const py = cy + Math.sin(ang) * 4.5;
    return <circle key={i} cx={px} cy={py} r={3.6} fill={PALETTE.pink} stroke={PALETTE.charcoal} strokeWidth={1.2} />;
  });
  return (
    <g>
      {petals}
      <circle cx={cx} cy={cy} r={2.6} fill={PALETTE.apricot} />
    </g>
  );
}

export function FlowerCrown() {
  const positions = [
    { cx: 82, cy: 90 },
    { cx: 101, cy: 74 },
    { cx: 120, cy: 68 },
    { cx: 139, cy: 74 },
    { cx: 158, cy: 90 },
  ];
  return (
    <g>
      {positions.map((p, i) => (
        <CrownBud key={i} cx={p.cx} cy={p.cy} />
      ))}
    </g>
  );
}

// アクセサリー第2弾(2026-07-15追加)。ピンクのリボンは既存のリボン/マフラー色選択(2-2節)とは
// 別部位として、頭のてっぺんに大きめのちょうちょ結びを乗せる形で固定ピンクで描画する
// (4色設定を上書きしない)。2026-07-15: ユーザー提示の🎀参考画像に合わせ、頭頂中央・大きめ・
// 丸みのあるロブ+ V字の垂れ尾+折り目のハイライトで絵文字寄りの形に変更。
export function HairRibbon() {
  return (
    <g transform="translate(120 60)">
      <path
        d="M-5,-7 C-5,-30 -34,-42 -48,-23 C-60,-7 -53,21 -30,26 C-14,29 -5,16 -5,7 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M5,-7 C5,-30 34,-42 48,-23 C60,-7 53,21 30,26 C14,29 5,16 5,7 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d="M-20,-19 Q-36,-5 -24,17" stroke={PALETTE.pink} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.75} />
      <path d="M20,-19 Q36,-5 24,17" stroke={PALETTE.pink} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.75} />
      <path
        d="M-4,10 C-9,19 -11,30 -6,41 L0,31 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path
        d="M4,10 C9,19 11,30 6,41 L0,31 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <ellipse cx={0} cy={0} rx={10} ry={15} fill={PALETTE.pink} stroke={PALETTE.charcoal} strokeWidth={4} />
    </g>
  );
}

export function StarClip() {
  return (
    <path
      d={starPath(92, 60, 3.4)}
      fill={PALETTE.apricot}
      stroke={PALETTE.charcoal}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  );
}

// アクセサリー第3弾(2026-07-23追加)。

function SunflowerPetals({ cx, cy }: { cx: number; cy: number }) {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const ang = (i / 8) * Math.PI * 2;
    const px = cx + Math.cos(ang) * 6;
    const py = cy + Math.sin(ang) * 6;
    return <ellipse key={i} cx={px} cy={py} rx={4.4} ry={3} fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={1.2} transform={`rotate(${(ang * 180) / Math.PI} ${px} ${py})`} />;
  });
  return (
    <g>
      {petals}
      <circle cx={cx} cy={cy} r={4.5} fill={PALETTE.pinkDeep} stroke={PALETTE.charcoal} strokeWidth={1.2} />
    </g>
  );
}

export function SunflowerPin() {
  return <SunflowerPetals cx={152} cy={96} />;
}

export function Headphones() {
  return (
    <g>
      <path
        d="M85,92 C85,58 100,42 120,42 C140,42 155,58 155,92"
        fill="none"
        stroke={PALETTE.charcoal}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <ellipse cx={83} cy={116} rx={11} ry={17} fill={PALETTE.lavender} stroke={PALETTE.charcoal} strokeWidth={3.5} />
      <ellipse cx={157} cy={116} rx={11} ry={17} fill={PALETTE.lavender} stroke={PALETTE.charcoal} strokeWidth={3.5} />
    </g>
  );
}

export function StrawberryCap() {
  return (
    <g>
      <path
        d="M88,88 C84,58 98,40 120,40 C142,40 156,58 152,88 C128,76 108,76 88,88 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={104} cy={62} r={2.2} fill={PALETTE.milk} />
      <circle cx={120} cy={54} r={2.2} fill={PALETTE.milk} />
      <circle cx={136} cy={62} r={2.2} fill={PALETTE.milk} />
      <circle cx={112} cy={74} r={2.2} fill={PALETTE.milk} />
      <circle cx={128} cy={74} r={2.2} fill={PALETTE.milk} />
      <path
        d="M120,40 C114,32 118,24 120,20 C122,24 126,32 120,40 Z"
        fill={PALETTE.mint}
        stroke={PALETTE.charcoal}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function StrawHat() {
  return (
    <g>
      <ellipse cx={120} cy={78} rx={54} ry={13} fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={4} />
      <path
        d="M96,78 C96,52 106,38 120,38 C134,38 144,52 144,78 Z"
        fill={PALETTE.apricot}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d="M97,68 L143,68" stroke={PALETTE.pinkDeep} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

export function WizardHat() {
  return (
    <g>
      <path
        d="M90,86 C90,86 108,32 118,18 C122,12 128,14 130,20 C136,38 148,80 148,80 C124,68 108,72 90,86 Z"
        fill={PALETTE.lavender}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <ellipse cx={119} cy={86} rx={31} ry={9} fill={PALETTE.lavender} stroke={PALETTE.charcoal} strokeWidth={3.5} />
      <path d={starPath(133, 34, 2.6)} fill={PALETTE.milk} />
      <path d={starPath(120, 52, 1.8)} fill={PALETTE.milk} />
    </g>
  );
}

function CrownGem({ cx, cy, fill }: { cx: number; cy: number; fill: string }) {
  return <circle cx={cx} cy={cy} r={3.4} fill={fill} stroke={PALETTE.charcoal} strokeWidth={1.4} />;
}

export function TinyCrown() {
  return (
    <g transform="translate(120 68)">
      <path
        d="M-26,10 L-26,-6 L-13,4 L0,-16 L13,4 L26,-6 L26,10 Z"
        fill={PALETTE.apricot}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <CrownGem cx={-13} cy={0} fill={PALETTE.pinkDeep} />
      <CrownGem cx={0} cy={-8} fill={PALETTE.mint} />
      <CrownGem cx={13} cy={0} fill={PALETTE.lavender} />
    </g>
  );
}

// おようふく「からだ」スロット(2026-07-23追加)。装備スロットはequippedOutfitIdの1枠のみ。
// 体パス(BODY_PATH, y:76-212)の上に描画し、あたま・かおアクセサリーとは独立して同時装備できる。
// Rabbit.tsx側で「体→おようふく→リボン→ほっぺ/はな/め/くち→あたまアクセサリー」の順に描画する。

export function RedScarf() {
  return (
    <g>
      <path
        d="M78,148 C78,138 162,138 162,148 C162,158 78,158 78,148 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path
        d="M92,154 C88,168 84,182 90,194 L102,188 C98,176 98,164 100,154 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function TinyApron() {
  return (
    <g>
      <path
        d="M92,158 C92,150 148,150 148,158 L142,206 C128,212 112,212 98,206 Z"
        fill={PALETTE.milk}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <rect x={109} y={172} width={22} height={16} rx={3} fill={PALETTE.pink} stroke={PALETTE.charcoal} strokeWidth={2} />
      <path
        d="M112,150 C112,144 128,144 128,150"
        fill="none"
        stroke={PALETTE.pinkDeep}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

export function SailorCollar() {
  return (
    <g>
      <path
        d="M84,150 C100,164 108,168 120,158 C132,168 140,164 156,150 L148,168 C132,180 108,180 92,168 Z"
        fill={PALETTE.milk}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path d="M92,156 L104,163" stroke={PALETTE.lavender} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M148,156 L136,163" stroke={PALETTE.lavender} strokeWidth={2.5} strokeLinecap="round" />
      <path
        d="M120,158 L112,176 L120,186 L128,176 Z"
        fill={PALETTE.pinkDeep}
        stroke={PALETTE.charcoal}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function FluffyCape() {
  const bumps = Array.from({ length: 7 }, (_, i) => 66 + i * 15);
  return (
    <g>
      <path
        d="M70,150 C70,140 170,140 170,150 L166,206 L74,206 Z"
        fill={PALETTE.pink}
        opacity={0.92}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {bumps.map((cx, i) => (
        <circle key={i} cx={cx} cy={206} r={7} fill={PALETTE.pink} opacity={0.92} stroke={PALETTE.charcoal} strokeWidth={2.5} />
      ))}
      <path
        d="M100,148 C108,142 132,142 140,148"
        fill="none"
        stroke={PALETTE.pinkDeep}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </g>
  );
}

export function DotPajama() {
  const dots = [
    { cx: 92, cy: 172 },
    { cx: 116, cy: 182 },
    { cx: 140, cy: 172 },
    { cx: 104, cy: 198 },
    { cx: 130, cy: 198 },
    { cx: 118, cy: 158 },
  ];
  return (
    <g>
      <path
        d="M90,156 C90,150 150,150 150,156 L146,208 C128,214 112,214 94,208 Z"
        fill={PALETTE.mint}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={3.2} fill={PALETTE.milk} opacity={0.85} />
      ))}
      <circle cx={120} cy={162} r={2.4} fill={PALETTE.charcoalSoft} />
      <circle cx={120} cy={176} r={2.4} fill={PALETTE.charcoalSoft} />
    </g>
  );
}
