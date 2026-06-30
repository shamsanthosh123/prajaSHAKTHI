import { useMemo } from "react";
import { computeAdminStats, getRecentActivity } from "../lib/adminUtils";
import type { Complaint } from "../types";

export function useAdminStats(complaints: Complaint[]) {
  return useMemo(
    () => ({
      stats: computeAdminStats(complaints),
      recentActivity: getRecentActivity(complaints),
    }),
    [complaints],
  );
}
