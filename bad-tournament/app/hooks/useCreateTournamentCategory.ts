import { useState } from "react";
import { API_URL } from "../lib/api";
import type {
  TournamentCategory,
  CreateTournamentCategoryParams,
} from "../types/tournament_category";

type UseCreateTournamentCategoryReturn = {
  createCategory: (
    tournamentId: number,
    params: CreateTournamentCategoryParams
  ) => Promise<TournamentCategory | null>;
  loading: boolean;
  error: string | null;
};

export const useCreateTournamentCategory =
  (): UseCreateTournamentCategoryReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createCategory = async (
      tournamentId: number,
      params: CreateTournamentCategoryParams
    ): Promise<TournamentCategory | null> => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/tournaments/${tournamentId}/tournament_categories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ tournament_category: params }),
          }
        );

        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            errorData = {
              errors: [`サーバーエラー: ${res.status} ${res.statusText}`],
            };
          }
          const messages = Array.isArray(errorData.errors)
            ? errorData.errors
            : ["カテゴリーの作成に失敗しました"];
          setError(messages.join(", "));
          return null;
        }

        const created: TournamentCategory = await res.json();
        return created;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "通信エラーが発生しました"
        );
        return null;
      } finally {
        setLoading(false);
      }
    };

    return { createCategory, loading, error };
  };
