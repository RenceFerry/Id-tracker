"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/StatCard";
import OrderForm from "@/components/OrderForm";
import OrderTable from "@/components/OrderTable";
import Pagination from "@/components/Pagination";
import EditOrderModal from "@/components/EditOrderModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import SettingsModal from "@/components/SettingsModal";
import ThemeToggle from "@/components/ThemeToggle";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/authFetch";
import { formatCurrency } from "@/lib/format";
import type { IdOrder, NewIdOrder } from "@/types/order";

const PAGE_SIZE = 10;

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAdmin = !!user;

  const [orders, setOrders] = useState<IdOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  const [pricePerId, setPricePerId] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [editingOrder, setEditingOrder] = useState<IdOrder | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IdOrder | null>(null);

  // Debounce search input so we're not firing a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  async function loadOrders(targetPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load entries");
      setOrders(json.orders ?? []);
      setTotalPages(json.totalPages ?? 1);
      setTotalEntries(json.total ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (res.ok && json.settings) {
        setPricePerId(Number(json.settings.price_per_id) || 0);
      }
    } catch {
      // Non-fatal — totals just show ₱0.00 until this loads or is set.
    }
  }

  useEffect(() => {
    loadOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleAdd(order: NewIdOrder) {
    const res = await authFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to add entry");
    // Reload so the new row reflects current search/sort/pagination correctly.
    await loadOrders(1);
    setPage(1);
  }

  async function handleSaveEdit(id: string, updates: Partial<IdOrder>) {
    const res = await authFetch(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to save changes");
    setOrders((prev) => prev.map((o) => (o.id === id ? json.order : o)));
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    const prevOrders = orders;
    setOrders((prev) => prev.filter((o) => o.id !== id));
    const res = await authFetch(`/api/orders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setOrders(prevOrders);
    } else {
      loadOrders();
    }
  }

  async function handleSavePrice(price: number) {
    const res = await authFetch("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ price_per_id: price }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to save price");
    setPricePerId(Number(json.settings.price_per_id) || 0);
  }

  const stats = useMemo(() => {
    const totalIds = orders.reduce((sum, o) => sum + o.quantity, 0);
    const paid = orders.filter((o) => o.paid).reduce((sum, o) => sum + o.quantity, 0);
    const unpaid = totalIds - paid;
    const released = orders.filter((o) => o.released).length;
    const typeCount = {
      IT: orders.filter((o) => o.idType === 'BSIT').reduce((sum, o) => sum + o.quantity, 0),
      MA: orders.filter((o) => o.idType === 'BMMA').reduce((sum, o) => sum + o.quantity, 0),
    }
    const pendingPayment = orders
      .filter((o) => !o.paid)
      .reduce((s, o) => s + o.quantity * pricePerId, 0);
    const collected = orders
      .filter((o) => o.paid)
      .reduce((s, o) => s + o.quantity * pricePerId, 0);
    const totalPayment = pendingPayment + collected;
    return { totalIds, paid, unpaid, released, pendingPayment, collected, typeCount, totalPayment };
  }, [orders, pricePerId]);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted">
              Student ID Purchases
            </p>
            <h1 className="font-serif text-4xl text-ink">ID Registry</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {!authLoading && isAdmin && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="border border-line px-3 py-1.5 text-xs text-ink hover:bg-line/40 transition-colors"
              >
                Settings
              </button>
            )}
            {!authLoading && (
              isAdmin ? (
                <button
                  onClick={() => signOut()}
                  className="border border-line px-3 py-1.5 text-xs text-ink hover:bg-line/40 transition-colors"
                  title={user?.email ?? undefined}
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="border border-line px-3 py-1.5 text-xs text-ink hover:bg-line/40 transition-colors"
                >
                  Admin sign in
                </button>
              )
            )}
          </div>
        </header>

        <section className="flex flex-wrap gap-4">
          <StatCard label="Total entries" value={totalEntries} />
          <StatCard label="IDs bought" value={stats.totalIds} accent="maroon" />
          <StatCard label="Paid IDs" value={stats.paid} accent="sage" />
          <StatCard label="Unpaid IDs" value={stats.unpaid} accent="amber" />
          <StatCard label="Released IDs" value={stats.released} accent="sage" />
          <StatCard label="BSIT IDs" value={stats.typeCount.IT} accent="amber" />
          <StatCard label="BMMA IDs" value={stats.typeCount.MA} accent="maroon" />
          <StatCard
            label="Pending Payment"
            value={formatCurrency(stats.pendingPayment)}
            accent="maroon"
          />
          <StatCard
            label="Total Payment"
            value={formatCurrency(stats.totalPayment)}
            accent="amber"
          />
          <StatCard
            label="Collected Payment"
            value={formatCurrency(stats.collected)}
            accent="sage"
          />
        </section>

        {isAdmin && <OrderForm onSubmit={handleAdd} />}

        <input
          type="text"
          placeholder="Search by name, year, or block…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:bg-paper transition-colors"
        />

        {error && (
          <p className="text-sm text-maroon border border-maroon/30 bg-maroon/5 px-4 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted">Loading registry…</p>
        ) : (
          <>
            <OrderTable
              orders={orders}
              pricePerId={pricePerId}
              canEdit={isAdmin}
              onEdit={setEditingOrder}
              onDeleteRequest={setPendingDelete}
            />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {isAdmin && (
        <>
          <EditOrderModal
            order={editingOrder}
            onSave={handleSaveEdit}
            onClose={() => setEditingOrder(null)}
          />

          <ConfirmDialog
            open={!!pendingDelete}
            title="Remove entry?"
            message={
              pendingDelete
                ? `This will permanently remove ${pendingDelete.student_name}'s entry. This can't be undone.`
                : ""
            }
            confirmLabel="Remove"
            onConfirm={handleConfirmDelete}
            onCancel={() => setPendingDelete(null)}
          />

          <SettingsModal
            open={settingsOpen}
            pricePerId={pricePerId}
            onSave={handleSavePrice}
            onClose={() => setSettingsOpen(false)}
          />
        </>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
