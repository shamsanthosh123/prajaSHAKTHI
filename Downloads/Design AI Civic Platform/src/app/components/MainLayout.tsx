import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Home,
  FileText,
  Map,
  Trophy,
  MessageSquare,
  User,
  Bell,
  Shield,
  LogOut,
  ChevronLeft,
  Globe,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { LanguageProvider, useLang } from "./LanguageContext";
import { useAuth } from "./AuthContext";

// ─── page meta ───────────────────────────────────────────────────────────────
const PAGE_META: Record<string, { en: string; kn: string; back?: string }> = {
  "/app":              { en: "Dashboard",      kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" },
  "/app/report":       { en: "Report Issue",   kn: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",  back: "/app" },
  "/app/analysis":     { en: "AI Analysis",    kn: "AI ವಿಶ್ಲೇಷಣೆ",      back: "/app/report" },
  "/app/preview":      { en: "Preview",        kn: "ಪೂರ್ವಾವಲೋಕನ",       back: "/app/analysis" },
  "/app/map":          { en: "Community Map",  kn: "ಸಮುದಾಯ ನಕ್ಷೆ" },
  "/app/leaderboard":  { en: "Leaderboard",    kn: "ಲೀಡರ್‌ಬೋರ್ಡ್" },
  "/app/assistant":    { en: "AI Assistant",   kn: "AI ಸಹಾಯಕ" },
  "/app/profile":      { en: "My Profile",     kn: "ನನ್ನ ಪ್ರೊಫೈಲ್" },
  "/app/notifications":{ en: "Notifications",  kn: "ಅಧಿಸೂಚನೆಗಳು" },
  "/app/admin":        { en: "Admin Dashboard",kn: "ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" },
  "/app/my-complaints":{ en: "My Complaints",  kn: "ನನ್ನ ದೂರುಗಳು",      back: "/app" },
};

// ─── bottom nav items (5 max for mobile) ─────────────────────────────────────
const BOTTOM_NAV = [
  { icon: Home,        labelEn: "Home",      labelKn: "ಮನೆ",    path: "/app" },
  { icon: AlertCircle, labelEn: "Report",    labelKn: "ವರದಿ",   path: "/app/report" },
  { icon: Map,         labelEn: "Map",       labelKn: "ನಕ್ಷೆ",  path: "/app/map" },
  { icon: Trophy,      labelEn: "Ranks",     labelKn: "ಶ್ರೇಣಿ", path: "/app/leaderboard" },
  { icon: User,        labelEn: "Profile",   labelKn: "ಪ್ರೊಫೈಲ್", path: "/app/profile" },
];

// ─── sidebar nav items ────────────────────────────────────────────────────────
const SIDEBAR_NAV = [
  { icon: Home,         labelEn: "Dashboard",       labelKn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",    path: "/app" },
  { icon: AlertCircle,  labelEn: "Report Issue",    labelKn: "ಸಮಸ್ಯೆ ವರದಿ",      path: "/app/report" },
  { icon: FileText,     labelEn: "My Complaints",   labelKn: "ನನ್ನ ದೂರುಗಳು",     path: "/app/my-complaints" },
  { icon: Map,          labelEn: "Community Map",   labelKn: "ಸಮುದಾಯ ನಕ್ಷೆ",     path: "/app/map" },
  { icon: Trophy,       labelEn: "Leaderboard",     labelKn: "ಲೀಡರ್‌ಬೋರ್ಡ್",     path: "/app/leaderboard" },
  { icon: MessageSquare,labelEn: "AI Assistant",    labelKn: "AI ಸಹಾಯಕ",          path: "/app/assistant" },
  { icon: User,         labelEn: "Profile",         labelKn: "ಪ್ರೊಫೈಲ್",          path: "/app/profile" },
  { icon: Bell,         labelEn: "Notifications",   labelKn: "ಅಧಿಸೂಚನೆಗಳು",      path: "/app/notifications" },
  { icon: Shield,       labelEn: "Admin",           labelKn: "ಆಡಳಿತ",              path: "/admin/dashboard", adminOnly: true },
];

// ─── inner layout (needs lang context) ───────────────────────────────────────
function InnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggleLang, t } = useLang();
  const { user, profile, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (profile?.displayName || user?.displayName || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // resolve current page meta
  const currentPath = location.pathname;
  // match tracking route
  const trackingMatch = currentPath.match(/^\/app\/tracking\//);
  const meta = trackingMatch
    ? { en: "Complaint Details", kn: "ದೂರಿನ ವಿವರ", back: "/app/my-complaints" }
    : PAGE_META[currentPath] ?? { en: "PrajaShakthi", kn: "ಪ್ರಜಾಶಕ್ತಿ" };

  const isActive = (path: string) => {
    if (path === "/app") return currentPath === "/app";
    return currentPath.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── SIDEBAR (desktop always visible, mobile slide-in) ── */}
      <>
        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed top-0 left-0 h-screen w-64 bg-card border-r border-white/10 z-40
            flex flex-col transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:sticky
          `}
        >
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <button
              onClick={() => { navigate("/app"); setSidebarOpen(false); }}
              className="text-2xl font-bold"
            >
              <span style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>ಪ್ರಜಾ</span>
              <span className="text-primary">Shakthi</span>
            </button>
            <p className="text-xs text-gray-400 mt-1">Karnataka's civic platform</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {SIDEBAR_NAV.filter(item => !item.adminOnly || isAdmin).map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
                  ${isActive(item.path)
                    ? "bg-primary text-white font-medium"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"}
                `}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{lang === "en" ? item.labelEn : item.labelKn}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User card + logout */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.displayName || user?.displayName || "Citizen"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("Logout", "ಲಾಗ್ ಔಟ್")}
            </button>
          </div>
        </aside>
      </>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── TOP HEADER ── */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3 px-4 h-14">

            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Back button — shows only when page has a back target */}
            {meta.back && (
              <button
                onClick={() => navigate(meta.back!)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Page title */}
            <h1 className="font-semibold text-base flex-1 truncate">
              {lang === "en" ? meta.en : meta.kn}
            </h1>

            {/* Right controls */}
            <div className="flex items-center gap-2">

              {/* Language toggle */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-colors"
                aria-label="Toggle language"
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-xs">
                  {lang === "en" ? "ಕನ್ನಡ" : "EN"}
                </span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => navigate("/app/notifications")}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5 text-gray-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white hover:ring-2 hover:ring-primary/50 transition-all"
                  aria-label="Profile menu"
                >
                  {initials}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium truncate">
                        {profile?.displayName || user?.displayName || "Citizen"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { navigate("/app/profile"); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        {t("My Profile", "ನನ್ನ ಪ್ರೊಫೈಲ್")}
                      </button>
                      <button
                        onClick={() => { navigate("/app/my-complaints"); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        {t("My Complaints", "ನನ್ನ ದೂರುಗಳು")}
                      </button>
                      <button
                        onClick={() => { navigate("/app/notifications"); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                        {t("Notifications", "ಅಧಿಸೂಚನೆಗಳು")}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { navigate("/admin/dashboard"); setProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-orange-500/10 text-sm text-orange-400 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          {t("Admin Dashboard", "ಆಡಳಿತ")}
                        </button>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-white/10">
                      <button
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/10 text-sm text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("Logout", "ಲಾಗ್ ಔಟ್")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center justify-around px-2 py-2">
            {BOTTOM_NAV.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-0 ${
                    active ? "text-primary" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                  <span className="text-[10px] font-medium truncate">
                    {lang === "en" ? item.labelEn : item.labelKn}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 w-1 h-1 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}

// ─── wrap with language provider ─────────────────────────────────────────────
export function MainLayout() {
  return (
    <LanguageProvider>
      <InnerLayout />
    </LanguageProvider>
  );
}
