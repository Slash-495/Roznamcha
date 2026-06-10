import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px] mt-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-xl border bg-white shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[350px] w-full rounded-md" />
        </div>
        <div className="lg:col-span-3 rounded-xl border bg-white shadow-sm p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-[350px] w-full rounded-md" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-white shadow-sm p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-[200px] w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
