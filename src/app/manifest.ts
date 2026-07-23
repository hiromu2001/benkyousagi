import type { MetadataRoute } from "next";
import { PALETTE } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "べんきょうさぎ",
    short_name: "べんきょうさぎ",
    description: "勉強するとうさぎがしあわせになる、ふたりの勉強継続アプリ",
    start_url: "/",
    display: "standalone",
    background_color: PALETTE.milk,
    theme_color: PALETTE.milk,
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
