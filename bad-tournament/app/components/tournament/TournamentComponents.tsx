import { useRouter } from "next/navigation";
import type { Tournament } from "../../types/tournament";

type TournamentCardProps = {
  tournament: Tournament;
};

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tournamentDays = tournament.tournament_days || [];
  const sortedDays = [...tournamentDays].sort((a, b) => 
    new Date(a.day).getTime() - new Date(b.day).getTime()
  );

  return (
    <div className="bg-gray-50 p-6 border border-gray-100 rounded hover:shadow-md transition-shadow flex gap-6">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-2 text-black">{tournament.title}</h2>
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{tournament.detail}</p>
        {sortedDays.length > 0 ? (
          <div className="text-sm text-gray-500">
            <p className="font-semibold mb-1">開催予定日:</p>
            <ul className="list-disc list-inside space-y-1">
              {sortedDays.map((day) => (
                <li key={day.id}>{formatDate(day.day)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500">開催予定日: 未設定</p>
        )}
      </div>
      <div className="flex items-start">
        <button
          onClick={() => router.push(`/tournament/${tournament.id}/edit`)}
          className="bg-[#1a1a1a] text-white px-3 py-1 text-sm font-normal hover:opacity-90 transition-opacity rounded"
        >
          編集
        </button>
      </div>
    </div>
  );
};

type TournamentListProps = {
  tournaments: Tournament[];
};

export const TournamentList = ({ tournaments }: TournamentListProps) => {
  if (tournaments.length === 0) {
    return (
      <div className="bg-gray-50 p-10 border border-gray-100 rounded">
        <p className="text-gray-600 text-center">大会がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
};

// Loading State
export const TournamentLoading = () => {
  return (
    <div className="text-center py-12">
      <p className="text-gray-600">読み込み中...</p>
    </div>
  );
};

type TournamentErrorProps = {
  error: string;
};

export const TournamentError = ({ error }: TournamentErrorProps) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <p className="text-red-600">{error}</p>
    </div>
  );
};
