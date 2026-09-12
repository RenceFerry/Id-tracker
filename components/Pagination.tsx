"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted pt-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="border border-line px-3 py-1.5 disabled:opacity-40 hover:bg-line/30 transition-colors"
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="border border-line px-3 py-1.5 disabled:opacity-40 hover:bg-line/30 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
