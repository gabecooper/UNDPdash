const sourcePdfUrlMap = import.meta.glob("../../input/*.pdf", {
  eager: true,
  query: "?url",
  import: "default",
});

function normalizeSourcePdfName(name) {
  return String(name || "").trim().toLowerCase();
}

function extractFileName(path) {
  return path.split("/").pop() || "";
}

export function getSourcePdfUrl(sourcePdfName) {
  const normalizedTargetName = normalizeSourcePdfName(sourcePdfName);
  const matchingEntry = Object.entries(sourcePdfUrlMap).find(([path]) => {
    const fileName = extractFileName(path);
    return normalizeSourcePdfName(fileName) === normalizedTargetName;
  });

  return matchingEntry?.[1] || null;
}

export function resolveSourcePdfUrls(sourcePdfFiles = []) {
  return sourcePdfFiles
    .map((fileName) => ({ fileName, url: getSourcePdfUrl(fileName) }))
    .filter((entry) => entry.url);
}
