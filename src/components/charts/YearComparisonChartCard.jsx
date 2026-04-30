import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatAxisMoneyTick, formatMoney, formatSignedMoney } from "../../data/formatters";
import { C, F, YEAR_PALETTE } from "../../theme/tokens";
import { chartAxisTick } from "../../theme/styles";
import ChartCardFrame from "../cards/ChartCardFrame";
import AuditTooltipContent from "../common/AuditTooltipContent";
import EmptyState from "../common/EmptyState";

function YearComparisonTooltip({ active, payload, label, currencyDisplay = "php" }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          background: C.navy,
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 11,
          color: "#fff",
          fontFamily: F.mono,
          boxShadow: "0 8px 20px rgba(0,22,58,.25)",
        }}
      >
        <div style={{ color: C.teal, marginBottom: 6 }}>{label}</div>
        <div>Total: {formatMoney(point.total, { currencyDisplay })}</div>
        {point.previousYear ? (
          <div>
            vs {point.previousYear}: {formatSignedMoney(point.delta || 0, { currencyDisplay })}
          </div>
        ) : (
          <div>Baseline year</div>
        )}
        {point.previousYear ? <div>{point.changeLabel}</div> : null}
      </div>
      {point.audit ? <AuditTooltipContent audit={point.audit} /> : null}
    </div>
  );
}

export default function YearComparisonChartCard({
  title,
  data,
  height = 280,
  emptyLabel,
  currencyDisplay = "php",
}) {
  const cardMinHeight = height + 84;
  const latestPair = data.length > 1 ? `${data[data.length - 1].year} vs ${data[data.length - 2].year}` : data[0]?.year || "";

  return (
    <ChartCardFrame
      title={title}
      action={latestPair ? (
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
          }}
        >
          {latestPair}
        </div>
      ) : null}
      style={{ overflow: "visible", minHeight: cardMinHeight }}
      bodyStyle={{ overflow: "visible", minHeight: height, paddingBottom: 8 }}
    >
      {data.length ? (
        <ResponsiveContainer width="100%" height={height} style={{ userSelect: "none", WebkitUserSelect: "none" }}>
          <BarChart accessibilityLayer={false} data={data} margin={{ top: 6, right: 16, left: 4, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={chartAxisTick} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={chartAxisTick}
              tickFormatter={(value) => formatAxisMoneyTick(value, { currencyDisplay })}
            />
            <Tooltip
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
              content={<YearComparisonTooltip currencyDisplay={currencyDisplay} />}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((entry) => (
                <Cell key={entry.year} fill={YEAR_PALETTE[entry.year] || C.teal} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState label={emptyLabel} />
      )}
    </ChartCardFrame>
  );
}
