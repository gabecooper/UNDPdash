import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import PageStateCard from "../components/common/PageStateCard";
import PageTransitionPlaceholder from "../components/common/PageTransitionPlaceholder";
import { sourceDocumentDownloadManager } from "../data/download/SourceDocumentDownloadManager";
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
  return function DatasetPage({ page, selectedYears, currencyDisplay }) {
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
        currencyDisplay,
        ...(includeSelectedYears ? { selectedYears } : {}),
      });
    }, [currencyDisplay, datasetState.data, datasetState.status, deferredSearchQuery, page, selectedYears]);

    if (datasetState.status === "error") {
      return (
        <PageStateCard
          eyebrow="Load Error"
          title={`Could not load ${page.navLabel}`}
          description={datasetState.error?.message || "The page dataset could not be loaded."}
        />
      );
    }

    if (datasetState.status === "loading" || viewModel == null) {
      return <PageTransitionPlaceholder />;
    }

    return (
      <Template
        page={page}
        selectedYears={selectedYears}
        currencyDisplay={currencyDisplay}
        searchQuery={searchQuery}
        onSearchChange={(nextValue) => {
          startTransition(() => {
            setSearchQuery(nextValue);
          });
        }}
        onDownload={() => sourceDocumentDownloadManager.downloadPageBundle(page)}
        viewModel={viewModel}
      />
    );
  };
}
