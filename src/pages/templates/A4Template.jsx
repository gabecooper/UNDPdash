import TopBar from "../../components/layout/TopBar";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";

export default function A4Template({ page, selectedYears, searchQuery, onSearchChange, onDownload, viewModel }) {
  return (
    <>
      <TopBar title={page.navLabel} meta={viewModel.meta} onDownload={onDownload} downloadDisabled={!page.supportsDownload} />

      <KpiTreemapSection
        kpis={viewModel.kpis}
        treemapTitle="Expenditure by Department"
        treemapData={viewModel.departmentTreemapData}
        rows={3}
        treemapFirst={page.treemapFirst}
      />

      <GroupedBarChartCard
        title="Top 10 Agencies"
        data={viewModel.topAgencyData}
        selectedYears={selectedYears}
        height={Math.max(420, viewModel.topAgencyData.length * 38)}
        xScale="log"
        emptyLabel="No agency totals are available for the current filters."
      />

      {viewModel.isMultiYearSelection ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 13 }}>
          <DeltaBarChartCard
            title="Biggest Moves by Department"
            data={viewModel.biggestDepartmentMoves}
            height={Math.max(340, viewModel.biggestDepartmentMoves.length * 34)}
            comparisonLabel={viewModel.comparisonLabel}
            emptyLabel="No department movers are available for the selected years."
          />
          <DeltaBarChartCard
            title="Biggest Moves by Agency"
            data={viewModel.biggestAgencyMoves}
            height={Math.max(340, viewModel.biggestAgencyMoves.length * 34)}
            comparisonLabel={viewModel.comparisonLabel}
            emptyLabel="No agency movers are available for the selected years."
          />
        </div>
      ) : null}

      <SearchTableSection viewModel={viewModel} searchQuery={searchQuery} onSearchChange={onSearchChange} />
    </>
  );
}
