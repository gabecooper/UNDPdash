import JSZip from "jszip";
import { loadCsvRaw } from "../csvLoaders";
import { resolveSourcePdfUrls } from "../sourcePdfLoaders";

function triggerBrowserDownload({ blob, filename }) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function fetchAsBlob(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download source PDF at ${url}.`);
  }

  return response.blob();
}

function buildBundleName(pageId) {
  const normalizedId = String(pageId || "dataset")
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${normalizedId}-source-files.zip`;
}

export class SourceDocumentDownloadManager {
  async downloadOriginalPdfs(page) {
    const sourcePdfEntries = resolveSourcePdfUrls(page.sourcePdfFiles);
    if (sourcePdfEntries.length === 0) return;

    if (sourcePdfEntries.length === 1) {
      const [entry] = sourcePdfEntries;
      const pdfBlob = await fetchAsBlob(entry.url);
      triggerBrowserDownload({ blob: pdfBlob, filename: entry.fileName });
      return;
    }

    const zip = new JSZip();
    for (const entry of sourcePdfEntries) {
      const pdfBlob = await fetchAsBlob(entry.url);
      zip.file(entry.fileName, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerBrowserDownload({
      blob: zipBlob,
      filename: `${buildBundleName(page.id).replace(".zip", "")}-pdfs.zip`,
    });
  }

  async downloadPageBundle(page) {
    const zip = new JSZip();
    const sourcePdfEntries = resolveSourcePdfUrls(page.sourcePdfFiles);

    if (page.csvFile) {
      const csvRaw = await loadCsvRaw(page.csvFile);
      zip.file(page.csvFile, csvRaw);
    }

    for (const entry of sourcePdfEntries) {
      const pdfBlob = await fetchAsBlob(entry.url);
      zip.file(entry.fileName, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerBrowserDownload({
      blob: zipBlob,
      filename: buildBundleName(page.id),
    });
  }
}

export const sourceDocumentDownloadManager = new SourceDocumentDownloadManager();
