import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export const EMPTY_SALES_FILTERS = {
  start_date: "",
  end_date: "",
  category: "",
  meal_period: "",
  search: "",
};

// Manages sales listing state: filters, sorting, pagination and fetching.
export function useSales() {
  const [filters, setFilters] = useState(EMPTY_SALES_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState({ total_revenue: 0, total_quantity: 0 });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const queryParams = useMemo(() => {
    const p = {};
    if (filters.start_date) p.start_date = filters.start_date;
    if (filters.end_date) p.end_date = filters.end_date;
    if (filters.category) p.category = filters.category;
    if (filters.meal_period) p.meal_period = filters.meal_period;
    if (filters.search) p.item_name = filters.search;
    return p;
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sales, sum] = await Promise.all([
        api.get("/sales", {
          params: { ...queryParams, page, limit, sort_by: sortBy, sort_order: sortOrder },
        }),
        api.get("/sales/summary", { params: queryParams }),
      ]);
      setData(sales.data.data || []);
      setTotal(sales.data.total || 0);
      setPages(sales.data.pages || 1);
      setSummary(sum.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [queryParams, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    const id = setTimeout(fetchData, filters.search ? 400 : 0);
    return () => clearTimeout(id);
  }, [fetchData, filters.search]);

  useEffect(() => {
    api
      .get("/sales/categories")
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  function changeFilters(next) {
    setFilters(next);
    setPage(1);
  }
  function clearFilters() {
    setFilters(EMPTY_SALES_FILTERS);
    setPage(1);
  }
  function sortByColumn(key) {
    if (sortBy === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  }
  function changeLimit(n) {
    setLimit(n);
    setPage(1);
  }

  async function exportRows() {
    const res = await api.get("/sales", {
      params: { ...queryParams, page: 1, limit: 5000, sort_by: sortBy, sort_order: sortOrder },
    });
    return res.data.data || [];
  }

  return {
    filters, changeFilters, clearFilters,
    page, setPage, limit, changeLimit,
    sortBy, sortOrder, sortByColumn,
    data, total, pages, summary, loading,
    categories, fetchData, exportRows,
  };
}
