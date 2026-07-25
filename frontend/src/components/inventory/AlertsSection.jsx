import { HiExclamationTriangle } from "react-icons/hi2";
import { formatNumber } from "../../utils/format";

// Bottom section listing items that need immediate reordering.
export default function AlertsSection({ alerts, onReorder }) {
  return (
    <div className="rounded-xl border-l-4 border-red-500 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-800">
        Items Needing Immediate Attention
      </h3>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-400">No items below reorder level.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md bg-red-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <HiExclamationTriangle className="text-lg text-red-500" />
                <span className="text-sm text-gray-700">
                  <strong>{a.item_name}</strong> — {formatNumber(a.current_stock)} units left
                  {a.days_until_stockout != null
                    ? `, stockout in ~${a.days_until_stockout} days`
                    : ""}
                </span>
              </div>
              <button
                onClick={() => onReorder(a)}
                className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-orange-600"
              >
                Reorder
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
