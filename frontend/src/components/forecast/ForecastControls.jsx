import SearchableSelect from "../common/SearchableSelect";

const TYPES = [
  { key: "overall", label: "Overall Revenue" },
  { key: "item", label: "By Item" },
  { key: "category", label: "By Category" },
];
const PERIODS = [7, 14, 30];
const MODELS = [
  { key: "prophet", label: "Prophet" },
  { key: "arima", label: "ARIMA" },
  { key: "compare", label: "Compare Both" },
];

function Toggle({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-sidebar text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function ForecastControls({
  config,
  items,
  categories,
  onChange,
  onGenerate,
  loading,
}) {
  function set(field, value) {
    onChange({ ...config, [field]: value });
  }

  return (
    <div className="flex flex-wrap items-end gap-6 rounded-xl bg-white p-5 shadow-sm">
      <div>
        <p className="mb-1 text-xs text-gray-500">Forecast Type</p>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <Toggle
              key={t.key}
              active={config.type === t.key}
              onClick={() => set("type", t.key)}
            >
              {t.label}
            </Toggle>
          ))}
        </div>
      </div>

      {config.type === "item" && (
        <div>
          <p className="mb-1 text-xs text-gray-500">Item</p>
          <SearchableSelect
            options={items}
            value={config.item}
            onChange={(v) => set("item", v)}
            placeholder="Select item..."
          />
        </div>
      )}

      {config.type === "category" && (
        <div>
          <p className="mb-1 text-xs text-gray-500">Category</p>
          <SearchableSelect
            options={categories}
            value={config.category}
            onChange={(v) => set("category", v)}
            placeholder="Select category..."
          />
        </div>
      )}

      <div>
        <p className="mb-1 text-xs text-gray-500">Period</p>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Toggle
              key={p}
              active={config.periods === p}
              onClick={() => set("periods", p)}
            >
              {p} Days
            </Toggle>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs text-gray-500">Model</p>
        <div className="flex gap-2">
          {MODELS.map((m) => (
            <Toggle
              key={m.key}
              active={config.model === m.key}
              onClick={() => set("model", m.key)}
            >
              {m.label}
            </Toggle>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="ml-auto flex items-center gap-2 rounded-md bg-accent px-5 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {loading ? "Generating..." : "Generate Forecast"}
      </button>
    </div>
  );
}
