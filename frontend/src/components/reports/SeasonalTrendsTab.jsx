import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";
import ChartCard from "../common/ChartCard";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatNPR } from "../../utils/format";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function SeasonalTrendsTab() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports/trends")
      .then((r) => setTrends(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !trends) return <LoadingSpinner label="Loading trends..." />;

  const monthly = (trends.monthly_pattern || []).map((m) => ({
    month: MONTH_NAMES[m.month] || m.month,
    avg_revenue: m.avg_revenue,
  }));

  const festival = (trends.festival_impact || []).map((f) => ({
    festival: f.festival,
    During: f.avg_revenue_during,
    Normal: f.avg_revenue_normal,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="Revenue by Day of Week">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trends.day_of_week}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
            <Tooltip formatter={(v) => [formatNPR(v), "Avg Revenue"]} />
            <Bar dataKey="avg_revenue" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Pattern">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
            <Tooltip formatter={(v) => [formatNPR(v), "Avg Revenue"]} />
            <Line type="monotone" dataKey="avg_revenue" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Festival Impact">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={festival}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="festival" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
            <Tooltip formatter={(v) => formatNPR(v)} />
            <Legend />
            <Bar dataKey="During" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Normal" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Weather Impact">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trends.weather_impact}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="weather" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
            <Tooltip formatter={(v) => [formatNPR(v), "Avg Revenue"]} />
            <Bar dataKey="avg_revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
