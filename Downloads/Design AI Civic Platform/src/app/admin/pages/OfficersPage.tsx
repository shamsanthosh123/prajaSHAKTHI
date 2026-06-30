import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthContext";
import {
  createOfficer,
  deleteOfficer,
  subscribeToOfficers,
  updateOfficer,
} from "../../lib/firebaseData";
import type { Officer } from "../../types";

const DEPARTMENTS = [
  "Roads & Infrastructure",
  "Water Supply",
  "Electricity",
  "Sanitation",
  "Public Health",
  "Urban Planning",
  "Other",
];

export function OfficersPage() {
  const { profile } = useAuth();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: profile?.department || DEPARTMENTS[0],
    designation: "",
  });

  useEffect(() => {
    const dept = profile?.role === "department_admin" ? profile.department : undefined;
    return subscribeToOfficers((items) => {
      setOfficers(items);
      setLoading(false);
    }, dept);
  }, [profile]);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      await createOfficer({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department,
        designation: form.designation.trim() || "Field Officer",
        active: true,
      });
      setForm({
        name: "",
        email: "",
        phone: "",
        department: profile?.department || DEPARTMENTS[0],
        designation: "",
      });
      setShowForm(false);
      toast.success("Officer created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create officer");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (officer: Officer) => {
    try {
      if (officer.active) {
        await deleteOfficer(officer.id);
        toast.success("Officer deactivated");
      } else {
        await updateOfficer(officer.id, { active: true });
        toast.success("Officer reactivated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Officer Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Assign officers to complaints and track workload
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Officer
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-white/10 rounded-2xl p-5 grid md:grid-cols-2 gap-4">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Officer name"
            className="p-3 bg-background border border-white/10 rounded-xl text-sm"
          />
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="Email"
            className="p-3 bg-background border border-white/10 rounded-xl text-sm"
          />
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="Phone"
            className="p-3 bg-background border border-white/10 rounded-xl text-sm"
          />
          <select
            value={form.department}
            onChange={(event) => setForm({ ...form, department: event.target.value })}
            disabled={profile?.role === "department_admin"}
            className="p-3 bg-background border border-white/10 rounded-xl text-sm disabled:opacity-60"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <input
            value={form.designation}
            onChange={(event) => setForm({ ...form, designation: event.target.value })}
            placeholder="Designation"
            className="p-3 bg-background border border-white/10 rounded-xl text-sm md:col-span-2"
          />
          <button
            disabled={saving}
            onClick={submit}
            className="md:col-span-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-500/90 disabled:opacity-60 font-medium"
          >
            {saving ? "Creating…" : "Create Officer"}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {officers.length === 0 ? (
          <div className="md:col-span-2 bg-card border border-dashed border-white/15 rounded-2xl p-10 text-center text-gray-500">
            No officers registered yet.
          </div>
        ) : (
          officers.map((officer) => (
            <div
              key={officer.id}
              className={`bg-card border rounded-2xl p-5 ${
                officer.active ? "border-white/10" : "border-red-500/20 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{officer.name}</p>
                    <p className="text-xs text-gray-400">{officer.designation || "Field Officer"}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(officer)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  title={officer.active ? "Deactivate" : "Reactivate"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-400">
                <p>{officer.email}</p>
                <p>{officer.phone || "No phone"}</p>
                <p>{officer.department}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                <span className="text-gray-500">Active assignments</span>
                <span className="font-bold text-primary">{officer.assignedCount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
