import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { formatNumber, formatDate } from "../utils/format";

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState({ records: null, lastDate: null, db: "checking" });

  useEffect(() => {
    api
      .get("/sales", { params: { limit: 1, sort_by: "date", sort_order: "desc" } })
      .then((r) =>
        setInfo((s) => ({
          ...s,
          records: r.data.total,
          lastDate: r.data.data?.[0]?.date || null,
        }))
      )
      .catch(() => {});
    api
      .get("/health")
      .then((r) => setInfo((s) => ({ ...s, db: r.data.database })))
      .catch(() => setInfo((s) => ({ ...s, db: "disconnected" })));
  }, []);

  async function changePassword(e) {
    e.preventDefault();
    if (form.next.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (form.next !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: form.current,
        new_password: form.next,
      });
      toast.success("Password changed successfully");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Profile */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-800">Profile</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Username</dt>
            <dd className="font-medium text-gray-800">{user?.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-800">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium capitalize text-gray-800">{user?.role}</dd>
          </div>
        </dl>
      </div>

      {/* System Info */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-800">System Info</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Total Sales Records</dt>
            <dd className="font-medium text-gray-800">
              {info.records == null ? "—" : formatNumber(info.records)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Latest Data Date</dt>
            <dd className="font-medium text-gray-800">
              {info.lastDate ? formatDate(info.lastDate) : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Database Status</dt>
            <dd
              className={`font-medium ${
                info.db === "connected" ? "text-green-600" : "text-red-600"
              }`}
            >
              {info.db}
            </dd>
          </div>
        </dl>
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-4 font-semibold text-gray-800">Change Password</h3>
        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Current Password</label>
            <input
              type="password"
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">New Password</label>
            <input
              type="password"
              value={form.next}
              onChange={(e) => setForm({ ...form, next: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Confirm New Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
