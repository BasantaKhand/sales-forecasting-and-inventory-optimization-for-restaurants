import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import KpiCards from "../components/dashboard/KpiCards";
import RevenueTrendChart from "../components/dashboard/RevenueTrendChart";
import TopItemsChart from "../components/dashboard/TopItemsChart";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import DailyOrdersChart from "../components/dashboard/DailyOrdersChart";
import RecentOrdersTable from "../components/dashboard/RecentOrdersTable";
import { CardSkeleton, BlockSkeleton } from "../components/common/Skeleton";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [state, setState] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, daily, recent, alerts, categories] = await Promise.all([
        api.get("/sales/summary"),
        api.get("/sales/daily-totals"),
        api.get("/sales", { params: { limit: 20, sort_by: "date", sort_order: "desc" } }),
        api.get("/inventory/alerts"),
        api.get("/reports/category-performance"),
      ]);

      const days = daily.data.data || [];
      const last30 = days.slice(-30);
      const today = days[days.length - 1] || { revenue: 0, order_count: 0 };
      const yesterday = days[days.length - 2] || { revenue: 0 };
      const revenueChange = yesterday.revenue
        ? ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100
        : 0;

      setState({
        kpis: {
          todayRevenue: today.revenue,
          todayOrders: today.order_count,
          avgOrderValue: today.order_count
            ? today.revenue / today.order_count
            : summary.data.avg_order_value || 0,
          activeAlerts: alerts.data.total || 0,
          revenueChange,
        },
        trend: last30,
        topItems: summary.data.top_items || [],
        categories: (categories.data.data || []).slice(0, 8),
        recentOrders: recent.data.data || [],
      });
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BlockSkeleton />
          <BlockSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={load}
          className="rounded-md bg-accent px-4 py-2 text-white hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KpiCards kpis={state.kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={state.trend} />
        <TopItemsChart data={state.topItems} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryPieChart data={state.categories} />
        <DailyOrdersChart data={state.trend} />
      </div>

      <RecentOrdersTable orders={state.recentOrders} />
    </div>
  );
}
