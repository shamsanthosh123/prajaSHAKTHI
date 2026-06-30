import { useEffect, useState } from "react";
import { subscribeToComplaint } from "../lib/firebaseData";
import type { Complaint } from "../types";

export function useComplaintDetail(id: string | undefined) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setComplaint(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToComplaint(
      id,
      (item) => {
        setComplaint(item);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [id]);

  return { complaint, loading, error };
}
