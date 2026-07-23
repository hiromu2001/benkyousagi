// アプリアイコン(favicon/apple-touch-icon)用の静止うさぎSVG。
// src/components/rabbit/RabbitParts.tsx の「きらきら」段階(表情段階6)を
// アニメーション無しで再現したもの。ImageResponse(next/og)からimgのdata URIとして
// 埋め込むため、framer-motionに依存しない素のSVG文字列として持つ。
import { PALETTE, RIBBON_COLOR_HEX } from "@/lib/theme";

const BODY_PATH =
  "M120,76 C158,76 180,116 184,164 C187,194 168,212 120,212 C72,212 53,194 56,164 C60,116 82,76 120,76 Z";

const BODY_FILL = RIBBON_COLOR_HEX.CREAM;
const RIBBON_FILL = PALETTE.pinkDeep;

function ear(side: "left" | "right"): string {
  const sign = side === "left" ? 1 : -1;
  const rootX = side === "left" ? 85 : 155;
  const restDeg = 58; // 表情段階6のearRestDeg(rabbit-config.ts)
  return `
    <g transform="translate(${rootX} 90) rotate(${sign * restDeg})">
      <ellipse cx="0" cy="42" rx="14" ry="42" fill="${BODY_FILL}" stroke="${PALETTE.charcoal}" stroke-width="5" />
      <ellipse cx="0" cy="48" rx="7" ry="31" fill="${PALETTE.pink}" />
    </g>`;
}

function ribbon(): string {
  return `
    <g transform="translate(120 180)">
      <path d="M0,0 C-4,-7 -20,-9 -24,0 C-20,9 -4,7 0,0 Z" fill="${RIBBON_FILL}" stroke="${PALETTE.charcoal}" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M0,0 C4,-7 20,-9 24,0 C20,9 4,7 0,0 Z" fill="${RIBBON_FILL}" stroke="${PALETTE.charcoal}" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M-3,10 C-6,16 -5,22 -2,26 L2,20 Z" fill="${RIBBON_FILL}" stroke="${PALETTE.charcoal}" stroke-width="2" stroke-linejoin="round" />
      <path d="M3,10 C6,16 5,22 2,26 L-2,20 Z" fill="${RIBBON_FILL}" stroke="${PALETTE.charcoal}" stroke-width="2" stroke-linejoin="round" />
      <circle cx="0" cy="0" r="6.5" fill="${RIBBON_FILL}" stroke="${PALETTE.charcoal}" stroke-width="2.5" />
    </g>`;
}

// 表情段階6の目(sparkle): まる目+ハイライト+きらきら
function eyes(): string {
  const leftX = 104;
  const rightX = 136;
  const y = 126;
  return `
    <circle cx="${leftX}" cy="${y}" r="8" fill="${PALETTE.charcoal}" />
    <circle cx="${rightX}" cy="${y}" r="8" fill="${PALETTE.charcoal}" />
    <circle cx="${leftX - 2}" cy="${y - 2}" r="2" fill="${PALETTE.milk}" />
    <circle cx="${rightX - 2}" cy="${y - 2}" r="2" fill="${PALETTE.milk}" />`;
}

// 表情段階6の口(smileBig)
function mouth(): string {
  return `
    <g transform="translate(120 150) scale(1.3)">
      <path d="M-7,0 Q0,9 7,0 Q0,4 -7,0 Z" fill="${PALETTE.charcoal}" />
    </g>`;
}

export function buildRabbitIconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 260">
    ${ear("left")}
    ${ear("right")}
    <circle cx="186" cy="198" r="12" fill="${BODY_FILL}" stroke="${PALETTE.charcoal}" stroke-width="5" />
    <path d="${BODY_PATH}" fill="${BODY_FILL}" stroke="${PALETTE.charcoal}" stroke-width="5.5" stroke-linejoin="round" />
    <ellipse cx="98" cy="210" rx="13" ry="8" fill="${BODY_FILL}" stroke="${PALETTE.charcoal}" stroke-width="4" />
    <ellipse cx="142" cy="210" rx="13" ry="8" fill="${BODY_FILL}" stroke="${PALETTE.charcoal}" stroke-width="4" />
    ${ribbon()}
    <ellipse cx="90" cy="147" rx="10" ry="7" fill="${PALETTE.pink}" opacity="0.8" />
    <ellipse cx="150" cy="147" rx="10" ry="7" fill="${PALETTE.pink}" opacity="0.8" />
    <path d="M115.5,139.5 C117.5,138 122.5,138 124.5,139.5 C123.5,143 121.5,144.8 120,144.8 C118.5,144.8 116.5,143 115.5,139.5 Z" fill="${PALETTE.pinkDeep}" />
    ${eyes()}
    ${mouth()}
  </svg>`;
}
