import { useState } from "react";
import { API_URL } from "../lib/api";

export function useGenerateBracket(tournamentId: number, categoryId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 409 = 生成済み（正常扱い）、それ以外の失敗は false を返す
  const generate = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/tournament_categories/${categoryId}/generate`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok || res.status === 409) return true;
      const data = await res.json();
      setError(data.error ?? "生成に失敗しました");
      return false;
    } catch {
      setError("生成に失敗しました");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
