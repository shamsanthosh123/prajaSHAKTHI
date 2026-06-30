import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAdminComplaints } from "../../hooks/useAdminComplaints";
import { DEFAULT_FILTERS, filterComplaints, paginate } from "../../lib/adminUtils";
import { subscribeToOfficers } from "../../lib/firebaseData";
import { ComplaintFiltersBar } from "../components/ComplaintFiltersBar";
import { ComplaintsTable } from "../components/ComplaintsTable";
import type { Officer } from "../../types";

const PAGE_SIZE = 12;

export function ComplaintsPage() {
  const { complaints, loading, departments, categories } = useAdminComplaints();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [officers, setOfficers] = useState<Officer[]>([]);

  useEffect(() => subscribeToOfficers(setOfficers), []);

  const filtered = useMemo(
    () => filterComplaints(complaints, filters),
    [complaints, filters],
  );
  const pagination = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
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
        <h1 className="text-2xl md:text-3xl font-bold">Complaint Management</h1>
        <p className="text-gray-400 text-sm mt-1">
          {complaints.length} total complaints · {filtered.length} matching filters
        </p>
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
      />

      <ComplaintsTable
        complaints={pagination.items}
        page={pagination.page}
        pageSize={PAGE_SIZE}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
