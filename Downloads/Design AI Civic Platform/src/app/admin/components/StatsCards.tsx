import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    verified: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    highPriority: number;
    today: number;
  };
}

const cards = [
  { key: "total", label: "Total Complaints", icon: FileText, color: "text-primary" },
  { key: "pending", label: "Pending", icon: Clock, color: "text-yellow-400" },
  { key: "verified", label: "Verified", icon: ShieldCheck, color: "text-cyan-400" },
  { key: "inProgress", label: "In Progress", icon: TrendingUp, color: "text-orange-400" },
  { key: "resolved", label: "Resolved", icon: CheckCircle2, color: "text-green-400" },
  { key: "rejected", label: "Rejected", icon: AlertTriangle, color: "text-red-400" },
  { key: "highPriority", label: "High Priority", icon: Flame, color: "text-red-400" },
  { key: "today", label: "Today's Complaints", icon: Clock, color: "text-blue-400" },
] as const;

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors"
        >
          <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
          <div className="text-2xl font-bold">{stats[card.key]}</div>
          <div className="text-xs text-gray-400 mt-1">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
