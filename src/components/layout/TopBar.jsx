import { createPortal } from "react-dom";
import { C, F } from "../../theme/tokens";
import { useTopBarOutlet } from "./TopBarOutletContext";

function IconButton({ children, title, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: `1.5px solid ${disabled ? "rgba(0,22,58,.08)" : "rgba(0,22,58,.12)"}`,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "rgba(0,22,58,.28)" : C.navy,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function TopBar({ title, meta, onDownload, downloadDisabled }) {
  const outlet = useTopBarOutlet();

  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 18,
        padding: "14px 14px 18px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontFamily: F.serif,
            fontSize: 34,
            fontWeight: 400,
            color: C.navy,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        {meta ? (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,.72)",
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: "0.05em",
              color: C.muted,
            }}
          >
            {meta}
          </div>
        ) : null}
        <IconButton
          title={downloadDisabled ? "CSV unavailable for this page" : "Download CSV"}
          onClick={onDownload}
          disabled={downloadDisabled}
        >
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1={12} y1={15} x2={12} y2={3} />
          </svg>
        </IconButton>
      </div>
    </div>
  );

  return outlet ? createPortal(content, outlet) : content;
}
