import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Tournament } from "../types/tournament";
import { API_URL } from "../lib/api";

export const useTournament = (id: number) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/tournaments/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("大会の取得に失敗しました");
        }

        const data = await res.json();
        setTournament(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id, router]);

  return {
    tournament,
    loading,
    error,
  };
};
