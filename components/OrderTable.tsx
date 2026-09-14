"use client";

import type { IdOrder } from "@/types/order";
import { formatCurrency } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/constants";

interface OrderTableProps {
  page: number;
  orders: IdOrder[];
  pricePerId: number;
  canEdit: boolean;
  onEdit: (order: IdOrder) => void;
  onDeleteRequest: (order: IdOrder) => void;
}

function StatusPill({
  ok,
  onLabel,
  offLabel,
}: {
  ok: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs border ${
        ok ? "border-sage text-sage" : "border-line text-muted"
      }`}
    >
      {ok ? onLabel : offLabel}
    </span>
  );
}

export default function OrderTable({
  orders,
  page,
  pricePerId,
  canEdit,
  onEdit,
  onDeleteRequest,
}: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="border border-line bg-surface p-8 text-center text-muted text-sm">
        No entries found.
      </div>
    );
  }

  return (
    <div className="border border-line bg-surface overflow-x-auto">
      <table className="w-full text-sm min-w-[960px]">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="px-4 py-3 font-normal">Student</th>
            <th className="px-4 py-3 font-normal">Year &amp; Block</th>
            <th className="px-4 py-3 font-normal text-right">Type</th>
            <th className="px-4 py-3 font-normal text-right">Qty</th>
            <th className="px-4 py-3 font-normal text-right">Total</th>
            <th className="px-4 py-3 font-normal">Date bought</th>
            <th className="px-4 py-3 font-normal">Paid</th>
            <th className="px-4 py-3 font-normal">Released</th>
            {canEdit && <th className="px-4 py-3 font-normal"></th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr key={order.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 text-ink">{(page - 1) * PAGE_SIZE + i + 1}. {order.student_name}</td>
              <td className="px-4 py-3 text-muted">
                {order.year} &middot; {order.block}
              </td>
              <td className="px-4 py-3 text-right text-ink">{order.idType}</td>
              <td className="px-4 py-3 text-right text-ink">{order.quantity}</td>
              <td className="px-4 py-3 text-right text-ink">
                {formatCurrency(order.quantity * pricePerId)}
              </td>
              <td className="px-4 py-3 text-muted">{order.date_bought}</td>
              <td className="px-4 py-3">
                <StatusPill ok={order.paid} onLabel="Paid" offLabel="Unpaid" />
              </td>
              <td className="px-4 py-3">
                <StatusPill ok={order.released} onLabel="Released" offLabel="Pending" />
              </td>
              {canEdit && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => onEdit(order)}
                    className="text-muted hover:text-ink transition-colors text-xs mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteRequest(order)}
                    className="text-muted hover:text-maroon transition-colors text-xs"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
