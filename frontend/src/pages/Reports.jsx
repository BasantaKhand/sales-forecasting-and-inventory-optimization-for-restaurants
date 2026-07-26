import { useState } from "react";
import ReportTabs from "../components/reports/ReportTabs";
import RevenueTab from "../components/reports/RevenueTab";
import ItemPerformanceTab from "../components/reports/ItemPerformanceTab";
import SeasonalTrendsTab from "../components/reports/SeasonalTrendsTab";
import CategoryAnalysisTab from "../components/reports/CategoryAnalysisTab";

const TABS = [
  { key: "revenue", label: "Revenue" },
  { key: "items", label: "Item Performance" },
  { key: "trends", label: "Seasonal Trends" },
  { key: "category", label: "Category Analysis" },
];

export default function Reports() {
  const [active, setActive] = useState("revenue");

  return (
    <div className="space-y-6">
      <ReportTabs tabs={TABS} active={active} onChange={setActive} />

      {/* Each tab lazily fetches its own data when mounted. */}
      {active === "revenue" && <RevenueTab />}
      {active === "items" && <ItemPerformanceTab />}
      {active === "trends" && <SeasonalTrendsTab />}
      {active === "category" && <CategoryAnalysisTab />}
    </div>
  );
}
