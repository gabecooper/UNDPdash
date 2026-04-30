import TopBar from "../../components/layout/TopBar";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import YearComparisonChartCard from "../../components/charts/YearComparisonChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";

export default function ClimateTemplate({ page, selectedYears, currencyDisplay, searchQuery, onSearchChange, onDownload, viewModel }) {
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 13 }}>
        <GroupedBarChartCard
          title={viewModel.primaryChartTitle}
          data={viewModel.primaryChartData}
          selectedYears={selectedYears}
          currencyDisplay={currencyDisplay}
          height={Math.max(360, viewModel.primaryChartData.length * 34)}
          emptyLabel="No grouped totals are available for the current filters."
        />
        <GroupedBarChartCard
          title={viewModel.secondaryChartTitle}
          data={viewModel.secondaryChartData}
          selectedYears={selectedYears}
          currencyDisplay={currencyDisplay}
          height={Math.max(360, viewModel.secondaryChartData.length * 34)}
          emptyLabel="No climate typology totals are available for the current filters."
        />
      </div>

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
