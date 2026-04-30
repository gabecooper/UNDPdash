import { C, F } from "../../theme/tokens";
import { cardStyle, eyebrowStyle } from "../../theme/styles";

export default function PageStateCard({ eyebrow = "Dashboard", title, description }) {
  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <div style={eyebrowStyle}>{eyebrow}</div>
      <div
        style={{
          fontFamily: F.serif,
          fontSize: 26,
          color: C.navy,
          lineHeight: 1.15,
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: C.muted,
          fontSize: 13,
          lineHeight: 1.6,
          maxWidth: 640,
        }}
      >
        {description}
      </div>
    </div>
  );
}
