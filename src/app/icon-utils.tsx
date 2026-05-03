import { ImageResponse } from "next/og";

export function generateStyleHubIcon(size: number) {
  const fontSize = Math.round(size * 0.58);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#7F77DD",
            color: "#FFFFFF",
            fontSize,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          }}
        >
          S
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}
