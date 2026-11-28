import { ImageResponse } from "next/og";

export const alt = "MyPrivate-Jet · One recommendation. One final price.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share preview for links on WhatsApp, LinkedIn, iMessage and social networks. */
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#f6f2e9", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", fontSize: 40, color: "#13213b" }}>MyPrivate<span style={{ color: "#9c7a35" }}>·</span>Jet</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 78, color: "#13213b", lineHeight: 1.1 }}>One recommendation.</div>
          <div style={{ fontSize: 78, color: "#13213b", lineHeight: 1.1 }}>One final price.</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: "#9c7a35", textTransform: "uppercase" }}>Private Aviation Office</div>
      </div>
    ),
    size,
  );
}
