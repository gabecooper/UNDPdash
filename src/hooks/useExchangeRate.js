import { useEffect, useState } from "react";
import { PHP_PER_USD, setActivePhpPerUsdRate } from "../data/formatters";

const EXCHANGE_RATE_CACHE_KEY = "undp-dashboard-exchange-rate";
const EXCHANGERATES_API_URL = "https://api.exchangeratesapi.io/v1/latest";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isValidRate(value) {
  return Number.isFinite(value) && value > 0;
}

function readCachedRate() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return isValidRate(parsed?.phpPerUsd) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedRate(payload) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and keep the in-memory rate.
  }
}

function buildApiUrl(apiKey) {
  const params = new URLSearchParams({
    access_key: apiKey,
    symbols: "PHP,USD",
  });

  return `${EXCHANGERATES_API_URL}?${params.toString()}`;
}

export function extractPhpPerUsdRate(payload) {
  const phpRate = Number(payload?.rates?.PHP);
  const usdRate = Number(payload?.rates?.USD);

  if (!isValidRate(phpRate) || !isValidRate(usdRate)) {
    return null;
  }

  return phpRate / usdRate;
}

export function useExchangeRate() {
  const [state, setState] = useState(() => {
    const cachedRate = readCachedRate();
    const initialRate = cachedRate?.phpPerUsd || PHP_PER_USD;

    setActivePhpPerUsdRate(initialRate);

    return {
      phpPerUsd: initialRate,
      source: cachedRate ? "cache" : "fallback",
      asOf: cachedRate?.asOf || null,
    };
  });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_EXCHANGERATES_API_KEY;
    const cachedRate = readCachedRate();
    const todayKey = getTodayKey();

    if (cachedRate && cachedRate.fetchedOn === todayKey) {
      setActivePhpPerUsdRate(cachedRate.phpPerUsd);
      setState({
        phpPerUsd: cachedRate.phpPerUsd,
        source: "cache",
        asOf: cachedRate.asOf || cachedRate.fetchedOn,
      });
      return undefined;
    }

    if (!apiKey) {
      setActivePhpPerUsdRate(cachedRate?.phpPerUsd || PHP_PER_USD);
      return undefined;
    }

    let cancelled = false;

    if (cachedRate) {
      setActivePhpPerUsdRate(cachedRate.phpPerUsd);
      setState({
        phpPerUsd: cachedRate.phpPerUsd,
        source: "cache",
        asOf: cachedRate.asOf || cachedRate.fetchedOn,
      });
    }

    fetch(buildApiUrl(apiKey))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Exchange rate request failed with ${response.status}`);
        }

        return response.json();
      })
      .then((payload) => {
        if (cancelled) return;
        if (payload?.success === false) {
          throw new Error(payload?.error?.info || "Exchange rate API returned an error.");
        }

        const phpPerUsd = extractPhpPerUsdRate(payload);
        if (!isValidRate(phpPerUsd)) {
          throw new Error("Exchange rate API response did not include valid PHP/USD data.");
        }

        const nextState = {
          phpPerUsd,
          fetchedOn: todayKey,
          asOf: payload?.date || todayKey,
        };

        writeCachedRate(nextState);
        setActivePhpPerUsdRate(phpPerUsd);
        setState({
          phpPerUsd,
          source: "api",
          asOf: nextState.asOf,
        });
      })
      .catch(() => {
        if (cancelled) return;

        const fallbackRate = cachedRate?.phpPerUsd || PHP_PER_USD;
        setActivePhpPerUsdRate(fallbackRate);
        setState({
          phpPerUsd: fallbackRate,
          source: cachedRate ? "cache" : "fallback",
          asOf: cachedRate?.asOf || null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
