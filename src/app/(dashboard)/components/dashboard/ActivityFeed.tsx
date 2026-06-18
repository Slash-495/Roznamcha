import { formatDistanceToNow } from "date-fns";

export interface ActivityEvent {
  id: string;
  type: "customer_added" | "purchase_recorded";
  title: string;
  description: string;
  date: Date;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-md">
        No recent activity.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex gap-4">
          <div className="mt-1">
            {event.type === "customer_added" ? (
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{event.title}</p>
            <p className="text-sm text-muted-foreground">{event.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(event.date, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
