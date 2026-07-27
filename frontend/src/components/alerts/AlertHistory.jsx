import { useState } from "react";
import DataTable from "../common/DataTable";
import { timeAgo } from "../../utils/format";

// Collapsible table of dismissed/resolved alerts.
export default function AlertHistory({ resolved, dismissedBy, onRestore }) {
  const [open, setOpen] = useState(false);

  const columns = [
    { key: "timestamp", label: "Date", render: (r) => timeAgo(r.timestamp) },
    { key: "message", label: "Message" },
    { key: "severity", label: "Severity" },
    { key: "status", label: "Status", render: () => "Dismissed" },
    { key: "by", label: "Dismissed By", render: () => dismissedBy },
    {
      key: "action",
      label: "",
      render: (r) => (
        <button
          onClick={() => onRestore(r.id)}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Restore
        </button>
      ),
    },
  ];

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-sidebar hover:underline"
      >
        {open ? "Hide History" : `Show History (${resolved.length})`}
      </button>
      {open && (
        <div className="mt-3">
          <DataTable
            columns={columns}
            data={resolved}
            emptyMessage="No dismissed alerts"
          />
        </div>
      )}
    </div>
  );
}
