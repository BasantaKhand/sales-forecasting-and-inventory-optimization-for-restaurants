import { HiArrowDownTray, HiArrowUpTray, HiXMark } from "react-icons/hi2";

const MEAL_PERIODS = [
  "Breakfast", "Late Morning", "Lunch", "Afternoon",
  "Snack Time", "Early Dinner", "Dinner", "Late Night",
];

// Filter bar for the sales page. All state is controlled by the parent.
export default function SalesFilters({
  filters,
  categories,
  onChange,
  onClear,
  onImport,
  onExport,
}) {
  function set(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const inputClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">Start Date</label>
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => set("start_date", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">End Date</label>
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => set("end_date", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">Category</label>
        <select
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
          className={inputClass}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">Meal Period</label>
        <select
          value={filters.meal_period}
          onChange={(e) => set("meal_period", e.target.value)}
          className={inputClass}
        >
          <option value="">All Periods</option>
          {MEAL_PERIODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-xs text-gray-500">Search Item</label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="e.g. Chicken"
          className={inputClass}
        />
      </div>

      <div className="ml-auto flex items-end gap-2">
        <button
          onClick={onImport}
          className="flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <HiArrowUpTray /> Import CSV
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <HiArrowDownTray /> Export CSV
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <HiXMark /> Clear
        </button>
      </div>
    </div>
  );
}
