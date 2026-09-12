"use client";

import { useEffect, useState } from "react";
import type { IdOrder } from "@/types/order";
import { YEAR_OPTIONS, BLOCK_OPTIONS } from "@/lib/constants";

interface EditOrderModalProps {
  order: IdOrder | null;
  onSave: (id: string, updates: Partial<IdOrder>) => Promise<void>;
  onClose: () => void;
}

export default function EditOrderModal({ order, onSave, onClose }: EditOrderModalProps) {
  const [form, setForm] = useState<IdOrder | null>(order);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(order);
    setError(null);
  }, [order]);

  if (!order || !form) return null;

  const inputClass =
    "w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:bg-surface transition-colors";
  const labelClass = "text-xs uppercase tracking-wide text-muted mb-1 block";

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(form.id, {
        student_name: form.student_name,
        year: form.year,
        block: form.block,
        quantity: form.quantity,
        paid: form.paid,
        released: form.released,
        date_bought: form.date_bought,
        idType: form.idType
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface border border-line max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-lg text-ink">Edit entry</h3>


        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className={labelClass}>Student name</label>
            <input
              className={inputClass}
              value={form.student_name}
              onChange={(e) => setForm({ ...form, student_name: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>Year</label>
            <select
              className={inputClass}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Block</label>
            <select
              className={inputClass}
              value={form.block}
              onChange={(e) => setForm({ ...form, block: e.target.value })}
            >
              {BLOCK_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={labelClass}>ID Type</label>
            <select
              className={inputClass}
              value={form.idType}
              onChange={(e) => setForm({ ...form, idType: e.target.value as 'BSIT' | 'BMMA' })}
            >
              <option value='BSIT'>
                BSIT
              </option>
              <option value='BMMA'>
                BMMA
              </option>
            </select>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Number of IDs bought</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>Date bought</label>
            <input
              type="date"
              className={inputClass}
              value={form.date_bought}
              onChange={(e) => setForm({ ...form, date_bought: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(e) => setForm({ ...form, paid: e.target.checked })}
              className="h-4 w-4 accent-maroon"
            />
            Paid
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.released}
              onChange={(e) => setForm({ ...form, released: e.target.checked })}
              className="h-4 w-4 accent-maroon"
            />
            Released
          </label>
        </div>

        {error && <p className="text-sm text-maroon">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-maroon text-paper px-4 py-2 text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
