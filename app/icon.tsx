import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #070b1a 0%, #123a9d 100%)",
          borderRadius: 112
        }}
      >
        <div
          style={{
            width: "72%",
            height: "72%",
            borderRadius: 80,
            border: "20px solid rgba(255,255,255,0.24)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f8fafc",
            fontFamily: "Arial, sans-serif",
            fontSize: 188,
            fontWeight: 800,
            letterSpacing: "-0.08em"
          }}
        >
          MX
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height
    }
  );
}
