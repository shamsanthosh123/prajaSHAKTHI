import { useState } from "react";
import { Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthContext";
import { addInternalNote, formatDate } from "../../lib/firebaseData";
import type { Complaint } from "../../types";

interface AdminNotesPanelProps {
  complaint: Complaint;
}

export function AdminNotesPanel({ complaint }: AdminNotesPanelProps) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim() || !user || !profile) return;
    setSaving(true);
    try {
      await addInternalNote(complaint.id, text.trim(), {
        id: user.uid,
        name: profile.displayName,
      });
      setText("");
      toast.success("Internal note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-orange-400" />
        <h3 className="font-semibold">Internal Notes</h3>
        <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400">
          Not visible to citizens
        </span>
      </div>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {(complaint.internalNotes ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No internal notes yet.</p>
        ) : (
          [...(complaint.internalNotes ?? [])]
            .reverse()
            .map((note) => (
              <div key={note.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <p className="text-sm text-gray-300">{note.text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {note.authorName} · {formatDate(note.createdAt)}
                </p>
              </div>
            ))
        )}
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Add internal department note…"
        className="w-full h-24 p-3 bg-background border border-white/10 rounded-xl resize-none text-sm"
      />
      <button
        disabled={saving || !text.trim()}
        onClick={submit}
        className="mt-3 w-full py-2.5 rounded-xl bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Send className="w-4 h-4" />
        {saving ? "Saving…" : "Add Internal Note"}
      </button>
    </div>
  );
}
