function triggerBrowserDownload({ blob, filename }) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

function toCsvCell(value) {
  const normalized = value == null ? "" : String(value);
  if (normalized.includes('"') || normalized.includes(",") || normalized.includes("\n")) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function buildCsvText(headers, rows) {
  const headerLine = headers.map((header) => toCsvCell(header.label)).join(",");
  const rowLines = rows.map((row) =>
    headers.map((header) => toCsvCell(row[header.key])).join(",")
  );
  return [headerLine, ...rowLines].join("\n");
}

export class GrantPortfolioDownloadManager {
  async downloadPublicFile(url, filename) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not download file at ${url}`);
    }
    const fileBlob = await response.blob();
    triggerBrowserDownload({ blob: fileBlob, filename });
  }

  downloadWorldBankSourceCsv(worldBankRawCsv) {
    const csvBlob = new Blob([worldBankRawCsv], { type: "text/csv;charset=utf-8" });
    triggerBrowserDownload({
      blob: csvBlob,
      filename: "world-bank-philippines-projects-source.csv",
    });
  }

  downloadAdbActivitiesCsv(rows) {
    const headers = [
      { key: "id", label: "id" },
      { key: "title", label: "title" },
      { key: "agency", label: "agency" },
      { key: "status", label: "status" },
      { key: "financeType", label: "finance_type" },
      { key: "approvalDate", label: "approval_date" },
      { key: "year", label: "year" },
    ];
    const csvText = buildCsvText(headers, rows);
    const csvBlob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    triggerBrowserDownload({
      blob: csvBlob,
      filename: "adb-activities-philippines.csv",
    });
  }
}

export const grantPortfolioDownloadManager = new GrantPortfolioDownloadManager();
