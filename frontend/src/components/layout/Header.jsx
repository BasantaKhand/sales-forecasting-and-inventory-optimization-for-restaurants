import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiBars3, HiBell, HiChevronDown } from "react-icons/hi2";
import { useAuth } from "../../hooks/useAuth";

export default function Header({ title, onMenuClick, alertCount = 0 }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded p-2 text-gray-500 hover:bg-gray-100 md:hidden"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <HiBars3 className="text-xl" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
          onClick={() => navigate("/alerts")}
          aria-label="Alerts"
        >
          <HiBell className="text-xl" />
          {alertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {alertCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-white">
              {(user?.username || "?").charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm text-gray-700 sm:block">
              {user?.username || "User"}
            </span>
            <HiChevronDown className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white py-1 shadow-lg">
              <div className="border-b px-4 py-2 text-xs text-gray-500">
                {user?.email}
                <span className="mt-0.5 block capitalize text-gray-400">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
