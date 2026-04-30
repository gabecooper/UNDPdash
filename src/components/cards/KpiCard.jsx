import { useState } from "react";
import AuditTooltipContent from "../common/AuditTooltipContent";
import { C, F } from "../../theme/tokens";
import { cardStyle, eyebrowStyle } from "../../theme/styles";

export default function KpiCard({ title, value, change, tone = "neutral", style, featured = false, currencyDisplay = "php", audit = null }) {
  const [isHovered, setIsHovered] = useState(false);
  const deltaColor = tone === "pos" ? "#1a8c5a" : tone === "neg" ? "#b03030" : C.muted;
  const valueLength = typeof value === "string" ? value.length : 0;
  const isMultiCurrencyDisplay = currencyDisplay === "dual" || currencyDisplay === "custom";
  const isVeryLongValue = valueLength > 24;
  const isLongValue = valueLength > 18;
  const valueFontSize = (() => {
    if (featured) {
      if (isMultiCurrencyDisplay) return isVeryLongValue ? 20 : 23;
      return 34;
    }

    if (isMultiCurrencyDisplay) return isVeryLongValue ? 15 : isLongValue ? 17 : 19;
    return 26;
  })();
  const valueLineHeight = featured ? 0.95 : 1;
  const isDescriptiveChange = tone === "neutral" && Boolean(change);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={audit ? 0 : undefined}
      style={{
        ...cardStyle,
        padding: 12,
        paddingTop: 8,
        paddingBottom: 10,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        ...style,
      }}
    >
      {audit && isHovered ? (
        <div
          style={{
            position: "absolute",
            left: 12,
            top: "calc(100% + 8px)",
            zIndex: 20,
          }}
        >
          <AuditTooltipContent title={title} audit={audit} />
        </div>
      ) : null}
      <div
        style={{
          minHeight: "2.1em",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            ...eyebrowStyle,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            width: "100%",
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          fontFamily: F.serif,
          fontSize: valueFontSize,
          fontWeight: 600,
          color: C.navy,
          lineHeight: valueLineHeight,
          marginTop: 6,
          whiteSpace: isMultiCurrencyDisplay ? "nowrap" : "normal",
          overflow: isMultiCurrencyDisplay ? "hidden" : "visible",
          textOverflow: isMultiCurrencyDisplay ? "clip" : "initial",
          letterSpacing: isMultiCurrencyDisplay ? "-0.025em" : "normal",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: "auto",
          minHeight: isDescriptiveChange ? 36 : 28,
          display: "flex",
          alignItems: "center",
        }}
      >
        {change ? (
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: deltaColor,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {change}
          </div>
        ) : null}
      </div>
    </div>
  );
}
