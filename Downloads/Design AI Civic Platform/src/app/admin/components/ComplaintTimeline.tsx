import { CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDate } from "../../lib/firebaseData";
import { displayStatus } from "../../types";
import type { Complaint, TimelineEvent } from "../../types";

interface ComplaintTimelineProps {
  complaint: Complaint;
}

export function ComplaintTimeline({ complaint }: ComplaintTimelineProps) {
  const events: TimelineEvent[] =
    complaint.timeline?.length
      ? [...complaint.timeline].sort(
          (a, b) => (a.at?.toMillis?.() ?? 0) - (b.at?.toMillis?.() ?? 0),
        )
      : (complaint.statusHistory ?? []).map((item, index) => ({
          id: `history-${index}`,
          type: "progress" as const,
          title: displayStatus(item.status),
          description: item.note,
          status: item.status,
          actorName: item.actorName,
          at: item.at,
          isPublic: Boolean(item.note),
        }));

  if (events.length === 0) {
    return (
      <div className="bg-card border border-white/10 rounded-2xl p-5">
        <h3 className="font-semibold mb-4">Timeline</h3>
        <div className="flex gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <div className="font-medium text-sm">Complaint Submitted</div>
            <div className="text-xs text-gray-500 mt-1">{formatDate(complaint.createdAt)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5">
      <h3 className="font-semibold mb-5">Timeline</h3>
      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />
        <div className="space-y-4">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            return (
              <div key={event.id} className="relative flex gap-4 pl-1">
                <div className="relative z-10 mt-1">
                  {isLast ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400 bg-card rounded-full" />
                  ) : (
                    <Circle className="w-6 h-6 text-primary fill-primary/20 bg-card rounded-full" />
                  )}
                </div>
                <div className={`flex-1 p-3 rounded-xl border ${isLast ? "bg-green-500/5 border-green-500/20" : "bg-white/[0.02] border-white/10"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{event.title}</div>
                    {!event.isPublic && event.type === "note" && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400">
                        Internal
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(event.at)}
                    {event.actorName && <span>· {event.actorName}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
