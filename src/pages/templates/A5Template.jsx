import TopBar from "../../components/layout/TopBar";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import YearComparisonChartCard from "../../components/charts/YearComparisonChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";

export default function A5Template({ page, selectedYears, currencyDisplay, searchQuery, onSearchChange, onDownload, viewModel }) {
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 13,
        }}
      >
        {viewModel.categoryCharts.map((chart) => (
          <GroupedBarChartCard
            key={chart.key}
            title={chart.title}
            data={chart.data}
            selectedYears={selectedYears}
            currencyDisplay={currencyDisplay}
            height={chart.height}
            emptyLabel={chart.emptyLabel}
            headerCenter={chart.note ? (
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(118,194,201,.35)",
                  background: "rgba(118,194,201,.12)",
                  fontSize: 10,
                  color: "#5a6f8e",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {chart.note}
              </div>
            ) : null}
          />
        ))}
      </div>

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
