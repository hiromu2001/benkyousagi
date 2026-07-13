import { useId } from "react";
import { PALETTE } from "@/lib/theme";

type RabbitAvatarProps = {
  ribbonColorHex: string;
  size?: number;
  className?: string;
};

// ログイン画面専用の簡易アイコン(凝ったうさぎ本体の描画は src/components/rabbit 側の担当)。
export function RabbitAvatar({ ribbonColorHex, size = 96, className }: RabbitAvatarProps) {
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="60" cy="66" r="42" />
        </clipPath>
      </defs>

      <ellipse cx="44" cy="30" rx="11" ry="23" fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth="5" transform="rotate(-16 44 30)" />
      <ellipse cx="76" cy="30" rx="11" ry="23" fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth="5" transform="rotate(16 76 30)" />
      <ellipse cx="44" cy="33" rx="5" ry="14" fill={PALETTE.pink} transform="rotate(-16 44 33)" />
      <ellipse cx="76" cy="33" rx="5" ry="14" fill={PALETTE.pink} transform="rotate(16 76 33)" />

      <circle cx="60" cy="66" r="42" fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth="5" />

      <rect x="14" y="88" width="92" height="24" rx="12" fill={ribbonColorHex} clipPath={`url(#${clipId})`} />
      <circle cx="60" cy="98" r="6" fill={ribbonColorHex} stroke={PALETTE.charcoal} strokeOpacity="0.15" strokeWidth="1.5" />

      <circle cx="48" cy="64" r="3.2" fill={PALETTE.charcoal} />
      <circle cx="72" cy="64" r="3.2" fill={PALETTE.charcoal} />
      <circle cx="37" cy="76" r="6" fill={PALETTE.pinkDeep} opacity="0.55" />
      <circle cx="83" cy="76" r="6" fill={PALETTE.pinkDeep} opacity="0.55" />
      <path d="M54 75 Q60 80 66 75" stroke={PALETTE.charcoal} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
