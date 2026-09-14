import React from 'react'

interface StatCardProps {
  label: string;
  accent?: "maroon" | "sage" | "amber" | "ink";
}

const accentMap: Record<string, string> = {
  maroon: "text-maroon",
  sage: "text-sage",
  amber: "text-amber",
  ink: "text-ink",
};

export const StatSkeleton = () => {
  return (
    <section className="flex flex-wrap gap-4">
      <StatCard label="Total entries" />
      <StatCard label="IDs bought"  accent="maroon" />
      <StatCard label="Paid IDs" accent="sage" />
      <StatCard label="Unpaid IDs"  accent="amber" />
      <StatCard label="Released IDs"  accent="sage" />
      <StatCard label="BSIT IDs"  accent="amber" />
      <StatCard label="BMMA IDs" accent="maroon" />
      <StatCard
        label="Pending Payment"
        accent="maroon"
      />
      <StatCard
        label="Total Payment"
        accent="amber"
      />
      <StatCard
        label="Collected Payment"
        accent="sage"
      />
    </section>
  )
}

export default function StatCard({ label, accent = "ink" }: StatCardProps) {
  return (
    <div className="border border-line bg-surface px-5 py-4 min-w-[140px]">
      <div className={`font-serif animate-pulse text-${accent} brightness-50`}>loading...</div>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}