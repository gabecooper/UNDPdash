import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { C } from "../../theme/tokens";
import ChartCardFrame from "../cards/ChartCardFrame";
import EmptyState from "../common/EmptyState";
import { buildSignedLogTicks, DeltaTooltip, ScientificExponentTick, toSignedLog, WrappedCategoryTick } from "./ChartBits";

export default function DeltaBarChartCard({ title, data, height, comparisonLabel, emptyLabel, currencyDisplay = "php" }) {
  const cardMinHeight = height + 84;
  const chartData = useMemo(
    () => data.map((item) => ({ ...item, scaledDelta: toSignedLog(item.delta) })),
    [data]
  );
  const maxAbsLog = useMemo(
    () => chartData.reduce((max, item) => Math.max(max, Math.abs(item.scaledDelta)), 0),
    [chartData]
  );
  const tickValues = useMemo(
    () => buildSignedLogTicks(maxAbsLog),
    [maxAbsLog]
  );
  const xDomain = useMemo(() => {
    const paddedMax = Math.max(1, Math.ceil(maxAbsLog + 0.15));
    return [-paddedMax, paddedMax];
  }, [maxAbsLog]);

  return (
    <ChartCardFrame
      title={title}
      action={(
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,.72)",
            fontFamily: '"SF Mono", "Menlo", "Consolas", monospace',
            fontSize: 10,
            color: C.muted,
            letterSpacing: "0.05em",
          }}
        >
          {comparisonLabel}
        </div>
      )}
      style={{ overflow: "visible", minHeight: cardMinHeight }}
      bodyStyle={{ overflow: "visible", minHeight: height, paddingBottom: 8 }}
    >
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={height} style={{ userSelect: "none", WebkitUserSelect: "none" }}>
          <BarChart accessibilityLayer={false} data={chartData} layout="vertical" margin={{ top: 6, right: 18, left: 12, bottom: 8 }} barCategoryGap="24%">
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
            <XAxis type="number" tick={<ScientificExponentTick />} axisLine={false} tickLine={false} domain={xDomain} ticks={tickValues} height={32} />
            <YAxis
              type="category"
              dataKey="name"
              tick={<WrappedCategoryTick maxCharsPerLine={20} maxLines={3} />}
              axisLine={false}
              tickLine={false}
              width={170}
              interval={0}
            />
            <Tooltip
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
              content={<DeltaTooltip currencyDisplay={currencyDisplay} />}
            />
            <ReferenceLine x={0} stroke="#C9D4E3" />
            <Bar dataKey="scaledDelta" name="Change" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.delta >= 0 ? C.teal : C.negativeBar} />
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
