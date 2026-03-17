import { useEffect, useRef, useState } from "react";
import KpiCard from "../cards/KpiCard";
import TreemapChartCard from "../charts/TreemapChartCard";

export default function KpiTreemapSection({ kpis, treemapTitle, treemapData, rows = 2, treemapFirst = false }) {
  const [kpiGridHeight, setKpiGridHeight] = useState(0);
  const kpiGridRef = useRef(null);

  useEffect(() => {
    const node = kpiGridRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const syncHeight = () => setKpiGridHeight(node.getBoundingClientRect().height);
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const kpiGrid = (
    <div
      ref={kpiGridRef}
      style={{
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gridTemplateRows: `repeat(${rows}, 112px)`,
        gap: 13,
        alignContent: "start",
      }}
    >
      {kpis.map((item) => (
        <KpiCard key={item.title} title={item.title} value={item.value} change={item.change} tone={item.tone} />
      ))}
    </div>
  );

  const treemap = (
    <TreemapChartCard title={treemapTitle} data={treemapData} style={{ height: `${Math.max(kpiGridHeight, 360)}px` }} />
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: treemapFirst
          ? "minmax(0, 2.45fr) minmax(0, 1.55fr)"
          : "minmax(0, 1.55fr) minmax(0, 2.45fr)",
        gap: 13,
        alignItems: "start",
      }}
    >
      {treemapFirst ? treemap : kpiGrid}
      {treemapFirst ? kpiGrid : treemap}
    </div>
  );
}
