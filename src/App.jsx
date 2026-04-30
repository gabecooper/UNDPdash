import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "./app/AppShell";
import { getDefaultPage, pageSections, findPageByPath } from "./app/pageRegistry";
import { pageComponents } from "./app/pageComponents";
import PageTransitionPlaceholder from "./components/common/PageTransitionPlaceholder";
import RenderErrorBoundary from "./components/common/RenderErrorBoundary";
import { usePathRouter } from "./app/usePathRouter";
import { YEAR_OPTIONS, sortYears } from "./data/yearFields";
import { CURRENCY_DISPLAY_OPTIONS, setActivePhpPerUsdRate } from "./data/formatters";
import { useExchangeRate } from "./hooks/useExchangeRate";

function RouteFallback() {
  return <PageTransitionPlaceholder />;
}

const CURRENCY_DISPLAY_STORAGE_KEY = "undp-dashboard-currency-display";
const CUSTOM_EXCHANGE_RATE_STORAGE_KEY = "undp-dashboard-custom-exchange-rate";

function getStoredCurrencyDisplay() {
  if (typeof window === "undefined") return "php";

  const storedValue = window.localStorage.getItem(CURRENCY_DISPLAY_STORAGE_KEY);
  return CURRENCY_DISPLAY_OPTIONS.some((option) => option.value === storedValue) ? storedValue : "php";
}

function getStoredCustomExchangeRate() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CUSTOM_EXCHANGE_RATE_STORAGE_KEY) || "";
}

function parseCustomExchangeRate(value) {
  const parsedValue = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export default function App() {
  const { pathname, navigate, replace } = usePathRouter();
  const defaultPage = getDefaultPage();
  const activePage = useMemo(() => findPageByPath(pathname) || defaultPage, [defaultPage, pathname]);
  const [selectedYears, setSelectedYears] = useState(defaultPage.defaultYears);
  const [currencyDisplay, setCurrencyDisplay] = useState(getStoredCurrencyDisplay);
  const [customExchangeRate, setCustomExchangeRate] = useState(getStoredCustomExchangeRate);
  const exchangeRateState = useExchangeRate();

  useEffect(() => {
    if (!findPageByPath(pathname)) {
      replace(defaultPage.route);
    }
  }, [defaultPage.route, pathname, replace]);

  useEffect(() => {
    setSelectedYears((current) => {
      if (!current.length) return activePage.defaultYears || defaultPage.defaultYears;
      return sortYears(current);
    });
  }, [activePage, defaultPage.defaultYears]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CURRENCY_DISPLAY_STORAGE_KEY, currencyDisplay);
  }, [currencyDisplay]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!customExchangeRate.trim()) {
      window.localStorage.removeItem(CUSTOM_EXCHANGE_RATE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(CUSTOM_EXCHANGE_RATE_STORAGE_KEY, customExchangeRate);
  }, [customExchangeRate]);

  useEffect(() => {
    const liveExchangeRate = exchangeRateState.phpPerUsd;
    const parsedCustomExchangeRate = parseCustomExchangeRate(customExchangeRate);
    const effectiveExchangeRate = currencyDisplay === "custom"
      ? parsedCustomExchangeRate || liveExchangeRate
      : liveExchangeRate;

    setActivePhpPerUsdRate(effectiveExchangeRate);
  }, [currencyDisplay, customExchangeRate, exchangeRateState.phpPerUsd]);

  const ActivePageComponent = pageComponents[activePage.componentKey];

  return (
    <AppShell
      sections={pageSections}
      activePage={activePage}
      onNavigate={navigate}
      selectedYears={selectedYears}
      currencyDisplay={currencyDisplay}
      onCurrencyDisplayChange={setCurrencyDisplay}
      customExchangeRate={customExchangeRate}
      onCustomExchangeRateChange={setCustomExchangeRate}
      liveExchangeRate={exchangeRateState.phpPerUsd}
      onToggleYear={(year) =>
        setSelectedYears((current) => {
          if (!YEAR_OPTIONS.includes(year)) {
            return sortYears(current);
          }

          if (current.includes(year)) {
            return sortYears(current.filter((item) => item !== year));
          }

          return sortYears([...current, year]);
        })
      }
    >
      <RenderErrorBoundary key={activePage.id}>
        <Suspense fallback={<RouteFallback />}>
          <ActivePageComponent page={activePage} selectedYears={selectedYears} currencyDisplay={currencyDisplay} onNavigate={navigate} />
        </Suspense>
      </RenderErrorBoundary>
    </AppShell>
  );
}
