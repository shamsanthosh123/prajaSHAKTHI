import { Outlet, useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../components/AuthContext";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: ClipboardList, label: "Complaints", path: "/admin/complaints" },
  { icon: Users, label: "Officers", path: "/admin/officers" },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel =
    profile?.role === "department_admin"
      ? "Department Admin"
      : profile?.role === "super_admin" || profile?.role === "admin"
        ? "Super Admin"
        : "Admin";

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin/auth");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-card border-r border-white/10 z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:sticky ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-bold text-sm">PrajaShakthi</p>
              <p className="text-xs text-orange-400">Department Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                isActive(item.path)
                  ? "bg-orange-500 text-white font-medium"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-white/5">
            <p className="text-sm font-medium truncate">{profile?.displayName || "Admin"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <p className="text-xs text-orange-400 mt-1">{roleLabel}</p>
            {profile?.department && (
              <p className="text-xs text-gray-500 mt-0.5">{profile.department}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          {!isSuperAdmin && null}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-white/10 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-semibold text-base">
            {NAV.find((item) => isActive(item.path))?.label ?? "Admin Portal"}
          </h1>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
