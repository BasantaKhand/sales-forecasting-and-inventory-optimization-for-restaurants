import DataTable from "../common/DataTable";
import { formatNPR, formatDate } from "../../utils/format";

const COLUMNS = [
  { key: "order_id", label: "Order ID" },
  { key: "date", label: "Date", render: (r) => formatDate(r.date) },
  { key: "item_name", label: "Item" },
  { key: "category", label: "Category" },
  {
    key: "total_price_npr",
    label: "Total",
    render: (r) => formatNPR(r.total_price_npr),
  },
  { key: "order_type", label: "Order Type" },
];

// Table of the most recent orders shown on the dashboard.
export default function RecentOrdersTable({ orders }) {
  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-800">Recent Orders</h3>
      <DataTable columns={COLUMNS} data={orders} emptyMessage="No recent orders" />
    </div>
  );
}
