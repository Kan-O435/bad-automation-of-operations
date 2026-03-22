"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../../hooks/useTournament";
import { useTournamentCategories } from "../../../../hooks/useTournamentCategories";
import { CategoryCard } from "../../../../components/tournament/category/CategoryCard";
import { CategoryEditModal } from "../../../../components/tournament/category/CategoryEditModal";
import {
  GENDER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  FORMAT_TYPE_LABELS,
} from "../../../../types/tournament_category";
import type { TournamentCategory } from "../../../../types/tournament_category";

// ── ローディング ──
const PageLoading = () => (
  <div className="text-center py-20">
    <p className="text-gray-400 text-sm">読み込み中...</p>
  </div>
);

// ── エラー ──
const PageError = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <p className="text-red-600 text-sm">{message}</p>
  </div>
);

// ── カテゴリが0件のとき ──
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="border border-dashed border-gray-300 rounded-lg p-16 text-center">
    <p className="text-gray-500 font-semibold mb-1">カテゴリーがまだありません</p>
    <p className="text-gray-400 text-sm mb-6">
      種目・形式を追加してトーナメントを構成しましょう
    </p>
    <button
      type="button"
      onClick={onAdd}
      className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:opacity-80 transition-opacity"
    >
      カテゴリーを追加する
    </button>
  </div>
);

// ── 統計バッジ（クリックでフィルター） ──
type StatChipProps = {
  label: string;
  count: number;
  colorClass: string;
  activeColorClass: string;
  isActive: boolean;
  onClick: () => void;
};
const StatChip = ({
  label,
  count,
  colorClass,
  activeColorClass,
  isActive,
  onClick,
}: StatChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-center transition-all border-2 cursor-pointer ${
      isActive
        ? `${activeColorClass} border-current shadow-md scale-105`
        : `${colorClass} border-transparent hover:opacity-80`
    }`}
  >
    <p className="text-xl font-bold">{count}</p>
    <p className="text-xs mt-0.5">{label}</p>
  </button>
);

// ── 統計サマリー ──
const CategoryStats = ({ categories }: { categories: TournamentCategory[] }) => {
  const genderCounts = {
    men: categories.filter((c) => c.gender_type === "men").length,
    women: categories.filter((c) => c.gender_type === "women").length,
    mixed: categories.filter((c) => c.gender_type === "mixed").length,
  };
  const formatCounts = {
    elimination: categories.filter((c) => c.format_type === "elimination").length,
    league: categories.filter((c) => c.format_type === "league").length,
    league_to_tournament: categories.filter(
      (c) => c.format_type === "league_to_tournament"
    ).length,
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 space-y-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        内訳
      </p>
      <div className="space-y-3">
        {/* 性別別 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">性別</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(genderCounts) as Array<keyof typeof genderCounts>)
              .filter((k) => genderCounts[k] > 0)
              .map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100"
                >
                  {GENDER_TYPE_LABELS[k]}
                  <span className="font-bold">{genderCounts[k]}件</span>
                </span>
              ))}
          </div>
        </div>
        {/* 形式別 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">大会形式</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(formatCounts) as Array<keyof typeof formatCounts>)
              .filter((k) => formatCounts[k] > 0)
              .map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-full border border-yellow-100"
                >
                  {FORMAT_TYPE_LABELS[k]}
                  <span className="font-bold">{formatCounts[k]}件</span>
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── メインページ ──
export default function CategoryListPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);

  const [editingCategory, setEditingCategory] = useState<TournamentCategory | null>(null);
  const [genderFilter, setGenderFilter] = useState<"all" | "men" | "women" | "mixed">("all");

  const {
    tournament,
    loading: tournamentLoading,
    error: tournamentError,
  } = useTournament(tournamentId);

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch,
  } = useTournamentCategories(tournamentId);

  const loading = tournamentLoading || categoriesLoading;
  const error = tournamentError || categoriesError;

  const goToAdd = () =>
    router.push(`/tournament/${tournamentId}/categories`);

  const goToParticipants = (_categoryId: number) =>
    router.push(`/tournament/${tournamentId}/participants`);

  const filteredCategories =
    genderFilter === "all"
      ? categories
      : categories.filter((c) => c.gender_type === genderFilter);

  const toggleFilter = (gender: "all" | "men" | "women" | "mixed") => {
    setGenderFilter((prev) => (prev === gender ? "all" : gender));
  };

  return (
    <>
    {/* 編集モーダル */}
    {editingCategory && (
      <CategoryEditModal
        tournamentId={tournamentId}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSuccess={() => {
          refetch();
          setEditingCategory(null);
        }}
      />
    )}

    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        {/* ── ヘッダー ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            {/* パンくず */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <button
                onClick={() => router.push("/tournament")}
                className="hover:text-gray-600 transition-colors"
              >
                大会一覧
              </button>
              <span>/</span>
              <span className="text-gray-500 font-medium">
                {tournament?.title ?? "..."}
              </span>
              <span>/</span>
              <span className="text-black font-semibold">カテゴリー一覧</span>
            </div>

            <h1 className="text-black font-bold text-2xl">カテゴリー一覧</h1>

            {tournament && (
              <p className="text-gray-500 text-sm mt-1">{tournament.title}</p>
            )}
          </div>

          {/* カテゴリー追加ボタン */}
          <button
            onClick={goToAdd}
            className="bg-black text-white px-4 py-2 text-sm font-bold rounded hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            + カテゴリーを追加
          </button>
        </div>

        {/* ── ローディング / エラー ── */}
        {loading && <PageLoading />}
        {!loading && error && <PageError message={error} />}

        {/* ── コンテンツ ── */}
        {!loading && !error && (
          <>
            {categories.length === 0 ? (
              <EmptyState onAdd={goToAdd} />
            ) : (
              <div className="space-y-6">
                {/* 件数 + フィルター */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">クリックで絞り込み</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatChip
                      label="合計"
                      count={categories.length}
                      colorClass="bg-black text-white"
                      activeColorClass="bg-black text-white"
                      isActive={genderFilter === "all"}
                      onClick={() => toggleFilter("all")}
                    />
                    <StatChip
                      label="男子"
                      count={categories.filter((c) => c.gender_type === "men").length}
                      colorClass="bg-indigo-50 text-indigo-700"
                      activeColorClass="bg-indigo-600 text-white"
                      isActive={genderFilter === "men"}
                      onClick={() => toggleFilter("men")}
                    />
                    <StatChip
                      label="女子"
                      count={categories.filter((c) => c.gender_type === "women").length}
                      colorClass="bg-pink-50 text-pink-700"
                      activeColorClass="bg-pink-600 text-white"
                      isActive={genderFilter === "women"}
                      onClick={() => toggleFilter("women")}
                    />
                    <StatChip
                      label="混合"
                      count={categories.filter((c) => c.gender_type === "mixed").length}
                      colorClass="bg-purple-50 text-purple-700"
                      activeColorClass="bg-purple-600 text-white"
                      isActive={genderFilter === "mixed"}
                      onClick={() => toggleFilter("mixed")}
                    />
                  </div>
                  {genderFilter !== "all" && (
                    <p className="text-xs text-gray-500 pt-1">
                      {GENDER_TYPE_LABELS[genderFilter]}のカテゴリーを表示中
                      <span className="ml-1 font-bold">({filteredCategories.length}件)</span>
                    </p>
                  )}
                </div>

                {/* 内訳 */}
                <CategoryStats categories={categories} />

                {/* カテゴリーカード一覧（2列グリッド） */}
                {filteredCategories.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-10 text-center">
                    <p className="text-gray-400 text-sm">
                      {GENDER_TYPE_LABELS[genderFilter as keyof typeof GENDER_TYPE_LABELS]}のカテゴリーはまだありません
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCategories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onEdit={setEditingCategory}
                        onRegisterParticipants={goToParticipants}
                      />
                    ))}
                  </div>
                )}

                {/* もっと追加ボタン */}
                <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                  <button
                    onClick={goToAdd}
                    className="text-sm text-black underline hover:opacity-70 transition-opacity"
                  >
                    + さらにカテゴリーを追加する
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/tournament/${tournamentId}/participants`)
                    }
                    className="bg-[#1a1a1a] text-white px-6 py-2.5 text-sm font-bold rounded hover:opacity-80 transition-opacity"
                  >
                    参加者を登録する
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
    </>
  );
}
