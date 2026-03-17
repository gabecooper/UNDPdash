import SearchableDataTable from "../tables/SearchableDataTable";

export default function SearchTableSection({
  viewModel,
  searchQuery,
  onSearchChange,
  emptyLabel = "No rows match this search.",
}) {
  return (
    <SearchableDataTable
      title={viewModel.tableTitle}
      rows={viewModel.tableRows}
      columns={viewModel.tableColumns}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={viewModel.searchPlaceholder}
      emptyLabel={emptyLabel}
      totalRowCount={viewModel.totalRowCount}
      getRowKey={viewModel.getRowKey}
      getHoverLabel={viewModel.getHoverLabel}
    />
  );
}
