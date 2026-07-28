import { useState } from "react";
import toast from "react-hot-toast";
import { useSales } from "../hooks/useSales";
import DataTable from "../components/common/DataTable";
import SalesFilters from "../components/sales/SalesFilters";
import SummaryBar from "../components/sales/SummaryBar";
import ImportCsvModal from "../components/sales/ImportCsvModal";
import { formatNPR, formatDate } from "../utils/format";

const COLUMNS = [
  { key: "order_id", label: "Order ID", sortable: true },
  { key: "date", label: "Date", sortable: true, render: (r) => formatDate(r.date) },
  { key: "time_slot", label: "Time Slot" },
  { key: "item_name", label: "Item Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "quantity", label: "Qty", sortable: true },
  { key: "unit_price_npr", label: "Unit Price", sortable: true, render: (r) => formatNPR(r.unit_price_npr) },
  { key: "total_price_npr", label: "Total", sortable: true, render: (r) => formatNPR(r.total_price_npr) },
  { key: "weather", label: "Weather" },
  { key: "order_type", label: "Order Type" },
];

export default function Sales() {
  const {
    filters, changeFilters, clearFilters,
    page, setPage, limit, changeLimit,
    sortBy, sortOrder, sortByColumn,
    data, total, pages, summary, loading,
    categories, fetchData, exportRows,
  } = useSales();

  const [importOpen, setImportOpen] = useState(false);

  async function exportCsv() {
    try {
      const rows = await exportRows();
      if (!rows.length) {
        toast("No data to export");
        return;
      }
      const headers = COLUMNS.map((c) => c.key);
      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales_export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} rows`);
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="space-y-4">
      <SalesFilters
        filters={filters}
        categories={categories}
        onChange={changeFilters}
        onClear={clearFilters}
        onImport={() => setImportOpen(true)}
        onExport={exportCsv}
      />

      <SummaryBar
        shown={data.length}
        total={total}
        revenue={summary.total_revenue}
        quantity={summary.total_quantity}
        limit={limit}
        onLimitChange={changeLimit}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={COLUMNS}
          data={data}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={sortByColumn}
          pagination={{ page, pages, total, onPageChange: setPage }}
          emptyMessage="No sales match the current filters"
        />
      )}

      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={fetchData}
      />
    </div>
  );
}
