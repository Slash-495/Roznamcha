export function TopList({ 
  items, 
  emptyMessage,
  valuePrefix = ""
}: { 
  items: { name: string; value: number | string; sub?: string }[];
  emptyMessage: string;
  valuePrefix?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-md">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y border rounded-md overflow-hidden bg-white shadow-sm">
      {items.map((item, i) => (
        <div key={i} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 text-gray-500 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {i + 1}
            </div>
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
            </div>
          </div>
          <div className="font-bold text-sm">
            {valuePrefix}{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
