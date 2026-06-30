import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthContext";
import { addPublicUpdate, formatDate } from "../../lib/firebaseData";
import type { Complaint } from "../../types";

const PRESETS = [
  "Inspection scheduled.",
  "Work started.",
  "Materials ordered.",
  "Road repaired.",
  "Team dispatched to location.",
];

interface PublicUpdatesPanelProps {
  complaint: Complaint;
}

export function PublicUpdatesPanel({ complaint }: PublicUpdatesPanelProps) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (message?: string) => {
    const content = (message ?? text).trim();
    if (!content || !user || !profile) return;
    setSaving(true);
    try {
      await addPublicUpdate(complaint.id, content, {
        id: user.uid,
        name: profile.displayName,
      });
      setText("");
      toast.success("Public update posted — citizen notified");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-green-400" />
        <h3 className="font-semibold">Public Updates</h3>
        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400">
          Visible to citizens
        </span>
      </div>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {(complaint.publicUpdates ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No public updates yet.</p>
        ) : (
          [...(complaint.publicUpdates ?? [])]
            .reverse()
            .map((update) => (
              <div key={update.id} className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-sm text-gray-200">{update.text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {update.authorName} · {formatDate(update.createdAt)}
                </p>
              </div>
            ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setText(preset)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400"
          >
            {preset}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Post an update visible to the citizen…"
        className="w-full h-24 p-3 bg-background border border-white/10 rounded-xl resize-none text-sm"
      />
      <button
        disabled={saving || !text.trim()}
        onClick={() => submit()}
        className="mt-3 w-full py-2.5 rounded-xl bg-green-500/15 text-green-400 hover:bg-green-500/25 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Send className="w-4 h-4" />
        {saving ? "Posting…" : "Post Public Update"}
      </button>
    </div>
  );
}
