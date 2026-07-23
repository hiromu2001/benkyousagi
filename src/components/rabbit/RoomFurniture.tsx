import { PALETTE } from "@/lib/theme";
import type { FurnitureId } from "@/lib/shop";

// ホーム画面の「おへや」に置く家具(2026-07-23追加)。うさぎ本体(Rabbit.tsx)とは
// 別の独立したSVGとして、RabbitRoomScene.tsxがCSSで周囲に配置する
// (Rabbit.tsxの座標系は変更しない=既存の全描画箇所への影響をゼロに保つ)。

export function PottedPlant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 70" className={className} aria-hidden>
      <path d="M14 50 L46 50 L41 66 L19 66 Z" fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={3.5} strokeLinejoin="round" />
      <ellipse cx={30} cy={38} rx={13} ry={16} fill={PALETTE.mint} stroke={PALETTE.charcoal} strokeWidth={3} />
      <ellipse cx={16} cy={44} rx={10} ry={13} fill={PALETTE.mint} stroke={PALETTE.charcoal} strokeWidth={3} />
      <ellipse cx={44} cy={44} rx={10} ry={13} fill={PALETTE.mint} stroke={PALETTE.charcoal} strokeWidth={3} />
    </svg>
  );
}

export function StudyDesk({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 70" className={className} aria-hidden>
      <rect x={10} y={36} width={60} height={8} rx={2} fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={3} />
      <rect x={14} y={44} width={6} height={20} fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={3} />
      <rect x={60} y={44} width={6} height={20} fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={3} />
      <rect x={22} y={20} width={18} height={12} rx={2} fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth={2.5} />
      <path d="M55 36 L55 22 C55 16 63 16 63 22 C63 26 55 26 55 30" fill="none" stroke={PALETTE.charcoal} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={55} cy={16} rx={9} ry={6} fill={PALETTE.pink} stroke={PALETTE.charcoal} strokeWidth={2.5} />
    </svg>
  );
}

export function StarGarland({ className }: { className?: string }) {
  const flags = [
    { x: 10, fill: PALETTE.pink },
    { x: 34, fill: PALETTE.lavender },
    { x: 58, fill: PALETTE.mint },
    { x: 82, fill: PALETTE.pink },
    { x: 106, fill: PALETTE.lavender },
  ];
  return (
    <svg viewBox="0 0 120 40" className={className} aria-hidden>
      <path d="M6 6 Q60 26 114 6" fill="none" stroke={PALETTE.charcoalSoft} strokeWidth={2} />
      {flags.map((f, i) => (
        <path key={i} d={`M${f.x} 10 L${f.x + 10} 10 L${f.x + 5} 22 Z`} fill={f.fill} stroke={PALETTE.charcoal} strokeWidth={1.8} strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function MoonWindow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 90" className={className} aria-hidden>
      <rect x={6} y={6} width={78} height={78} rx={20} fill="#3E3A5E" stroke={PALETTE.charcoal} strokeWidth={4} />
      <circle cx={56} cy={32} r={14} fill={PALETTE.milk} />
      <circle cx={62} cy={27} r={12} fill="#3E3A5E" />
      <circle cx={26} cy={26} r={2.4} fill={PALETTE.milk} />
      <circle cx={34} cy={54} r={1.8} fill={PALETTE.milk} />
      <circle cx={20} cy={58} r={2.2} fill={PALETTE.milk} />
      <rect x={6} y={6} width={78} height={78} rx={20} fill="none" stroke={PALETTE.charcoal} strokeWidth={4} />
    </svg>
  );
}

export const FURNITURE_COMPONENTS: Record<FurnitureId, (props: { className?: string }) => React.JSX.Element> = {
  potted_plant: PottedPlant,
  study_desk: StudyDesk,
  star_garland: StarGarland,
  moon_window: MoonWindow,
};
