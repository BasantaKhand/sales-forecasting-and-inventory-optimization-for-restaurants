// Underline-style tab navigation with an orange active indicator.
export default function ReportTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-6 border-b">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
            active === t.key
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
