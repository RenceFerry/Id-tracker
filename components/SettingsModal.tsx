"use client";

import { useState, useRef } from "react";

interface SettingsModalProps {
  open: boolean;
  pricePerId: number;
  onSave: (price: number) => Promise<void>;
  onClose: () => void;
}

export default function SettingsModal({
  open,
  pricePerId,
  onSave,
  onClose,
}: SettingsModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSave() {
    const input = inputRef.current;
    if (!input) return;

    if (Number.isNaN(parseInt(input.value)) || parseInt(input.value) < 0) {
      setError("Enter a valid, non-negative price.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(parseInt(input.value));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save price.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface border border-line max-w-sm w-full p-5 space-y-4">
        <h3 className="font-serif text-lg text-ink">Settings</h3>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted mb-1 block">
            Price per ID (₱)
          </label>
          <input
            ref={inputRef}
            type="number"
            min={0}
            step="0.01"
            className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:bg-surface transition-colors"
            defaultValue={pricePerId}
          />
          <p className="text-xs text-muted mt-1">
            Used to calculate the Total column in the registry table.
          </p>
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
