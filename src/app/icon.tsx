import { ImageResponse } from "next/og";
import { PALETTE } from "@/lib/theme";
import { buildRabbitIconSvg } from "@/lib/rabbit-icon";

// ブラウザタブ・PWAアイコン用(apple-icon.tsxと同じ絵柄をタブ向けサイズで生成)。
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
        <img src={dataUri} width={54} height={58} alt="" />
      </div>
    ),
    { ...size },
  );
}
