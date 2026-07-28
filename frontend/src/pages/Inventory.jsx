import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { HiPlus, HiSparkles, HiArrowPath } from "react-icons/hi2";
import { useInventory } from "../hooks/useInventory";
import DataTable from "../components/common/DataTable";
import InventoryStatusCards from "../components/inventory/InventoryStatusCards";
import InventoryItemModal from "../components/inventory/InventoryItemModal";
import OptimizationPanel from "../components/inventory/OptimizationPanel";
import AlertsSection from "../components/inventory/AlertsSection";
import StatusBadge from "../components/inventory/StatusBadge";
import { formatNPR, formatNumber, formatDate } from "../utils/format";

export default function Inventory() {
  const { items, alerts, categories, allItems, loading, reload, updateItem, optimize } =
    useInventory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [sortBy, setSortBy] = useState("item_name");
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const x = a[sortBy];
      const y = b[sortBy];
      const cmp = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sortBy, sortOrder]);

  function handleSort(key) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortOrder("asc");
    }
  }

  async function runOptimize() {
    setOptimizeResult({ data: [] });
    setOptimizing(true);
    try {
      const { data } = await optimize();
      setOptimizeResult(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Optimization failed");
      setOptimizeResult(null);
    } finally {
      setOptimizing(false);
    }
  }

  async function applySuggestion(s) {
    try {
      await updateItem(s.id, {
        current_stock: Number(s.current_stock) + Number(s.suggested_order_qty),
      });
      toast.success(`Restocked ${s.item_name}`);
      await reload();
      await runOptimize();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to apply");
    }
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setModalOpen(true);
  }

  const columns = [
    { key: "item_name", label: "Item Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "current_stock", label: "Current Stock", sortable: true, render: (r) => formatNumber(r.current_stock) },
    { key: "reorder_level", label: "Reorder Level", sortable: true, render: (r) => formatNumber(r.reorder_level) },
    { key: "status", label: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: "unit_cost", label: "Unit Cost", sortable: true, render: (r) => formatNPR(r.unit_cost) },
    { key: "supplier", label: "Supplier" },
    { key: "updated_at", label: "Last Updated", render: (r) => formatDate(r.updated_at) },
  ];

  return (
    <div className="space-y-6">
      <InventoryStatusCards items={items} />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={openAdd}
          className="flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <HiPlus /> Add Item
        </button>
        <button
          onClick={runOptimize}
          className="flex items-center gap-1 rounded-md border border-sidebar px-4 py-2 text-sm font-medium text-sidebar hover:bg-blue-50"
        >
          <HiSparkles /> Auto-Optimize
        </button>
        <button
          onClick={reload}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <HiArrowPath /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sortedItems}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={openEdit}
          emptyMessage="No inventory items yet — click Add Item to get started"
        />
      )}

      {optimizeResult !== null && (
        <OptimizationPanel
          loading={optimizing}
          result={optimizeResult}
          onApply={applySuggestion}
        />
      )}

      <AlertsSection alerts={alerts} onReorder={openEdit} />

      <InventoryItemModal
        open={modalOpen}
        item={editing}
        items={allItems}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={reload}
      />
    </div>
  );
}
