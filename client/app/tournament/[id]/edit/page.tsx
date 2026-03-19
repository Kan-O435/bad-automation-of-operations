"use client";

import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../hooks/useTournament";
import { useUpdateTournament } from "../../../hooks/useUpdateTournament";
import { TournamentForm } from "../../../components/tournament/TournamentForm";
import { TournamentLoading } from "../../../components/tournament/TournamentComponents";
import { TournamentError } from "../../../components/tournament/TournamentComponents";

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);
  const { tournament, loading: loadingTournament, error: tournamentError } = useTournament(tournamentId);
  const { updateTournament, loading: updating, error: updateError } = useUpdateTournament();

  const handleSubmit = (title: string, detail: string, days: string[]) => {
    const existingDayIds = tournament?.tournament_days?.map((day) => day.id) || [];
    updateTournament({
      id: tournamentId,
      title,
      detail,
      days,
      existingDayIds,
    });
  };

  if (loadingTournament) {
    return (
      <main className="min-h-screen bg-white p-8 md:p-16">
        <div className="max-w-2xl mx-auto">
          <TournamentLoading />
        </div>
      </main>
    );
  }

  if (tournamentError || !tournament) {
    return (
      <main className="min-h-screen bg-white p-8 md:p-16">
        <div className="max-w-2xl mx-auto">
          <TournamentError error={tournamentError || "大会が見つかりません"} />
        </div>
      </main>
    );
  }

  const initialDays = tournament.tournament_days?.map((day) => day.day) || [];

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-black font-bold text-2xl">大会編集</h1>
          <button
            onClick={() => router.push("/tournament")}
            className="text-gray-600 hover:text-black text-sm"
          >
            戻る
          </button>
        </div>

        <div className="bg-gray-50 p-10 border border-gray-100">
          <TournamentForm
            onSubmit={handleSubmit}
            loading={updating}
            error={updateError}
            initialTitle={tournament.title}
            initialDetail={tournament.detail}
            initialDays={initialDays}
            submitButtonText="大会を更新する"
          />
        </div>
      </div>
    </main>
  );
}
