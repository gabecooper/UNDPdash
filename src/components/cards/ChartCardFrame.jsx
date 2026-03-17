import { cardStyle, eyebrowStyle } from "../../theme/styles";

export default function ChartCardFrame({ title, action, headerCenter, style, bodyStyle, titleStyle, children }) {
  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", minHeight: 0, ...style }}>
      <div
        style={{
          marginBottom: 12,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr)",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ ...eyebrowStyle, ...titleStyle }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "center", minWidth: 0 }}>
          {headerCenter}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
          {action}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, ...bodyStyle }}>
        {children}
      </div>
    </div>
  );
}
