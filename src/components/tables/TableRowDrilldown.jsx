import { formatMoney, numberFormatter } from "../../data/formatters";
import { toNumber } from "../../data/csv";
import { C, F } from "../../theme/tokens";

function formatAuditValue(value, isPercent, currencyDisplay, formatAsMoney) {
  if (value === "" || value == null) return "Not provided";
  if (isPercent) return String(value);
  if (!formatAsMoney) return String(value);

  const numericValue = toNumber(value);
  if (!Number.isFinite(numericValue)) return String(value);
  return formatMoney(numericValue, { currencyDisplay });
}

function AuditPill({ title, value }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: "rgba(255,255,255,.9)",
      }}
    >
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 4,
          color: C.navy,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function AuditField({ item, currencyDisplay }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: "rgba(255,255,255,.9)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.navy,
          lineHeight: 1.3,
        }}
      >
        {item.label}
      </div>
      <div
        style={{
          marginTop: 4,
          color: C.dark,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {formatAuditValue(item.value, item.isPercent, currencyDisplay, item.formatAsMoney)}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: F.mono,
          fontSize: 10,
          color: C.muted,
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}
      >
        {item.raw}
      </div>
    </div>
  );
}

export default function TableRowDrilldown({ detail, currencyDisplay }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        padding: 14,
        background: "rgba(241,245,248,.6)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        <AuditPill title="Dimension Fields" value={numberFormatter.format(detail.dimensionItems.length)} />
        <AuditPill title="Year Blocks" value={numberFormatter.format(detail.yearSections.length)} />
        <AuditPill title="Audit Fields" value={numberFormatter.format(detail.metaItems.length)} />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 10,
            color: C.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Dimensions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {detail.dimensionItems.map((item) => (
            <AuditField key={item.raw} item={item} currencyDisplay={currencyDisplay} />
          ))}
        </div>
      </div>

      {detail.yearSections.map((section) => (
        <div key={section.year} style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 10,
              color: C.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {section.year} Source Fields
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {section.items.map((item) => (
              <AuditField key={item.raw} item={item} currencyDisplay={currencyDisplay} />
            ))}
          </div>
        </div>
      ))}

      {detail.metaItems.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 10,
              color: C.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Audit Metadata
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {detail.metaItems.map((item) => (
              <AuditField key={item.raw} item={item} currencyDisplay={currencyDisplay} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
