import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";
import ChartCard from "../common/ChartCard";
import DataTable from "../common/DataTable";
import LoadingSpinner from "../common/LoadingSpinner";
import SearchableSelect from "../common/SearchableSelect";
import { formatNPR, formatNumber } from "../../utils/format";

function HBar({ title, data, dataKey, color, fmt }) {
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="item_name" width={130} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => fmt(v)} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function ItemPerformanceTab() {
  const [top, setTop] = useState(null);
  const [bottom, setBottom] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState("");
  const [itemSeries, setItemSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/reports/top-items", { params: { limit: 20 } }),
      api.get("/reports/bottom-items", { params: { limit: 10 } }),
      api.get("/sales/items"),
    ])
      .then(([t, b, it]) => {
        setTop(t.data);
        setBottom(b.data.data || []);
        setItems(it.data.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api
      .get("/sales/daily-totals", { params: { item_name: selected } })
      .then((r) => {
        const byMonth = {};
        (r.data.data || []).forEach((d) => {
          const m = d.date.slice(0, 7);
          byMonth[m] = (byMonth[m] || 0) + d.revenue;
        });
        setItemSeries(
          Object.entries(byMonth)
            .sort()
            .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }))
        );
      })
      .catch(() => setItemSeries([]));
  }, [selected]);

  const bottomColumns = useMemo(
    () => [
      { key: "item_name", label: "Item Name" },
      { key: "total_qty", label: "Total Qty", render: (r) => formatNumber(r.total_qty) },
      { key: "total_revenue", label: "Revenue", render: (r) => formatNPR(r.total_revenue) },
    ],
    []
  );

  if (loading || !top) return <LoadingSpinner label="Loading item performance..." />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HBar
          title="Top 20 by Revenue"
          data={top.by_revenue}
          dataKey="total_revenue"
          color="#1e3a5f"
          fmt={(v) => [formatNPR(v), "Revenue"]}
        />
        <HBar
          title="Top 20 by Quantity"
          data={top.by_quantity}
          dataKey="total_qty"
          color="#f97316"
          fmt={(v) => [formatNumber(v), "Quantity"]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold text-gray-800">
            Bottom 10 Items (Consider Removing)
          </h3>
          <DataTable columns={bottomColumns} data={bottom} emptyMessage="No data" />
        </div>

        <ChartCard
          title="Item Monthly Sales"
          action={
            <SearchableSelect
              options={items}
              value={selected}
              onChange={setSelected}
              placeholder="Search item..."
            />
          }
        >
          {selected ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={itemSeries} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={16} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
                <Tooltip formatter={(v) => [formatNPR(v), "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-gray-400">
              Select an item to see its monthly sales.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
