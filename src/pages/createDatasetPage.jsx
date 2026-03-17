import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import PageStateCard from "../components/common/PageStateCard";
import { downloadCsv } from "../data/csvLoaders";
import { useDataset } from "../hooks/useDataset";

/**
 * @param {{
 *   template: React.ComponentType<any>,
 *   buildViewModel: (args: any) => any,
 *   includeSelectedYears?: boolean,
 *   loadingDescription?: string,
 * }} config
 */
export function createDatasetPage({
  template: Template,
  buildViewModel,
  includeSelectedYears = true,
  loadingDescription = "The page dataset is loading on demand for this route.",
}) {
  return function DatasetPage({ page, selectedYears }) {
    const [searchQuery, setSearchQuery] = useState("");
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const datasetState = useDataset(page);

    useEffect(() => {
      setSearchQuery("");
    }, [page.id]);

    const viewModel = useMemo(() => {
      if (datasetState.status !== "success" || !datasetState.data) return null;

      return buildViewModel({
        dataset: datasetState.data,
        page,
        searchQuery: deferredSearchQuery,
        ...(includeSelectedYears ? { selectedYears } : {}),
      });
    }, [datasetState.data, datasetState.status, deferredSearchQuery, page, selectedYears]);

    if (datasetState.status === "loading" || viewModel == null) {
      return (
        <PageStateCard
          eyebrow="Loading"
          title={`Loading ${page.navLabel}`}
          description={loadingDescription}
        />
      );
    }

    if (datasetState.status === "error") {
      return (
        <PageStateCard
          eyebrow="Load Error"
          title={`Could not load ${page.navLabel}`}
          description={datasetState.error?.message || "The page dataset could not be loaded."}
        />
      );
    }

    return (
      <Template
        page={page}
        selectedYears={selectedYears}
        searchQuery={searchQuery}
        onSearchChange={(nextValue) => {
          startTransition(() => {
            setSearchQuery(nextValue);
          });
        }}
        onDownload={() => downloadCsv(page.csvFile)}
        viewModel={viewModel}
      />
    );
  };
}
