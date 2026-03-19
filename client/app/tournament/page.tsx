"use client";

import { useRouter } from "next/navigation";
import { useTournaments } from "../hooks/useTournaments";
import { TournamentList, TournamentLoading, TournamentError } from "../components/tournament/TournamentComponents";
import { Button } from "../components/ui/Button";

export default function TournamentPage() {
  const { tournaments, loading, error } = useTournaments();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12 ml-4">
          <h1 className="text-black font-bold text-2xl">大会一覧</h1>
          <button
            onClick={() => router.push("/tournament/new")}
            className="bg-[#1a1a1a] text-white px-3 py-1 text-sm font-normal hover:opacity-90 transition-opacity rounded"
          >
            大会作成
          </button>
        </div>
        {loading && <TournamentLoading />}
        {error && <TournamentError error={error} />}
        {!loading && !error && <TournamentList tournaments={tournaments} />}
      </div>
    </main>
  );
}
