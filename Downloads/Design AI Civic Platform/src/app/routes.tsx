import { createBrowserRouter, Navigate } from "react-router";
import { SplashScreen } from "./components/SplashScreen";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { Dashboard } from "./components/Dashboard";
import { ReportIssue } from "./components/ReportIssue";
import { ComplaintPreview } from "./components/ComplaintPreview";
import { ComplaintTracking } from "./components/ComplaintTracking";
import { CommunityMap } from "./components/CommunityMap";
import { Leaderboard } from "./components/Leaderboard";
import { AIAssistant } from "./components/AIAssistant";
import { UserProfile } from "./components/UserProfile";
import { Notifications } from "./components/Notifications";
import { AdminDashboard } from "./components/AdminDashboard";
import { MainLayout } from "./components/MainLayout";
import { MyComplaints } from "./components/MyComplaints";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminAuthPage } from "./admin/AdminAuthPage";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminProtectedRoute } from "./admin/AdminProtectedRoute";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { ComplaintsPage } from "./admin/pages/ComplaintsPage";
import { ComplaintDetailPage } from "./admin/pages/ComplaintDetailPage";
import { OfficersPage } from "./admin/pages/OfficersPage";
import { ReportsPage } from "./admin/pages/ReportsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SplashScreen />,
  },
  {
    path: "/landing",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/admin/auth",
    element: <AdminAuthPage />,
  },
  {
    element: <AdminProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboardPage /> },
          { path: "complaints", element: <ComplaintsPage /> },
          { path: "complaints/:id", element: <ComplaintDetailPage /> },
          { path: "officers", element: <OfficersPage /> },
          { path: "reports", element: <ReportsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: <MainLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "report", element: <ReportIssue /> },
          { path: "preview", element: <ComplaintPreview /> },
          { path: "tracking/:id", element: <ComplaintTracking /> },
          { path: "map", element: <CommunityMap /> },
          { path: "leaderboard", element: <Leaderboard /> },
          { path: "assistant", element: <AIAssistant /> },
          { path: "profile", element: <UserProfile /> },
          { path: "notifications", element: <Notifications /> },
          { path: "my-complaints", element: <MyComplaints /> },
          {
            element: <ProtectedRoute adminOnly />,
            children: [
              { path: "admin", element: <AdminDashboard /> },
            ],
          },
        ],
      },
    ],
  },
]);
