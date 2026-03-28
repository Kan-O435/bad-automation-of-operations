import { useState } from "react";
import { API_URL } from "../lib/api";
import type { BracketData } from "../types/bracket";

export function useBracket(tournamentId: number, categoryId: number) {
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/tournament_categories/${categoryId}/bracket`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error();
      setBracket(await res.json());
    } catch {
      setError("ブラケットの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return { bracket, loading, error, fetch: fetch_ };
}
