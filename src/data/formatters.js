export const CURRENCY_DISPLAY_OPTIONS = [
  { value: "php", label: "PHP" },
  { value: "usd", label: "USD" },
  { value: "dual", label: "PHP & USD" },
  { value: "custom", label: "Custom Rate" },
];

// Fallback reference rate used until the live daily rate is fetched.
export const PHP_PER_USD = 60.15;
let activePhpPerUsdRate = PHP_PER_USD;

const compactFormatters = {
  PHP: new Intl.NumberFormat("en-PH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }),
  USD: new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }),
};

const currencySymbols = {
  PHP: "₱",
  USD: "$",
};

const fullFormatters = {
  PHP: new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }),
};

export const numberFormatter = new Intl.NumberFormat("en-US");

function resolveExchangeRate(exchangeRate) {
  return Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : activePhpPerUsdRate;
}

export function setActivePhpPerUsdRate(exchangeRate) {
  activePhpPerUsdRate = resolveExchangeRate(exchangeRate);
}

export function getActivePhpPerUsdRate() {
  return activePhpPerUsdRate;
}

export function convertPhpToUsd(value, exchangeRate = activePhpPerUsdRate) {
  const resolvedRate = resolveExchangeRate(exchangeRate);
  if (!resolvedRate) return 0;
  return value / resolvedRate;
}

function formatCurrencyValue(value, currency, compact = false) {
  const formatter = compact ? compactFormatters[currency] : fullFormatters[currency];
  if (!compact) {
    return formatter.format(value);
  }

  const symbol = currencySymbols[currency] || "";
  const absoluteValue = formatter.format(Math.abs(value));
  const prefix = value < 0 ? "-" : "";
  return `${prefix}${symbol}${absoluteValue}`;
}

function resolveCurrencyDisplay(value, currencyDisplay, compact = false, exchangeRate = activePhpPerUsdRate) {
  const phpValue = formatCurrencyValue(value, "PHP", compact);
  const usdValue = formatCurrencyValue(convertPhpToUsd(value, exchangeRate), "USD", compact);

  if (currencyDisplay === "usd") return usdValue;
  if (currencyDisplay === "dual" || currencyDisplay === "custom") return `${phpValue} / ${usdValue}`;
  return phpValue;
}

export function formatMoneyCompact(value, { currencyDisplay = "php", exchangeRate = activePhpPerUsdRate } = {}) {
  return resolveCurrencyDisplay(value, currencyDisplay, true, exchangeRate);
}

export function formatAxisMoneyTick(value, { currencyDisplay = "php", exchangeRate = activePhpPerUsdRate } = {}) {
  if (!Number.isFinite(value) || value <= 0) return "";
  const power = Math.log10(value);
  if (Number.isInteger(power) && Math.abs(power % 2) !== 1) return "";
  const axisCurrencyDisplay = currencyDisplay === "usd" ? "usd" : "php";
  return resolveCurrencyDisplay(value, axisCurrencyDisplay, true, exchangeRate);
}

export function formatMoney(value, { currencyDisplay = "php", exchangeRate = activePhpPerUsdRate } = {}) {
  return resolveCurrencyDisplay(value, currencyDisplay, false, exchangeRate);
}

export function formatPercentChange(current, previous) {
  if (!previous) return "No prior period";
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.05) return "Flat vs prior period";
  const arrow = change > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(change).toFixed(1)}% vs prior period`;
}

export function formatSignedMoney(value, { currencyDisplay = "php", exchangeRate = activePhpPerUsdRate, compact = false } = {}) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  const nextValue = compact
    ? formatMoneyCompact(Math.abs(value), { currencyDisplay, exchangeRate })
    : formatMoney(Math.abs(value), { currencyDisplay, exchangeRate });
  return `${prefix}${nextValue}`;
}

export function formatPesoCompact(value) {
  return formatMoneyCompact(value, { currencyDisplay: "php" });
}

export function formatAxisPesoTick(value) {
  return formatAxisMoneyTick(value, { currencyDisplay: "php" });
}

export function formatPeso(value) {
  return formatMoney(value, { currencyDisplay: "php" });
}

export function formatSignedPeso(value) {
  return formatSignedMoney(value, { currencyDisplay: "php" });
}
