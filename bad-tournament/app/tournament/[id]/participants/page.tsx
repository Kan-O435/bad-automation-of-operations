"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../hooks/useTournament";
import { useAllTeams } from "../../../hooks/useAllTeams";

// ────────────────────────────────────────────
// 参加チーム追加モーダル
// ────────────────────────────────────────────
const AddClubModal = ({
  onClose,
  onAdd,
  existingClubs,
}: {
  onClose: () => void;
  onAdd: (name: string) => void;
  existingClubs: string[];
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("チーム名を入力してください"); return; }
    if (existingClubs.includes(trimmed)) { setError("同じ名前のチームがすでに存在します"); return; }
    onAdd(trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-base">参加チームを追加</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-black text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              チーム名・クラブ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：A高校、Bクラブ"
              autoFocus
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded p-3">{error}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit"
              className="flex-1 bg-black text-white rounded px-4 py-2.5 text-sm font-bold hover:opacity-80">
              追加して登録へ →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// メインページ（クラブ一覧）
// ────────────────────────────────────────────
export default function ParticipantsHubPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);

  const [addClubOpen, setAddClubOpen] = useState(false);
  const { tournament } = useTournament(tournamentId);
  const { teams, loading } = useAllTeams(tournamentId);

  // 既存クラブを導出
  const existingClubs = useMemo(() => {
    const names = teams
      .map((t) => t.affiliation)
      .filter((a): a is string => !!a);
    return [...new Set(names)];
  }, [teams]);

  // チームをクラブ別にカウント
  const countByClub = useMemo(() => {
    const map = new Map<string, number>();
    for (const team of teams) {
      const key = team.affiliation ?? "";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [teams]);

  const navigateToClub = (name: string) => {
    router.push(
      `/tournament/${tournamentId}/participants/${encodeURIComponent(name)}`
    );
  };

  const handleAddClub = (name: string) => {
    navigateToClub(name);
  };

  return (
    <>
      {addClubOpen && (
        <AddClubModal
          onClose={() => setAddClubOpen(false)}
          onAdd={handleAddClub}
          existingClubs={existingClubs}
        />
      )}

      <main className="min-h-screen bg-white p-8 md:p-16">
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
              <button onClick={() => router.push("/tournament")}
                className="hover:text-gray-600 transition-colors">大会一覧</button>
              <span>/</span>
              <button onClick={() => router.push(`/tournament/${tournamentId}/categories/list`)}
                className="hover:text-gray-600 transition-colors">
                {tournament?.title ?? "..."}
              </button>
              <span>/</span>
              <span className="text-black font-semibold">参加者登録</span>
            </div>
            <h1 className="text-black font-bold text-2xl">参加者登録</h1>
            {tournament && (
              <p className="text-gray-500 text-sm mt-1">{tournament.title}</p>
            )}
          </div>

          {/* 参加チームを追加ボタン */}
          <button
            type="button"
            onClick={() => setAddClubOpen(true)}
            className="w-full border-2 border-dashed border-gray-300 hover:border-black text-gray-500 hover:text-black rounded-xl py-4 text-sm font-bold transition-colors mb-6"
          >
            + 参加チームを追加
          </button>

          {/* クラブ一覧 */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">読み込み中...</p>
            </div>
          ) : existingClubs.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-16 text-center">
              <p className="text-gray-500 font-semibold mb-1">参加チームがまだありません</p>
              <p className="text-gray-400 text-sm">「参加チームを追加」からクラブ・学校を登録してください</p>
            </div>
          ) : (
            <div className="space-y-2">
              {existingClubs.map((clubName) => {
                const count = countByClub.get(clubName) ?? 0;
                return (
                  <button
                    key={clubName}
                    type="button"
                    onClick={() => navigateToClub(clubName)}
                    className="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-black rounded-xl px-5 py-4 transition-colors group"
                  >
                    <span className="font-bold text-sm text-black">{clubName}</span>
                    <div className="flex items-center gap-3">
                      {count > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                          {count} エントリー
                        </span>
                      )}
                      <span className="text-gray-300 group-hover:text-black transition-colors">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* フッター */}
          {!loading && existingClubs.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400">
                合計 <span className="font-bold text-black">{existingClubs.length}</span> チーム /{" "}
                <span className="font-bold text-black">{teams.length}</span> エントリー
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
