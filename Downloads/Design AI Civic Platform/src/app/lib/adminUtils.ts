import type { Complaint, ComplaintFilters, ComplaintSeverity } from "../types";
import { displayStatus, PRIORITY_ORDER } from "../types";

export function filterComplaints(complaints: Complaint[], filters: ComplaintFilters): Complaint[] {
  let result = [...complaints];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q) ||
        item.userEmail.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        (item.assignedOfficerName ?? "").toLowerCase().includes(q),
    );
  }

  if (filters.status !== "All") {
    result = result.filter(
      (item) => displayStatus(item.status) === filters.status || item.status === filters.status,
    );
  }

  if (filters.department !== "All") {
    result = result.filter((item) => item.department === filters.department);
  }

  if (filters.priority !== "All") {
    result = result.filter(
      (item) => (item.priority ?? item.severity) === filters.priority,
    );
  }

  if (filters.category !== "All") {
    result = result.filter((item) => item.issueType === filters.category);
  }

  if (filters.verification !== "All") {
    result = result.filter(
      (item) => (item.locationVerification ?? "pending") === filters.verification,
    );
  }

  if (filters.officer !== "All") {
    result = result.filter((item) => item.assignedOfficerId === filters.officer);
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter((item) => (item.createdAt?.toMillis?.() ?? 0) >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime() + 86400000;
    result = result.filter((item) => (item.createdAt?.toMillis?.() ?? 0) <= to);
  }

  switch (filters.sortBy) {
    case "oldest":
      result.sort(
        (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0),
      );
      break;
    case "priority":
      result.sort(
        (a, b) =>
          PRIORITY_ORDER[(b.priority ?? b.severity) as ComplaintSeverity] -
          PRIORITY_ORDER[(a.priority ?? a.severity) as ComplaintSeverity],
      );
      break;
    case "status":
      result.sort((a, b) => displayStatus(a.status).localeCompare(displayStatus(b.status)));
      break;
    default:
      result.sort(
        (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
      );
  }

  return result;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
    total: items.length,
  };
}

export function computeAdminStats(complaints: Complaint[]) {
  const pendingStatuses = new Set(["Pending", "Submitted", "Under Review"]);
  const highPriority = new Set<ComplaintSeverity>(["Critical", "High"]);

  const byDepartment = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const resolutionDays: number[] = [];

  complaints.forEach((item) => {
    byDepartment.set(item.department, (byDepartment.get(item.department) ?? 0) + 1);
    byCategory.set(item.issueType, (byCategory.get(item.issueType) ?? 0) + 1);

    if (item.createdAt?.toDate) {
      const d = item.createdAt.toDate();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }

    if (item.status === "Resolved" && item.createdAt?.toDate && item.updatedAt?.toDate) {
      const days =
        (item.updatedAt.toDate().getTime() - item.createdAt.toDate().getTime()) / 86400000;
      resolutionDays.push(days);
    }
  });

  const avgResolution =
    resolutionDays.length > 0
      ? resolutionDays.reduce((sum, value) => sum + value, 0) / resolutionDays.length
      : 0;

  return {
    total: complaints.length,
    pending: complaints.filter((item) => pendingStatuses.has(item.status)).length,
    verified: complaints.filter((item) => item.status === "Verified").length,
    inProgress: complaints.filter((item) => item.status === "In Progress").length,
    resolved: complaints.filter((item) => item.status === "Resolved" || item.status === "Closed").length,
    rejected: complaints.filter((item) => item.status === "Rejected").length,
    highPriority: complaints.filter((item) =>
      highPriority.has((item.priority ?? item.severity) as ComplaintSeverity),
    ).length,
    today: complaints.filter((item) => {
      if (!item.createdAt?.toDate) return false;
      const d = item.createdAt.toDate();
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length,
    byDepartment: [...byDepartment.entries()].sort((a, b) => b[1] - a[1]),
    byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
    byMonth: [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    avgResolutionDays: Math.round(avgResolution * 10) / 10,
    heatmap: complaints
      .filter((item) => item.coords)
      .map((item) => ({
        lat: item.coords!.lat,
        lng: item.coords!.lng,
        weight: PRIORITY_ORDER[(item.priority ?? item.severity) as ComplaintSeverity],
        status: item.status,
      })),
  };
}

export function getRecentActivity(complaints: Complaint[], limit = 10) {
  const events: Array<{
    id: string;
    complaintId: string;
    title: string;
    description: string;
    at: number;
    status: string;
  }> = [];

  complaints.forEach((complaint) => {
    complaint.timeline?.forEach((event) => {
      events.push({
        id: event.id,
        complaintId: complaint.id,
        title: event.title,
        description: event.description ?? complaint.titleEn,
        at: event.at?.toMillis?.() ?? complaint.updatedAt?.toMillis?.() ?? 0,
        status: complaint.status,
      });
    });
    if (!complaint.timeline?.length && complaint.updatedAt?.toMillis) {
      events.push({
        id: `${complaint.id}-updated`,
        complaintId: complaint.id,
        title: "Complaint updated",
        description: complaint.titleEn,
        at: complaint.updatedAt.toMillis(),
        status: complaint.status,
      });
    }
  });

  return events.sort((a, b) => b.at - a.at).slice(0, limit);
}

export const DEFAULT_FILTERS: ComplaintFilters = {
  search: "",
  status: "All",
  department: "All",
  priority: "All",
  category: "All",
  verification: "All",
  officer: "All",
  dateFrom: "",
  dateTo: "",
  sortBy: "newest",
};

export const STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Pending: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Under Review": "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  Verified: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  Assigned: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "In Progress": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Resolved: "bg-green-500/15 text-green-400 border-green-500/20",
  Rejected: "bg-red-500/15 text-red-400 border-red-500/20",
  Closed: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  fake: "Fake Location",
  duplicate: "Duplicate",
  outside_jurisdiction: "Outside Jurisdiction",
};
