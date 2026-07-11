import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../common/ChartCard";
import { formatNumber } from "../../utils/format";

// Horizontal bar chart of the top items by quantity.
export default function TopItemsChart({ data }) {
  return (
    <ChartCard title="Top 10 Items">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 16, bottom: 5, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="item_name"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v) => [formatNumber(v), "Quantity"]} />
          <Bar dataKey="total_qty" fill="#f97316" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
