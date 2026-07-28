import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

// Encapsulates inventory data and CRUD/optimize operations.
export function useInventory() {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, alertRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/inventory/alerts"),
      ]);
      setItems(inv.data.data || []);
      setAlerts(alertRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    api.get("/sales/categories").then((r) => setCategories(r.data.categories || [])).catch(() => {});
    api.get("/sales/items").then((r) => setAllItems(r.data.items || [])).catch(() => {});
  }, [reload]);

  const addItem = (payload) => api.post("/inventory", payload);
  const updateItem = (id, payload) => api.put(`/inventory/${id}`, payload);
  const deleteItem = (id) => api.delete(`/inventory/${id}`);
  const optimize = (periods = 7) =>
    api.post("/inventory/optimize", null, { params: { periods } });

  return {
    items,
    alerts,
    categories,
    allItems,
    loading,
    reload,
    addItem,
    updateItem,
    deleteItem,
    optimize,
  };
}
