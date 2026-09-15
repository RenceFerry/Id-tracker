"use client";

import { useEffect, useState } from "react";
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
import { IdOrder, NewIdOrder, OrderStatType } from "@/types/order";
import { FilterType } from "@/types/filters";
import { Stats } from "@/types/stat";
import { StatSkeleton } from "@/components/Skeletons";
import { PAGE_SIZE } from "@/lib/constants";

const inputClass = "w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:bg-surface transition-colors";
const labelClass = "text-xs uppercase tracking-wide text-muted mb-1 block";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAdmin = !!user;

  const [orders, setOrders] = useState<IdOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStat, setLoadingStat] = useState(true);
  const [errorStat, setErrorStat] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<null | FilterType>(null);
  const [hideFilterOps, setHideFilterOps] = useState(true);
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
      console.log(filter);
      if (filter?.paid) params.set("paid", "true");
      if (filter?.released) params.set("released", "true");
      if (filter?.type) params.set("type", filter.type);
      if (filter?.date && filter.date.op && filter.date.value) {
        params.set('op', filter.date.op);
        params.set('val', filter.date.value);
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load entries");
      setOrders(json.orders ?? []);
      setTotalPages(json.totalPages ?? 1);
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

  async function loadStats() {
    setLoadingStat(true);
    try {
      const res = await fetch(`/api/stat`);
      const json: OrderStatType = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load statistics");
      const totalEntries = json.total;
      const orders = json.orders;
      setTotalEntries(totalEntries);
      const typeIT = orders.filter((o) => o.idType === 'BSIT').reduce((sum, o) => sum + o.quantity, 0);
      const typeMA = orders.filter((o) => o.idType !== 'BSIT').reduce((sum, o) => sum + o.quantity, 0);
      const totalIDs = typeIT + typeMA;
      const paid = orders.filter((o) => o.paid).reduce((sum, o) => sum + o.quantity, 0);
      const unpaid = totalIDs - paid;
      const released = orders.filter((o) => o.released).reduce((sum, o) => sum + o.quantity, 0);
      const pendingPayment = unpaid * pricePerId;
      const totalPayment = totalIDs * pricePerId;
      const collected = paid * pricePerId;

      setStats({
        paid, 
        totalIDs,
        unpaid,
        released,
        pendingPayment,
        collected,
        totalPayment,
        typeCount: {
          MA: typeMA,
          IT: typeIT
        }
      });
      
      setErrorStat(null);
    } catch (err) {
      setErrorStat(err instanceof Error ? err.message : "Failed to load statistics");
    } finally {
      setLoadingStat(false);
    }
  }

  useEffect(() => {
    loadOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadStats();
  }, [pricePerId]);

  async function handleAdd(order: NewIdOrder) {
    const res = await authFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to add entry");
    // Reload so the new row reflects current search/sort/pagination correctly.
    await loadOrders(1);
    await loadStats();
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
    await loadStats();
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
      await loadOrders();
      await loadStats();
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

        {
          loadingStat ? 
          <StatSkeleton /> :
          errorStat ? 
          <p className="text-center text-sm tracking-wide text-maroon mb-1 block">erorr</p> :
          stats &&
          <section className="flex flex-wrap gap-4">
            <StatCard label="Total entries" value={totalEntries} />
            <StatCard label="IDs bought" value={stats.totalIDs} accent="maroon" />
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
        }

        {isAdmin && <OrderForm onSubmit={handleAdd} />}

        {/** search and filter */}
        <div className="w-full flex-col flex gap-2">

          {/** search */}
          <input
            type="text"
            placeholder="Search by name, year, or block…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-line bg-surface px-3 py-2 text-sm text-ink focus:bg-paper transition-colors"
          />

          {/** filter */}
          <div 
            className="max-w-20 h-10 flex items-center justify-center border border-line bg-surface relative cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                setHideFilterOps(!hideFilterOps);
              }
            }}
          >
            Filter

            {/** dropdowns */
              !hideFilterOps &&
              <form className="flex flex-col p-2 justify-center items-center absolute top-full left-0 border border-line bg-surface gap-4 z-10">

                <div className="min-w-48">
                  <label className={labelClass}>Type</label>
                  <select
                    className={inputClass}
                    value={filter?.type || ''}
                    onChange={(e) => setFilter((f) => {
                      return {
                        ...(f ? f : {}), type: e.target.value as 'BSIT' | 'BMMA' 
                      }
                    })}
                  >
                    <option className="hidden" value=""></option>
                    <option value='BSIT'>
                      BSIT
                    </option>
                    <option value='BMMA'>
                      BMMA
                    </option>
                  </select>
                </div>

                <div className="min-w-48">
                  <label className={labelClass}>Date</label>

                  <div className="pl-2">
                    <select
                      className={inputClass}
                      value={filter?.date?.op || ''}
                      onChange={(e) => setFilter((f) => {
                      return {
                        ...(f ? f : {}), date: { ...(f?.date), op: e.target.value as 'GT' | 'LT' | 'EQ'} 
                      }})}
                    >
                      <option className="hidden" value=""></option>
                      <option value='GT'>
                        GREATER THAN
                      </option>
                      <option value='LT'>
                        LESS THAN
                      </option>
                      <option value='EQ'>
                        EQUAL
                      </option>
                    </select>
                  </div>

                  <div className="pl-2">
                    <label className={labelClass}>Value</label>
                    <input 
                      type="date"
                      value={filter?.date?.value || ''}
                      className={inputClass}
                      onChange={(e) => setFilter((f) => {
                      return {
                        ...(f ? f : {}), date: { ...(f?.date), value: e.target.value} 
                      }})}   
                    />
                  </div>
                  
                </div>


                <div className="min-w-48">
                  <label className={labelClass}>Paid</label>
                  <select
                    className={inputClass}
                    value={filter?.paid === undefined ? '' : filter.paid ? 'PAID' : 'UNPAID'}
                    onChange={(e) => setFilter((f) => {
                      return {
                        ...(f ? f : {}), paid: e.target.value === 'PAID' } 
                      })}
                  >
                    <option className="hidden" value=""></option>
                    <option value='PAID'>
                      PAID
                    </option>
                    <option value='UNPAID'>
                      UNPAID
                    </option>
                  </select>
                </div>

                <div className="min-w-48">
                  <label className={labelClass}>Released</label>
                  <select
                    className={inputClass}
                    value={filter?.released === undefined ? '' : filter?.released ? 'RELEASED' : 'PENDING'}
                    onChange={(e) => setFilter((f) => {
                      return {
                        ...(f ? f : {}), released: e.target.value === 'RELEASED' }
                      })}
                  >
                    <option className="hidden" value=""></option>
                    <option value='RELEASED'>
                      RELEASED
                    </option>
                    <option value='PENDING'>
                      PENDING
                    </option>
                  </select>
                </div>

                <div className="flex flex-row gap-2 justify-between w-full items-center">
                  <button type='button' className="bg-paper text-maroon px-5 py-2 text-sm hover:bg-paper/50 transition-colors disabled:opacity-60" onClick={(e) => setFilter(null)}>Clear</button>
                  <button type='button' className="bg-maroon text-paper px-5 py-2 text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60" onClick={(e) => loadOrders()}>Filter</button>
                </div>

              </form>
            }
          </div>

        </div>


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
              page={page}
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
