import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShortDate } from "../../utils/format";

// Builds a continuous history + forecast series with a confidence band.
function buildSingleRows(result) {
  const rows = [];
  const hd = result.historical_dates || [];
  const hv = result.historical_values || [];
  hd.forEach((d, i) => rows.push({ date: d, historical: hv[i] }));

  const bridge = rows[rows.length - 1];
  if (bridge) {
    bridge.forecast = bridge.historical;
    bridge.band = [bridge.historical, bridge.historical];
  }
  (result.dates || []).forEach((d, i) => {
    rows.push({
      date: d,
      forecast: result.predictions[i],
      band: [result.lower_bound[i], result.upper_bound[i]],
    });
  });
  return rows;
}

function buildCompareRows(compare) {
  const dates = compare.test_dates || [];
  return dates.map((d, i) => ({
    date: d,
    actual: compare.actual?.[i],
    prophet: compare.prophet?.predictions?.[i],
    arima: compare.arima?.predictions?.[i],
  }));
}

export default function ForecastChart({ mode, single, compare, unit }) {
  const rows =
    mode === "compare" ? buildCompareRows(compare) : buildSingleRows(single);

  const fmt = (v) =>
    v == null ? "" : `${Number(v).toLocaleString("en-IN")}${unit === "NPR" ? "" : ""}`;

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={rows} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fontSize: 12 }}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 12 }} width={52} />
        <Tooltip formatter={(v) => fmt(v)} labelFormatter={formatShortDate} />
        <Legend />

        {mode === "compare" ? (
          <>
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#1e3a5f"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="prophet"
              name="Prophet"
              stroke="#0ea5e9"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="arima"
              name="ARIMA"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </>
        ) : (
          <>
            <Area
              type="monotone"
              dataKey="band"
              name="Confidence"
              stroke="none"
              fill="#f97316"
              fillOpacity={0.15}
            />
            <Line
              type="monotone"
              dataKey="historical"
              name="Historical"
              stroke="#1e3a5f"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
