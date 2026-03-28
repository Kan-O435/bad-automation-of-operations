"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../../hooks/useTournament";
import { useTournamentCategories } from "../../../../hooks/useTournamentCategories";
import { useAllTeams } from "../../../../hooks/useAllTeams";
import { API_URL } from "../../../../lib/api";
import { GENDER_TYPE_LABELS, EVENT_TYPE_LABELS } from "../../../../types/tournament_category";
import { TEAM_MEMBER_GENDER_LABELS } from "../../../../types/team";
import type { Team, TeamMember, TeamMemberGenderType } from "../../../../types/team";
import type { TournamentCategory } from "../../../../types/tournament_category";

type ViewMode = "category" | "club";

const categoryLabel = (cat: TournamentCategory | Team["tournament_category"]) => {
  if (!cat) return "—";
  return [
    GENDER_TYPE_LABELS[cat.gender_type],
    EVENT_TYPE_LABELS[cat.event_type],
    cat.age_type || null,
    cat.rank ? `(${cat.rank})` : null,
  ]
    .filter(Boolean)
    .join(" ");
};

// ── メンバー編集フォーム（インライン） ───────────────────────────────────────

type MemberEditFormProps = {
  member: TeamMember;
  tournamentId: number;
  categoryId: number;
  teamId: number;
  onSaved: () => void;
  onCancel: () => void;
};

function MemberEditForm({ member, tournamentId, categoryId, teamId, onSaved, onCancel }: MemberEditFormProps) {
  const [name, setName] = useState(member.name);
  const [gender, setGender] = useState<TeamMemberGenderType>(member.gender_type);
  const [age, setAge] = useState(member.age != null ? String(member.age) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError("氏名を入力してください"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/tournament_categories/${categoryId}/teams/${teamId}/team_members/${member.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_member: {
              name: name.trim(),
              gender_type: gender,
              age: age !== "" ? Number(age) : null,
            },
          }),
        }
      );
      if (!res.ok) throw new Error("更新に失敗しました");
      onSaved();
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">氏名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-black bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">性別</label>
          <div className="flex gap-3 pt-1">
            {(["men", "women"] as TeamMemberGenderType[]).map((g) => (
              <label key={g} className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`edit_gender_${member.id}`}
                  value={g}
                  checked={gender === g}
                  onChange={() => setGender(g)}
                  className="accent-black"
                />
                {TEAM_MEMBER_GENDER_LABELS[g]}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">年齢</label>
          <input
            type="number"
            min={0}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="—"
            className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-black bg-white"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 bg-black text-white rounded hover:opacity-80 disabled:opacity-40"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}

// ── チーム行 ─────────────────────────────────────────────────────────────────

type TeamRowProps = {
  team: Team;
  tournamentId: number;
  showCategory?: boolean;
  onDeleted: () => void;
  onUpdated: () => void;
};

function TeamRow({ team, tournamentId, showCategory = false, onDeleted, onUpdated }: TeamRowProps) {
  const [seed, setSeed] = useState(team.seed_number != null ? String(team.seed_number) : "");
  const [seedDirty, setSeedDirty] = useState(false);
  const [savingSeed, setSavingSeed] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryId = team.tournament_category_id;

  const handleSeedChange = (v: string) => {
    setSeed(v);
    setSeedDirty(true);
  };

  const handleSaveSeed = async () => {
    setSavingSeed(true);
    try {
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/tournament_categories/${categoryId}/teams/${team.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team: { seed_number: seed !== "" ? Number(seed) : null } }),
        }
      );
      if (!res.ok) throw new Error();
      setSeedDirty(false);
      onUpdated();
    } finally {
      setSavingSeed(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`「${team.name}」を削除しますか？`)) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/tournament_categories/${categoryId}/teams/${team.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error();
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between gap-3">
        {/* 左: チーム情報 */}
        <div className="flex-1 min-w-0 space-y-1">
          {showCategory && team.tournament_category && (
            <p className="text-xs text-gray-400">{categoryLabel(team.tournament_category)}</p>
          )}
          {team.team_members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">{m.name}</span>
              <span className="text-xs text-gray-400">{TEAM_MEMBER_GENDER_LABELS[m.gender_type]}</span>
              {m.age != null && <span className="text-xs text-gray-400">{m.age}歳</span>}
              {m.affiliation && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {m.affiliation}
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditingMemberId(editingMemberId === m.id ? null : m.id)}
                className="text-xs text-gray-400 hover:text-black underline"
              >
                編集
              </button>
              {editingMemberId === m.id && (
                <MemberEditForm
                  member={m}
                  tournamentId={tournamentId}
                  categoryId={categoryId}
                  teamId={team.id}
                  onSaved={() => { setEditingMemberId(null); onUpdated(); }}
                  onCancel={() => setEditingMemberId(null)}
                />
              )}
            </div>
          ))}
        </div>

        {/* 右: シード + 削除 */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-400 shrink-0">シード</label>
            <input
              type="number"
              min={1}
              value={seed}
              onChange={(e) => handleSeedChange(e.target.value)}
              placeholder="—"
              className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-black bg-white"
            />
            {seedDirty && (
              <button
                type="button"
                onClick={handleSaveSeed}
                disabled={savingSeed}
                className="text-xs px-2 py-1 bg-black text-white rounded hover:opacity-80 disabled:opacity-40"
              >
                {savingSeed ? "…" : "保存"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────────────────────────

export default function ParticipantsConfirmPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);

  const [viewMode, setViewMode] = useState<ViewMode>("category");

  const { tournament } = useTournament(tournamentId);
  const { categories } = useTournamentCategories(tournamentId);
  const { teams, loading, error, refetch } = useAllTeams(tournamentId);

  // カテゴリ別グループ
  const teamsByCategory = useMemo(() => {
    const map = new Map<number, Team[]>();
    for (const team of teams) {
      const key = team.tournament_category_id;
      map.set(key, [...(map.get(key) ?? []), team]);
    }
    return map;
  }, [teams]);

  // 団体別グループ
  const teamsByClub = useMemo(() => {
    const map = new Map<string, Team[]>();
    for (const team of teams) {
      const key = team.affiliation ?? "所属なし";
      map.set(key, [...(map.get(key) ?? []), team]);
    }
    return map;
  }, [teams]);

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
            <button onClick={() => router.push("/tournament")} className="hover:text-gray-600 transition-colors">
              大会一覧
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/tournament/${tournamentId}/categories/list`)}
              className="hover:text-gray-600 transition-colors"
            >
              {tournament?.title ?? "..."}
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/tournament/${tournamentId}/participants`)}
              className="hover:text-gray-600 transition-colors"
            >
              参加者登録
            </button>
            <span>/</span>
            <span className="text-black font-semibold">参加者確認</span>
          </div>
          <h1 className="text-black font-bold text-2xl">参加者確認</h1>
          {tournament && <p className="text-gray-500 text-sm mt-1">{tournament.title}</p>}
        </div>

        {/* タブ */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {(["category", "club"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                viewMode === mode ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {mode === "category" ? "カテゴリ別" : "団体別"}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        {loading ? (
          <p className="text-center py-20 text-gray-400 text-sm">読み込み中...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-16 text-center">
            <p className="text-gray-500 font-semibold mb-1">参加者がまだ登録されていません</p>
            <button
              onClick={() => router.push(`/tournament/${tournamentId}/participants`)}
              className="mt-4 text-sm text-black underline hover:opacity-70"
            >
              参加者を登録する
            </button>
          </div>
        ) : viewMode === "category" ? (
          // ── カテゴリ別 ──
          <div className="space-y-6">
            {categories.map((cat) => {
              const catTeams = teamsByCategory.get(cat.id) ?? [];
              return (
                <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <span className="font-bold text-sm text-gray-800">{categoryLabel(cat)}</span>
                    <span className="text-xs text-gray-400">{catTeams.length} チーム</span>
                  </div>
                  <div className="px-4">
                    {catTeams.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">登録なし</p>
                    ) : (
                      catTeams.map((team) => (
                        <TeamRow
                          key={team.id}
                          team={team}
                          tournamentId={tournamentId}
                          onDeleted={refetch}
                          onUpdated={refetch}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // ── 団体別 ──
          <div className="space-y-6">
            {[...teamsByClub.entries()].map(([clubName, clubTeams]) => (
              <div key={clubName} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <span className="font-bold text-sm text-gray-800">{clubName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{clubTeams.length} エントリー</span>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/tournament/${tournamentId}/participants/${encodeURIComponent(clubName)}`
                        )
                      }
                      className="text-xs text-black underline hover:opacity-70"
                    >
                      登録ページへ
                    </button>
                  </div>
                </div>
                <div className="px-4">
                  {clubTeams.map((team) => (
                    <TeamRow
                      key={team.id}
                      team={team}
                      tournamentId={tournamentId}
                      showCategory
                      onDeleted={refetch}
                      onUpdated={refetch}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* フッター */}
        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => router.push(`/tournament/${tournamentId}/participants`)}
            className="text-sm text-black underline hover:opacity-70 transition-opacity"
          >
            ← 参加者登録に戻る
          </button>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">
              合計 <span className="font-bold text-black">{teams.length}</span> エントリー
            </p>
            <button
              onClick={() => router.push(`/tournament/${tournamentId}/bracket`)}
              className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:opacity-80 transition-opacity"
            >
              トーナメントを作成する →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
