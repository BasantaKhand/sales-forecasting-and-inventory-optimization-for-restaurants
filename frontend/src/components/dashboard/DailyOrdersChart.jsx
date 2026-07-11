import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../common/ChartCard";
import { formatNumber, formatShortDate } from "../../utils/format";

// Filled area chart of daily order counts over the last N days.
export default function DailyOrdersChart({ data }) {
  return (
    <ChartCard title="Daily Orders (Last 30 Days)">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 12 }} width={36} />
          <Tooltip
            formatter={(v) => [formatNumber(v), "Orders"]}
            labelFormatter={formatShortDate}
          />
          <Area
            type="monotone"
            dataKey="order_count"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#ordersFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
