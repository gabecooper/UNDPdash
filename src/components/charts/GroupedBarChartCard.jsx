import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { C, YEAR_PALETTE } from "../../theme/tokens";
import { chartAxisTick } from "../../theme/styles";
import { formatAxisPesoTick, formatPesoCompact } from "../../data/formatters";
import ChartCardFrame from "../cards/ChartCardFrame";
import EmptyState from "../common/EmptyState";
import { ChartLegend, DonutTooltip, MoneyTooltip, WrappedCategoryTick } from "./ChartBits";

function buildLogTicks(minValue, maxValue) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue <= 0 || maxValue <= 0) {
    return [1, 10];
  }

  const ticks = [];
  const startPower = Math.floor(Math.log10(minValue));
  const endPower = Math.ceil(Math.log10(maxValue));

  for (let power = startPower; power <= endPower; power += 1) {
    if (Math.abs(power % 2) === 1) {
      ticks.push(10 ** power);
    }
  }

  return ticks.length ? ticks : [10 ** startPower, 10 ** endPower];
}

export default function GroupedBarChartCard({ title, data, selectedYears, height, emptyLabel, xScale = "linear" }) {
  const cardMinHeight = height + 84;
  const donutPalette = [C.navy, C.teal2];
  const chartData = xScale === "log"
    ? data.map((row) => {
      const nextRow = { ...row };
      selectedYears.forEach((year) => {
        const value = row[year] || 0;
        nextRow[`${year}Display`] = value > 0 ? value : null;
      });
      return nextRow;
    })
    : data;
  const positiveValues = xScale === "log"
    ? chartData.flatMap((row) =>
      selectedYears
        .map((year) => row[`${year}Display`])
        .filter((value) => typeof value === "number" && value > 0)
    )
    : [];
  const domainMin = xScale === "log"
    ? (() => {
      if (!positiveValues.length) return 1;
      const minPositive = Math.min(...positiveValues);
      return Math.max(1, 10 ** Math.floor(Math.log10(minPositive)));
    })()
    : null;
  const domainMax = xScale === "log"
    ? (() => {
      if (!positiveValues.length) return 10;
      const maxPositive = Math.max(...positiveValues);
      return Math.max(domainMin * 10, 10 ** Math.ceil(Math.log10(maxPositive)));
    })()
    : null;
  const logTicks = xScale === "log" ? buildLogTicks(domainMin, domainMax) : null;
  const shouldRenderDonut = xScale !== "log" && data.length === 2;
  const donutData = shouldRenderDonut
    ? data.map((row, index) => ({
      name: row.name,
      value: row.selectedAverage ?? selectedYears.reduce((sum, year) => sum + (row[year] || 0), 0),
      fill: donutPalette[index % donutPalette.length],
    }))
    : [];
  const donutTotal = donutData.reduce((sum, item) => sum + item.value, 0);
  const donutActionLabel = selectedYears.length > 1
    ? `${selectedYears[0]}-${selectedYears[selectedYears.length - 1]} avg`
    : selectedYears[0];

  return (
    <ChartCardFrame
      title={title}
      action={shouldRenderDonut ? (
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,.72)",
            fontSize: 10,
            color: C.muted,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {donutActionLabel}
        </div>
      ) : (
        <ChartLegend years={selectedYears} />
      )}
      style={{ overflow: "hidden", minHeight: cardMinHeight }}
      bodyStyle={{ overflow: "hidden", minHeight: height, paddingBottom: 8 }}
    >
      {chartData.length ? (
        shouldRenderDonut ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(220px, 0.85fr)",
              gap: 18,
              alignItems: "center",
              height,
            }}
          >
            <ResponsiveContainer width="100%" height="100%" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
              <PieChart accessibilityLayer={false} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={3}
                  stroke="#fff"
                  strokeWidth={3}
                  isAnimationActive={false}
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <text x="50%" y="52%" textAnchor="middle" fill={C.navy} fontSize={24} fontWeight={700}>
                  {formatPesoCompact(donutTotal)}
                </text>
              </PieChart>
            </ResponsiveContainer>

            <div style={{ display: "grid", gap: 12, alignContent: "center" }}>
              {donutData.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "10px minmax(0, 1fr) auto",
                    gap: 10,
                    alignItems: "center",
                    fontSize: 11,
                    color: C.navy,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: item.fill,
                      boxShadow: "0 0 0 2px rgba(255,255,255,.85)",
                    }}
                  />
                  <span style={{ minWidth: 0, fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: C.navy, fontFamily: '"SF Mono", "Menlo", "Consolas", monospace', fontWeight: 700 }}>
                    {formatPesoCompact(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height} style={{ userSelect: "none", WebkitUserSelect: "none" }}>
            <BarChart
              accessibilityLayer={false}
              data={chartData}
              layout="vertical"
              margin={{ top: 6, right: 18, left: 18, bottom: 8 }}
              barCategoryGap="22%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
              <XAxis
                type="number"
                scale={xScale}
                domain={xScale === "log" ? [domainMin, domainMax] : undefined}
                ticks={xScale === "log" ? logTicks : undefined}
                tick={chartAxisTick}
                axisLine={false}
                tickLine={false}
                tickFormatter={xScale === "log" ? formatAxisPesoTick : formatPesoCompact}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={<WrappedCategoryTick maxCharsPerLine={24} maxLines={3} />}
                axisLine={false}
                tickLine={false}
                width={210}
                interval={0}
              />
              <Tooltip content={<MoneyTooltip />} />
              {selectedYears.map((year) => (
                <Bar
                  key={year}
                  dataKey={xScale === "log" ? `${year}Display` : year}
                  name={year}
                  fill={YEAR_PALETTE[year]}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
      ) : (
        <EmptyState label={emptyLabel} />
      )}
    </ChartCardFrame>
  );
}
