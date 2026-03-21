import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../lib/api";
import type { TournamentCategory } from "../types/tournament_category";

type UseTournamentCategoriesReturn = {
  categories: TournamentCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const useTournamentCategories = (
  tournamentId: number
): UseTournamentCategoriesReturn => {
  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/tournament_categories`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("カテゴリーの取得に失敗しました");
      }

      const data: TournamentCategory[] = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
};
