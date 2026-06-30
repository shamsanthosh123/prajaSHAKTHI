import { useNavigate, useParams } from "react-router";
import {
  Building2,
  ChevronLeft,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useComplaintDetail } from "../../hooks/useComplaintDetail";
import { formatDate } from "../../lib/firebaseData";
import { STATUS_COLORS, VERIFICATION_LABELS } from "../../lib/adminUtils";
import { displayStatus } from "../../types";
import { AdminNotesPanel } from "../components/AdminNotesPanel";
import { ComplaintTimeline } from "../components/ComplaintTimeline";
import { ImageGallery } from "../components/ImageGallery";
import { LocationVerificationMap } from "../components/LocationVerificationMap";
import { PublicUpdatesPanel } from "../components/PublicUpdatesPanel";
import { StatusWorkflowPanel } from "../components/StatusWorkflowPanel";

export function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaint, loading, error } = useComplaintDetail(id);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="p-10 text-center text-gray-400">
        {error ?? "Complaint not found"}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-10">
      <button
        onClick={() => navigate("/admin/complaints")}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to complaints
      </button>

      <div className="bg-card border border-white/10 rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-start gap-3 mb-4">
          <span className="text-xs text-gray-500 font-mono">#{complaint.id}</span>
          <span className={`text-xs px-2.5 py-1 rounded-lg border ${STATUS_COLORS[complaint.status] ?? STATUS_COLORS.Pending}`}>
            {displayStatus(complaint.status)}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400">
            {complaint.priority ?? complaint.severity} Priority
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-gray-400">
            {VERIFICATION_LABELS[complaint.locationVerification ?? "pending"]}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold">{complaint.titleEn}</h1>
        <p className="text-gray-300 mt-3 leading-relaxed">{complaint.descriptionEn}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <Meta icon={User} label="Citizen" value={complaint.userName} />
          <Meta icon={Mail} label="Email" value={complaint.userEmail} />
          <Meta icon={Phone} label="Phone" value={complaint.userPhone || "Not provided"} />
          <Meta icon={Building2} label="Department" value={complaint.department} />
          <Meta icon={MapPin} label="Location" value={complaint.location} />
          <Meta icon={Building2} label="Category" value={complaint.issueType} />
          <Meta icon={User} label="Assigned Officer" value={complaint.assignedOfficerName || "Unassigned"} />
          <Meta icon={MapPin} label="Submitted" value={formatDate(complaint.createdAt)} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery complaint={complaint} />
          <LocationVerificationMap complaint={complaint} />
          <ComplaintTimeline complaint={complaint} />
        </div>

        <div className="space-y-6">
          <StatusWorkflowPanel complaint={complaint} />
          <PublicUpdatesPanel complaint={complaint} />
          <AdminNotesPanel complaint={complaint} />

          <div className="bg-card border border-white/10 rounded-2xl p-5 text-sm space-y-2">
            <h3 className="font-semibold mb-3">Complaint Metadata</h3>
            <Row label="Complaint ID" value={complaint.id} mono />
            <Row label="User ID" value={complaint.userId} mono />
            <Row label="AI Confidence" value={`${Math.round(complaint.confidence * 100)}%`} />
            <Row label="Hero Points" value={String(complaint.heroPoints)} />
            <Row label="Urgency" value={complaint.urgency || "—"} />
            {complaint.coords && (
              <>
                <Row label="Latitude" value={complaint.coords.lat.toFixed(6)} mono />
                <Row label="Longitude" value={complaint.coords.lng.toFixed(6)} mono />
              </>
            )}
            <Row label="Last Updated" value={formatDate(complaint.updatedAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-sm font-medium mt-1 break-all">{value}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-300 text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
