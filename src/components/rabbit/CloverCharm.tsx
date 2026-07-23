import { PALETTE } from "@/lib/theme";

// よつばのクローバー(2026-07-23追加のおまじない消耗品)。たべものではなく「使う」演出用。
export function CloverCharm({ className }: { className?: string }) {
  const leafPositions = [
    { x: -8, y: -8 },
    { x: 8, y: -8 },
    { x: -8, y: 8 },
    { x: 8, y: 8 },
  ];
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <g transform="translate(24 26)">
        {leafPositions.map((p, i) => (
          <path
            key={i}
            d={`M0,0 C${p.x < 0 ? -2 : 2},${p.y < 0 ? -14 : -2} ${p.x},${p.y} C${p.x < 0 ? -14 : -2},${p.y < 0 ? -2 : 2} 0,0 Z`}
            fill={PALETTE.mint}
            stroke={PALETTE.charcoal}
            strokeWidth={2.5}
            strokeLinejoin="round"
            transform={`translate(${p.x * 0.9} ${p.y * 0.9})`}
          />
        ))}
        <circle cx={0} cy={0} r={4} fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={2} />
      </g>
      <path d="M24 34 L24 44" stroke={PALETTE.mint} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}
