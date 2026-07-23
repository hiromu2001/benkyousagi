import { ImageResponse } from "next/og";
import { PALETTE } from "@/lib/theme";
import { buildRabbitIconSvg } from "@/lib/rabbit-icon";

// iPhoneの「ホーム画面に追加」で使われるアイコン(REQUIREMENTS.md参照)。
// 未設定だとNext.jsのデフォルトアイコンになりうさぎだとわからないため用意する。
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const dataUri = `data:image/svg+xml,${encodeURIComponent(buildRabbitIconSvg())}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PALETTE.milk,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={148} height={160} alt="" />
      </div>
    ),
    { ...size },
  );
}
