import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

// Fetches and derives all dashboard data (KPIs, charts, recent orders).
export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
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

      setData({
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
      setError(err.response?.data?.error || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
