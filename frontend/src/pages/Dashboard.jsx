import { useDashboard } from "../hooks/useDashboard";
import KpiCards from "../components/dashboard/KpiCards";
import RevenueTrendChart from "../components/dashboard/RevenueTrendChart";
import TopItemsChart from "../components/dashboard/TopItemsChart";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import DailyOrdersChart from "../components/dashboard/DailyOrdersChart";
import RecentOrdersTable from "../components/dashboard/RecentOrdersTable";
import { CardSkeleton, BlockSkeleton } from "../components/common/Skeleton";

export default function Dashboard() {
  const { data, loading, error, reload } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BlockSkeleton />
          <BlockSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={reload}
          className="rounded-md bg-accent px-4 py-2 text-white hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KpiCards kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={data.trend} />
        <TopItemsChart data={data.topItems} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryPieChart data={data.categories} />
        <DailyOrdersChart data={data.trend} />
      </div>

      <RecentOrdersTable orders={data.recentOrders} />
    </div>
  );
}
