import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import ForecastControls from "../components/forecast/ForecastControls";
import ForecastChart from "../components/forecast/ForecastChart";
import ModelComparisonPanel from "../components/forecast/ModelComparisonPanel";
import ForecastTable from "../components/forecast/ForecastTable";
import InsightsPanel from "../components/forecast/InsightsPanel";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function Forecast() {
  const [config, setConfig] = useState({
    type: "overall",
    item: "",
    category: "",
    periods: 14,
    model: "prophet",
  });
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [single, setSingle] = useState(null);
  const [compare, setCompare] = useState(null);
  const [mode, setMode] = useState("single");

  // Load dropdown options once.
  useEffect(() => {
    api.get("/sales/items").then((r) => setItems(r.data.items || [])).catch(() => {});
    api
      .get("/sales/categories")
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const unit = config.type === "item" ? "units" : "NPR";

  const generate = useCallback(async () => {
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
  }, [config]);

  // Auto-generate a default overall forecast on first load.
  useEffect(() => {
    generate();
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
        onGenerate={generate}
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

      {mode === "compare" && compare && (
        <ModelComparisonPanel compare={compare} />
      )}

      {mode === "single" && single && (
        <>
          <InsightsPanel result={single} unit={unit} />
          <ForecastTable result={single} />
        </>
      )}
    </div>
  );
}
