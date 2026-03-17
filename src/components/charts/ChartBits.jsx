import { C, F, TREEMAP_PALETTE, YEAR_PALETTE } from "../../theme/tokens";
import { formatPeso, formatPesoCompact, formatSignedPeso } from "../../data/formatters";

export function wrapLabel(text, maxCharsPerLine, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      return;
    }

    if (currentLine) lines.push(currentLine);

    if (word.length <= maxCharsPerLine) {
      currentLine = word;
      return;
    }

    let remaining = word;
    while (remaining.length > maxCharsPerLine && lines.length < maxLines - 1) {
      lines.push(`${remaining.slice(0, maxCharsPerLine - 1)}-`);
      remaining = remaining.slice(maxCharsPerLine - 1);
    }
    currentLine = remaining;
  });

  if (currentLine) lines.push(currentLine);
  if (lines.length <= maxLines) return lines;

  const trimmed = lines.slice(0, maxLines);
  const lastLine = trimmed[maxLines - 1];
  trimmed[maxLines - 1] = lastLine.length > 3 ? `${lastLine.slice(0, -3)}...` : lastLine;
  return trimmed;
}

export function WrappedCategoryTick({ x, y, payload, maxCharsPerLine = 22, maxLines = 3 }) {
  const lines = wrapLabel(String(payload?.value || ""), maxCharsPerLine, maxLines);
  const firstLineDy = lines.length > 1 ? -((lines.length - 1) * 5) : 4;

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-8} y={0} textAnchor="end" fill={C.muted} fontSize={10} fontFamily={F.mono}>
        {lines.map((line, index) => (
          <tspan key={`${payload?.value}-${index}`} x={-8} dy={index === 0 ? firstLineDy : 10}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const tooltipLabel = label || payload[0]?.payload?.name || payload[0]?.name || "Value";

  return (
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
      <div style={{ color: C.teal, marginBottom: 6 }}>{tooltipLabel}</div>
      {payload.map((entry, index) => {
        const value =
          (typeof entry.payload?.[entry.name] === "number" ? entry.payload[entry.name] : null)
          ?? entry.value
          ?? entry.payload?.value
          ?? 0;

        return (
          <div key={index}>
            {(entry.name || "Amount")}: {formatPeso(value)}
          </div>
        );
      })}
    </div>
  );
}

export function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
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
      <div style={{ color: C.teal, marginBottom: 6 }}>{point.name}</div>
      <div>Amount: {formatPeso(point.value || 0)}</div>
    </div>
  );
}

export function DeltaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
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
      <div>Change: {formatSignedPeso(point.delta)}</div>
      <div>{point.startYear}: {formatPeso(point.startValue)}</div>
      <div>{point.endYear}: {formatPeso(point.endValue)}</div>
    </div>
  );
}

export function ChartLegend({ years }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {years.map((year) => (
        <div
          key={year}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: F.mono,
            fontSize: 10,
            color: C.muted,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: YEAR_PALETTE[year],
              boxShadow: "0 0 0 3px rgba(139,184,195,.14)",
            }}
          />
          {year}
        </div>
      ))}
    </div>
  );
}

export function ScientificExponentTick({ x, y, payload }) {
  const value = payload?.value ?? 0;

  if (value === 0) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="middle" fill={C.muted} fontSize={10} fontFamily={F.mono}>
          0
        </text>
      </g>
    );
  }

  const exponent = Math.round(Math.abs(value));
  if (Math.abs(exponent % 2) !== 1) return null;
  const sign = value > 0 ? "+" : "-";

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="middle" fill={C.muted} fontSize={10} fontFamily={F.mono}>
        <tspan>{`${sign}10`}</tspan>
        <tspan fontSize={7} dy={-4}>{exponent}</tspan>
      </text>
    </g>
  );
}

export function DepartmentTreemapNode(props) {
  const { x, y, width, height, index, name, value } = props;
  if (!name || width <= 0 || height <= 0) return null;

  const fill = TREEMAP_PALETTE[index % TREEMAP_PALETTE.length];
  const showValue = width > 126 && height > 60;
  const showLabel = width > 84 && height > 40;
  const maxCharsPerLine = Math.max(8, Math.floor((width - 20) / 6.8));
  const maxLines = showValue ? Math.max(2, Math.floor((height - 34) / 12)) : Math.max(2, Math.floor((height - 16) / 12));
  const labelLines = showLabel ? wrapLabel(name, maxCharsPerLine, Math.min(maxLines, 5)) : [];

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} ry={8} fill={fill} stroke="rgba(255,255,255,.9)" strokeWidth={2} />
      {showLabel ? (
        <text x={x + 10} y={y + 18} fill="#fff" fontSize={10} fontFamily={F.mono}>
          {labelLines.map((line, lineIndex) => (
            <tspan key={`${name}-${lineIndex}`} x={x + 10} dy={lineIndex === 0 ? 0 : 12}>
              {line}
            </tspan>
          ))}
        </text>
      ) : null}
      {showValue ? (
        <text x={x + 10} y={y + 18 + (labelLines.length * 12) + 4} fill="rgba(255,255,255,.9)" fontSize={11} fontFamily={F.mono}>
          {formatPesoCompact(value)}
        </text>
      ) : null}
    </g>
  );
}

export function toSignedLog(value) {
  if (!value) return 0;
  return Math.sign(value) * Math.log10(Math.abs(value) + 1);
}

export function buildSignedLogTicks(maxAbsLog) {
  const maxExponent = Math.max(1, Math.ceil(maxAbsLog));
  const ticks = [0];

  for (let exponent = 1; exponent <= maxExponent; exponent += 1) {
    if (Math.abs(exponent % 2) === 1) {
      ticks.push(exponent, -exponent);
    }
  }

  return ticks.sort((left, right) => left - right);
}
