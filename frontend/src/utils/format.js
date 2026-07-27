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

// Relative time: "just now", "3 hours ago", "2 days ago".
export function timeAgo(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

// Short axis label: "Jun 15"
export function formatShortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
