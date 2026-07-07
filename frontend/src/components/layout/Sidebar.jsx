import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineShoppingCart,
  HiOutlineChartBarSquare,
  HiOutlineCube,
  HiOutlineDocumentChartBar,
  HiOutlineBell,
} from "react-icons/hi2";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: HiOutlineHome },
  { to: "/sales", label: "Sales", icon: HiOutlineShoppingCart },
  { to: "/forecast", label: "Forecast", icon: HiOutlineChartBarSquare },
  { to: "/inventory", label: "Inventory", icon: HiOutlineCube },
  { to: "/reports", label: "Reports", icon: HiOutlineDocumentChartBar },
  { to: "/alerts", label: "Alerts", icon: HiOutlineBell },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-[250px] flex-col bg-sidebar text-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5">
          <h1 className="text-lg font-bold">Deurali Thakali</h1>
          <p className="text-xs text-blue-200">Sales Intelligence</p>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "border-l-4 border-accent bg-white/10 font-medium"
                    : "border-l-4 border-transparent text-blue-100 hover:bg-white/5"
                }`
              }
            >
              <Icon className="text-lg" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 text-xs text-blue-300">
          © {new Date().getFullYear()} Deurali Thakali
        </div>
      </aside>
    </>
  );
}
