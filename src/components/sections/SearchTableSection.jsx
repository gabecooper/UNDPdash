import TableRowDrilldown from "../tables/TableRowDrilldown";
import SearchableDataTable from "../tables/SearchableDataTable";

export default function SearchTableSection({
  viewModel,
  searchQuery,
  onSearchChange,
  emptyLabel = "No rows match this search.",
  controls = null,
  rows = null,
  totalRowCount = null,
}) {
  return (
    <SearchableDataTable
      title={viewModel.tableTitle}
      rows={rows ?? viewModel.tableRows}
      columns={viewModel.tableColumns}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={viewModel.searchPlaceholder}
      emptyLabel={emptyLabel}
      totalRowCount={totalRowCount ?? viewModel.totalRowCount}
      getRowKey={viewModel.getRowKey}
      getHoverLabel={viewModel.getHoverLabel}
      controls={controls}
      renderExpandedRow={viewModel.getRowDetail
        ? (row) => (
          <TableRowDrilldown
            detail={viewModel.getRowDetail(row)}
            currencyDisplay={viewModel.currencyDisplay}
          />
        )
        : null}
    />
  );
}
