import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * iOS home-screen icon.
 *
 * Apple doesn't accept SVG for touch icons, so this rasterises the same
 * `icon.svg` at build time rather than keeping a second, drift-prone artwork
 * file. One source of truth for the mark.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const svg = readFileSync(join(process.cwd(), "src/app/icon.svg"), "utf8");
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* Satori's <img>, not the DOM's — the Next lint rule doesn't apply. */}
        <img src={src} width={180} height={180} alt="" />
      </div>
    ),
    size,
  );
}
