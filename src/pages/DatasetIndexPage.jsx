import { useState } from "react";
import worldBankRaw from "../../example/philippines_projects_a4_like.csv?raw";
import { flatPageRegistry } from "../app/pageRegistry";
import ChartCardFrame from "../components/cards/ChartCardFrame";
import { downloadCsv } from "../data/csvLoaders";
import { grantPortfolioDownloadManager } from "../data/download/GrantPortfolioDownloadManager";
import { sourceDocumentDownloadManager } from "../data/download/SourceDocumentDownloadManager";
import { C, F } from "../theme/tokens";

const datasetPages = flatPageRegistry.filter((entry) => entry.csvFile);

function DownloadButton({ label, iconPath, onClick, title }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 86,
        height: 34,
        borderRadius: 999,
        border: `1px solid ${hovered ? "rgba(0,22,58,.18)" : "rgba(0,22,58,.12)"}`,
        background: hovered ? "rgba(118,194,201,.08)" : "rgba(255,255,255,.7)",
        color: hovered ? C.navy : "rgba(0,22,58,.82)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: F.mono,
        fontSize: 10,
        letterSpacing: "0.05em",
        cursor: "pointer",
        transition: "background-color .18s ease, border-color .18s ease, color .18s ease, transform .18s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPath} />
      </svg>
      {label}
    </button>
  );
}

function SourceDatasetButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 999,
        border: `1px solid ${hovered ? "rgba(0,22,58,.18)" : "rgba(0,22,58,.12)"}`,
        background: hovered ? "rgba(118,194,201,.08)" : "rgba(255,255,255,.72)",
        color: hovered ? C.navy : "rgba(0,22,58,.82)",
        fontFamily: F.mono,
        fontSize: 9.5,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "8px 12px",
        cursor: "pointer",
      }}
    >
      {label}
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
      <td style={{ padding: "15px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.03em",
          }}
        >
          {(page.sourcePdfFiles || []).join(", ") || "N/A"}
        </div>
      </td>
      <td style={{ padding: "15px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <DownloadButton
            label="CSV"
            title="Download CSV only"
            iconPath="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            onClick={() => downloadCsv(page.csvFile)}
          />
          <DownloadButton
            label="PDF"
            title="Download original PDF(s)"
            iconPath="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            onClick={() => sourceDocumentDownloadManager.downloadOriginalPdfs(page)}
          />
          <DownloadButton
            label="Both"
            title="Download CSV + PDF bundle (.zip)"
            iconPath="M12 3v12M7 10l5 5 5-5"
            onClick={() => sourceDocumentDownloadManager.downloadPageBundle(page)}
          />
        </div>
      </td>
    </tr>
  );
}

export default function DatasetIndexPage({ page }) {
  async function handleDownloadAdbCsv() {
    try {
      await grantPortfolioDownloadManager.downloadPublicFile(
        "/adb-sovereign-projects.csv",
        "adb-sovereign-projects.csv"
      );
    } catch (error) {
      window.alert("Could not download the ADB CSV source right now.");
    }
  }

  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 18,
          padding: "16px 14px 30px",
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
          {datasetPages.length} datasets
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 14px 16px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <SourceDatasetButton
            label="ADB CSV Source"
            onClick={handleDownloadAdbCsv}
          />
          <SourceDatasetButton
            label="World Bank Source CSV"
            onClick={() => grantPortfolioDownloadManager.downloadWorldBankSourceCsv(worldBankRaw)}
          />
        </div>
      </div>

      <ChartCardFrame
        title="Available datasets"
        style={{ flex: 1, minHeight: 0 }}
        bodyStyle={{ paddingTop: 8, minHeight: 0 }}
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
            overflow: "auto",
            background: "rgba(255,255,255,.74)",
            minHeight: "100%",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
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
                    width: 72,
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
                    width: "40%",
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
                    width: 120,
                  }}
                >
                  CSV
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
                    width: "25%",
                  }}
                >
                  PDF
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
                    width: 300,
                  }}
                >
                  Downloads
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
      </ChartCardFrame>
    </div>
  );
}
