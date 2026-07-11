// Formatting helpers shared across pages.

export function formatNPR(value) {
  const n = Number(value) || 0;
  return "NPR " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-IN");
}

// "2024-06-15T00:00:00" or "2024-06-15" -> "Jun 15, 2024"
export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Short axis label: "Jun 15"
export function formatShortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
