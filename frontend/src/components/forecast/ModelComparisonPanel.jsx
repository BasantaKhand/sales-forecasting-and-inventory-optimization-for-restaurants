// Side-by-side Prophet vs ARIMA accuracy cards with a winner badge.
function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">
        {value == null ? "—" : value}
      </span>
    </div>
  );
}

function ModelCard({ title, metrics, borderColor, isWinner }) {
  return (
    <div className={`flex-1 rounded-xl border-2 bg-white p-5 shadow-sm ${borderColor}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        {isWinner && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            More Accurate
          </span>
        )}
      </div>
      <MetricRow label="RMSE" value={metrics?.rmse} />
      <MetricRow label="MAE" value={metrics?.mae} />
      <MetricRow label="MAPE" value={metrics?.mape != null ? `${metrics.mape}%` : null} />
    </div>
  );
}

export default function ModelComparisonPanel({ compare }) {
  if (!compare) return null;
  const winner = compare.winner;
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <ModelCard
        title="Prophet"
        metrics={compare.prophet}
        borderColor="border-sky-400"
        isWinner={winner === "prophet"}
      />
      <ModelCard
        title="ARIMA"
        metrics={compare.arima}
        borderColor="border-green-400"
        isWinner={winner === "arima"}
      />
    </div>
  );
}
