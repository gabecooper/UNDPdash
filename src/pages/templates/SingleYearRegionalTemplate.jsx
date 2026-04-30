import { useEffect, useMemo, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import A4FilterDropdown from "../../components/a4/A4FilterDropdown";
import GroupedBarChartCard from "../../components/charts/GroupedBarChartCard";
import KpiTreemapSection from "../../components/sections/KpiTreemapSection";
import SearchTableSection from "../../components/sections/SearchTableSection";
import { buildGroupedSeries, filterRowsByQuery } from "../../data/selectors";
import { C } from "../../theme/tokens";

export default function SingleYearRegionalTemplate({ page, currencyDisplay, searchQuery, onSearchChange, onDownload, viewModel }) {
  const [selectedPrimaryValue, setSelectedPrimaryValue] = useState("");
  const [selectedSecondaryValues, setSelectedSecondaryValues] = useState([]);
  const drilldown = viewModel.drilldown;
  const drilldownYears = viewModel.groupedYears;

  useEffect(() => {
    setSelectedPrimaryValue("");
    setSelectedSecondaryValues([]);
  }, [page.id]);

  const secondaryOptions = useMemo(
    () => (selectedPrimaryValue && drilldown?.secondaryOptionsByPrimary?.[selectedPrimaryValue]) || [],
    [drilldown, selectedPrimaryValue]
  );

  useEffect(() => {
    if (!drilldown?.hasSecondaryFilter || !selectedSecondaryValues.length) {
      return;
    }

    const allowed = new Set(secondaryOptions.map((option) => option.value));
    setSelectedSecondaryValues((current) => current.filter((value) => allowed.has(value)));
  }, [drilldown?.hasSecondaryFilter, secondaryOptions, selectedSecondaryValues.length]);

  const baseFilteredRows = useMemo(() => {
    if (!drilldown) {
      return viewModel.allTableRows || viewModel.tableRows;
    }

    let rows = viewModel.allTableRows;

    if (selectedPrimaryValue) {
      rows = rows.filter((row) => row.dimensions?.[drilldown.primaryKey] === selectedPrimaryValue);
    }

    if (drilldown.hasSecondaryFilter && selectedSecondaryValues.length) {
      const selectedSet = new Set(selectedSecondaryValues);
      rows = rows.filter((row) => selectedSet.has(row.dimensions?.[drilldown.secondaryKey]));
    }

    return rows;
  }, [drilldown, selectedPrimaryValue, selectedSecondaryValues, viewModel.allTableRows, viewModel.tableRows]);

  const visibleRows = useMemo(
    () => drilldown
      ? filterRowsByQuery(baseFilteredRows, searchQuery, viewModel.searchKeys)
      : viewModel.tableRows,
    [baseFilteredRows, drilldown, searchQuery, viewModel.searchKeys, viewModel.tableRows]
  );

  const drilldownChartData = useMemo(() => {
    if (!drilldown || !selectedPrimaryValue) {
      return [];
    }

    return buildGroupedSeries(
      baseFilteredRows,
      drilldown.breakdownDimensionKey,
      drilldownYears,
      Math.max(baseFilteredRows.length, 12)
    );
  }, [baseFilteredRows, drilldown, drilldownYears, selectedPrimaryValue]);

  const drilldownControls = drilldown ? (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: drilldown.hasSecondaryFilter
          ? "minmax(0, 1fr) minmax(0, 1fr) auto"
          : "minmax(0, 1fr) auto",
        gap: 12,
        padding: 14,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        background: "rgba(248,251,253,.88)",
        alignItems: "end",
      }}
    >
      <A4FilterDropdown
        label={drilldown.primaryLabel}
        placeholder={`Select ${drilldown.primaryLabel.toLowerCase()}`}
        options={drilldown.primaryOptions}
        selectedValues={selectedPrimaryValue ? [selectedPrimaryValue] : []}
        onChange={(values) => {
          setSelectedPrimaryValue(values[0] || "");
          setSelectedSecondaryValues([]);
        }}
      />

      {drilldown.hasSecondaryFilter ? (
        <A4FilterDropdown
          label={drilldown.secondaryLabel}
          placeholder={selectedPrimaryValue
            ? `Select one or more ${drilldown.secondaryLabel.toLowerCase()}`
            : `Choose a ${drilldown.primaryLabel.toLowerCase()} first`}
          options={secondaryOptions}
          selectedValues={selectedSecondaryValues}
          onChange={setSelectedSecondaryValues}
          multiple
          disabled={!selectedPrimaryValue}
        />
      ) : null}

      <button
        type="button"
        onClick={() => {
          setSelectedPrimaryValue("");
          setSelectedSecondaryValues([]);
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
  ) : null;

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
        selectedYears={viewModel.groupedYears}
        currencyDisplay={currencyDisplay}
        height={Math.max(360, viewModel.groupedData.length * 34)}
        emptyLabel="No grouped totals are available for this dataset."
      />

      {drilldown ? (
        <GroupedBarChartCard
          title={drilldown.title}
          data={drilldownChartData}
          selectedYears={drilldownYears}
          currencyDisplay={currencyDisplay}
          height={Math.max(320, drilldownChartData.length * 34)}
          emptyLabel={drilldown.emptyLabel}
        />
      ) : null}

      <SearchTableSection
        viewModel={viewModel}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        controls={drilldownControls}
        rows={visibleRows}
        totalRowCount={drilldown ? baseFilteredRows.length : viewModel.totalRowCount}
        emptyLabel={drilldown ? "No rows match the current search and drilldown filters." : "No rows match this search."}
      />
    </>
  );
}
