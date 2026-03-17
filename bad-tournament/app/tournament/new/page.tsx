"use client";

import { useRouter } from "next/navigation";
import { useCreateTournament } from "../../hooks/useCreateTournament";
import { TournamentForm } from "../../components/tournament/TournamentForm";

export default function NewTournamentPage() {
  const router = useRouter();
  const { createTournament, loading, error } = useCreateTournament();

  const handleSubmit = (title: string, detail: string, days: string[]) => {
    createTournament({ title, detail, days });
  };

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-black font-bold text-2xl">大会作成</h1>
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
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </main>
  );
}
