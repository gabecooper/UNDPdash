import { C, F } from "./tokens";

export const cardStyle = {
  background: C.white,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 18,
  position: "relative",
  overflow: "hidden",
};

export const eyebrowStyle = {
  fontFamily: F.mono,
  fontSize: 10.5,
  lineHeight: 1.05,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: C.teal,
  marginBottom: 3,
};

export const chartAxisTick = {
  fontSize: 9.5,
  fill: C.muted,
  fontFamily: F.mono,
};

export const chartMargin = {
  top: 4,
  right: 8,
  left: -24,
  bottom: 0,
};
