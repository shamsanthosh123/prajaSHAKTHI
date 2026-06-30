import { useEffect, useState } from "react";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthContext";
import {
  assignOfficerToComplaint,
  subscribeToOfficers,
  updateComplaintWorkflow,
} from "../../lib/firebaseData";
import { WORKFLOW_STATUSES, displayStatus } from "../../types";
import type { Complaint, ComplaintStatus, Officer } from "../../types";

interface StatusWorkflowPanelProps {
  complaint: Complaint;
}

export function StatusWorkflowPanel({ complaint }: StatusWorkflowPanelProps) {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [assignedTo, setAssignedTo] = useState(complaint.assignedTo ?? "");
  const [officerId, setOfficerId] = useState(complaint.assignedOfficerId ?? "");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(complaint.status);
    setAssignedTo(complaint.assignedTo ?? "");
    setOfficerId(complaint.assignedOfficerId ?? "");
  }, [complaint]);

  useEffect(() => {
    const dept = profile?.department || complaint.department;
    return subscribeToOfficers(setOfficers, profile?.role === "department_admin" ? dept : undefined);
  }, [profile, complaint.department]);

  const activeOfficers = officers.filter((item) => item.active);

  const saveStatus = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const selected = activeOfficers.find((item) => item.id === officerId);
      if (selected && officerId !== complaint.assignedOfficerId) {
        await assignOfficerToComplaint(complaint.id, selected, {
          id: user.uid,
          name: profile.displayName,
        });
        toast.success(`Assigned to ${selected.name}`);
      } else {
        await updateComplaintWorkflow(complaint.id, {
          status,
          assignedTo,
          assignedOfficerId: officerId,
          assignedOfficerName: selected?.name ?? complaint.assignedOfficerName,
          actor: { id: user.uid, name: profile.displayName },
          timelineTitle: `Status changed to ${displayStatus(status)}`,
        });
        toast.success("Complaint updated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const quickAction = async (nextStatus: ComplaintStatus, title: string) => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await updateComplaintWorkflow(complaint.id, {
        status: nextStatus,
        assignedTo,
        actor: { id: user.uid, name: profile.displayName },
        timelineTitle: title,
      });
      toast.success(title);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold">Workflow Actions</h3>

      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={saving}
          onClick={() => quickAction("Under Review", "Complaint under review")}
          className="py-2 px-3 rounded-xl bg-indigo-500/10 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 disabled:opacity-50"
        >
          Start Review
        </button>
        <button
          disabled={saving}
          onClick={() => quickAction("Verified", "Complaint verified")}
          className="py-2 px-3 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 disabled:opacity-50"
        >
          Verify
        </button>
        <button
          disabled={saving}
          onClick={() => quickAction("In Progress", "Work in progress")}
          className="py-2 px-3 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-medium hover:bg-orange-500/20 disabled:opacity-50"
        >
          Start Work
        </button>
        <button
          disabled={saving}
          onClick={() => quickAction("Resolved", "Complaint resolved")}
          className="py-2 px-3 rounded-xl bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 disabled:opacity-50"
        >
          Resolve
        </button>
        <button
          disabled={saving}
          onClick={() => quickAction("Rejected", "Complaint rejected")}
          className="py-2 px-3 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          disabled={saving}
          onClick={() => quickAction("Closed", "Complaint closed")}
          className="py-2 px-3 rounded-xl bg-gray-500/10 text-gray-400 text-xs font-medium hover:bg-gray-500/20 disabled:opacity-50"
        >
          Close
        </button>
      </div>

      <label className="block text-sm">
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ComplaintStatus)}
          className="mt-1 w-full p-3 bg-background border border-white/10 rounded-xl text-sm"
        >
          {WORKFLOW_STATUSES.map((item) => (
            <option key={item} value={item}>
              {displayStatus(item)}
            </option>
          ))}
          {complaint.status === "Pending" && <option value="Pending">Submitted (Legacy)</option>}
        </select>
      </label>

      <label className="block text-sm">
        Assigned Department/Team
        <input
          value={assignedTo}
          onChange={(event) => setAssignedTo(event.target.value)}
          placeholder={complaint.department}
          className="mt-1 w-full p-3 bg-background border border-white/10 rounded-xl text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          Assign Officer
        </span>
        <select
          value={officerId}
          onChange={(event) => setOfficerId(event.target.value)}
          className="mt-1 w-full p-3 bg-background border border-white/10 rounded-xl text-sm"
        >
          <option value="">Select officer…</option>
          {activeOfficers.map((officer) => (
            <option key={officer.id} value={officer.id}>
              {officer.name} — {officer.department} ({officer.assignedCount} active)
            </option>
          ))}
        </select>
      </label>

      <button
        disabled={saving}
        onClick={saveStatus}
        className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 font-medium flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {saving ? "Saving…" : "Save Workflow Update"}
      </button>
    </div>
  );
}
