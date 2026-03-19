import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Tournament } from "../types/tournament";
import { API_URL } from "../lib/api";

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tournaments`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("トーナメントの取得に失敗しました");
      }

      const data = await res.json();
      setTournaments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return {
    tournaments,
    loading,
    error,
    refetch: fetchTournaments,
  };
};
