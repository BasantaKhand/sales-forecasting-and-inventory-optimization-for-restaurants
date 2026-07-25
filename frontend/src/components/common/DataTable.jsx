import { HiChevronDown, HiChevronUp } from "react-icons/hi2";

/**
 * Reusable table.
 * @param columns [{ key, label, render?, sortable? }]
 * @param data    array of row objects
 * @param sortBy / sortOrder / onSort  optional controlled sorting
 * @param pagination optional { page, pages, total, onPageChange }
 */
export default function DataTable({
  columns,
  data,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  pagination,
  emptyMessage = "No data available",
}) {
  function headerClick(col) {
    if (col.sortable && onSort) onSort(col.key);
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => headerClick(col)}
                  className={`px-4 py-3 font-medium ${
                    col.sortable ? "cursor-pointer select-none" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      sortOrder === "asc" ? (
                        <HiChevronUp />
                      ) : (
                        <HiChevronDown />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`${i % 2 ? "bg-gray-50" : "bg-white"} ${
                    onRowClick ? "cursor-pointer hover:bg-blue-50" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-600">
          <span>
            Page {pagination.page} of {pagination.pages || 1}
            {pagination.total != null && ` — ${pagination.total} records`}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={pagination.page >= (pagination.pages || 1)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
