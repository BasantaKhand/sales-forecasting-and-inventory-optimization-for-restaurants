import { createContext, useCallback, useEffect, useState } from "react";
import api from "../services/api";

export const AlertsContext = createContext(null);

const DISMISSED_KEY = "dismissed_alerts";

function loadDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

// Derives alerts from inventory status + demand forecasts, and tracks which
// have been dismissed (persisted to localStorage). Shared by the Alerts page
// and the header notification bell.
export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, alertRes, demand] = await Promise.all([
        api.get("/inventory"),
        api.get("/inventory/alerts"),
        api.get("/forecast/top-demand", { params: { periods: 7 } }),
      ]);

      const stockout = {};
      (alertRes.data.data || []).forEach((a) => {
        stockout[a.id] = a.days_until_stockout;
      });

      const built = [];
      (inv.data.data || []).forEach((item) => {
        if (item.status === "Critical") {
          const d = stockout[item.id];
          built.push({
            id: `inv-${item.id}`,
            severity: "Critical",
            itemId: item.id,
            title: `${item.item_name} running low`,
            message: `${item.item_name} running low — ${item.current_stock} units left${
              d != null ? `, stockout in ~${d} days` : ""
            }`,
            details: `Reorder level ${item.reorder_level} · Supplier: ${item.supplier || "N/A"}`,
            timestamp: item.updated_at,
            item,
          });
        } else if (item.status === "Low") {
          built.push({
            id: `inv-${item.id}`,
            severity: "Warning",
            itemId: item.id,
            title: `${item.item_name} stock declining`,
            message: `${item.item_name} stock declining — consider reordering (${item.current_stock} units left)`,
            details: `Reorder level ${item.reorder_level} · Supplier: ${item.supplier || "N/A"}`,
            timestamp: item.updated_at,
            item,
          });
        }
      });

      (demand.data.data || []).forEach((d) => {
        built.push({
          id: `demand-${d.item_name}`,
          severity: "Info",
          title: `High demand expected: ${d.item_name}`,
          message: `High demand expected for ${d.item_name} next week — forecasted ${d.predicted_total_demand} units`,
          details: `Average ~${d.avg_daily} units/day`,
          timestamp: new Date().toISOString(),
        });
      });

      setAlerts(built);
    } catch {
      // Network/auth errors are surfaced elsewhere; keep the app usable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function persist(set) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  }
  function dismiss(id) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      persist(next);
      return next;
    });
  }
  function restore(id) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      persist(next);
      return next;
    });
  }

  const active = alerts.filter((a) => !dismissed.has(a.id));
  const resolved = alerts.filter((a) => dismissed.has(a.id));
  const counts = {
    critical: active.filter((a) => a.severity === "Critical").length,
    warning: active.filter((a) => a.severity === "Warning").length,
    info: active.filter((a) => a.severity === "Info").length,
    resolved: resolved.length,
    total: active.length,
  };

  return (
    <AlertsContext.Provider
      value={{ alerts, active, resolved, counts, loading, dismiss, restore, refresh }}
    >
      {children}
    </AlertsContext.Provider>
  );
}
