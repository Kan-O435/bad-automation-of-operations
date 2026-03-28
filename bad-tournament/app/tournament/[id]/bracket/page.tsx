"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../hooks/useTournament";
import { useTournamentCategories } from "../../../hooks/useTournamentCategories";
import { BracketView } from "../../../components/tournament/bracket/BracketView";
import { API_URL } from "../../../lib/api";
import { GENDER_TYPE_LABELS, EVENT_TYPE_LABELS } from "../../../types/tournament_category";
import type { TournamentCategory } from "../../../types/tournament_category";
import type { BracketData } from "../../../types/bracket";

// ── カテゴリラベル ────────────────────────────────────────────────────────────

const categoryLabel = (cat: TournamentCategory) =>
  [
    GENDER_TYPE_LABELS[cat.gender_type],
    EVENT_TYPE_LABELS[cat.event_type],
    cat.age_type || null,
    cat.rank ? `(${cat.rank})` : null,
  ]
    .filter(Boolean)
    .join(" ");

// ── カテゴリ別ブラケットパネル ─────────────────────────────────────────────────
// マウント時に自動でgenerate → bracketを取得して表示する。
// 生成済み（409）も正常扱いなので冪等に動作する。

type PanelStatus = "generating" | "done" | "error";

function CategoryBracketPanel({
  category,
  tournamentId,
}: {
  category: TournamentCategory;
  tournamentId: number;
}) {
  const [open, setOpen] = useState(true);
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [status, setStatus] = useState<PanelStatus>("generating");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // 1. generate（409 = 生成済みも OK）
        const genRes = await fetch(
          `${API_URL}/tournaments/${tournamentId}/tournament_categories/${category.id}/generate`,
          { method: "POST", credentials: "include" }
        );
        if (!genRes.ok && genRes.status !== 409) {
          const data = await genRes.json().catch(() => ({}));
          setError(data.error ?? "生成に失敗しました");
          setStatus("error");
          return;
        }

        // 2. ブラケット取得
        const bracketRes = await fetch(
          `${API_URL}/tournaments/${tournamentId}/tournament_categories/${category.id}/bracket`,
          { credentials: "include" }
        );
        if (!bracketRes.ok) throw new Error("取得に失敗しました");

        setBracket(await bracketRes.json());
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
        setStatus("error");
      }
    };

    run();
  }, [tournamentId, category.id]);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* ヘッダー */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-gray-800">{categoryLabel(category)}</span>
          {status === "generating" && (
            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">生成中...</span>
          )}
          {status === "done" && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              ✓ 生成済み
            </span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              エラー
            </span>
          )}
        </div>
        <span
          className="text-gray-400 text-sm transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {/* コンテンツ */}
      {open && (
        <div className="p-5">
          {status === "generating" && (
            <p className="text-sm text-gray-400 text-center py-6">ブラケットを生成中です...</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-500 text-center py-4">{error}</p>
          )}
          {status === "done" && bracket && <BracketView data={bracket} />}
        </div>
      )}
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────────────────────────

export default function BracketPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);

  const { tournament } = useTournament(tournamentId);
  const { categories, loading, error } = useTournamentCategories(tournamentId);

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
            <button
              onClick={() => router.push("/tournament")}
              className="hover:text-gray-600 transition-colors"
            >
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
              onClick={() => router.push(`/tournament/${tournamentId}/participants/confirm`)}
              className="hover:text-gray-600 transition-colors"
            >
              参加者確認
            </button>
            <span>/</span>
            <span className="text-black font-semibold">トーナメント</span>
          </div>
          <h1 className="text-black font-bold text-2xl">トーナメント</h1>
          {tournament && <p className="text-gray-500 text-sm mt-1">{tournament.title}</p>}
        </div>

        {/* コンテンツ */}
        {loading ? (
          <p className="text-center py-20 text-gray-400 text-sm">読み込み中...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-16 text-center">
            <p className="text-gray-500 font-semibold mb-1">カテゴリが登録されていません</p>
            <button
              onClick={() => router.push(`/tournament/${tournamentId}/categories`)}
              className="mt-4 text-sm text-black underline hover:opacity-70"
            >
              カテゴリを追加する
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryBracketPanel
                key={category.id}
                category={category}
                tournamentId={tournamentId}
              />
            ))}
          </div>
        )}

        {/* フッター */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <button
            onClick={() => router.push(`/tournament/${tournamentId}/participants/confirm`)}
            className="text-sm text-black underline hover:opacity-70 transition-opacity"
          >
            ← 参加者確認に戻る
          </button>
        </div>
      </div>
    </main>
  );
}
