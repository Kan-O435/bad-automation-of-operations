import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

type UpdateTournamentParams = {
  id: number;
  title: string;
  detail: string;
  days: string[];
  existingDayIds: number[];
};

export const useUpdateTournament = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const updateTournament = async (params: UpdateTournamentParams) => {
    try {
      setLoading(true);
      setError(null);

      // Tournamentを更新
      const tournamentRes = await fetch(`${API_URL}/tournaments/${params.id}`, {
        method: "PATCH",
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
          : ["大会の更新に失敗しました"];
        setError(errorMessages.join(", "));
        return;
      }

      // 既存のTournamentDayを削除
      if (params.existingDayIds.length > 0) {
        await Promise.all(
          params.existingDayIds.map((dayId) =>
            fetch(`${API_URL}/tournaments/${params.id}/tournament_days/${dayId}`, {
              method: "DELETE",
              credentials: "include",
            })
          )
        );
      }

      // 新しいTournamentDayを作成
      if (params.days.length > 0) {
        const dayPromises = params.days.map((day) =>
          fetch(`${API_URL}/tournaments/${params.id}/tournament_days`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              tournament_day: {
                day: day,
              },
            }),
          })
        );

        const dayResults = await Promise.all(dayPromises);
        const failedDays = dayResults.filter((res) => !res.ok);

        if (failedDays.length > 0) {
          setError("大会は更新されましたが、一部の開催日の更新に失敗しました");
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
    updateTournament,
    loading,
    error,
  };
};
