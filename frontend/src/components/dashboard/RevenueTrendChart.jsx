import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../common/ChartCard";
import { formatNPR, formatShortDate } from "../../utils/format";

// Line chart of daily revenue over the last N days.
export default function RevenueTrendChart({ data }) {
  return (
    <ChartCard title="Revenue Trend (Last 30 Days)">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            width={40}
          />
          <Tooltip
            formatter={(v) => [formatNPR(v), "Revenue"]}
            labelFormatter={formatShortDate}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1e3a5f"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
