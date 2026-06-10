export function StatCard({ title, value, prefix = "" }: { title: string; value: string | number; prefix?: string }) {
  return (
    <div className="rounded-xl border bg-white text-card-foreground shadow-sm p-6">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="text-2xl font-bold">{prefix}{value}</div>
    </div>
  );
}
