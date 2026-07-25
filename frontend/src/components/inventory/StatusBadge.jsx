const STYLES = {
  OK: "bg-green-100 text-green-700",
  Low: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
