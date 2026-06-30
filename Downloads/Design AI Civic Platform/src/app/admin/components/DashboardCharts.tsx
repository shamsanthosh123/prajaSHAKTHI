import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardChartsProps {
  byDepartment: [string, number][];
  byCategory: [string, number][];
  byMonth: [string, number][];
}

const COLORS = ["#4F7CFF", "#22c55e", "#f97316", "#06b6d4", "#a855f7", "#ef4444", "#eab308"];

export function DashboardCharts({ byDepartment, byCategory, byMonth }: DashboardChartsProps) {
  const deptData = byDepartment.slice(0, 8).map(([name, value]) => ({ name, value }));
  const catData = byCategory.slice(0, 6).map(([name, value]) => ({ name, value }));
  const monthData = byMonth.slice(-6).map(([name, value]) => ({
    name: name.slice(5),
    value,
  }));

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="bg-card border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-4">Complaints by Department</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#151B2D", border: "1px solid #ffffff20" }} />
              <Bar dataKey="value" fill="#4F7CFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-4">Complaints by Category</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {catData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#151B2D", border: "1px solid #ffffff20" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-4">Monthly Trend</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#151B2D", border: "1px solid #ffffff20" }} />
              <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
