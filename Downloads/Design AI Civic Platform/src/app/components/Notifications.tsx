import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "./AuthContext";
import {
  formatDate,
  markNotificationRead,
  subscribeToComplaints,
  subscribeToNotifications,
} from "../lib/firebaseData";
import type { AppNotification, Complaint } from "../types";

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    const stopComplaints = subscribeToComplaints(setComplaints, user.uid);
    const stopNotifications = subscribeToNotifications(user.uid, setNotifications);
    return () => {
      stopComplaints();
      stopNotifications();
    };
  }, [user]);

  const handleClick = async (complaintId: string, notificationId?: string) => {
    if (notificationId) {
      await markNotificationRead(notificationId);
    }
    navigate(`/app/tracking/${complaintId}`);
  };

  const combined = [
    ...notifications.map((item) => ({
      id: item.id,
      complaintId: item.complaintId,
      title: item.title,
      message: item.message,
      date: item.createdAt,
      read: item.read,
      isNotification: true,
    })),
    ...complaints
      .filter((item) => !notifications.some((n) => n.complaintId === item.id))
      .map((item) => ({
        id: item.id,
        complaintId: item.id,
        title: item.titleEn,
        message: `Status: ${item.status}${item.adminNote ? ` — ${item.adminNote}` : ""}`,
        date: item.updatedAt,
        read: true,
        isNotification: false,
      })),
  ].sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Notifications</h1>
      <p className="text-gray-400 mb-6">Real-time updates from department actions on your complaints.</p>
      {combined.length === 0 ? (
        <div className="bg-card border border-dashed border-white/15 rounded-2xl p-10 text-center text-gray-400">
          <Bell className="w-10 h-10 mx-auto mb-3" />
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {combined.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.complaintId, item.isNotification ? item.id : undefined)}
              className={`w-full text-left bg-card border rounded-2xl p-4 flex gap-3 transition-colors ${
                item.read ? "border-white/10 hover:border-primary" : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                item.message.includes("Resolved") ? "bg-green-500/10" : "bg-primary/10"
              }`}>
                {item.message.includes("Resolved") ? (
                  <CheckCircle2 className="text-green-400" />
                ) : (
                  <Clock className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{item.title}</div>
                <div className="text-sm text-gray-400 truncate">{item.message}</div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(item.date)}</div>
              </div>
              {!item.read && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
