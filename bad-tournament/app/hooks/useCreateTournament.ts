import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

type CreateTournamentParams = {
  title: string;
  detail: string;
  days: string[];
};

export const useCreateTournament = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createTournament = async (params: CreateTournamentParams) => {
    try {
      setLoading(true);
      setError(null);

      // Tournamentを作成
      const tournamentRes = await fetch(`${API_URL}/tournaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          tournament: {
            title: params.title,
            detail: params.detail,
          },
        }),
      });

      if (!tournamentRes.ok) {
        if (tournamentRes.status === 401) {
          router.push("/login");
          return;
        }

        let errorData;
        try {
          errorData = await tournamentRes.json();
        } catch {
          errorData = { errors: [`サーバーエラー: ${tournamentRes.status} ${tournamentRes.statusText}`] };
        }

        const errorMessages = Array.isArray(errorData.errors)
          ? errorData.errors
          : ["大会の作成に失敗しました"];
        setError(errorMessages.join(", "));
        return;
      }

      const tournamentData = await tournamentRes.json();

      // TournamentDayを作成
      if (params.days.length > 0) {
        const dayPromises = params.days.map((day) =>
          fetch(`${API_URL}/tournament_days`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              tournament_day: {
                day: day,
                tournament_id: tournamentData.id,
              },
            }),
          })
        );

        const dayResults = await Promise.all(dayPromises);
        const failedDays = dayResults.filter((res) => !res.ok);

        if (failedDays.length > 0) {
          setError("大会は作成されましたが、一部の開催日の登録に失敗しました");
          return;
        }
      }

      router.push("/tournament");
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return {
    createTournament,
    loading,
    error,
  };
};
