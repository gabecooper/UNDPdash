import { C } from "../../theme/tokens";

export default function EmptyState({ label }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.muted,
        fontSize: 12,
        textAlign: "center",
        padding: "20px 24px",
        border: `1px dashed ${C.border}`,
        borderRadius: 10,
        background: "rgba(255,255,255,.45)",
      }}
    >
      {label}
    </div>
  );
}
