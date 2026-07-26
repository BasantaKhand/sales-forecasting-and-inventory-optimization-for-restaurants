import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";
import ChartCard from "../common/ChartCard";
import DataTable from "../common/DataTable";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatNPR, formatNumber } from "../../utils/format";

const COLORS = [
  "#1e3a5f", "#f97316", "#0ea5e9", "#22c55e", "#a855f7",
  "#eab308", "#ef4444", "#14b8a6", "#ec4899", "#64748b",
];
const YEARS = [2022, 2023, 2024];

export default function CategoryAnalysisTab() {
  const [year, setYear] = useState(2024);
  const [perf, setPerf] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total_revenue");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/reports/category-performance", { params: { year } }),
      api.get("/reports/category-trends", { params: { year, top: 5 } }),
    ])
      .then(([p, t]) => {
        setPerf(p.data.data || []);
        setTrends(t.data);
      })
      .finally(() => setLoading(false));
  }, [year]);

  if (loading || !trends) return <LoadingSpinner label="Loading categories..." />;

  const pieData = perf.slice(0, 10);

  // Build multi-line rows: [{ month, cat1, cat2, ... }]
  const lineRows = (trends.months || []).map((month, i) => {
    const row = { month };
    trends.series.forEach((s) => {
      row[s.category] = s.values[i];
    });
    return row;
  });

  const sortedPerf = [...perf].sort((a, b) => {
    const x = a[sortBy];
    const y = b[sortBy];
    const cmp = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
    return sortOrder === "asc" ? cmp : -cmp;
  });

  function handleSort(key) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortOrder("desc");
    }
  }

  const columns = [
    { key: "category", label: "Category", sortable: true },
    { key: "total_revenue", label: "Revenue", sortable: true, render: (r) => formatNPR(r.total_revenue) },
    { key: "total_quantity", label: "Quantity", sortable: true, render: (r) => formatNumber(r.total_quantity) },
    { key: "avg_price", label: "Avg Price", sortable: true, render: (r) => formatNPR(r.avg_price) },
    {
      key: "mom_growth",
      label: "Growth %",
      sortable: true,
      render: (r) => (
        <span className={r.mom_growth >= 0 ? "text-green-600" : "text-red-600"}>
          {r.mom_growth >= 0 ? "+" : ""}
          {Number(r.mom_growth).toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Share (Top 10)">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="total_revenue" nameKey="category" cx="50%" cy="50%" outerRadius={100}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [formatNPR(v), n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 Category Trends (Monthly)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineRows} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} minTickGap={16} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
              <Tooltip formatter={(v) => formatNPR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {trends.series.map((s, i) => (
                <Line
                  key={s.category}
                  type="monotone"
                  dataKey={s.category}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-gray-800">Category Performance</h3>
        <DataTable
          columns={columns}
          data={sortedPerf}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No category data"
        />
      </div>
    </div>
  );
}
