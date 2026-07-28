import { useEffect, useState } from "react";
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
import DataTable from "../common/DataTable";
import LoadingSpinner from "../common/LoadingSpinner";
import { useReports } from "../../hooks/useReports";
import { formatNPR, formatNumber } from "../../utils/format";

const YEARS = [2022, 2023, 2024];
const PERIODS = ["daily", "weekly", "monthly"];

export default function RevenueTab() {
  const reports = useReports();
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(2024);
  const [data, setData] = useState(null);
  const [yoy, setYoy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      reports.getRevenue(period, year),
      reports.getRevenue("monthly", year - 1),
    ])
      .then(([cur, prev]) => {
        if (!active) return;
        setData(cur);
        const curTotal = (cur.values || []).reduce((a, b) => a + b, 0);
        const prevTotal = (prev.values || []).reduce((a, b) => a + b, 0);
        setYoy(prevTotal ? ((curTotal - prevTotal) / prevTotal) * 100 : null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reports, period, year]);

  if (loading || !data) return <LoadingSpinner label="Loading revenue..." />;

  const chartData = data.labels.map((label, i) => ({
    label,
    revenue: data.values[i],
  }));
  const mom = data.growth_percentage?.[data.growth_percentage.length - 1] ?? 0;

  const tableRows = data.labels.map((label, i) => ({
    id: label,
    label,
    revenue: data.values[i],
    orders: data.orders?.[i],
    aov: data.avg_order_value?.[i],
    growth: data.growth_percentage?.[i],
  }));

  const columns = [
    { key: "label", label: period === "monthly" ? "Month" : period === "weekly" ? "Week" : "Date" },
    { key: "revenue", label: "Revenue", render: (r) => formatNPR(r.revenue) },
    { key: "orders", label: "Orders", render: (r) => formatNumber(r.orders) },
    { key: "aov", label: "Avg Order Value", render: (r) => formatNPR(r.aov) },
    {
      key: "growth",
      label: "Growth %",
      render: (r) => (
        <span className={r.growth >= 0 ? "text-green-600" : "text-red-600"}>
          {r.growth >= 0 ? "+" : ""}
          {Number(r.growth).toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-gray-100 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded px-3 py-1 text-sm capitalize ${
                period === p ? "bg-white shadow-sm" : "text-gray-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
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

      <ChartCard title={`Revenue (${year}, ${period})`}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={16} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
            <Tooltip formatter={(v) => [formatNPR(v), "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#1e3a5f" strokeWidth={2} fill="url(#revFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Month-over-Month Growth</p>
          <p className={`mt-1 text-2xl font-semibold ${mom >= 0 ? "text-green-600" : "text-red-600"}`}>
            {mom >= 0 ? "+" : ""}
            {Number(mom).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Year-over-Year Growth</p>
          <p className={`mt-1 text-2xl font-semibold ${(yoy ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {yoy == null ? "—" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`}
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={tableRows} emptyMessage="No revenue data" />
    </div>
  );
}
