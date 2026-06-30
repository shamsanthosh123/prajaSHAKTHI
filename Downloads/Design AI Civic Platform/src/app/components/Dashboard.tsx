import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  AlertCircle, Camera, CheckCircle2, Clock,
  FileText, MapPin, TrendingUp, Newspaper, User,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";
import { formatDate, subscribeToComplaints, subscribeToAllComplaints } from "../lib/firebaseData";
import type { Complaint } from "../types";

const statusColor: Record<string, string> = {
  Pending: "text-yellow-400 bg-yellow-500/10",
  Verified: "text-blue-400 bg-blue-500/10",
  Assigned: "text-purple-400 bg-purple-500/10",
  "In Progress": "text-orange-400 bg-orange-500/10",
  Resolved: "text-green-400 bg-green-500/10",
  Rejected: "text-red-400 bg-red-500/10",
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { lang, t } = useLang();

  // ── My own complaints (for stats + "Recent Reports") ──────────────────────
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    return subscribeToComplaints((items) => { setComplaints(items); setLoading(false); }, user.uid, () => setLoading(false));
  }, [user]);

  // ── ALL complaints from every user (for "Community Feed") ─────────────────
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    return subscribeToAllComplaints(
      (items) => { setAllComplaints(items); setFeedLoading(false); },
      () => setFeedLoading(false)
    );
  }, []);

  const stats = useMemo(() => {
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const active = complaints.filter((c) => ["Pending","Verified","Assigned","In Progress"].includes(c.status)).length;
    const points = complaints.reduce((s, c) => s + c.heroPoints, 0);
    return [
      { icon: FileText, label: t("Total Reports","ಒಟ್ಟು ವರದಿಗಳು"), value: complaints.length, color: "text-primary" },
      { icon: CheckCircle2, label: t("Resolved","ಪರಿಹರಿಸಲಾಗಿದೆ"), value: resolved, color: "text-green-400" },
      { icon: Clock, label: t("Active","ಸಕ್ರಿಯ"), value: active, color: "text-yellow-400" },
      { icon: TrendingUp, label: t("Hero Points","ಹೀರೋ ಪಾಯಿಂಟ್‌ಗಳು"), value: points, color: "text-blue-400" },
    ];
  }, [complaints, t]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold mb-1">
          {t("Welcome","ಸ್ವಾಗತ")},{" "}
          <span className="text-primary">{profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Citizen"}</span>
        </h1>
        <p className="text-gray-400 text-sm">{t("Your reports and their real-time progress are shown here.","ನಿಮ್ಮ ವರದಿಗಳು ಮತ್ತು ಅವುಗಳ ನೈಜ-ಸಮಯದ ಪ್ರಗತಿ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.")}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-white/10 rounded-2xl p-4">
            <s.icon className={`w-5 h-5 mb-3 ${s.color}`} />
            <div className="text-3xl font-bold">{loading ? "—" : s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={() => navigate("/app/report")}
        className="w-full mb-6 p-5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 flex items-center gap-4 text-left hover:opacity-90 transition-opacity">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Camera className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg">{t("Report a civic issue","ನಾಗರಿಕ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ")}</div>
          <div className="text-sm text-white/75">{t("Upload a photo for AI classification and routing","AI ವರ್ಗೀಕರಣಕ್ಕಾಗಿ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ")}</div>
        </div>
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
      </button>

      {/* Recent Reports (compact, personal) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t("Recent Reports","ಇತ್ತೀಚಿನ ವರದಿಗಳು")}</h2>
          <button onClick={() => navigate("/app/my-complaints")} className="text-primary text-sm hover:underline">
            {t("View all","ಎಲ್ಲವನ್ನೂ ನೋಡಿ")}
          </button>
        </div>
        {!loading && complaints.length === 0 ? (
          <div className="bg-card border border-dashed border-white/15 rounded-2xl p-8 text-center">
            <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">{t("No complaints yet. Be the first to report!","ಇನ್ನೂ ದೂರುಗಳಿಲ್ಲ. ಮೊದಲಿಗರಾಗಿ ವರದಿ ಮಾಡಿ!")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {complaints.slice(0, 4).map((c) => (
              <button key={c.id} onClick={() => navigate(`/app/tracking/${c.id}`)}
                className="bg-card border border-white/10 hover:border-primary rounded-2xl p-3 text-left transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <FileText className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs truncate">{lang === "kn" ? c.titleKn : c.titleEn}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] ${statusColor[c.status]}`}>{c.status}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Community Feed — social-media style posts ───────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">{t("Community Feed","ಸಮುದಾಯ ಫೀಡ್")}</h2>
        </div>

        {feedLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allComplaints.length === 0 ? (
          <div className="bg-card border border-white/10 rounded-2xl p-10 text-center text-gray-400 text-sm">
            {t("No reports yet. Be the first!","ಇನ್ನೂ ವರದಿಗಳಿಲ್ಲ. ಮೊದಲಿಗರಾಗಿ!")}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allComplaints.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/app/tracking/${c.id}`)}
                className="bg-card border border-white/10 hover:border-primary rounded-2xl overflow-hidden transition-colors cursor-pointer flex flex-col"
              >
                {/* Photo — big, like a social post */}
                <div className="w-full h-52 bg-white/5 flex items-center justify-center overflow-hidden">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.titleEn} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-600">
                      <FileText className="w-10 h-10 mb-1" />
                      <span className="text-xs">{t("No photo","ಫೋಟೋ ಇಲ್ಲ")}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  {/* User row — like a post header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-primary truncate">{c.userName}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-lg text-xs whitespace-nowrap ${statusColor[c.status]}`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base leading-snug mb-1">
                    {lang === "kn" ? c.titleKn : c.titleEn}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {lang === "kn" ? c.descriptionKn : c.descriptionEn}
                  </p>

                  {/* Footer meta */}
                  <div className="mt-auto pt-2 border-t border-white/5 text-xs text-gray-500 space-y-1">
                    <p className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{c.location}
                    </p>
                    <p>{c.department} · {formatDate(c.createdAt)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 text-center mt-4">
          {t("Reports from citizens across Karnataka","ಕರ್ನಾಟಕದಾದ್ಯಂತ ನಾಗರಿಕರಿಂದ ವರದಿಗಳು")}
        </p>
      </div>
    </div>
  );
}
