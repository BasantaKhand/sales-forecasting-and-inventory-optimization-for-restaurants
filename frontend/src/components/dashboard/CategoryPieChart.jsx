import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ChartCard from "../common/ChartCard";
import { formatNPR } from "../../utils/format";

const COLORS = [
  "#1e3a5f", "#f97316", "#0ea5e9", "#22c55e", "#a855f7",
  "#eab308", "#ef4444", "#14b8a6",
];

// Donut chart of revenue share by top categories.
export default function CategoryPieChart({ data }) {
  return (
    <ChartCard title="Revenue by Category">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total_revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [formatNPR(v), name]} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            layout="horizontal"
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
