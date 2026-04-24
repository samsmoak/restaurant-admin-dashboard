"use client";

export default function FullScreenLoader() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div
        className="animate-spin"
        style={{
          width: 24,
          height: 24,
          border: "2px solid #E5E7EB",
          borderTopColor: "#0F2B4D",
        }}
      />
    </div>
  );
}
