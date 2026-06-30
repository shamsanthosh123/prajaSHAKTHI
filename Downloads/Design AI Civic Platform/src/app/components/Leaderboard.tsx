import { useEffect, useState } from "react";
import { Award, Trophy } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useLang } from "./LanguageContext";

interface CitizenStat {
  userId: string;
  userName: string;
  email: string;
  reports: number;
  resolved: number;
  points: number;
}

const BADGE = (points: number) => {
  if (points >= 500) return { label: "🏆 Karnataka Champion", color: "text-yellow-400" };
  if (points >= 200) return { label: "🥇 City Hero", color: "text-orange-400" };
  if (points >= 100) return { label: "🥈 Community Guardian", color: "text-gray-300" };
  return { label: "🥉 Local Helper", color: "text-amber-600" };
};

export function Leaderboard() {
  const { t } = useLang();
  const [ranked, setRanked] = useState<CitizenStat[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      // aggregate by userId
      const map: Record<string, CitizenStat> = {};
      snap.docs.forEach((doc) => {
        const d = doc.data();
        const uid = d.userId || d.userEmail || "unknown";
        if (!map[uid]) {
          map[uid] = {
            userId: uid,
            userName: d.userName || d.userEmail?.split("@")[0] || "Citizen",
            email: d.userEmail || "",
            reports: 0,
            resolved: 0,
            points: 0,
          };
        }
        map[uid].reports += 1;
        map[uid].points += d.heroPoints || 50;
        if (d.status === "Resolved") {
          map[uid].resolved += 1;
          map[uid].points += 100;
        }
      });

      const sorted = Object.values(map).sort((a, b) => b.points - a.points);
      setRanked(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const myRank = ranked.findIndex(
    (r) => r.userId === currentUser?.uid || r.email === currentUser?.email
  );

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Trophy className="w-7 h-7 text-yellow-400" />
        <h1 className="text-2xl font-bold">{t("Community Leaderboard", "ಸಮುದಾಯ ಲೀಡರ್‌ಬೋರ್ಡ್")}</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        {t("Calculated from real reports and resolutions", "ನೈಜ ವರದಿಗಳು ಮತ್ತು ಪರಿಹಾರಗಳಿಂದ ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ")}
      </p>

      {/* Your rank banner */}
      {myRank >= 0 && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white">
            {(currentUser?.displayName || currentUser?.email || "C")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{t("Your rank", "ನಿಮ್ಮ ಶ್ರೇಣಿ")}</p>
            <p className="text-sm text-gray-400">
              #{myRank + 1} · {ranked[myRank]?.points} {t("points", "ಪಾಯಿಂಟ್‌ಗಳು")}
            </p>
          </div>
          <span className="text-lg">{BADGE(ranked[myRank]?.points).label}</span>
        </div>
      )}

      {/* List */}
      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            {t("Loading…", "ಲೋಡ್ ಆಗುತ್ತಿದೆ…")}
          </div>
        ) : ranked.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            {t("No citizen activity yet. Be the first to report!", "ಇನ್ನೂ ಯಾವುದೇ ಚಟುವಟಿಕೆ ಇಲ್ಲ. ಮೊದಲಿಗರಾಗಿ!")}
          </div>
        ) : (
          ranked.map((citizen, index) => {
            const isMe = citizen.userId === currentUser?.uid || citizen.email === currentUser?.email;
            const badge = BADGE(citizen.points);
            return (
              <div
                key={citizen.userId}
                className={`flex items-center gap-4 p-4 border-b border-white/10 last:border-0 transition-colors ${
                  isMe ? "bg-primary/10" : "hover:bg-white/5"
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center font-bold text-lg flex-shrink-0">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  isMe ? "bg-primary text-white" : "bg-white/10 text-gray-300"
                }`}>
                  {citizen.userName[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {isMe ? `${citizen.userName} (${t("You", "ನೀವು")})` : citizen.userName}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {citizen.reports} {t("reports", "ವರದಿಗಳು")} · {citizen.resolved} {t("resolved", "ಪರಿಹರಿಸಲಾಗಿದೆ")}
                  </div>
                  <div className={`text-xs mt-0.5 ${badge.color}`}>{badge.label}</div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-primary text-lg">{citizen.points}</div>
                  <div className="text-xs text-gray-500">{t("pts", "ಪಾಯಿಂಟ್")}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Points guide */}
      <div className="mt-4 p-4 bg-card border border-white/10 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{t("How to earn points", "ಪಾಯಿಂಟ್‌ಗಳು ಹೇಗೆ ಗಳಿಸುವುದು")}</span>
        </div>
        {[
          { action: t("Report an issue", "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ"), pts: "+50" },
          { action: t("Issue gets resolved", "ಸಮಸ್ಯೆ ಪರಿಹರಿಸಲಾಗಿದೆ"), pts: "+100" },
        ].map(({ action, pts }) => (
          <div key={action} className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{action}</span>
            <span className="font-bold text-green-400">{pts}</span>
          </div>
        ))}
        <div className="border-t border-white/10 pt-2 mt-2 grid grid-cols-4 gap-2 text-center">
          {[
            { badge: "🥉", label: t("Local Helper", "ಸ್ಥಳೀಯ ಸಹಾಯಕ"), pts: "1+" },
            { badge: "🥈", label: t("Guardian", "ರಕ್ಷಕ"), pts: "100+" },
            { badge: "🥇", label: t("City Hero", "ನಗರ ನಾಯಕ"), pts: "200+" },
            { badge: "🏆", label: t("Champion", "ಚಾಂಪಿಯನ್"), pts: "500+" },
          ].map(({ badge, label, pts }) => (
            <div key={label} className="bg-white/5 rounded-xl p-2">
              <div className="text-lg">{badge}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
              <div className="text-xs text-primary font-medium">{pts} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
