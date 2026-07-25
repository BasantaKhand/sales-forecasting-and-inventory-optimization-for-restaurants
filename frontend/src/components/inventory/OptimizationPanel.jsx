import DataTable from "../common/DataTable";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatNPR, formatNumber } from "../../utils/format";

// Shows forecast-driven reorder suggestions returned by /inventory/optimize.
export default function OptimizationPanel({ loading, result, onApply }) {
  const columns = [
    { key: "item_name", label: "Item Name" },
    { key: "current_stock", label: "Current Stock", render: (r) => formatNumber(r.current_stock) },
    {
      key: "forecasted_demand_7d",
      label: "Forecast Demand (7d)",
      render: (r) => formatNumber(r.forecasted_demand_7d),
    },
    {
      key: "suggested_order_qty",
      label: "Suggested Order",
      render: (r) => formatNumber(r.suggested_order_qty),
    },
    { key: "estimated_cost", label: "Est. Cost", render: (r) => formatNPR(r.estimated_cost) },
    {
      key: "action",
      label: "",
      render: (r) => (
        <button
          onClick={() => onApply(r)}
          className="rounded border border-accent px-2 py-1 text-xs text-accent hover:bg-orange-50"
        >
          Apply
        </button>
      ),
    },
  ];

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-800">
        Optimization Suggestions (Based on 7-Day Forecast)
      </h3>
      {loading ? (
        <LoadingSpinner label="Computing suggestions..." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={result?.data || []}
            emptyMessage="All items are sufficiently stocked — no reorders needed"
          />
          {result?.data?.length > 0 && (
            <p className="mt-3 text-right text-sm text-gray-600">
              Total estimated cost:{" "}
              <strong>{formatNPR(result.total_estimated_cost)}</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
}
