import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoneyCompact, formatAxisMoneyTick } from "../../data/formatters";
import { C, YEAR_PALETTE } from "../../theme/tokens";
import { chartAxisTick } from "../../theme/styles";
import ChartCardFrame from "../cards/ChartCardFrame";
import EmptyState from "../common/EmptyState";
import { ChartLegend, MoneyTooltip, WrappedCategoryTick } from "../charts/ChartBits";

export default function A4DepartmentChartCard({
  data,
  selectedYears,
  currencyDisplay,
  title = "Expenditure by Department",
}) {
  const chartHeight = Math.max(420, data.length * 42);

  return (
    <ChartCardFrame
      title={title}
      action={<ChartLegend years={selectedYears} />}
      style={{ overflow: "hidden", minHeight: 504 }}
      bodyStyle={{ overflow: "hidden", minHeight: 420 }}
    >
      {data.length ? (
        <div style={{ height: 420, overflowY: "auto", paddingRight: 6 }}>
          <div style={{ height: chartHeight, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
              <BarChart
                accessibilityLayer={false}
                data={data}
                layout="vertical"
                margin={{ top: 6, right: 18, left: 18, bottom: 8 }}
                barCategoryGap="22%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatAxisMoneyTick(value, { currencyDisplay })}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<WrappedCategoryTick maxCharsPerLine={24} maxLines={3} />}
                  axisLine={false}
                  tickLine={false}
                  width={220}
                  interval={0}
                />
                <Tooltip content={<MoneyTooltip currencyDisplay={currencyDisplay} />} />
                {selectedYears.map((year) => (
                  <Bar
                    key={year}
                    dataKey={`totalsByYear.${year}`}
                    name={year}
                    fill={YEAR_PALETTE[year]}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <EmptyState label="No department totals are available for the current filters." />
      )}

      {data.length ? (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 11,
            color: C.muted,
          }}
        >
          <span>Scrolling keeps every department visible in-place.</span>
          <span style={{ whiteSpace: "nowrap" }}>
            Leading department: {data[0].name} ({formatMoneyCompact(data[0].selectedValue, { currencyDisplay })})
          </span>
        </div>
      ) : null}
    </ChartCardFrame>
  );
}
