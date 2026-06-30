import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/AuthContext";
import {
  filterComplaintsForDepartment,
  subscribeToAllComplaints,
} from "../lib/firebaseData";
import type { Complaint } from "../types";

export function useAdminComplaints() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllComplaints(
      (items) => {
        setComplaints(filterComplaintsForDepartment(items, profile));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [profile?.uid, profile?.role, profile?.department]);

  const departments = useMemo(
    () => [...new Set(complaints.map((item) => item.department))].sort(),
    [complaints],
  );

  const categories = useMemo(
    () => [...new Set(complaints.map((item) => item.issueType))].sort(),
    [complaints],
  );

  return { complaints, loading, error, departments, categories };
}
