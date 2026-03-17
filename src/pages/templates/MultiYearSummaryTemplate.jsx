import TopBar from "../../components/layout/TopBar";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";

export default function MultiYearSummaryTemplate({ page, selectedYears, searchQuery, onSearchChange, onDownload, viewModel }) {
  return (
    <>
      <TopBar
        title={page.navLabel}
        meta={viewModel.meta}
        onDownload={onDownload}
        downloadDisabled={!page.supportsDownload}
      />

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
        height={Math.max(420, viewModel.groupedData.length * 38)}
        emptyLabel="No grouped totals are available for the current filters."
      />

      {viewModel.isMultiYearSelection ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 13 }}>
          <DeltaBarChartCard
            title={viewModel.primaryMovesTitle}
            data={viewModel.primaryMovesData}
            height={Math.max(340, viewModel.primaryMovesData.length * 34)}
            comparisonLabel={viewModel.comparisonLabel}
            emptyLabel="No movement is available across the selected years."
          />
          <DeltaBarChartCard
            title={viewModel.secondaryMovesTitle}
            data={viewModel.secondaryMovesData}
            height={Math.max(340, viewModel.secondaryMovesData.length * 34)}
            comparisonLabel={viewModel.comparisonLabel}
            emptyLabel="No movement is available across the selected years."
          />
        </div>
      ) : null}

      <SearchTableSection viewModel={viewModel} searchQuery={searchQuery} onSearchChange={onSearchChange} />
    </>
  );
}
