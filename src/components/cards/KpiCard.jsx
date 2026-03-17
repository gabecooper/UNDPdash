import { C, F } from "../../theme/tokens";
import { cardStyle, eyebrowStyle } from "../../theme/styles";

export default function KpiCard({ title, value, change, tone = "neutral", style, featured = false }) {
  const deltaColor = tone === "pos" ? "#1a8c5a" : tone === "neg" ? "#b03030" : C.muted;
  const valueFontSize = featured ? 34 : 26;
  const valueLineHeight = featured ? 0.95 : 1;
  const isDescriptiveChange = tone === "neutral" && Boolean(change);

  return (
    <div
      style={{
        ...cardStyle,
        padding: 12,
        paddingTop: 8,
        paddingBottom: 10,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
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
