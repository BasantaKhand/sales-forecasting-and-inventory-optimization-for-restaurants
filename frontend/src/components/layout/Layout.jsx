import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const TITLES = {
  "/dashboard": "Dashboard",
  "/sales": "Sales",
  "/forecast": "Forecast",
  "/inventory": "Inventory",
  "/reports": "Reports",
  "/alerts": "Alerts",
  "/settings": "Settings",
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = TITLES[pathname] || "Deurali Thakali";

  return (
    <div className="h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-full flex-col md:ml-[250px]">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
