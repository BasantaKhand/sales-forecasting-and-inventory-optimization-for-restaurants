import { HiArrowTrendingDown, HiArrowTrendingUp } from "react-icons/hi2";

// Reusable stat card: icon, title, value, and optional change percentage.
export default function Card({ icon: Icon, title, value, change, accent }) {
  const hasChange = change !== undefined && change !== null;
  const positive = hasChange && change >= 0;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
        </div>
        {Icon && (
          <span
            className={`rounded-lg p-2 text-xl ${
              accent || "bg-blue-50 text-sidebar"
            }`}
          >
            <Icon />
          </span>
        )}
      </div>
      {hasChange && (
        <div
          className={`mt-3 flex items-center gap-1 text-sm ${
            positive ? "text-green-600" : "text-red-600"
          }`}
        >
          {positive ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
          <span>{Math.abs(change).toFixed(1)}%</span>
          <span className="text-gray-400">vs previous</span>
        </div>
      )}
    </div>
  );
}
