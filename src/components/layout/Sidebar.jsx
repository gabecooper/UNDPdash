import { useState } from "react";
import logoImg from "../../../Logos.png";
import { YEAR_OPTIONS } from "../../data/yearFields";
import { C, F } from "../../theme/tokens";

function YearChip({ label, selected, onClick, shake }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={selected}
      style={{
        padding: "8px 11px",
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

function ActionButton({ children, onClick, disabled, active }) {
  const [hovered, setHovered] = useState(false);
  const highlighted = active || hovered;

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
        border: `1.8px solid ${
          highlighted ? "#79B7BE" : "rgba(121,183,190,.82)"
        }`,
        background: "#79B7BE",
        color: C.sidebar,
        fontFamily: F.mono,
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: "0.04em",
        transition: "background-color .2s ease, border-color .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease",
        opacity: disabled ? 0.56 : 1,
        boxShadow: highlighted ? "0 10px 20px rgba(0,0,0,.12)" : "none",
      }}
    >
      {children}
    </button>
  );
}

export default function Sidebar({
  sections,
  activePage,
  onNavigate,
  selectedYears,
  onToggleYear,
  rejectedYear,
  width,
}) {
  const [hoveredNav, setHoveredNav] = useState(null);
  const hasDatasets = sections.some((section) => section.pages.some((page) => page.csvFile));
  const isDatasetIndex = activePage.id === "datasets";
  const isCompact = width < 230;
  const horizontalPadding = isCompact ? 16 : 20;
  const navFontSize = isCompact ? 10.5 : 11;

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

      <div
        aria-hidden="true"
        style={{
          height: 1,
          margin: `0 ${isCompact ? 18 : 24}px`,
          background: "rgba(244, 240, 232, 0.7)",
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
          padding: `${isCompact ? 16 : 22}px ${horizontalPadding}px 6px`,
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

      <div style={{ padding: `16px ${horizontalPadding}px 8px`, borderTop: "1px solid rgba(231,240,245,.08)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {YEAR_OPTIONS.map((year) => (
            <YearChip
              key={year}
              label={year}
              selected={selectedYears.includes(year)}
              onClick={() => onToggleYear(year)}
              shake={rejectedYear === year}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: `8px ${horizontalPadding}px 24px`, flexShrink: 0 }}>
        <ActionButton
          onClick={() => {
            if (!hasDatasets) return;
            onNavigate("/datasets");
          }}
          disabled={!hasDatasets}
          active={isDatasetIndex}
        >
          View Dataset
        </ActionButton>
      </div>
    </aside>
  );
}
