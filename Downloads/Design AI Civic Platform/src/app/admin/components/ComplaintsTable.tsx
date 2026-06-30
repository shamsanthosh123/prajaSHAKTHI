import { useNavigate } from "react-router";
import { Eye, MapPin } from "lucide-react";
import { formatDate, getComplaintImages } from "../../lib/firebaseData";
import { STATUS_COLORS, VERIFICATION_LABELS } from "../../lib/adminUtils";
import { displayStatus } from "../../types";
import type { Complaint } from "../../types";

interface ComplaintsTableProps {
  complaints: Complaint[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function ComplaintsTable({
  complaints,
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
}: ComplaintsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Citizen</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Department</th>
              <th className="p-4 font-medium">Priority</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Verification</th>
              <th className="p-4 font-medium">Officer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-10 text-center text-gray-500">
                  No complaints found.
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => {
                const images = getComplaintImages(complaint);
                return (
                  <tr
                    key={complaint.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-4 font-mono text-xs text-gray-400">
                      #{complaint.id.slice(0, 8)}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{complaint.userName}</div>
                      <div className="text-xs text-gray-500">{complaint.userEmail}</div>
                    </td>
                    <td className="p-4">{complaint.issueType}</td>
                    <td className="p-4">{complaint.department}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs">
                        {complaint.priority ?? complaint.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg border text-xs ${STATUS_COLORS[complaint.status] ?? STATUS_COLORS.Pending}`}>
                        {displayStatus(complaint.status)}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {VERIFICATION_LABELS[complaint.locationVerification ?? "pending"]}
                    </td>
                    <td className="p-4 text-xs">
                      {complaint.assignedOfficerName || "—"}
                    </td>
                    <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(complaint.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {images[0] && (
                          <img src={images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        )}
                        {complaint.coords && (
                          <MapPin className="w-4 h-4 text-gray-500" />
                        )}
                        <button
                          onClick={() => navigate(`/admin/complaints/${complaint.id}`)}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-white/10 text-sm text-gray-400">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg bg-white/5 disabled:opacity-40 hover:bg-white/10"
          >
            Previous
          </button>
          <span className="px-3 py-1.5">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg bg-white/5 disabled:opacity-40 hover:bg-white/10"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
