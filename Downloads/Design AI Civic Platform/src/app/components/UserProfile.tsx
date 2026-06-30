import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { updateProfile, updatePassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { 
  Award, CheckCircle2, FileText, Save, KeyRound, 
  LogOut, Home, HelpCircle, User, Loader2, Sparkles, TrendingUp 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { toast } from "sonner";
import { auth, db } from "../../firebase";
import { subscribeToComplaints } from "../lib/firebaseData";
import type { Complaint } from "../types";
import { useAuth } from "./AuthContext";
import { useLang } from "./LanguageContext";

export function UserProfile() {
  const { user, profile } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.displayName ?? "");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [saving, setSaving] = useState(false);

  // Password States
  const [newPassword, setNewPassword] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => setName(profile?.displayName ?? ""), [profile]);
  useEffect(() => user ? subscribeToComplaints(setComplaints, user.uid) : undefined, [user]);

  const points = useMemo(() => 
    complaints.reduce((sum, item) => sum + item.heroPoints + (item.status === "Resolved" ? 100 : 0), 0), 
    [complaints]
  );
  
  const resolvedCount = complaints.filter((item) => item.status === "Resolved").length;

  // Reporter Rank / Tier Based on points
  const userRank = useMemo(() => {
    if (points >= 500) return { label: t("Gold Guardian", "ಚಿನ್ನದ ರಕ್ಷಕ"), color: "from-yellow-400 to-amber-500", icon: "👑" };
    if (points >= 200) return { label: t("Silver Leader", "ಬೆಳ್ಳಿ ನಾಯಕ"), color: "from-slate-350 to-slate-500", icon: "🥈" };
    return { label: t("Bronze Reporter", "ಕಂಚಿನ ವರದಿಗಾರ"), color: "from-amber-600 to-amber-800", icon: "🥉" };
  }, [points, t]);

  // Aggregate monthly submissions for Chart Analysis
  const chartData = useMemo(() => {
    const monthlyCounts: Record<string, number> = {};
    
    // Default last 5 months initialized to 0
    const months = [t("Jan", "ಜನ"), t("Feb", "ಫೆಬ್ರು"), t("Mar", "ಮಾರ್ಚಿ"), t("Apr", "ಏಪ್ರಿಲ್"), t("May", "ಮೇ"), t("Jun", "ಜೂನ್")];
    months.forEach((m) => { monthlyCounts[m] = 0; });

    complaints.forEach((c) => {
      if (c.createdAt?.toDate) {
        const date = c.createdAt.toDate();
        const monthLabel = date.toLocaleString("en-IN", { month: "short" });
        // Handle localization translation lookup
        const translatedLabel = 
          monthLabel.startsWith("Jan") ? t("Jan", "ಜನ") :
          monthLabel.startsWith("Feb") ? t("Feb", "ಫೆಬ್ರು") :
          monthLabel.startsWith("Mar") ? t("Mar", "ಮಾರ್ಚಿ") :
          monthLabel.startsWith("Apr") ? t("Apr", "ಏಪ್ರಿಲ್") :
          monthLabel.startsWith("May") ? t("May", "ಮೇ") :
          monthLabel.startsWith("Jun") ? t("Jun", "ಜೂನ್") : monthLabel;
        
        monthlyCounts[translatedLabel] = (monthlyCounts[translatedLabel] || 0) + 1;
      }
    });

    return Object.entries(monthlyCounts).map(([name, count]) => ({ name, complaints: count }));
  }, [complaints, t]);

  // Save Display Name
  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser!, { displayName: name.trim() });
      await updateDoc(doc(db, "users", user.uid), { displayName: name.trim() });
      toast.success(t("Profile updated successfully!", "ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!"));
    } catch (err) {
      toast.error(t("Failed to update profile.", "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ."));
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.warning(t("Password must be at least 6 characters long.", "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಿರಬೇಕು."));
      return;
    }
    setUpdatingPass(true);
    try {
      await updatePassword(auth.currentUser!, newPassword);
      toast.success(t("Password updated successfully!", "ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!"));
      setNewPassword("");
    } catch (err) {
      toast.error(t("Security re-authentication required. Re-login to change password.", "ಭದ್ರತಾ ದೃಢೀಕರಣದ ಅಗತ್ಯವಿದೆ. ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಲು ಮತ್ತೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ."));
    } finally {
      setUpdatingPass(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t("Logged out successfully", "ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಔಟ್ ಮಾಡಲಾಗಿದೆ"));
      navigate("/auth");
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Profile Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <User className="text-blue-400 w-8 h-8" /> {t("User Profile", "ನನ್ನ ಪ್ರೊಫೈಲ್")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t("Manage your settings, change credentials, and view report history statistics.", "ನಿಮ್ಮ ಸೆಟ್ಟಿಂಗ್‌ಗಳು, ರುಜುವಾತುಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ವರದಿ ಇತಿಹಾಸದ ಅಂಕಿಅಂಶಗಳನ್ನು ನೋಡಿ.")}</p>
        </div>
        
        {/* Navigation Quick Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => navigate("/app")} 
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 transition-all shadow-sm"
          >
            <Home className="w-4 h-4 text-indigo-400" /> {t("Home", "ಮುಖಪುಟ")}
          </button>
          <button 
            onClick={() => navigate("/app/assistant")} 
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 transition-all shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" /> {t("Help Assistant", "ಸಹಾಯ")}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" /> {t("Logout", "ಲಾಗ್ ಔಟ್")}
          </button>
        </div>
      </div>

      {/* Grid: Left Section Info & Settings, Right Section Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* User Card & Settings Forms */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Rank Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            <div className="absolute top-4 right-4 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[10px] text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>
                {profile?.role === "super_admin" || profile?.role === "admin"
                  ? "Super Admin"
                  : profile?.role === "department_admin"
                    ? "Department Admin"
                    : "Citizen"}
              </span>
            </div>

            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shadow-lg mb-4">
              {(profile?.displayName || user?.email || "C")[0].toUpperCase()}
            </div>

            <h2 className="text-xl font-bold text-white">{profile?.displayName || t("Citizen", "ನಾಗರಿಕ")}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>

            {/* Rank / Badge indicator */}
            <div className={`mt-5 px-4 py-2 rounded-2xl bg-gradient-to-r ${userRank.color} text-white font-bold text-xs flex items-center gap-1.5 shadow-md`}>
              <span>{userRank.icon}</span>
              <span>{userRank.label}</span>
            </div>
          </div>

          {/* Form Settings Panels */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-5 space-y-5 shadow-2xl">
            <h3 className="font-bold text-sm text-gray-300 border-b border-white/5 pb-2">{t("Profile Information", "ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ")}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t("Display Name", "ಪ್ರದರ್ಶನ ಹೆಸರು")}</label>
                <input 
                  value={name} 
                  onChange={(event) => setName(event.target.value)} 
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-white text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t("Account Email", "ಖಾತೆ ಇಮೇಲ್")}</label>
                <input 
                  value={user?.email ?? ""} 
                  disabled 
                  className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-gray-500 text-sm cursor-not-allowed" 
                />
              </div>

              <button 
                disabled={saving || !name.trim()} 
                onClick={saveName} 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("Save Profile", "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ")}
              </button>
            </div>
          </div>

          {/* Password Change Form */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-5 space-y-5 shadow-2xl">
            <h3 className="font-bold text-sm text-gray-300 border-b border-white/5 pb-2">{t("Update Security", "ಭದ್ರತೆ ನವೀಕರಿಸಿ")}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t("New Password", "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್")}</label>
                <input 
                  type="password"
                  value={newPassword} 
                  onChange={(event) => setNewPassword(event.target.value)} 
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-white text-sm font-mono" 
                />
              </div>

              <button 
                disabled={updatingPass || !newPassword} 
                onClick={changePassword} 
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                {updatingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {t("Change Password", "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ")}
              </button>

              <button 
                type="button"
                onClick={async () => {
                  if (user?.email) {
                    try {
                      await sendPasswordResetEmail(auth, user.email);
                      toast.success(t("Password reset email sent!", "ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಇಮೇಲ್ ಕಳುಹಿಸಲಾಗಿದೆ!"));
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }
                }} 
                className="w-full py-2.5 bg-slate-900/50 hover:bg-slate-900 text-xs text-indigo-400 border border-indigo-500/10 rounded-xl font-medium transition-all"
              >
                {t("Send Reset Recovery Email", "ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಿ")}
              </button>
            </div>
          </div>

        </div>

        {/* Stats and Graph Analysis View */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats overview boxes */}
          <div className="grid grid-cols-3 gap-4">
            <Stat 
              icon={FileText} 
              value={complaints.length} 
              label={t("Total Reports", "ಒಟ್ಟು ವರದಿಗಳು")} 
              color="text-indigo-400" 
              bgColor="bg-indigo-500/10 border-indigo-500/20" 
            />
            <Stat 
              icon={CheckCircle2} 
              value={resolvedCount} 
              label={t("Resolved Issues", "ಪರಿಹರಿಸಲಾಗಿದೆ")} 
              color="text-emerald-400" 
              bgColor="bg-emerald-500/10 border-emerald-500/20" 
            />
            <Stat 
              icon={Award} 
              value={points} 
              label={t("Hero Points", "ಹೀರೋ ಪಾಯಿಂಟ್ಸ್")} 
              color="text-yellow-400" 
              bgColor="bg-yellow-500/10 border-yellow-500/20" 
            />
          </div>

          {/* Graph Analysis Panel */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" /> {t("Submission Trends", "ಸಲ್ಲಿಕೆಯ ಪ್ರವೃತ್ತಿಗಳು")}
                </h3>
                <p className="text-gray-400 text-xs mt-1">{t("A timeline comparison of civic issues reported this season.", "ಈ ಋತುವಿನಲ್ಲಿ ವರದಿಯಾದ ಸಮಸ್ಯೆಗಳ ಸಮಯರೇಖೆ ಹೋಲಿಕೆ.")}</p>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0 text-xs">
              {complaints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
                      itemStyle={{ color: "#818cf8" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="complaints" 
                      stroke="#818cf8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorComplaints)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  <p>{t("No submission records available to plot.", "ಪ್ರಸ್ತುತಪಡಿಸಲು ಯಾವುದೇ ವರದಿ ಸಲ್ಲಿಕೆ ದಾಖಲೆಗಳಿಲ್ಲ.")}</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

interface StatProps {
  icon: typeof FileText;
  value: number;
  label: string;
  color: string;
  bgColor: string;
}

function Stat({ icon: Icon, value, label, color, bgColor }: StatProps) {
  return (
    <div className={`border rounded-2xl p-5 flex flex-col transition-all hover:scale-[1.02] shadow-md ${bgColor}`}>
      <Icon className={`w-5 h-5 mb-3 ${color}`} />
      <div className="text-3xl font-extrabold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1 font-medium">{label}</div>
    </div>
  );
}
