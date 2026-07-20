import {
  HiArrowTrendingUp,
  HiCalendarDays,
  HiChartBar,
  HiScale,
} from "react-icons/hi2";

// Small insight card with a colored left border.
function Insight({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-l-4 border-sidebar bg-white p-4 shadow-sm">
      <Icon className="mt-0.5 text-lg text-sidebar" />
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}

// Auto-generated insights derived from a single-model forecast result.
export default function InsightsPanel({ result, unit }) {
  const preds = result.predictions || [];
  if (!preds.length) return null;

  const fmt = (v) =>
    `${unit === "NPR" ? "NPR " : ""}${Math.round(v).toLocaleString("en-IN")}${
      unit === "units" ? " units" : ""
    }`;

  const next7 = preds.slice(0, 7).reduce((a, b) => a + b, 0);
  const avg = preds.reduce((a, b) => a + b, 0) / preds.length;
  const peakIdx = preds.indexOf(Math.max(...preds));
  const peakDate = result.dates?.[peakIdx];

  const hv = result.historical_values || [];
  const last7 = hv.slice(-7).reduce((a, b) => a + b, 0);
  const change = last7 ? ((next7 - last7) / last7) * 100 : null;

  const cards = [
    {
      icon: HiChartBar,
      text: `Expected total for next 7 days: ${fmt(next7)}`,
    },
    {
      icon: HiCalendarDays,
      text: `Peak expected on ${peakDate} (${fmt(preds[peakIdx])})`,
    },
    {
      icon: HiScale,
      text: `Average daily prediction: ${fmt(avg)}`,
    },
  ];

  if (change != null) {
    cards.push({
      icon: HiArrowTrendingUp,
      text: `Next 7 days vs last 7 days: ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((c, i) => (
        <Insight key={i} icon={c.icon} text={c.text} />
      ))}
    </div>
  );
}
