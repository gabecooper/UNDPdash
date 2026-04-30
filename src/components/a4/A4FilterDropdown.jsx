import { useEffect, useMemo, useRef, useState } from "react";
import { C, F } from "../../theme/tokens";

function SelectionSummary({ multiple, selectedCount, selectedLabel, placeholder }) {
  if (multiple) {
    if (!selectedCount) return placeholder;
    return selectedCount === 1 ? "1 selected" : `${selectedCount} selected`;
  }

  return selectedLabel || placeholder;
}

export default function A4FilterDropdown({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  multiple = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);
  const selectedLabel = !multiple && selectedValues[0]
    ? options.find((option) => option.value === selectedValues[0])?.label || ""
    : "";

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const handleOptionClick = (value) => {
    if (multiple) {
      onChange(
        selectedSet.has(value)
          ? selectedValues.filter((item) => item !== value)
          : [...selectedValues, value]
      );
      return;
    }

    onChange(selectedValues[0] === value ? [] : [value]);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: 0 }}>
      <div
        style={{
          marginBottom: 6,
          fontSize: 11,
          fontWeight: 700,
          color: disabled ? C.muted : C.dark,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <button
        type="button"
        aria-label={`${label}: ${selectedLabel || placeholder}`}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((current) => !current);
        }}
        style={{
          width: "100%",
          minHeight: 44,
          borderRadius: 12,
          border: `1px solid ${disabled ? "rgba(228,232,238,.72)" : C.border}`,
          background: disabled ? "rgba(245,247,250,.9)" : "rgba(255,255,255,.94)",
          color: disabled ? C.muted : C.navy,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled ? "none" : "0 8px 18px rgba(0,22,58,.05)",
          fontSize: 13,
          fontFamily: F.sans,
        }}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
          <SelectionSummary
            multiple={multiple}
            selectedCount={selectedValues.length}
            selectedLabel={selectedLabel}
            placeholder={placeholder}
          />
        </span>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 20,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,.98)",
            boxShadow: "0 24px 48px rgba(0,22,58,.14)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 12, borderBottom: `1px solid ${C.border}` }}>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              aria-label={`Search ${label.toLowerCase()}`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "rgba(248,251,253,.92)",
                color: C.navy,
                fontFamily: F.sans,
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ maxHeight: 260, overflowY: "auto", padding: 8, display: "grid", gap: 4 }}>
            {filteredOptions.length ? filteredOptions.map((option) => {
              const isSelected = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  style={{
                    border: `1px solid ${isSelected ? C.teal2 : "transparent"}`,
                    borderRadius: 10,
                    background: isSelected ? "rgba(118,194,201,.18)" : "rgba(255,255,255,.92)",
                    color: isSelected ? C.navy : C.dark,
                    padding: "10px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "grid",
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500 }}>{option.label}</span>
                  {option.meta ? (
                    <span style={{ fontSize: 11, color: C.muted }}>{option.meta}</span>
                  ) : null}
                </button>
              );
            }) : (
              <div style={{ padding: "16px 12px", textAlign: "center", color: C.muted, fontSize: 12 }}>
                No matches found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
