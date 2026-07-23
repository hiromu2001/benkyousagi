import { PALETTE } from "@/lib/theme";

// はちみつミルク(2026-07-23追加の消耗品)。Carrot.tsxと同じ位置づけの共通アセット。
export function HoneyMilk({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden>
      <path
        d="M14 24 L34 24 L31 58 C31 61 28.5 63 26 63 L22 63 C19.5 63 17 61 17 58 Z"
        fill={PALETTE.milk}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d="M14 24 L34 24 L33 32 L15 32 Z" fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={20} y={8} width={8} height={10} rx={2} fill={PALETTE.apricot} stroke={PALETTE.charcoal} strokeWidth={3} />
      <path d="M17 44 C 21 40 27 40 31 44" fill="none" stroke={PALETTE.apricot} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
    </svg>
  );
}
