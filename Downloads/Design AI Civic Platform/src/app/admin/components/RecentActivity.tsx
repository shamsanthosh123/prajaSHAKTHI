import { useNavigate } from "react-router";
import { Activity, ChevronRight } from "lucide-react";
import { formatDate } from "../../lib/firebaseData";
import { STATUS_COLORS } from "../../lib/adminUtils";
import { displayStatus } from "../../types";
import type { Timestamp } from "firebase/firestore";

interface ActivityItem {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  at: number;
  status: string;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Recent Activity</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/admin/complaints/${item.complaintId}`)}
              className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-start gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{item.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLORS[item.status] ?? STATUS_COLORS.Pending}`}>
                    {displayStatus(item.status as never)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{item.description}</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {formatDate({ toMillis: () => item.at, toDate: () => new Date(item.at) } as Timestamp)}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
