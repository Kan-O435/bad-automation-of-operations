import { useState } from "react";
import { API_URL } from "../lib/api";
import type {
  TournamentCategory,
  CreateTournamentCategoryParams,
} from "../types/tournament_category";

type UseUpdateTournamentCategoryReturn = {
  updateCategory: (
    tournamentId: number,
    categoryId: number,
    params: CreateTournamentCategoryParams
  ) => Promise<TournamentCategory | null>;
  loading: boolean;
  error: string | null;
};

export const useUpdateTournamentCategory =
  (): UseUpdateTournamentCategoryReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateCategory = async (
      tournamentId: number,
      categoryId: number,
      params: CreateTournamentCategoryParams
    ): Promise<TournamentCategory | null> => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/tournaments/${tournamentId}/tournament_categories/${categoryId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ tournament_category: params }),
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = Array.isArray(data.errors)
            ? data.errors.join(", ")
            : `更新に失敗しました (${res.status})`;
          throw new Error(msg);
        }

        return (await res.json()) as TournamentCategory;
      } catch (err) {
        setError(err instanceof Error ? err.message : "通信エラーが発生しました");
        return null;
      } finally {
        setLoading(false);
      }
    };

    return { updateCategory, loading, error };
  };
