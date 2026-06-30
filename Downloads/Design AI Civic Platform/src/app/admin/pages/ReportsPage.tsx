import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminComplaints } from "../../hooks/useAdminComplaints";
import { useAdminStats } from "../../hooks/useAdminStats";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

const heatIcon = L.divIcon({
  html: `<div style="width:12px;height:12px;background:#f97316;border-radius:50%;opacity:.8;box-shadow:0 0 8px #f97316"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export function ReportsPage() {
  const { complaints, loading } = useAdminComplaints();
  const { stats } = useAdminStats(complaints);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const deptPerformance = stats.byDepartment.map(([name, total]) => {
    const resolved = complaints.filter(
      (item) => item.department === name && (item.status === "Resolved" || item.status === "Closed"),
    ).length;
    return {
      name,
      total,
      resolved,
      pending: total - resolved,
      rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  });

  const monthlyData = stats.byMonth.slice(-12).map(([name, value]) => ({
    name: name.slice(5),
    complaints: value,
  }));

  const center = stats.heatmap[0]
    ? ([stats.heatmap[0].lat, stats.heatmap[0].lng] as [number, number])
    : ([12.9716, 77.5946] as [number, number]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">
          Department performance, resolution metrics, and heatmap data
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Avg Resolution Time", value: `${stats.avgResolutionDays} days` },
          { label: "Pending Complaints", value: stats.pending },
          { label: "Resolved Complaints", value: stats.resolved },
          { label: "Rejection Rate", value: stats.total > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}%` : "0%" },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs text-gray-400 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Complaints per Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#151B2D", border: "1px solid #ffffff20" }} />
                <Bar dataKey="complaints" fill="#4F7CFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Department Performance</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {deptPerformance.map((dept) => (
              <div key={dept.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{dept.name}</span>
                  <span className="text-green-400">{dept.rate}% resolved</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{dept.resolved} resolved</span>
                  <span>{dept.pending} pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="font-semibold">Complaint Heatmap</h3>
          <p className="text-xs text-gray-400 mt-1">
            {stats.heatmap.length} geolocated complaints
          </p>
        </div>
        <div className="h-80 relative z-0">
          {stats.heatmap.length > 0 ? (
            <MapContainer center={center} zoom={11} className="w-full h-full">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {stats.heatmap.map((point, index) => (
                <Marker
                  key={index}
                  position={[point.lat, point.lng]}
                  icon={heatIcon}
                />
              ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              No geolocated complaints for heatmap.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
