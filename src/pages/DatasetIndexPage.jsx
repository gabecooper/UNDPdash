import { useState } from "react";
import { flatPageRegistry } from "../app/pageRegistry";
import ChartCardFrame from "../components/cards/ChartCardFrame";
import { downloadCsv } from "../data/csvLoaders";
import { C, F } from "../theme/tokens";

const datasetPages = flatPageRegistry.filter((entry) => entry.csvFile);

function DownloadButton({ filename }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${hovered ? "rgba(0,22,58,.18)" : "rgba(0,22,58,.12)"}`,
        background: hovered ? "rgba(118,194,201,.08)" : "rgba(255,255,255,.7)",
        color: hovered ? C.navy : "rgba(0,22,58,.82)",
        fontFamily: F.mono,
        fontSize: 10,
        letterSpacing: "0.05em",
        cursor: "pointer",
        transition: "background-color .18s ease, border-color .18s ease, color .18s ease, transform .18s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      Download CSV
    </button>
  );
}

function DatasetTableRow({ page }) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(118,194,201,.04)" : "transparent",
        transition: "background-color .18s ease",
      }}
    >
      <td style={{ padding: "15px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.05em",
            color: C.teal2,
          }}
        >
          {page.id}
        </div>
      </td>
      <td style={{ padding: "15px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div
          style={{
            color: C.navy,
            fontSize: 14,
            lineHeight: 1.45,
            fontWeight: 500,
          }}
        >
          {page.label}
        </div>
      </td>
      <td style={{ padding: "15px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.03em",
          }}
        >
          {page.csvFile}
        </div>
      </td>
      <td style={{ padding: "15px 16px", borderBottom: `1px solid ${C.border}`, textAlign: "right" }}>
        <DownloadButton filename={page.csvFile} />
      </td>
    </tr>
  );
}

export default function DatasetIndexPage({ page }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 18,
          padding: "14px 14px 28px",
        }}
      >
        <div
          style={{
            fontFamily: F.serif,
            fontSize: 34,
            fontWeight: 400,
            color: C.navy,
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {page.navLabel}
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,.72)",
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: "0.05em",
            color: C.muted,
            whiteSpace: "nowrap",
          }}
        >
          {datasetPages.length} CSV files
        </div>
      </div>

      <ChartCardFrame
        title="Available datasets"
        bodyStyle={{ paddingTop: 4 }}
        action={
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: "0.05em",
              color: C.muted,
            }}
          >
            Download by row
          </div>
        }
      >
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            overflow: "hidden",
            background: "rgba(255,255,255,.74)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ background: "rgba(241,245,248,.82)" }}>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: F.mono,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.muted,
                      fontWeight: 500,
                      width: 96,
                    }}
                  >
                    Page
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: F.mono,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.muted,
                      fontWeight: 500,
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: F.mono,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.muted,
                      fontWeight: 500,
                      width: 140,
                    }}
                  >
                    CSV file
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "right",
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: F.mono,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.muted,
                      fontWeight: 500,
                      width: 160,
                    }}
                  >
                    Download
                  </th>
                </tr>
              </thead>
              <tbody>
                {datasetPages.map((entry) => (
                  <DatasetTableRow key={entry.id} page={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartCardFrame>
    </>
  );
}
