import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAdminComplaints } from "../../hooks/useAdminComplaints";
import { useAdminStats } from "../../hooks/useAdminStats";
import { DEFAULT_FILTERS, filterComplaints, paginate } from "../../lib/adminUtils";
import { subscribeToOfficers } from "../../lib/firebaseData";
import { ComplaintFiltersBar } from "../components/ComplaintFiltersBar";
import { ComplaintsTable } from "../components/ComplaintsTable";
import { DashboardCharts } from "../components/DashboardCharts";
import { RecentActivity } from "../components/RecentActivity";
import { StatsCards } from "../components/StatsCards";
import type { Officer } from "../../types";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { complaints, loading, departments, categories } = useAdminComplaints();
  const { stats, recentActivity } = useAdminStats(complaints);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [officers, setOfficers] = useState<Officer[]>([]);

  useEffect(() => subscribeToOfficers(setOfficers), []);

  const filtered = useMemo(
    () => filterComplaints(complaints, filters),
    [complaints, filters],
  );
  const pagination = useMemo(
    () => paginate(filtered, page, 8),
    [filtered, page],
  );

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Department Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Real-time complaint operations and analytics
        </p>
      </div>

      <StatsCards stats={stats} />

      <DashboardCharts
        byDepartment={stats.byDepartment}
        byCategory={stats.byCategory}
        byMonth={stats.byMonth}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Complaint Management</h2>
            <button
              onClick={() => navigate("/admin/complaints")}
              className="text-sm text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          <ComplaintFiltersBar
            filters={filters}
            onChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
            departments={departments}
            categories={categories}
            officers={officers.map((item) => ({ id: item.id, name: item.name }))}
            compact
          />
          <ComplaintsTable
            complaints={pagination.items}
            page={pagination.page}
            pageSize={8}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        </div>
        <RecentActivity items={recentActivity} />
      </div>
    </div>
  );
}
