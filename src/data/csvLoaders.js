const csvLoaders = import.meta.glob("../../*.csv", {
  query: "?raw",
  import: "default",
});

function getLoader(filename) {
  const entry = Object.entries(csvLoaders).find(([path]) => path.endsWith(`/${filename}`));
  return entry?.[1] || null;
}

export async function loadCsvRaw(filename) {
  const loader = getLoader(filename);
  if (!loader) {
    throw new Error(`CSV file "${filename}" is not registered.`);
  }

  return loader();
}

export async function downloadCsv(filename) {
  const raw = await loadCsvRaw(filename);
  const blob = new Blob([raw], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
