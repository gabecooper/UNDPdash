import { useState } from "react";
import { numberFormatter } from "../../data/formatters";
import { C, F } from "../../theme/tokens";
import ChartCardFrame from "../cards/ChartCardFrame";

export default function SearchableDataTable({
  title,
  rows,
  columns,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  emptyLabel,
  totalRowCount,
  getRowKey,
  getHoverLabel,
  resultsLabel = "Table Results",
}) {
  const [tooltip, setTooltip] = useState(null);
  const inputPlaceholder = searchPlaceholder || "Search";

  return (
    <ChartCardFrame
      title={title}
      titleStyle={{ letterSpacing: "0.12em" }}
      style={{ overflow: "hidden" }}
      bodyStyle={{ overflow: "hidden" }}
    >
      {tooltip ? (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            padding: "6px 10px",
            borderRadius: 8,
            background: "rgba(8,33,73,.94)",
            color: "#F4FCFD",
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 18px rgba(0,22,58,.18)",
            pointerEvents: "none",
            zIndex: 90,
          }}
        >
          {tooltip.label}
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ position: "relative", width: "min(360px, 100%)" }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              width: 15,
              height: 15,
              transform: "translateY(-50%)",
              color: C.muted,
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={inputPlaceholder}
            aria-label={inputPlaceholder}
            style={{
              width: "100%",
              padding: "11px 14px 11px 36px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,.88)",
              color: C.navy,
              fontFamily: F.sans,
              fontSize: 13,
              outline: "none",
              boxShadow: "0 8px 18px rgba(0,22,58,.05)",
            }}
          />
        </div>
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,.72)",
            fontFamily: F.mono,
            fontSize: 10,
            color: C.muted,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {numberFormatter.format(rows.length)} of {numberFormatter.format(totalRowCount)} rows
        </div>
      </div>

      <div
        aria-label={resultsLabel}
        role="region"
        style={{
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: "auto",
          maxHeight: 420,
          background: "rgba(255,255,255,.72)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 940 }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    padding: "12px 14px",
                    textAlign: column.align || "left",
                    fontFamily: F.mono,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: C.muted,
                    background: "#F8FBFD",
                    borderBottom: `1px solid ${C.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  onMouseMove={(event) => {
                    const label = getHoverLabel?.(row);
                    if (!label) return;
                    setTooltip({
                      label,
                      x: event.clientX + 14,
                      y: event.clientY + 14,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    background: index % 2 === 0 ? "rgba(255,255,255,.92)" : "rgba(241,245,248,.72)",
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={`${getRowKey(row, index)}-${column.key}`}
                      style={{
                        padding: "12px 14px",
                        borderBottom: `1px solid ${C.border}`,
                        fontSize: 12,
                        color: column.align === "right" ? C.navy : C.dark,
                        textAlign: column.align || "left",
                        fontFamily: column.align === "right" ? F.mono : F.sans,
                        whiteSpace: column.align === "right" ? "nowrap" : "normal",
                        verticalAlign: "top",
                        minWidth: column.minWidth,
                        fontWeight: column.emphasis ? 600 : 400,
                      }}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: "22px 24px", textAlign: "center", color: C.muted, fontSize: 12 }}>
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ChartCardFrame>
  );
}
