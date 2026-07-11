import {
  HiCurrencyRupee,
  HiShoppingCart,
  HiCalculator,
  HiExclamationTriangle,
} from "react-icons/hi2";
import Card from "../common/Card";
import { formatNPR, formatNumber } from "../../utils/format";

// Renders the four top-row KPI cards from the derived dashboard stats.
export default function KpiCards({ kpis }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card
        icon={HiCurrencyRupee}
        title="Today's Revenue"
        value={formatNPR(kpis.todayRevenue)}
        change={kpis.revenueChange}
        accent="bg-green-50 text-green-600"
      />
      <Card
        icon={HiShoppingCart}
        title="Orders Today"
        value={formatNumber(kpis.todayOrders)}
        accent="bg-blue-50 text-sidebar"
      />
      <Card
        icon={HiCalculator}
        title="Avg Order Value"
        value={formatNPR(kpis.avgOrderValue)}
        accent="bg-purple-50 text-purple-600"
      />
      <Card
        icon={HiExclamationTriangle}
        title="Active Alerts"
        value={formatNumber(kpis.activeAlerts)}
        accent="bg-red-50 text-red-600"
      />
    </div>
  );
}
