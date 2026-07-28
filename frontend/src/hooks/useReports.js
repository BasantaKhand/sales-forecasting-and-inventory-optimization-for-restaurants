import { useMemo } from "react";
import api from "../services/api";

// Centralizes the reports API. Each tab calls the fetcher it needs; the tab
// keeps its own UI state (period, year, selection).
export function useReports() {
  return useMemo(
    () => ({
      getRevenue: (period, year) =>
        api.get("/reports/revenue", { params: { period, year } }).then((r) => r.data),
      getTopItems: (limit = 20) =>
        api.get("/reports/top-items", { params: { limit } }).then((r) => r.data),
      getBottomItems: (limit = 10) =>
        api.get("/reports/bottom-items", { params: { limit } }).then((r) => r.data),
      getTrends: () => api.get("/reports/trends").then((r) => r.data),
      getCategoryPerformance: (year) =>
        api.get("/reports/category-performance", { params: { year } }).then((r) => r.data),
      getCategoryTrends: (year, top = 5) =>
        api.get("/reports/category-trends", { params: { year, top } }).then((r) => r.data),
      getItemDailyTotals: (itemName) =>
        api.get("/sales/daily-totals", { params: { item_name: itemName } }).then((r) => r.data),
      getItems: () => api.get("/sales/items").then((r) => r.data),
    }),
    []
  );
}
