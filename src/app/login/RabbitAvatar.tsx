import { useId } from "react";
import { PALETTE } from "@/lib/theme";

type RabbitAvatarProps = {
  ribbonColorHex: string;
  size?: number;
  className?: string;
};

// ログイン画面専用の簡易アイコン(凝ったうさぎ本体の描画は src/components/rabbit 側の担当)。
// 2026-07-15: たれ耳ロップイヤーへのリニューアル(src/components/rabbit/RabbitParts.tsx)に合わせて
// 耳・目まわりを更新(体は丸のまま、簡易アイコンとしての軽さは維持)。
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

      <circle cx="60" cy="66" r="42" fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth="5" />

      {/* たれ耳は頭のシルエットに大きく重なる形状のため、頭の円より後(手前)に描かないと
          不透明な頭の塗りに隠れて見えなくなる(2026-07-15: 隠れて見えない不具合を修正)。 */}
      <g transform="translate(46 32) rotate(24)">
        <ellipse cx="0" cy="21" rx="9" ry="21" fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth="4.5" />
        <ellipse cx="0" cy="25" rx="4.5" ry="15" fill={PALETTE.pink} />
      </g>
      <g transform="translate(74 32) rotate(-24)">
        <ellipse cx="0" cy="21" rx="9" ry="21" fill={PALETTE.milk} stroke={PALETTE.charcoal} strokeWidth="4.5" />
        <ellipse cx="0" cy="25" rx="4.5" ry="15" fill={PALETTE.pink} />
      </g>

      <rect x="14" y="88" width="92" height="24" rx="12" fill={ribbonColorHex} clipPath={`url(#${clipId})`} />
      <circle cx="60" cy="98" r="6" fill={ribbonColorHex} stroke={PALETTE.charcoal} strokeOpacity="0.15" strokeWidth="1.5" />

      <circle cx="39" cy="77" r="6" fill={PALETTE.pink} opacity="0.7" />
      <circle cx="81" cy="77" r="6" fill={PALETTE.pink} opacity="0.7" />

      <circle cx="51" cy="64" r="3.8" fill={PALETTE.charcoal} />
      <circle cx="69" cy="64" r="3.8" fill={PALETTE.charcoal} />
      <path
        d="M57.5,69 C58.5,68.3 61.5,68.3 62.5,69 C62,70.8 61,71.8 60,71.8 C59,71.8 58,70.8 57.5,69 Z"
        fill={PALETTE.pinkDeep}
      />
      <path d="M55,75 Q60,79 65,75" stroke={PALETTE.charcoal} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
