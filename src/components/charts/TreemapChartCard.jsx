import { useEffect, useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { C } from "../../theme/tokens";
import ChartCardFrame from "../cards/ChartCardFrame";
import EmptyState from "../common/EmptyState";
import { DepartmentTreemapNode, MoneyTooltip } from "./ChartBits";

export default function TreemapChartCard({ title, data, style }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerHeight = style?.height ?? 360;

  useEffect(() => {
    if (!isExpanded) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isExpanded]);

  const expandButton = (
    <button
      type="button"
      onClick={() => setIsExpanded(true)}
      aria-label="Expand treemap"
      title="Expand"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: "rgba(255,255,255,.92)",
        color: C.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 8px 16px rgba(0,22,58,.08)",
        flexShrink: 0,
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1={21} y1={3} x2={14} y2={10} />
        <line x1={3} y1={21} x2={10} y2={14} />
        <polyline points="21 15 21 21 15 21" />
        <polyline points="3 9 3 3 9 3" />
        <line x1={21} y1={21} x2={14} y2={14} />
        <line x1={3} y1={3} x2={10} y2={10} />
      </svg>
    </button>
  );

  const renderTreemap = () => (
    data.length ? (
      <ResponsiveContainer width="100%" height="100%" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
        <Treemap
          accessibilityLayer={false}
          data={data}
          dataKey="value"
          stroke="rgba(255,255,255,.92)"
          content={<DepartmentTreemapNode />}
          aspectRatio={1.55}
          isAnimationActive={false}
        >
          <Tooltip content={<MoneyTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    ) : (
      <EmptyState label="No summary data is available for the current filters." />
    )
  );

  return (
    <>
      <div style={{ minHeight: 0, height: containerHeight }}>
        <ChartCardFrame title={title} action={expandButton} style={{ ...style, height: "100%" }}>
          {renderTreemap()}
        </ChartCardFrame>
      </div>
      {isExpanded ? (
        <div
          onClick={() => setIsExpanded(false)}
          onWheel={(event) => event.preventDefault()}
          onTouchMove={(event) => event.preventDefault()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(8,33,73,.24)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "22px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1120px, 100%)",
              height: "min(100%, 760px)",
              boxShadow: "0 28px 80px rgba(0,22,58,.22)",
            }}
          >
            <ChartCardFrame
              title={title}
              action={(
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close expanded treemap"
                  title="Close"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "rgba(255,255,255,.94)",
                    color: C.navy,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(0,22,58,.08)",
                    flexShrink: 0,
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <line x1={18} y1={6} x2={6} y2={18} />
                    <line x1={6} y1={6} x2={18} y2={18} />
                  </svg>
                </button>
              )}
              style={{
                height: "100%",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {renderTreemap()}
            </ChartCardFrame>
          </div>
        </div>
      ) : null}
    </>
  );
}
