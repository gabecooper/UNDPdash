import { useRef, useState } from "react";
import logoImg from "../../../logo.png";
import { YEAR_OPTIONS } from "../../data/yearFields";
import { C, F } from "../../theme/tokens";

function FilterChip({ label, selected, onClick, shake }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={selected}
      style={{
        padding: "5px 9px",
        borderRadius: 999,
        border: `1px solid ${
          selected ? "rgba(121,183,190,.72)" : hovered ? "rgba(121,183,190,.6)" : "rgba(121,183,190,.35)"
        }`,
        background:
          selected
            ? "rgba(121,183,190,.22)"
            : hovered
              ? "rgba(121,183,190,.16)"
              : "transparent",
        color: selected ? "#FFFFFF" : hovered ? "rgba(231,240,245,.9)" : "rgba(231,240,245,.72)",
        fontFamily: F.mono,
        fontSize: 10,
        letterSpacing: "0.05em",
        cursor: "pointer",
        transition: "background-color .2s ease, border-color .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered || selected ? "0 10px 22px rgba(0,0,0,.12)" : "none",
        animation: shake ? "sidebarShake .35s ease-in-out" : "none",
      }}
    >
      {label}
    </button>
  );
}

function ActionButton({ children, onClick, disabled, active, accent }) {
  const [hovered, setHovered] = useState(false);
  const highlighted = active || hovered;

  const accentStyle = {
    border: `1.8px solid ${highlighted ? "#79B7BE" : "rgba(121,183,190,.82)"}`,
    background: highlighted ? "#86C2C8" : "#79B7BE",
    color: C.sidebar,
    fontWeight: 600,
    boxShadow: highlighted ? "0 10px 20px rgba(0,0,0,.16)" : "none",
  };

  const ghostStyle = {
    border: `1px solid ${active ? "rgba(121,183,190,.45)" : hovered ? "rgba(121,183,190,.32)" : "rgba(231,240,245,.12)"}`,
    background: active ? "rgba(121,183,190,.12)" : hovered ? "rgba(231,240,245,.07)" : "transparent",
    color: active ? "rgba(231,240,245,.92)" : hovered ? "rgba(231,240,245,.82)" : "rgba(231,240,245,.52)",
    fontWeight: active ? 500 : 400,
    boxShadow: "none",
  };

  const variantStyle = accent ? accentStyle : ghostStyle;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: F.mono,
        fontSize: 11,
        letterSpacing: "0.04em",
        transition: "background-color .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease",
        opacity: disabled ? 0.56 : 1,
        ...variantStyle,
      }}
    >
      {children}
    </button>
  );
}

function parseExchangeRate(value) {
  const parsedValue = Number.parseFloat(String(value || "").trim());
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export default function Sidebar({
  sections,
  activePage,
  onNavigate,
  selectedYears,
  currencyDisplay,
  onCurrencyDisplayChange,
  customExchangeRate,
  onCustomExchangeRateChange,
  liveExchangeRate,
  onToggleYear,
  rejectedYear,
  width,
}) {
  const [hoveredNav, setHoveredNav] = useState(null);
  const [rejectedCurrency, setRejectedCurrency] = useState(null);
  const [customRateExpanded, setCustomRateExpanded] = useState(false);
  const rejectedCurrencyTimeoutRef = useRef(null);
  const hasDatasets = sections.some((section) => section.pages.some((page) => page.csvFile));
  const isDatasetIndex = activePage.id === "datasets";

  const CURRENCY_CHIPS = [
    { value: "php", label: "PHP" },
    { value: "usd", label: "USD" },
    { value: "custom", label: "Custom Rate" },
  ];

  function currencyDisplayToSelection(display) {
    if (display === "dual") return ["php", "usd"];
    if (display === "custom") return ["custom"];
    if (display === "usd") return ["usd"];
    return ["php"];
  }

  function selectionToCurrencyDisplay(selected) {
    if (selected.includes("custom")) return "custom";
    if (selected.includes("php") && selected.includes("usd")) return "dual";
    if (selected.includes("usd")) return "usd";
    return "php";
  }

  const selectedCurrencies = currencyDisplayToSelection(currencyDisplay);

  function handleCurrencyToggle(value) {
    const current = selectedCurrencies;
    const rejectWith = (v) => {
      setRejectedCurrency(v);
      if (rejectedCurrencyTimeoutRef.current) clearTimeout(rejectedCurrencyTimeoutRef.current);
      rejectedCurrencyTimeoutRef.current = setTimeout(() => setRejectedCurrency(null), 360);
    };

    let next;
    if (value === "custom") {
      if (current.includes("custom")) { rejectWith("custom"); return; }
      next = ["custom"];
      setCustomRateExpanded(true);
    } else {
      if (current.includes("custom")) {
        next = [value];
      } else if (current.includes(value)) {
        if (current.length === 1) { rejectWith(value); return; }
        next = current.filter((c) => c !== value);
      } else {
        next = [...current, value];
      }
    }
    onCurrencyDisplayChange(selectionToCurrencyDisplay(next));
  }

  const analystTools = [
    { id: "home",                   route: "/home",                      label: "Home"               },
    { id: "grantPortfolio",         route: "/grants-portfolio",          label: "Grants Portfolio"   },
    { id: "peopleBudgetComparison", route: "/peoples-budget-comparison", label: "People's Budget"    },
    { id: "comparison",             route: "/comparison",                label: "Compare"            },
  ];
  const isCompact = width < 230;
  const horizontalPadding = isCompact ? 16 : 20;
  const navFontSize = isCompact ? 10.5 : 11;
  const customRateValue = parseExchangeRate(customExchangeRate);
  const activeExchangeRate = currencyDisplay === "custom"
    ? customRateValue || liveExchangeRate
    : liveExchangeRate;

  return (
    <aside
      style={{
        width: "100%",
        flexShrink: 0,
        height: "100vh",
        minHeight: 0,
        background: C.sidebar,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        boxShadow: "18px 0 36px rgba(0,22,58,.08)",
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: -28,
          width: 28,
          height: "100%",
          background: "linear-gradient(90deg, rgba(8,33,73,.12), rgba(8,33,73,0))",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: isCompact ? "18px 16px 14px" : "22px 20px 18px", display: "flex", justifyContent: "center" }}>
        <img
          src={logoImg}
          alt="UNDP dashboard logo"
          style={{
            display: "block",
            width: isCompact ? 150 : 182,
            maxWidth: "100%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      <div aria-hidden="true" style={{ height: 1, margin: `0 ${isCompact ? 18 : 24}px`, background: "rgba(231,240,245,.08)", flexShrink: 0 }} />

      {/* Analyst Tools — static, never scrolls */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 8.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(231,240,245,.42)",
            padding: `${isCompact ? 14 : 18}px ${horizontalPadding}px 6px`,
          }}
        >
          Analyst Tools
        </div>
        {analystTools.map((tool) => {
          const isActive = tool.id === activePage.id;
          const isHovered = hoveredNav === tool.id;
          return (
            <a
              key={tool.id}
              href={tool.route}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(tool.route);
              }}
              onMouseEnter={() => setHoveredNav(tool.id)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                display: "block",
                padding: `8px ${horizontalPadding}px`,
                fontSize: navFontSize,
                cursor: "pointer",
                lineHeight: 1.45,
                textDecoration: "none",
                borderLeft: isActive
                  ? `2px solid ${C.teal}`
                  : isHovered
                    ? "2px solid rgba(118,194,201,.38)"
                    : "2px solid transparent",
                color: isActive
                  ? "#BDE7EB"
                  : isHovered
                    ? "rgba(231,240,245,.92)"
                    : "rgba(231,240,245,.68)",
                background: isActive
                  ? "rgba(118,194,201,.11)"
                  : isHovered
                    ? "rgba(118,194,201,.07)"
                    : "transparent",
                fontWeight: isActive || isHovered ? 500 : 400,
                textShadow: isActive ? "0 0 12px rgba(118,194,201,.32)" : "none",
                transform: isHovered && !isActive ? "translateX(4px)" : "translateX(0)",
                transition: "background-color .2s ease, color .2s ease, border-color .2s ease, transform .2s ease, font-weight .2s ease",
              }}
            >
              {tool.label}
            </a>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        style={{
          height: 1,
          margin: `8px ${isCompact ? 18 : 24}px 0`,
          background: "rgba(231,240,245,.08)",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          fontFamily: F.mono,
          fontSize: 8.5,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(231,240,245,.42)",
          padding: `${isCompact ? 14 : 18}px ${horizontalPadding}px 6px`,
          flexShrink: 0,
        }}
      >
        General Appropriations Act
      </div>

      <nav
        style={{
          padding: "10px 0 16px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {sections.map((section) => (
          <div key={section.key}>
            {section.pages.map((page) => {
              const isActive = page.id === activePage.id;
              const isHovered = hoveredNav === page.id;

              return (
                <a
                  key={page.id}
                  href={page.route}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(page.route);
                  }}
                  onMouseEnter={() => setHoveredNav(page.id)}
                  onMouseLeave={() => setHoveredNav(null)}
                  style={{
                    display: "block",
                    padding: `8px ${horizontalPadding}px`,
                    fontSize: navFontSize,
                    cursor: "pointer",
                    lineHeight: 1.45,
                    textDecoration: "none",
                    borderLeft:
                      isActive
                        ? `2px solid ${C.teal}`
                        : isHovered
                          ? "2px solid rgba(118,194,201,.38)"
                          : "2px solid transparent",
                    color:
                      isActive
                        ? "#BDE7EB"
                        : isHovered
                          ? "rgba(231,240,245,.92)"
                          : "rgba(231,240,245,.68)",
                    background:
                      isActive
                        ? "rgba(118,194,201,.11)"
                        : isHovered
                          ? "rgba(118,194,201,.07)"
                          : "transparent",
                    fontWeight: isActive || isHovered ? 500 : 400,
                    textShadow: isActive ? "0 0 12px rgba(118,194,201,.32)" : "none",
                    transform: isHovered && !isActive ? "translateX(4px)" : "translateX(0)",
                    transition: "background-color .2s ease, color .2s ease, border-color .2s ease, transform .2s ease, font-weight .2s ease",
                  }}
                >
                  {page.navLabel}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: `10px ${horizontalPadding}px 8px`, borderTop: "1px solid rgba(231,240,245,.08)", flexShrink: 0 }}>
        {/* Years row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <span style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(231,240,245,.42)", width: 52, flexShrink: 0 }}>Years</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {YEAR_OPTIONS.map((year) => (
              <FilterChip
                key={year}
                label={year}
                selected={selectedYears.includes(year)}
                onClick={() => onToggleYear(year)}
                shake={rejectedYear === year}
              />
            ))}
          </div>
        </div>

        {/* Currency row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(231,240,245,.42)", width: 52, flexShrink: 0 }}>Currency</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {CURRENCY_CHIPS.map((chip) => (
              <FilterChip
                key={chip.value}
                label={chip.label}
                selected={selectedCurrencies.includes(chip.value)}
                onClick={() => handleCurrencyToggle(chip.value)}
                shake={rejectedCurrency === chip.value}
              />
            ))}
          </div>
        </div>

        {/* Rate display — always visible */}
        {currencyDisplay === "custom" && customRateExpanded ? (
          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(121,183,190,.28)",
              background: "rgba(121,183,190,.08)",
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(231,240,245,.72)" }}>₱ per $1</span>
              <input
                type="number"
                min="0"
                step="1"
                value={customExchangeRate}
                onChange={(event) => onCustomExchangeRateChange(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.currentTarget.blur(); setCustomRateExpanded(false); } }}
                placeholder={liveExchangeRate ? String(Math.round(liveExchangeRate)) : "60"}
                aria-label="Custom exchange rate"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(121,183,190,.35)",
                  background: "rgba(7,18,27,.22)",
                  color: "#FFFFFF",
                  fontFamily: F.mono,
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </label>
          </div>
        ) : (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 9.5, color: "rgba(231,240,245,.38)", letterSpacing: "0.04em" }}>
              {activeExchangeRate ? `₱${activeExchangeRate.toFixed(2)} / $1` : "—"}
            </span>
            {currencyDisplay === "custom" && (
              <button
                type="button"
                onClick={() => setCustomRateExpanded(true)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F.mono, fontSize: 8.5, color: "rgba(121,183,190,.6)", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                edit
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: `8px ${horizontalPadding}px 24px`, flexShrink: 0 }}>
        <ActionButton
          onClick={() => {
            if (!hasDatasets) return;
            onNavigate("/datasets");
          }}
          disabled={!hasDatasets}
          active={isDatasetIndex}
          accent
        >
          View Dataset
        </ActionButton>
      </div>

    </aside>
  );
}
