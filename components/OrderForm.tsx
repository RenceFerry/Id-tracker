"use client";

import { useState } from "react";
import type { NewIdOrder } from "@/types/order";
import { YEAR_OPTIONS, BLOCK_OPTIONS } from "@/lib/constants";

interface OrderFormProps {
  onSubmit: (order: NewIdOrder) => Promise<void>;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm: NewIdOrder = {
  student_name: "",
  year: YEAR_OPTIONS[0],
  block: BLOCK_OPTIONS[0],
  quantity: 1,
  paid: false,
  date_bought: todayISO(),
  released: false,
  idType: 'BSIT'
};

export default function OrderForm({ onSubmit }: OrderFormProps) {
  const [form, setForm] = useState<NewIdOrder>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.student_name.trim() || !form.year.trim() || !form.block.trim()) {
      setError("Name, year, and block are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({ ...emptyForm, date_bought: todayISO() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:bg-surface transition-colors";
  const labelClass = "text-xs uppercase tracking-wide text-muted mb-1 block";

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-line bg-surface p-5 space-y-4"
    >
      <h2 className="font-serif text-xl text-ink">New entry</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className={labelClass}>Student name</label>
          <input
            className={inputClass}
            value={form.student_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, student_name: e.target.value }))
            }
            placeholder="Dela Cruz, Juan"
          />
        </div>

        <div>
          <label className={labelClass}>Year</label>
          <select
            className={inputClass}
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
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
            onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))}
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
            onChange={(e) => setForm((f) => ({ ...f, idType: e.target.value as 'BSIT' | 'BMMA' }))}
          >
            <option value={'BSIT'}>
              BSIT
            </option>
            <option value={'BMMA'}>
              BMMA
            </option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Number of IDs bought</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.quantity}
            onChange={(e) =>
              setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
            }
          />
        </div>

        <div>
          <label className={labelClass}>Date bought</label>
          <input
            type="date"
            className={inputClass}
            value={form.date_bought}
            onChange={(e) =>
              setForm((f) => ({ ...f, date_bought: e.target.value }))
            }
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.paid}
            onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))}
            className="h-4 w-4 accent-maroon"
          />
          Paid
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.released}
            onChange={(e) =>
              setForm((f) => ({ ...f, released: e.target.checked }))
            }
            className="h-4 w-4 accent-maroon"
          />
          Released
        </label>
      </div>

      {error && <p className="text-sm text-maroon">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-maroon text-paper px-5 py-2 text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Add to registry"}
      </button>
    </form>
  );
}
