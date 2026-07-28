import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

// Manages forecast generation (single model or compare) and dropdown options.
export function useForecast() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [single, setSingle] = useState(null);
  const [compare, setCompare] = useState(null);
  const [mode, setMode] = useState("single");

  useEffect(() => {
    api.get("/sales/items").then((r) => setItems(r.data.items || [])).catch(() => {});
    api.get("/sales/categories").then((r) => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const generateForecast = useCallback(async (config) => {
    if (config.type === "item" && !config.item) {
      toast.error("Please select an item");
      return;
    }
    if (config.type === "category" && !config.category) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);
    setSingle(null);
    setCompare(null);
    try {
      if (config.model === "compare") {
        const params = { periods: config.periods };
        if (config.type === "item") params.item = config.item;
        if (config.type === "category") params.category = config.category;
        const { data } = await api.get("/forecast/compare", { params });
        setCompare(data);
        setMode("compare");
      } else {
        const params = { periods: config.periods, model: config.model };
        let url = "/forecast/overall";
        if (config.type === "item")
          url = `/forecast/item/${encodeURIComponent(config.item)}`;
        else if (config.type === "category")
          url = `/forecast/category/${encodeURIComponent(config.category)}`;
        const { data } = await api.get(url, { params });
        setSingle(data);
        setMode("single");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to generate forecast");
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, categories, loading, single, compare, mode, generateForecast };
}
