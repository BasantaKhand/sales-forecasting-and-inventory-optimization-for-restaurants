import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import DataTable from "../components/common/DataTable";
import SalesFilters from "../components/sales/SalesFilters";
import SummaryBar from "../components/sales/SummaryBar";
import ImportCsvModal from "../components/sales/ImportCsvModal";
import { formatNPR, formatDate } from "../utils/format";

const EMPTY_FILTERS = {
  start_date: "",
  end_date: "",
  category: "",
  meal_period: "",
  search: "",
};

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
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState({ total_revenue: 0, total_quantity: 0 });
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  // Build query params, dropping empty values. Search maps to item_name.
  const queryParams = useMemo(() => {
    const p = {};
    if (filters.start_date) p.start_date = filters.start_date;
    if (filters.end_date) p.end_date = filters.end_date;
    if (filters.category) p.category = filters.category;
    if (filters.meal_period) p.meal_period = filters.meal_period;
    if (filters.search) p.item_name = filters.search;
    return p;
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sales, sum] = await Promise.all([
        api.get("/sales", {
          params: { ...queryParams, page, limit, sort_by: sortBy, sort_order: sortOrder },
        }),
        api.get("/sales/summary", { params: queryParams }),
      ]);
      setData(sales.data.data || []);
      setTotal(sales.data.total || 0);
      setPages(sales.data.pages || 1);
      setSummary(sum.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [queryParams, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    const id = setTimeout(fetchData, filters.search ? 400 : 0);
    return () => clearTimeout(id);
  }, [fetchData, filters.search]);

  // Categories for the filter dropdown (reuse the reports endpoint).
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    api
      .get("/reports/category-performance")
      .then((res) =>
        setCategories(
          (res.data.data || []).map((c) => c.category).sort()
        )
      )
      .catch(() => setCategories([]));
  }, []);

  function handleFilterChange(next) {
    setFilters(next);
    setPage(1);
  }

  function handleSort(key) {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  async function exportCsv() {
    try {
      const res = await api.get("/sales", {
        params: { ...queryParams, page: 1, limit: 5000, sort_by: sortBy, sort_order: sortOrder },
      });
      const rows = res.data.data || [];
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
        onChange={handleFilterChange}
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
        onLimitChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
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
          onSort={handleSort}
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
