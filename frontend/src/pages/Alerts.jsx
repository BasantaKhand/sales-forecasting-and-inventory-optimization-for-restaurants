import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiCheckCircle } from "react-icons/hi2";
import { useAlerts } from "../hooks/useAlerts";
import { useAuth } from "../hooks/useAuth";
import AlertCard from "../components/alerts/AlertCard";
import AlertHistory from "../components/alerts/AlertHistory";
import LoadingSpinner from "../components/common/LoadingSpinner";

const FILTERS = [
  { key: "All", label: "All" },
  { key: "Critical", label: "Critical" },
  { key: "Warning", label: "Warning" },
  { key: "Info", label: "Info" },
  { key: "Resolved", label: "Resolved" },
];

export default function Alerts() {
  const { active, resolved, counts, loading, dismiss, restore } = useAlerts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  const badgeFor = (key) => {
    if (key === "Critical") return counts.critical;
    if (key === "Warning") return counts.warning;
    if (key === "Info") return counts.info;
    if (key === "Resolved") return counts.resolved;
    return counts.total;
  };

  const visible =
    filter === "All"
      ? active
      : filter === "Resolved"
      ? resolved
      : active.filter((a) => a.severity === filter);

  if (loading) return <LoadingSpinner label="Loading alerts..." />;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="rounded-xl bg-white p-4 text-sm shadow-sm">
        <span className="font-medium text-red-600">{counts.critical} Critical</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-medium text-orange-600">{counts.warning} Warning</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-medium text-sky-600">{counts.info} Info</span>
        <span className="ml-1 text-gray-500">alerts active</span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-sidebar text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 text-xs ${
                filter === f.key ? "bg-white/20" : "bg-gray-300 text-gray-700"
              }`}
            >
              {badgeFor(f.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <HiCheckCircle className="mb-3 text-5xl text-green-500" />
          <p className="text-gray-600">All systems optimal — no alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              resolved={filter === "Resolved"}
              onDismiss={() => dismiss(a.id)}
              onViewItem={() => navigate("/inventory")}
            />
          ))}
        </div>
      )}

      {/* History */}
      <AlertHistory
        resolved={resolved}
        dismissedBy={user?.username || "You"}
        onRestore={restore}
      />
    </div>
  );
}
