import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import SearchableSelect from "../common/SearchableSelect";
import api from "../../services/api";

const BLANK = {
  item_name: "",
  category: "",
  current_stock: 0,
  reorder_level: 0,
  unit_cost: 0,
  supplier: "",
  lead_time_days: 1,
};

// Add / edit inventory item. When `item` has an id it's edit mode.
export default function InventoryItemModal({
  open,
  item,
  items,
  categories,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(item?.id);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(item ? { ...BLANK, ...item } : BLANK);
  }, [item, open]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.item_name) {
      toast.error("Item name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        item_name: form.item_name,
        category: form.category,
        current_stock: Number(form.current_stock),
        reorder_level: Number(form.reorder_level),
        unit_cost: Number(form.unit_cost),
        supplier: form.supplier,
        lead_time_days: Number(form.lead_time_days),
      };
      if (isEdit) {
        await api.put(`/inventory/${item.id}`, payload);
        toast.success("Item updated");
      } else {
        await api.post("/inventory", payload);
        toast.success("Item added");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${item.item_name}"?`)) return;
    setSaving(true);
    try {
      await api.delete(`/inventory/${item.id}`);
      toast.success("Item deleted");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit: ${item.item_name}` : "Add Inventory Item"}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Item Name</label>
          {isEdit ? (
            <input value={form.item_name} disabled className={`${inputClass} bg-gray-100`} />
          ) : (
            <SearchableSelect
              options={items}
              value={form.item_name}
              onChange={(v) => set("item_name", v)}
              placeholder="Select item..."
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className={inputClass}
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Current Stock</label>
            <input
              type="number"
              value={form.current_stock}
              onChange={(e) => set("current_stock", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Reorder Level</label>
            <input
              type="number"
              value={form.reorder_level}
              onChange={(e) => set("reorder_level", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Unit Cost (NPR)</label>
            <input
              type="number"
              value={form.unit_cost}
              onChange={(e) => set("unit_cost", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Lead Time (days)</label>
            <input
              type="number"
              value={form.lead_time_days}
              onChange={(e) => set("lead_time_days", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Supplier</label>
          <input
            value={form.supplier}
            onChange={(e) => set("supplier", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        {isEdit ? (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
