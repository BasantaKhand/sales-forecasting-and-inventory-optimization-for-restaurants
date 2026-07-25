import {
  HiCube,
  HiExclamationCircle,
  HiXCircle,
  HiCheckCircle,
} from "react-icons/hi2";
import Card from "../common/Card";
import { formatNumber } from "../../utils/format";

// Four status summary cards derived from the inventory items list.
export default function InventoryStatusCards({ items }) {
  const total = items.length;
  const low = items.filter((i) => i.status === "Low").length;
  const critical = items.filter((i) => i.status === "Critical").length;
  const ok = items.filter((i) => i.status === "OK").length;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card
        icon={HiCube}
        title="Total Items"
        value={formatNumber(total)}
        accent="bg-blue-50 text-sidebar"
      />
      <Card
        icon={HiExclamationCircle}
        title="Low Stock"
        value={formatNumber(low)}
        accent="bg-orange-50 text-orange-600"
      />
      <Card
        icon={HiXCircle}
        title="Critical"
        value={formatNumber(critical)}
        accent="bg-red-50 text-red-600"
      />
      <Card
        icon={HiCheckCircle}
        title="Optimally Stocked"
        value={formatNumber(ok)}
        accent="bg-green-50 text-green-600"
      />
    </div>
  );
}
