const pesoCompactFormatter = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("en-US");

export function formatPesoCompact(value) {
  return `₱${pesoCompactFormatter.format(value)}`;
}

export function formatAxisPesoTick(value) {
  if (!Number.isFinite(value) || value <= 0) return "";
  const power = Math.log10(value);
  if (Number.isInteger(power) && Math.abs(power % 2) !== 1) return "";
  return `₱${pesoCompactFormatter.format(value)}`;
}

export function formatPeso(value) {
  return pesoFormatter.format(value);
}

export function formatPercentChange(current, previous) {
  if (!previous) return "No prior period";
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.05) return "Flat vs prior period";
  const arrow = change > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(change).toFixed(1)}% vs prior period`;
}

export function formatSignedPeso(value) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatPeso(Math.abs(value))}`;
}
