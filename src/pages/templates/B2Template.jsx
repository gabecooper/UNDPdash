import { useEffect, useMemo, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import A4FilterDropdown from "../../components/a4/A4FilterDropdown";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import YearComparisonChartCard from "../../components/charts/YearComparisonChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";
import { buildGroupedSeries, filterRowsByQuery } from "../../data/selectors";
import { C } from "../../theme/tokens";

export default function B2Template({ page, selectedYears, currencyDisplay, searchQuery, onSearchChange, onDownload, viewModel }) {
  const [selectedDepartment, setSelectedDepartment] = useState("");

  useEffect(() => {
    setSelectedDepartment("");
  }, [page.id]);

  const baseFilteredRows = useMemo(() => (
    selectedDepartment
      ? viewModel.allTableRows.filter((row) => row.dimensions?.deptName === selectedDepartment)
      : viewModel.allTableRows
  ), [selectedDepartment, viewModel.allTableRows]);

  const visibleRows = useMemo(
    () => filterRowsByQuery(baseFilteredRows, searchQuery, viewModel.searchKeys),
    [baseFilteredRows, searchQuery, viewModel.searchKeys]
  );

  const selectedDepartmentCategoryData = useMemo(() => {
    if (!selectedDepartment) return [];

    const categories = [
      {
        name: "Current Operating Expenditures",
        predicate: (row) => row.dimensions?.expenseClass !== "Capital Outlays",
      },
      {
        name: "Capital Outlays",
        predicate: (row) => row.dimensions?.expenseClass === "Capital Outlays",
      },
    ];

    return categories.map((category) => {
      const series = { name: category.name };
      selectedYears.forEach((year) => {
        series[year] = baseFilteredRows.reduce(
          (sum, row) => sum + (category.predicate(row) ? row.valuesByYear?.[year] || 0 : 0),
          0
        );
      });
      return series;
    });
  }, [baseFilteredRows, selectedDepartment, selectedYears]);

  const selectedDepartmentObjectData = useMemo(
    () => selectedDepartment
      ? buildGroupedSeries(baseFilteredRows, "objectExpenditure", selectedYears, Math.max(baseFilteredRows.length, 12))
      : [],
    [baseFilteredRows, selectedDepartment, selectedYears]
  );

  const controls = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 12,
        padding: 14,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        background: "rgba(248,251,253,.88)",
        alignItems: "end",
      }}
    >
      <A4FilterDropdown
        label="Department"
        placeholder="Select a department"
        options={viewModel.departmentOptions}
        selectedValues={selectedDepartment ? [selectedDepartment] : []}
        onChange={(values) => setSelectedDepartment(values[0] || "")}
      />

      <button
        type="button"
        onClick={() => setSelectedDepartment("")}
        style={{
          minHeight: 44,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          background: "rgba(255,255,255,.92)",
          color: C.muted,
          padding: "10px 14px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        Clear Filters
      </button>
    </div>
  );

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
        title="Current Operating Expenditures vs Capital Outlays"
        data={viewModel.categoryBreakdownData}
        selectedYears={selectedYears}
        currencyDisplay={currencyDisplay}
        height={280}
        emptyLabel="No grouped totals are available for the current filters."
      />

      <GroupedBarChartCard
        title={viewModel.groupedTitle}
        data={viewModel.groupedData}
        selectedYears={selectedYears}
        currencyDisplay={currencyDisplay}
        height={Math.max(360, viewModel.groupedData.length * 34)}
        emptyLabel="No grouped totals are available for the current filters."
      />

      {selectedDepartment ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 13 }}>
          <GroupedBarChartCard
            title={`${selectedDepartment} Spending Structure`}
            data={selectedDepartmentCategoryData}
            selectedYears={selectedYears}
            currencyDisplay={currencyDisplay}
            height={280}
            emptyLabel="No expenditure structure is available for the selected department."
          />
          <GroupedBarChartCard
            title={`${selectedDepartment} Object Expenditures`}
            data={selectedDepartmentObjectData}
            selectedYears={selectedYears}
            currencyDisplay={currencyDisplay}
            height={Math.max(320, selectedDepartmentObjectData.length * 34)}
            emptyLabel="No object expenditures are available for the selected department."
          />
        </div>
      ) : null}

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

      <SearchTableSection
        viewModel={viewModel}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        controls={controls}
        rows={visibleRows}
        totalRowCount={baseFilteredRows.length}
        emptyLabel="No rows match the current search and department filters."
      />
    </>
  );
}
