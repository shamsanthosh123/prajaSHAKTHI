import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FileText, MapPin, Search } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";
import { formatDate, subscribeToComplaints } from "../lib/firebaseData";
import type { Complaint } from "../types";

export function MyComplaints() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    if (!user) return;
    return subscribeToComplaints(
      (items) => {
        setComplaints(items);
        setLoading(false);
      },
      user.uid,
      () => setLoading(false),
    );
  }, [user]);

  const filtered = useMemo(
    () =>
      complaints.filter((item) => {
        const text = `${item.titleEn} ${item.titleKn} ${item.issueType} ${item.location}`.toLowerCase();
        return (status === "All" || item.status === status) && text.includes(search.toLowerCase());
      }),
    [complaints, search, status],
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{t("My Complaints", "ನನ್ನ ದೂರುಗಳು")}</h1>
      <p className="text-gray-400 mb-6">{t("Live records submitted from your account.", "ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಸಲ್ಲಿಸಿದ ನೈಜ ದಾಖಲೆಗಳು.")}</p>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Search complaints", "ದೂರುಗಳನ್ನು ಹುಡುಕಿ")}
            className="w-full pl-10 pr-4 py-3 bg-card border border-white/10 rounded-xl outline-none focus:border-primary"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-4 py-3 bg-card border border-white/10 rounded-xl outline-none"
        >
          {["All", "Pending", "Verified", "Assigned", "In Progress", "Resolved", "Rejected"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 bg-card border border-dashed border-white/15 rounded-2xl text-center text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3" />
          {t("No matching complaints found.", "ಹೊಂದುವ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ.")}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((complaint) => (
            <button
              key={complaint.id}
              onClick={() => navigate(`/app/tracking/${complaint.id}`)}
              className="w-full bg-card border border-white/10 hover:border-primary rounded-2xl p-4 text-left"
            >
              <div className="flex gap-4">
                {complaint.imageUrl && <img src={complaint.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <h2 className="font-bold text-lg truncate">
                      {lang === "kn" ? complaint.titleKn : complaint.titleEn}
                    </h2>
                    <span className="ml-auto text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">{complaint.status}</span>
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3" /> {complaint.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {complaint.issueType} · {complaint.severity} · {formatDate(complaint.createdAt)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
