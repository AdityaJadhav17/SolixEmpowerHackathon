import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const alt = "Coverage Keeper: understand your OHP letter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#ffffff",
        borderTop: "24px solid #14325c",
        color: "#14325c",
      }}
    >
      <div style={{ fontSize: 76, fontWeight: 700 }}>Coverage Keeper</div>
      <div
        style={{
          marginTop: 28,
          fontSize: 38,
          lineHeight: 1.35,
          color: "#1a1f29",
          maxWidth: 980,
        }}
      >
        {SITE_DESCRIPTION}
      </div>
      <div
        style={{
          marginTop: 40,
          fontSize: 30,
          background: "#ffe066",
          color: "#1a1f29",
          padding: "8px 16px",
          alignSelf: "flex-start",
        }}
      >
        Questions? OHP Customer Service: 800-699-9075
      </div>
    </div>,
    size,
  );
}
