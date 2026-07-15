import { formatNPR, formatNumber } from "../../utils/format";

// Compact bar showing how many records match and the filtered totals.
export default function SummaryBar({ shown, total, revenue, quantity, limit, onLimitChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <span>
          Showing <strong>{formatNumber(shown)}</strong> of{" "}
          <strong>{formatNumber(total)}</strong> records
        </span>
        <span>
          Total Revenue: <strong>{formatNPR(revenue)}</strong>
        </span>
        <span>
          Total Quantity: <strong>{formatNumber(quantity)}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Per page</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none"
        >
          {[25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
