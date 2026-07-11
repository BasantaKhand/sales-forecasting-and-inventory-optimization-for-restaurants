// White card with a title header, used to wrap charts.
export default function ChartCard({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
