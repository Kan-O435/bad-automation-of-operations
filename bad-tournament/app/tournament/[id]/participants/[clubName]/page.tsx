"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../../hooks/useTournament";
import { useTournamentCategories } from "../../../../hooks/useTournamentCategories";
import { useAllTeams } from "../../../../hooks/useAllTeams";
import {
  GENDER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from "../../../../types/tournament_category";
import { TEAM_MEMBER_GENDER_LABELS } from "../../../../types/team";
import type {
  Team,
  TeamMember,
  CreateTeamMemberParams,
  TeamMemberGenderType,
  TeamCategory,
} from "../../../../types/team";
import type { TournamentCategory } from "../../../../types/tournament_category";

// ────────────────────────────────────────────
// ユーティリティ
// ────────────────────────────────────────────
const categoryLabel = (cat: TournamentCategory | TeamCategory) =>
  [
    GENDER_TYPE_LABELS[cat.gender_type],
    EVENT_TYPE_LABELS[cat.event_type],
    cat.age_type || null,
    cat.rank ? `(${cat.rank})` : null,
  ]
    .filter(Boolean)
    .join(" ");

// ────────────────────────────────────────────
// カテゴリ選択
// ────────────────────────────────────────────
const CategorySelect = ({
  categories,
  value,
  onChange,
}: {
  categories: TournamentCategory[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      出場カテゴリ <span className="text-red-500">*</span>
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
    >
      <option value="">選択してください</option>
      {categories.map((cat) => (
        <option key={cat.id} value={String(cat.id)}>
          {categoryLabel(cat)}
        </option>
      ))}
    </select>
  </div>
);

// ────────────────────────────────────────────
// ── シングルス ──
// ────────────────────────────────────────────

type SinglesFormState = {
  name: string;
  gender: TeamMemberGenderType;
  age: string;
  number: string;
  categoryId: string;
};

const defaultSingles = (): SinglesFormState => ({
  name: "",
  gender: "men",
  age: "",
  number: "",
  categoryId: "",
});

// 登録済みシングルス行
const SinglesRow = ({
  team,
  index,
  tournamentId,
  onDelete,
  deleting,
}: {
  team: Team;
  index: number;
  tournamentId: number;
  onDelete: (tournamentId: number, categoryId: number, teamId: number) => void;
  deleting: boolean;
}) => {
  const m = team.team_members[0];
  const cat = team.tournament_category;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-xs text-gray-400 w-5 text-right">{index + 1}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{m?.name}</span>
            <span className="text-xs text-gray-400">
              {m ? TEAM_MEMBER_GENDER_LABELS[m.gender_type as TeamMemberGenderType] : ""}
            </span>
            {m?.age != null && (
              <span className="text-xs text-gray-400">{m.age}歳</span>
            )}
            {team.seed_number != null && (
              <span className="text-xs text-gray-300">#{team.seed_number}</span>
            )}
          </div>
          {cat && (
            <p className="text-xs text-gray-400 mt-0.5">{categoryLabel(cat)}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(tournamentId, team.tournament_category_id, team.id)}
        disabled={deleting}
        className="shrink-0 text-xs text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        削除
      </button>
    </div>
  );
};

// シングルス入力フォーム（インライン・自動連続）
const SinglesForm = ({
  categories,
  clubName,
  onSubmit,
}: {
  categories: TournamentCategory[];
  clubName: string;
  onSubmit: (form: SinglesFormState) => Promise<void>;
}) => {
  const [form, setForm] = useState<SinglesFormState>(defaultSingles());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const set = (k: keyof SinglesFormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError("氏名を入力してください"); return; }
    if (!form.categoryId) { setError("出場カテゴリを選択してください"); return; }
    try {
      setSubmitting(true);
      await onSubmit(form);
      setForm(defaultSingles()); // ← リセット = 次の人のフォームが自動表示
      setSavedCount((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4 mt-3"
    >
      {savedCount > 0 && (
        <p className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 rounded px-3 py-1.5">
          ✓ {savedCount}人登録済み。続けて入力できます
        </p>
      )}

      {/* 名前 + 性別 + 年齢 + 番号 を1行レイアウト */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            氏名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="田中 太郎"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            性別 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 pt-1.5">
            {(["men", "women"] as TeamMemberGenderType[]).map((g) => (
              <label key={g} className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`singles_gender_${clubName}`}
                  value={g}
                  checked={form.gender === g}
                  onChange={() => set("gender", g)}
                  className="accent-black"
                />
                {TEAM_MEMBER_GENDER_LABELS[g]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">年齢（任意）</label>
          <input
            type="number"
            min={0}
            max={120}
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="25"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">番号（任意）</label>
          <input
            type="number"
            min={1}
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            placeholder="1"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          />
        </div>
      </div>

      <CategorySelect
        categories={categories}
        value={form.categoryId}
        onChange={(v) => set("categoryId", v)}
      />

      {error && (
        <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded p-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {submitting ? "登録中..." : "登録する →"}
      </button>
    </form>
  );
};

// ────────────────────────────────────────────
// ── ダブルス ──
// ────────────────────────────────────────────

type MemberForm = {
  name: string;
  gender: TeamMemberGenderType;
  age: string;
  affiliation: string;
};

type DoublesFormState = {
  member1: MemberForm;
  member2: MemberForm;
  categoryId: string;
  number: string;
};

const defaultDoublesForm = (clubName: string): DoublesFormState => ({
  member1: { name: "", gender: "men", age: "", affiliation: clubName },
  member2: { name: "", gender: "men", age: "", affiliation: clubName },
  categoryId: "",
  number: "",
});

// 登録済みダブルス行
const DoublesRow = ({
  team,
  index,
  tournamentId,
  onDelete,
  deleting,
}: {
  team: Team;
  index: number;
  tournamentId: number;
  onDelete: (tournamentId: number, categoryId: number, teamId: number) => void;
  deleting: boolean;
}) => {
  const cat = team.tournament_category;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-xs text-gray-400 w-5 text-right">{index + 1}</span>
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {team.team_members.map((m: TeamMember, i) => (
              <span key={m.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">/</span>}
                <span className="font-semibold text-sm text-gray-900">{m.name}</span>
                <span className="text-xs text-gray-400">
                  {TEAM_MEMBER_GENDER_LABELS[m.gender_type as TeamMemberGenderType]}
                </span>
                {m.age != null && (
                  <span className="text-xs text-gray-400">{m.age}歳</span>
                )}
                {m.affiliation && m.affiliation !== team.affiliation && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {m.affiliation}
                  </span>
                )}
              </span>
            ))}
            {team.seed_number != null && (
              <span className="text-xs text-gray-300">#{team.seed_number}</span>
            )}
          </div>
          {cat && (
            <p className="text-xs text-gray-400">{categoryLabel(cat)}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(tournamentId, team.tournament_category_id, team.id)}
        disabled={deleting}
        className="shrink-0 text-xs text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        削除
      </button>
    </div>
  );
};

// ダブルス選手フィールドセット
const DoublesMemberFields = ({
  label,
  value,
  clubName,
  onChange,
  radioGroupSuffix,
}: {
  label: string;
  value: MemberForm;
  clubName: string;
  onChange: (v: MemberForm) => void;
  radioGroupSuffix: string;
}) => (
  <div className="space-y-3">
    <p className="text-xs font-bold text-gray-500">{label}</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          氏名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="田中 太郎"
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          性別 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3 pt-1.5">
          {(["men", "women"] as TeamMemberGenderType[]).map((g) => (
            <label key={g} className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="radio"
                name={`doubles_gender_${radioGroupSuffix}`}
                value={g}
                checked={value.gender === g}
                onChange={() => onChange({ ...value, gender: g })}
                className="accent-black"
              />
              {TEAM_MEMBER_GENDER_LABELS[g]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">年齢（任意）</label>
        <input
          type="number"
          min={0}
          max={120}
          value={value.age}
          onChange={(e) => onChange({ ...value, age: e.target.value })}
          placeholder="25"
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          所属
          {value.affiliation !== clubName && (
            <span className="ml-1 text-orange-500 font-normal">（変更済み）</span>
          )}
        </label>
        <input
          type="text"
          value={value.affiliation}
          onChange={(e) => onChange({ ...value, affiliation: e.target.value })}
          placeholder={clubName}
          className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white ${
            value.affiliation !== clubName
              ? "border-orange-300 bg-orange-50"
              : "border-gray-200"
          }`}
        />
      </div>
    </div>
  </div>
);

// ダブルス入力フォーム（インライン・自動連続）
const DoublesForm = ({
  categories,
  clubName,
  onSubmit,
}: {
  categories: TournamentCategory[];
  clubName: string;
  onSubmit: (form: DoublesFormState) => Promise<void>;
}) => {
  const [form, setForm] = useState<DoublesFormState>(defaultDoublesForm(clubName));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.member1.name.trim()) { setError("選手1の氏名を入力してください"); return; }
    if (!form.member2.name.trim()) { setError("選手2の氏名を入力してください"); return; }
    if (!form.categoryId) { setError("出場カテゴリを選択してください"); return; }
    try {
      setSubmitting(true);
      await onSubmit(form);
      setForm(defaultDoublesForm(clubName)); // ← リセット = 次のペアフォームが自動表示
      setSavedCount((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4 mt-3"
    >
      {savedCount > 0 && (
        <p className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 rounded px-3 py-1.5">
          ✓ {savedCount}ペア登録済み。続けて入力できます
        </p>
      )}

      <DoublesMemberFields
        label="選手 1"
        value={form.member1}
        clubName={clubName}
        onChange={(v) => setForm((f) => ({ ...f, member1: v }))}
        radioGroupSuffix={`m1_${clubName}`}
      />

      <div className="border-t border-gray-200" />

      <DoublesMemberFields
        label="選手 2"
        value={form.member2}
        clubName={clubName}
        onChange={(v) => setForm((f) => ({ ...f, member2: v }))}
        radioGroupSuffix={`m2_${clubName}`}
      />

      <div className="border-t border-gray-200" />

      <div className="grid grid-cols-2 gap-3">
        <CategorySelect
          categories={categories}
          value={form.categoryId}
          onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
        />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">番号（任意）</label>
          <input
            type="number"
            min={1}
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            placeholder="1"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded p-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {submitting ? "登録中..." : "登録する →"}
      </button>
    </form>
  );
};

// ────────────────────────────────────────────
// メインページ
// ────────────────────────────────────────────
export default function ClubParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);
  const clubName = decodeURIComponent(params.clubName as string);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { tournament } = useTournament(tournamentId);
  const { categories } = useTournamentCategories(tournamentId);
  const { teams, loading, error, createTeamWithMembers, deleteTeam } =
    useAllTeams(tournamentId);

  // このクラブのチームのみ
  const clubTeams = useMemo(
    () => teams.filter((t) => t.affiliation === clubName),
    [teams, clubName]
  );
  const singles = useMemo(
    () => clubTeams.filter((t) => t.team_members.length < 2),
    [clubTeams]
  );
  const doubles = useMemo(
    () => clubTeams.filter((t) => t.team_members.length >= 2),
    [clubTeams]
  );

  // シングルス登録
  const handleCreateSingles = async (form: SinglesFormState) => {
    const members: CreateTeamMemberParams[] = [
      {
        name: form.name.trim(),
        gender_type: form.gender,
        affiliation: clubName,
        age: form.age !== "" ? Number(form.age) : undefined,
      },
    ];
    await createTeamWithMembers(
      tournamentId,
      Number(form.categoryId),
      {
        name: form.name.trim(),
        affiliation: clubName,
        seed_number: form.number !== "" ? Number(form.number) : null,
      },
      members
    );
  };

  // ダブルス登録
  const handleCreateDoubles = async (form: DoublesFormState) => {
    const teamName = `${form.member1.name.trim()} / ${form.member2.name.trim()}`;
    const members: CreateTeamMemberParams[] = [
      {
        name: form.member1.name.trim(),
        gender_type: form.member1.gender,
        affiliation: form.member1.affiliation.trim() || clubName,
        age: form.member1.age !== "" ? Number(form.member1.age) : undefined,
      },
      {
        name: form.member2.name.trim(),
        gender_type: form.member2.gender,
        affiliation: form.member2.affiliation.trim() || clubName,
        age: form.member2.age !== "" ? Number(form.member2.age) : undefined,
      },
    ];
    await createTeamWithMembers(
      tournamentId,
      Number(form.categoryId),
      {
        name: teamName,
        affiliation: clubName,
        seed_number: form.number !== "" ? Number(form.number) : null,
      },
      members
    );
  };

  const handleDelete = async (tId: number, cId: number, teamId: number) => {
    if (!window.confirm("このエントリーを削除しますか？")) return;
    setDeletingId(teamId);
    try {
      await deleteTeam(tId, cId, teamId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto">
        {/* ── ヘッダー ── */}
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
            <button onClick={() => router.push(`/tournament/${tournamentId}/participants`)}
              className="hover:text-gray-600 transition-colors">参加者登録</button>
            <span>/</span>
            <span className="text-black font-semibold">{clubName}</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-black font-bold text-2xl">{clubName}</h1>
              {tournament && (
                <p className="text-gray-500 text-sm mt-0.5">{tournament.title}</p>
              )}
            </div>
            {!loading && (
              <div className="text-right">
                <p className="text-xl font-bold text-black">{clubTeams.length}</p>
                <p className="text-xs text-gray-400">エントリー</p>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ────── シングルス セクション ────── */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-bold text-base text-black">シングルス</h2>
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  S
                </span>
                {singles.length > 0 && (
                  <span className="text-xs text-gray-400">{singles.length}人登録済み</span>
                )}
              </div>

              {/* 登録済みリスト */}
              {singles.length > 0 && (
                <div className="border border-gray-200 rounded-xl px-4 mb-3">
                  {singles.map((team, i) => (
                    <SinglesRow
                      key={team.id}
                      team={team}
                      index={i}
                      tournamentId={tournamentId}
                      onDelete={handleDelete}
                      deleting={deletingId === team.id}
                    />
                  ))}
                </div>
              )}

              {/* インライン入力フォーム（常時表示・自動連続） */}
              {categories.length > 0 ? (
                <SinglesForm
                  categories={categories}
                  clubName={clubName}
                  onSubmit={handleCreateSingles}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-700 text-xs font-semibold">
                    カテゴリが登録されていません。
                    <button
                      onClick={() => router.push(`/tournament/${tournamentId}/categories`)}
                      className="underline ml-1"
                    >
                      カテゴリを追加
                    </button>
                  </p>
                </div>
              )}
            </section>

            {/* ────── ダブルス セクション ────── */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-bold text-base text-black">ダブルス</h2>
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-700">
                  D
                </span>
                {doubles.length > 0 && (
                  <span className="text-xs text-gray-400">{doubles.length}ペア登録済み</span>
                )}
              </div>

              {/* 登録済みリスト */}
              {doubles.length > 0 && (
                <div className="border border-gray-200 rounded-xl px-4 mb-3">
                  {doubles.map((team, i) => (
                    <DoublesRow
                      key={team.id}
                      team={team}
                      index={i}
                      tournamentId={tournamentId}
                      onDelete={handleDelete}
                      deleting={deletingId === team.id}
                    />
                  ))}
                </div>
              )}

              {/* インライン入力フォーム（常時表示・自動連続） */}
              {categories.length > 0 ? (
                <DoublesForm
                  categories={categories}
                  clubName={clubName}
                  onSubmit={handleCreateDoubles}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-700 text-xs font-semibold">
                    カテゴリが登録されていません。
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* フッター */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <button
            onClick={() => router.push(`/tournament/${tournamentId}/participants`)}
            className="text-sm text-black underline hover:opacity-70 transition-opacity"
          >
            ← 参加チーム一覧に戻る
          </button>
        </div>
      </div>
    </main>
  );
}
