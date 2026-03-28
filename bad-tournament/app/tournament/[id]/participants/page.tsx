"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../hooks/useTournament";
import { useAllTeams } from "../../../hooks/useAllTeams";
import { useTournamentCategories } from "../../../hooks/useTournamentCategories";
import { API_URL } from "../../../lib/api";
import {
  GENDER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from "../../../types/tournament_category";
import type { TournamentCategory } from "../../../types/tournament_category";

// ────────────────────────────────────────────
// カテゴリ表示名
// ────────────────────────────────────────────
const categoryLabel = (cat: TournamentCategory) =>
  [
    GENDER_TYPE_LABELS[cat.gender_type],
    EVENT_TYPE_LABELS[cat.event_type],
    cat.age_type || null,
    cat.rank ? `(${cat.rank})` : null,
  ]
    .filter(Boolean)
    .join(" ");

// ────────────────────────────────────────────
// CSVテンプレートダウンロード（カテゴリ一覧を埋め込む）
// ────────────────────────────────────────────
const downloadTemplate = (categories: TournamentCategory[]) => {
  const headers = [
    "カテゴリ",
    "チーム名",
    "選手1 名前",
    "選手1 所属",
    "選手1 性別",
    "選手2 名前",
    "選手2 所属",
    "選手2 性別",
    "シード番号",
  ];

  // 実際のカテゴリ名を使ったサンプル行
  const firstCat = categories[0] ? categoryLabel(categories[0]) : "男子 シングルス 一般";
  const secondCat = categories[1] ? categoryLabel(categories[1]) : firstCat;
  const examples = [
    [firstCat,  "Aクラブ", "田中 太郎", "Aクラブ", "男", "",       "",      "",    "1"],
    [firstCat,  "Bクラブ", "鈴木 花子", "Bクラブ", "女", "",       "",      "",    "" ],
    [secondCat, "Cクラブ", "佐藤 次郎", "Cクラブ", "男", "山田 三郎", "Dクラブ", "男", "" ],
  ];

  // 利用可能なカテゴリ一覧をコメント行として末尾に付与
  const categoryComments = [
    [""],
    ["# 利用可能なカテゴリ一覧（カテゴリ列にそのままコピーして使ってください）"],
    ...categories.map((cat) => [`# ${categoryLabel(cat)}`]),
  ];

  const rows = [headers, ...examples, ...categoryComments]
    .map((r) => r.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "参加者インポートテンプレート.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ────────────────────────────────────────────
// CSVインポートモーダル
// ────────────────────────────────────────────
type ImportError = { row: number; message: string };

const CsvImportModal = ({
  tournamentId,
  categories,
  onClose,
  onSuccess,
}: {
  tournamentId: number;
  categories: TournamentCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessCount(null);

    if (!file) {
      setErrors([{ row: 0, message: "CSVファイルを選択してください" }]);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetch(
        `${API_URL}/tournaments/${tournamentId}/import`,
        { method: "POST", credentials: "include", body: formData }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccessCount(data.success_count);
        onSuccess();
      } else {
        setErrors(data.errors ?? [{ row: 0, message: "インポートに失敗しました" }]);
        if (data.success_count > 0) setSuccessCount(data.success_count);
      }
    } catch {
      setErrors([{ row: 0, message: "通信エラーが発生しました" }]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-base">CSVで一括インポート</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-black text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* テンプレートDL */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">テンプレートを使って入力してください</p>
              <p className="text-xs text-gray-400 mt-0.5">
                カテゴリ名はテンプレート末尾の一覧からコピーして使ってください
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadTemplate(categories)}
              className="shrink-0 ml-4 text-xs font-bold text-black border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-100"
            >
              テンプレートDL
            </button>
          </div>

          {/* ファイル選択 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              CSVファイル <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          {/* 成功メッセージ */}
          {successCount !== null && (
            <p className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 rounded px-3 py-2">
              {successCount} 件のチームを登録しました
            </p>
          )}

          {/* エラー一覧 */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 space-y-1 max-h-40 overflow-y-auto">
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">
                  {err.row > 0 ? `${err.row}行目: ` : ""}{err.message}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              閉じる
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-black text-white rounded px-4 py-2.5 text-sm font-bold hover:opacity-80 disabled:opacity-40"
            >
              {uploading ? "インポート中..." : "インポート →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  const [importOpen, setImportOpen] = useState(false);
  const { tournament } = useTournament(tournamentId);
  const { teams, loading, refetch } = useAllTeams(tournamentId);
  const { categories } = useTournamentCategories(tournamentId);

  const existingClubs = useMemo(() => {
    const names = teams
      .map((t) => t.affiliation)
      .filter((a): a is string => !!a);
    return [...new Set(names)];
  }, [teams]);

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

      {importOpen && (
        <CsvImportModal
          tournamentId={tournamentId}
          categories={categories}
          onClose={() => setImportOpen(false)}
          onSuccess={() => refetch()}
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

          {/* アクションボタン */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setAddClubOpen(true)}
              className="flex-1 border-2 border-dashed border-gray-300 hover:border-black text-gray-500 hover:text-black rounded-xl py-4 text-sm font-bold transition-colors"
            >
              + 参加チームを追加
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex-1 border-2 border-dashed border-gray-300 hover:border-black text-gray-500 hover:text-black rounded-xl py-4 text-sm font-bold transition-colors"
            >
              CSVで一括インポート
            </button>
          </div>

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
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                合計 <span className="font-bold text-black">{existingClubs.length}</span> チーム /{" "}
                <span className="font-bold text-black">{teams.length}</span> エントリー
              </p>
              <button
                type="button"
                onClick={() => router.push(`/tournament/${tournamentId}/participants/confirm`)}
                className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:opacity-80 transition-opacity"
              >
                参加者の確認 →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
