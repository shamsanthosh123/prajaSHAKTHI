import { Search } from "lucide-react";
import type { ComplaintFilters } from "../../types";
import { ALL_STATUSES, displayStatus } from "../../types";

interface ComplaintFiltersBarProps {
  filters: ComplaintFilters;
  onChange: (filters: ComplaintFilters) => void;
  departments: string[];
  categories: string[];
  officers: Array<{ id: string; name: string }>;
  compact?: boolean;
}

export function ComplaintFiltersBar({
  filters,
  onChange,
  departments,
  categories,
  officers,
  compact = false,
}: ComplaintFiltersBarProps) {
  const update = (patch: Partial<ComplaintFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className={`grid gap-3 ${compact ? "md:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"}`}>
      <div className="relative md:col-span-2">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
        <input
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Search ID, citizen, location, officer…"
          className="w-full pl-10 pr-4 py-3 bg-card border border-white/10 rounded-xl outline-none focus:border-primary text-sm"
        />
      </div>

      <select
        value={filters.status}
        onChange={(event) => update({ status: event.target.value })}
        className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
      >
        <option value="All">All Statuses</option>
        {ALL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {displayStatus(status)}
          </option>
        ))}
      </select>

      <select
        value={filters.department}
        onChange={(event) => update({ department: event.target.value })}
        className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
      >
        <option value="All">All Departments</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(event) => update({ priority: event.target.value })}
        className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
      >
        <option value="All">All Priorities</option>
        {["Critical", "High", "Medium", "Low"].map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {!compact && (
        <>
          <select
            value={filters.category}
            onChange={(event) => update({ category: event.target.value })}
            className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.verification}
            onChange={(event) => update({ verification: event.target.value })}
            className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
          >
            <option value="All">All Verification</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="fake">Fake Location</option>
            <option value="duplicate">Duplicate</option>
            <option value="outside_jurisdiction">Outside Jurisdiction</option>
          </select>

          <select
            value={filters.officer}
            onChange={(event) => update({ officer: event.target.value })}
            className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
          >
            <option value="All">All Officers</option>
            {officers.map((officer) => (
              <option key={officer.id} value={officer.id}>{officer.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => update({ dateFrom: event.target.value })}
            className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => update({ dateTo: event.target.value })}
            className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
          />

          <select
            value={filters.sortBy}
            onChange={(event) => update({ sortBy: event.target.value as ComplaintFilters["sortBy"] })}
            className="px-4 py-3 bg-card border border-white/10 rounded-xl text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </>
      )}
    </div>
  );
}
