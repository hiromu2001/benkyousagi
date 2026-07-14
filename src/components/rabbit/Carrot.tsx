import { PALETTE } from "@/lib/theme";

// にんじん(強調色 apricot はもともと「にんじん等」用のトークン。globals.css 参照)。
// きぶんチェックイン(MoodCheckInClient)とおみせ(ShopClient)の両方で使う共通アセット。
export function Carrot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden>
      <path
        d="M24 60 C 16 48 12 35 13 25 C 14 17 19 13 24 13 C 29 13 34 17 35 25 C 36 35 32 48 24 60 Z"
        fill={PALETTE.apricot}
        stroke={PALETTE.charcoal}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M23 14 C 19 6 13 3 7 5 C 10 11 16 14 23 14 Z"
        fill={PALETTE.mint}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path
        d="M25 14 C 29 6 35 3 41 5 C 38 11 32 14 25 14 Z"
        fill={PALETTE.mint}
        stroke={PALETTE.charcoal}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
