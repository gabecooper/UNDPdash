import TopBar from "../../components/layout/TopBar";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";

export default function B2Template({ page, selectedYears, searchQuery, onSearchChange, onDownload, viewModel }) {
  return (
    <>
      <TopBar title={page.navLabel} meta={viewModel.meta} onDownload={onDownload} downloadDisabled={!page.supportsDownload} />

      <KpiTreemapSection
        kpis={viewModel.kpis}
        treemapTitle={viewModel.treemapTitle}
        treemapData={viewModel.treemapData}
        rows={3}
        treemapFirst={page.treemapFirst}
      />

      <GroupedBarChartCard
        title={viewModel.groupedTitle}
        data={viewModel.groupedData}
        selectedYears={selectedYears}
        height={Math.max(360, viewModel.groupedData.length * 34)}
        emptyLabel="No grouped totals are available for the current filters."
      />

      {viewModel.isMultiYearSelection ? (
        <DeltaBarChartCard
          title={viewModel.movesTitle}
          data={viewModel.movesData}
          height={Math.max(340, viewModel.movesData.length * 34)}
          comparisonLabel={viewModel.comparisonLabel}
          emptyLabel="No movement is available across the selected years."
        />
      ) : null}

      <SearchTableSection viewModel={viewModel} searchQuery={searchQuery} onSearchChange={onSearchChange} />
    </>
  );
}
