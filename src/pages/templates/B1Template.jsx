import TopBar from "../../components/layout/TopBar";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import YearComparisonChartCard from "../../components/charts/YearComparisonChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";

export default function B1Template({ page, selectedYears, currencyDisplay, searchQuery, onSearchChange, onDownload, viewModel }) {
  return (
    <>
      <TopBar title={page.navLabel} meta={viewModel.meta} onDownload={onDownload} downloadDisabled={!page.supportsDownload} />

      <KpiTreemapSection
        kpis={viewModel.kpis}
        treemapTitle={viewModel.treemapTitle}
        treemapData={viewModel.treemapData}
        rows={3}
        treemapFirst={page.treemapFirst}
        currencyDisplay={currencyDisplay}
      />

      <GroupedBarChartCard
        title={viewModel.groupedTitle}
        data={viewModel.groupedData}
        selectedYears={selectedYears}
        currencyDisplay={currencyDisplay}
        height={Math.max(360, viewModel.groupedData.length * 34)}
        emptyLabel="No grouped totals are available for the current filters."
      />

      {viewModel.isMultiYearSelection ? (
        <>
          <YearComparisonChartCard
            title="Year-over-Year Totals"
            data={viewModel.yearComparisonData}
            height={280}
            currencyDisplay={currencyDisplay}
            emptyLabel="No yearly comparison is available for the selected years."
          />
          <DeltaBarChartCard
            title={viewModel.movesTitle}
            data={viewModel.movesData}
            height={Math.max(340, viewModel.movesData.length * 34)}
            comparisonLabel={viewModel.comparisonLabel}
            currencyDisplay={currencyDisplay}
            emptyLabel="No movement is available across the selected years."
          />
        </>
      ) : null}

      <SearchTableSection viewModel={viewModel} searchQuery={searchQuery} onSearchChange={onSearchChange} />
    </>
  );
}
