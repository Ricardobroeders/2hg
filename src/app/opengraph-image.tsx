import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The card that shows when the site is linked in Discord, Slack or a tweet —
 * which, for a tool whose distribution channel is a share link, is the first
 * impression more often than the home page is.
 *
 * Rasterised from the same `icon.svg` as the other marks, so there's still one
 * source of truth for the artwork.
 */
export const alt = "Two-Headed Giant — the 2HG card database";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const svg = readFileSync(join(process.cwd(), "src/app/icon.svg"), "utf8");
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 80,
          // zinc-950, the site's ground colour.
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, rgba(16,185,129,0.18), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Satori's <img>, not the DOM's — the Next lint rule doesn't apply. */}
          <img src={src} width={72} height={72} alt="" />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#34d399",
            }}
          >
            Two-Headed Giant
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#ffffff",
            }}
          >
            The card database built for 2HG
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.4, color: "#a1a1aa" }}>
            Shared life. Shared turns. Two opponents. Every card rated for the
            format that changes what it&rsquo;s worth.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
