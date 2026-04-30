import { useEffect, useMemo, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import DeltaBarChartCard from "../../components/charts/DeltaBarChartCard";
import YearComparisonChartCard from "../../components/charts/YearComparisonChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchableDataTable from "../../components/tables/SearchableDataTable";
import A4DepartmentChartCard from "../../components/a4/A4DepartmentChartCard";
import A4FilterDropdown from "../../components/a4/A4FilterDropdown";
import TableRowDrilldown from "../../components/tables/TableRowDrilldown";
import { filterRowsByQuery } from "../../data/selectors";
import { C } from "../../theme/tokens";
import { eyebrowStyle } from "../../theme/styles";

function getAgencyLabel(name) {
  if (!name || name === "None" || name === "Unspecified") return "Department Total";
  return name;
}

export default function A4Template({ page, selectedYears, currencyDisplay, searchQuery, onSearchChange, onDownload, viewModel }) {
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");
  const [selectedAgencies, setSelectedAgencies] = useState([]);

  const selectedDepartment = useMemo(
    () => viewModel.departmentOptions.find((department) => department.name === selectedDepartmentName) || null,
    [selectedDepartmentName, viewModel.departmentOptions]
  );
  const departmentDropdownOptions = useMemo(
    () => viewModel.departmentOptions.map((department) => ({
      value: department.name,
      label: department.name,
      meta: `${department.sector} • ${department.agencies.length} agencies`,
    })),
    [viewModel.departmentOptions]
  );
  const agencyDropdownOptions = useMemo(
    () => selectedDepartment
      ? selectedDepartment.agencies.map((agency) => ({
        value: agency.name,
        label: getAgencyLabel(agency.name),
        meta: `${agency.rowCount} line items`,
      }))
      : [],
    [selectedDepartment]
  );

  useEffect(() => {
    if (selectedDepartmentName && !selectedDepartment) {
      setSelectedDepartmentName("");
      setSelectedAgencies([]);
    }
  }, [selectedDepartment, selectedDepartmentName]);

  const baseFilteredRows = useMemo(() => {
    let rows = viewModel.allTableRows;

    if (selectedDepartmentName) {
      rows = rows.filter((row) => row.dimensions.dept === selectedDepartmentName);
    }

    if (selectedAgencies.length) {
      const selectedAgencySet = new Set(selectedAgencies);
      rows = rows.filter((row) => selectedAgencySet.has(row.dimensions.agency));
    }

    return rows;
  }, [selectedAgencies, selectedDepartmentName, viewModel.allTableRows]);

  const visibleRows = useMemo(
    () => filterRowsByQuery(baseFilteredRows, searchQuery, viewModel.searchKeys),
    [baseFilteredRows, searchQuery, viewModel.searchKeys]
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

      <A4DepartmentChartCard data={viewModel.departmentChartData} selectedYears={selectedYears} currencyDisplay={currencyDisplay} />

      {viewModel.isMultiYearSelection ? (
        <>
          <YearComparisonChartCard
            title="Year-over-Year Totals"
            data={viewModel.yearComparisonData}
            height={280}
            currencyDisplay={currencyDisplay}
            emptyLabel="No yearly comparison is available for the selected years."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 13 }}>
            <DeltaBarChartCard
              title="Biggest Moves by Department"
              data={viewModel.biggestDepartmentMoves}
              height={Math.max(340, viewModel.biggestDepartmentMoves.length * 34)}
              comparisonLabel={viewModel.comparisonLabel}
              currencyDisplay={currencyDisplay}
              emptyLabel="No department movers are available for the selected years."
            />
            <DeltaBarChartCard
              title="Biggest Moves by Agency"
              data={viewModel.biggestAgencyMoves}
              height={Math.max(340, viewModel.biggestAgencyMoves.length * 34)}
              comparisonLabel={viewModel.comparisonLabel}
              currencyDisplay={currencyDisplay}
              emptyLabel="No agency movers are available for the selected years."
            />
          </div>
        </>
      ) : null}

      <SearchableDataTable
        title={viewModel.tableTitle}
        rows={visibleRows}
        columns={viewModel.tableColumns}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder={viewModel.searchPlaceholder}
        emptyLabel="No rows match the current search and department filters."
        totalRowCount={baseFilteredRows.length}
        getRowKey={viewModel.getRowKey}
        getHoverLabel={viewModel.getHoverLabel}
        renderExpandedRow={(row) => (
          <TableRowDrilldown
            detail={viewModel.getRowDetail(row)}
            currencyDisplay={viewModel.currencyDisplay}
          />
        )}
        controls={(
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) auto",
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
              options={departmentDropdownOptions}
              selectedValues={selectedDepartmentName ? [selectedDepartmentName] : []}
              onChange={(values) => {
                const nextDepartment = values[0] || "";
                setSelectedDepartmentName(nextDepartment);
                setSelectedAgencies([]);
              }}
            />

            <A4FilterDropdown
              label="Agency"
              placeholder={selectedDepartment ? "Select one or more agencies" : "Choose a department first"}
              options={agencyDropdownOptions}
              selectedValues={selectedAgencies}
              onChange={setSelectedAgencies}
              multiple
              disabled={!selectedDepartment}
            />

            <button
              type="button"
              onClick={() => {
                setSelectedDepartmentName("");
                setSelectedAgencies([]);
              }}
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
        )}
      />
    </>
  );
}
