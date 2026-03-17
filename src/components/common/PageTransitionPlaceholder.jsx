import { BlurFade } from "../ui/blur-fade";

function PlaceholderBlock({ height, width = "100%", radius = 18, opacity = 1 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(180deg, rgba(255,255,255,.84), rgba(236,242,246,.88))",
        border: "1px solid rgba(228,232,238,.92)",
        boxShadow: "0 18px 42px rgba(0,22,58,.06)",
        opacity,
      }}
    />
  );
}

export default function PageTransitionPlaceholder() {
  return (
    <BlurFade
      duration={0.22}
      offset={12}
      blur="10px"
      direction="up"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minHeight: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <PlaceholderBlock height={14} width={140} radius={999} opacity={0.72} />
          <PlaceholderBlock height={36} width={520} radius={14} />
        </div>
        <PlaceholderBlock height={36} width={132} radius={999} opacity={0.7} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 20 }}>
        <PlaceholderBlock height={360} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          <PlaceholderBlock height={108} />
          <PlaceholderBlock height={108} />
          <PlaceholderBlock height={108} />
          <PlaceholderBlock height={108} />
          <PlaceholderBlock height={108} />
          <PlaceholderBlock height={108} />
        </div>
      </div>

      <PlaceholderBlock height={430} />
      <PlaceholderBlock height={390} />
    </BlurFade>
  );
}
