import { useEffect, useState } from "react";
import { useForecast } from "../hooks/useForecast";
import ForecastControls from "../components/forecast/ForecastControls";
import ForecastChart from "../components/forecast/ForecastChart";
import ModelComparisonPanel from "../components/forecast/ModelComparisonPanel";
import ForecastTable from "../components/forecast/ForecastTable";
import InsightsPanel from "../components/forecast/InsightsPanel";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function Forecast() {
  const { items, categories, loading, single, compare, mode, generateForecast } =
    useForecast();
  const [config, setConfig] = useState({
    type: "overall",
    item: "",
    category: "",
    periods: 14,
    model: "prophet",
  });

  const unit = config.type === "item" ? "units" : "NPR";

  // Auto-generate a default overall forecast on first load.
  useEffect(() => {
    generateForecast(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function title() {
    if (mode === "compare")
      return `Model Comparison — Back-test over ${config.periods} Days`;
    const subject =
      config.type === "item"
        ? `${config.item} Demand`
        : config.type === "category"
        ? `${config.category}`
        : "Revenue";
    return `${subject} Forecast — Next ${config.periods} Days`;
  }

  return (
    <div className="space-y-6">
      <ForecastControls
        config={config}
        items={items}
        categories={categories}
        onChange={setConfig}
        onGenerate={() => generateForecast(config)}
        loading={loading}
      />

      <div className="relative min-h-[420px] rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-800">{title()}</h3>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <LoadingSpinner label="Computing forecast..." />
          </div>
        )}
        {mode === "compare" && compare ? (
          <ForecastChart mode="compare" compare={compare} unit={unit} />
        ) : single ? (
          <ForecastChart mode="single" single={single} unit={unit} />
        ) : (
          !loading && (
            <p className="py-20 text-center text-gray-400">
              Choose options and click Generate Forecast.
            </p>
          )
        )}
      </div>

      {mode === "compare" && compare && <ModelComparisonPanel compare={compare} />}

      {mode === "single" && single && (
        <>
          <InsightsPanel result={single} unit={unit} />
          <ForecastTable result={single} />
        </>
      )}
    </div>
  );
}
