interface StatCardProps {
  label: string;
  value: number | string;
  accent?: "maroon" | "sage" | "amber" | "ink";
}

const accentMap: Record<string, string> = {
  maroon: "text-maroon",
  sage: "text-sage",
  amber: "text-amber",
  ink: "text-ink",
};

export default function StatCard({ label, value, accent = "ink" }: StatCardProps) {
  return (
    <div className="border border-line bg-surface px-5 py-4 min-w-[140px]">
      <p className={`font-serif text-3xl ${accentMap[accent]}`}>{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}
