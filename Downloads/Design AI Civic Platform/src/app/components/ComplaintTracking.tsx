import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Megaphone,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";
import { useComplaintDetail } from "../hooks/useComplaintDetail";
import {
  formatDate,
  voteOnComplaint,
} from "../lib/firebaseData";
import { displayStatus } from "../types";
import type { ComplaintStatus } from "../types";

const stages: ComplaintStatus[] = [
  "Submitted",
  "Under Review",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
];

const trackingIcon = L.divIcon({
  html: `<div style="color: #ef4444; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5)); transform: translate(-10px, -20px);">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3" fill="black"></circle>
    </svg>
  </div>`,
  className: "tracking-div-icon",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function normalizeStage(status: ComplaintStatus): ComplaintStatus {
  if (status === "Pending") return "Submitted";
  if (status === "Closed") return "Resolved";
  return status;
}

export function ComplaintTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const { complaint, loading } = useComplaintDetail(id);
  const [voting, setVoting] = useState(false);

  const currentIndex = useMemo(() => {
    if (!complaint) return 0;
    const normalized = normalizeStage(complaint.status);
    const index = stages.indexOf(normalized);
    return index >= 0 ? index : 0;
  }, [complaint]);

  const vote = async (kind: "urgent" | "needsAttention" | "alreadyFixed") => {
    if (!complaint || !user) return;
    setVoting(true);
    try {
      await voteOnComplaint(complaint.id, user.uid, kind);
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading…</div>;
  if (!complaint) return <div className="p-10 text-center">{t("Complaint not found", "ದೂರು ಕಂಡುಬಂದಿಲ್ಲ")}</div>;

  const publicTimeline = (complaint.timeline ?? []).filter(
    (event) => event.isPublic || event.type === "public_update" || event.type === "submitted" || event.type === "progress",
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-10">
      <button onClick={() => navigate("/app/my-complaints")} className="text-sm text-gray-400 hover:text-white mb-5 transition-colors">
        ← {t("Back to complaints", "ದೂರುಗಳಿಗೆ ಹಿಂತಿರುಗಿ")}
      </button>

      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden mb-6 shadow-xl">
        {complaint.imageUrl && <img src={complaint.imageUrl} alt="" className="w-full max-h-80 object-cover" />}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">#{complaint.id}</span>
            <span className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/20 text-xs font-semibold">{complaint.issueType}</span>
            <span className="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20 text-xs font-semibold">{complaint.severity}</span>
            <span className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-semibold">{displayStatus(complaint.status)}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {lang === "kn" ? complaint.titleKn : complaint.titleEn}
          </h1>
          <p className="text-gray-300 mt-3 leading-relaxed">
            {lang === "kn" ? complaint.descriptionKn : complaint.descriptionEn}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-lg">
            <h2 className="font-bold mb-5 flex items-center gap-2 text-gray-150">
              <Clock className="w-5 h-5 text-indigo-400" /> {t("Tracking Timeline", "ಟ್ರ್ಯಾಕಿಂಗ್ ಸಮಯರೇಖೆ")}
            </h2>
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const history = complaint.statusHistory?.find(
                  (item) => normalizeStage(item.status) === stage,
                );
                const complete = index <= currentIndex && complaint.status !== "Rejected";
                return (
                  <div key={stage} className={`flex gap-3 p-3 rounded-xl border ${complete ? "bg-green-500/5 border-green-500/20" : "bg-white/[0.02] border-white/10"}`}>
                    {complete ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" /> : <Clock className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />}
                    <div>
                      <div className="font-semibold text-sm">{t(displayStatus(stage), displayStatus(stage))}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {history?.at?.toDate ? formatDate(history.at) : complete && index === 0 ? formatDate(complaint.createdAt) : t("Waiting", "ಕಾಯುತ್ತಿದೆ")}
                      </div>
                      {history?.note && <div className="text-sm text-gray-400 mt-1.5">{history.note}</div>}
                    </div>
                  </div>
                );
              })}
              {complaint.status === "Rejected" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div><div className="font-medium text-red-400">Rejected</div><div className="text-sm text-gray-400 mt-1">{complaint.adminNote}</div></div>
                </div>
              )}
            </div>
          </div>

          {(complaint.publicUpdates?.length ?? 0) > 0 && (
            <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-lg">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-green-400" />
                {t("Official Updates", "ಅಧಿಕೃತ ಅಪ್‌ಡೇಟ್‌ಗಳು")}
              </h2>
              <div className="space-y-3">
                {[...(complaint.publicUpdates ?? [])].reverse().map((update) => (
                  <div key={update.id} className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <p className="text-sm text-gray-200">{update.text}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(update.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {publicTimeline.length > 0 && (
            <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-lg">
              <h2 className="font-bold mb-4">{t("Activity Log", "ಚಟುವಟಿಕೆ ಲಾಗ್")}</h2>
              <div className="space-y-2">
                {publicTimeline.map((event) => (
                  <div key={event.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-sm">
                    <div className="font-medium">{event.title}</div>
                    {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
                    <p className="text-xs text-gray-500 mt-2">{formatDate(event.at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-lg">
            <h2 className="font-bold mb-2 text-gray-150">{t("Community verification", "ಸಮುದಾಯ ಪರಿಶೀಲನೆ")}</h2>
            <p className="text-xs text-gray-400 mb-4">{t("One vote per citizen. You can change your vote.", "ಪ್ರತಿ ನಾಗರಿಕನಿಗೆ ಒಂದು ಮತ. ನಿಮ್ಮ ಮತವನ್ನು ಬದಲಾಯಿಸಬಹುದು.")}</p>
            <div className="grid md:grid-cols-3 gap-3">
              <button disabled={voting} onClick={() => vote("urgent")} className="p-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/10 text-red-400 rounded-xl text-sm font-semibold transition-all">🚨 {t("Urgent", "ತುರ್ತು")} ({complaint.votes.urgent})</button>
              <button disabled={voting} onClick={() => vote("needsAttention")} className="p-3 bg-yellow-500/10 hover:bg-yellow-500/15 border border-yellow-500/10 text-yellow-450 rounded-xl text-sm font-semibold transition-all">⚠️ {t("Needs attention", "ಗಮನ ಬೇಕು")} ({complaint.votes.needsAttention})</button>
              <button disabled={voting} onClick={() => vote("alreadyFixed")} className="p-3 bg-green-500/10 hover:bg-green-500/15 border border-green-500/10 text-green-400 rounded-xl text-sm font-semibold transition-all">✅ {t("Already fixed", "ಈಗಾಗಲೇ ಸರಿಪಡಿಸಲಾಗಿದೆ")} ({complaint.votes.alreadyFixed})</button>
            </div>
            <p className="text-[11px] text-gray-500 mt-3.5 flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-indigo-400" /> {Object.keys(complaint.voterIds ?? {}).length} {t("citizen votes", "ನಾಗರಿಕ ಮತಗಳು")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="font-bold text-gray-150 border-b border-white/5 pb-2">{t("Details", "ವಿವರಗಳು")}</h3>
            <Info icon={Building2} label={t("Department", "ಇಲಾಖೆ")} value={complaint.department} />
            <Info icon={MapPin} label={t("Location", "ಸ್ಥಳ")} value={complaint.location} />
            <Info icon={Calendar} label={t("Submitted", "ಸಲ್ಲಿಸಲಾಗಿದೆ")} value={formatDate(complaint.createdAt)} />
            <Info icon={Building2} label={t("Assigned to", "ನಿಯೋಜಿಸಲಾಗಿದೆ")} value={complaint.assignedOfficerName || complaint.assignedTo || t("Not assigned", "ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ")} />
          </div>
          {complaint.adminNote && (
            <div className="bg-card border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold mb-2 text-gray-150">{t("Latest official update", "ಇತ್ತೀಚಿನ ಅಧಿಕೃತ ಅಪ್‌ಡೇಟ್")}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{complaint.adminNote}</p>
              <p className="text-xs text-gray-500 mt-2">{formatDate(complaint.updatedAt)}</p>
            </div>
          )}
          {complaint.coords && (
            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-lg flex flex-col gap-2">
              <div className="h-48 w-full z-0 relative">
                <MapContainer
                  center={[complaint.coords.lat, complaint.coords.lng]}
                  zoom={15}
                  zoomControl={false}
                  scrollWheelZoom={false}
                  dragging={false}
                  doubleClickZoom={false}
                  className="w-full h-full"
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Marker position={[complaint.coords.lat, complaint.coords.lng]} icon={trackingIcon} />
                </MapContainer>
                <div className="absolute top-2 left-2 z-10 bg-slate-900/90 border border-white/15 px-2 py-1 rounded text-[10px] text-gray-300 font-mono shadow-md">
                  {complaint.coords.lat.toFixed(4)}, {complaint.coords.lng.toFixed(4)}
                </div>
              </div>
              <div className="p-3 pt-1">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${complaint.coords.lat}&mlon=${complaint.coords.lng}#map=18/${complaint.coords.lat}/${complaint.coords.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  {t("Open external map", "ಬಾಹ್ಯ ನಕ್ಷೆಯನ್ನು ತೆರೆಯಿರಿ")} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 flex items-center gap-1"><Icon className="w-3.5 h-3.5 text-indigo-400" /> {label}</div>
      <div className="text-sm mt-1 text-gray-200 font-medium">{value}</div>
    </div>
  );
}
