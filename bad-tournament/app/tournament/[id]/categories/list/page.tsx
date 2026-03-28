"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournament } from "../../../../hooks/useTournament";
import { useTournamentCategories } from "../../../../hooks/useTournamentCategories";
import { useGenerateBracket } from "../../../../hooks/useGenerateBracket";
import { useBracket } from "../../../../hooks/useBracket";
import { CategoryEditModal } from "../../../../components/tournament/category/CategoryEditModal";
import { BracketView } from "../../../../components/tournament/bracket/BracketView";
import {
  GENDER_TYPE_LABELS,
  FORMAT_TYPE_LABELS,
} from "../../../../types/tournament_category";
import type { TournamentCategory } from "../../../../types/tournament_category";
import { API_URL } from "../../../../lib/api";

// ── ブラケット生成 + 表示セクション ──────────────────────────────────────────

function BracketSection({
  tournamentId,
  categoryId,
}: {
  tournamentId: number;
  categoryId: number;
}) {
  const { generate, loading: generating, error: genError } = useGenerateBracket(tournamentId, categoryId);
  const { bracket, loading: fetching, error: fetchError, fetch: fetchBracket } = useBracket(tournamentId, categoryId);

  const handleGenerate = async () => {
    const ok = await generate();
    if (ok) fetchBracket();
  };

  if (generating || fetching) {
    return <p className="text-sm text-gray-400 py-4 text-center">処理中...</p>;
  }

  const error = genError ?? fetchError;
  return (
    <div className="pt-3 border-t border-gray-100">
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {bracket ? (
        <BracketView data={bracket} />
      ) : (
        <button
          onClick={handleGenerate}
          className="w-full py-2.5 text-sm font-bold bg-black text-white rounded hover:opacity-80 transition-opacity"
        >
          ブラケットを生成する
        </button>
      )}
    </div>
  );
}

// ── ドラッグ可能なカテゴリー行 ───────────────────────────────────────────────

type CategoryRowProps = {
  category: TournamentCategory;
  tournamentId: number;
  index: number;
  isOpen: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggle: () => void;
  onEdit: (c: TournamentCategory) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
};

function CategoryRow({
  category,
  tournamentId,
  index,
  isOpen,
  isDragging,
  isDragOver,
  onToggle,
  onEdit,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: CategoryRowProps) {
  const genderLabel = GENDER_TYPE_LABELS[category.gender_type];
  const formatLabel = FORMAT_TYPE_LABELS[category.format_type];

  const genderColor =
    category.gender_type === "men"
      ? "bg-indigo-50 text-indigo-700"
      : category.gender_type === "women"
      ? "bg-pink-50 text-pink-700"
      : "bg-purple-50 text-purple-700";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`border rounded-lg transition-all select-none
        ${isDragging ? "opacity-40" : "opacity-100"}
        ${isDragOver ? "border-black shadow-md" : "border-gray-200"}
      `}
    >
      {/* 行ヘッダー */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* ドラッグハンドル */}
        <span className="text-gray-300 cursor-grab active:cursor-grabbing text-lg leading-none">⠿</span>

        {/* バッジ */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${genderColor}`}>
          {genderLabel}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-semibold shrink-0">
          {formatLabel}
        </span>

        {/* カテゴリー名 */}
        <span className="text-sm font-bold text-gray-800 flex-1 truncate">
          {category.rank}
          {category.age_type ? `・${category.age_type}` : ""}
        </span>

        {/* 操作ボタン */}
        <button
          onClick={() => onEdit(category)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          編集
        </button>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 transition-transform shrink-0"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </button>
      </div>

      {/* 展開エリア */}
      {isOpen && (
        <div className="px-4 pb-4">
          <BracketSection tournamentId={tournamentId} categoryId={category.id} />
        </div>
      )}
    </div>
  );
}

// ── 統計チップ ────────────────────────────────────────────────────────────────

type StatChipProps = {
  label: string;
  count: number;
  colorClass: string;
  activeColorClass: string;
  isActive: boolean;
  onClick: () => void;
};
const StatChip = ({ label, count, colorClass, activeColorClass, isActive, onClick }: StatChipProps) => (
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

// ── メインページ ──────────────────────────────────────────────────────────────

export default function CategoryListPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);

  const [editingCategory, setEditingCategory] = useState<TournamentCategory | null>(null);
  const [genderFilter, setGenderFilter] = useState<"all" | "men" | "women" | "mixed">("all");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [orderedCategories, setOrderedCategories] = useState<TournamentCategory[]>([]);

  // DnD 用
  const dragIndexRef = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const { tournament, loading: tournamentLoading, error: tournamentError } = useTournament(tournamentId);
  const { categories, loading: categoriesLoading, error: categoriesError, refetch } = useTournamentCategories(tournamentId);

  // API から取得したらローカル順序に反映
  useEffect(() => {
    setOrderedCategories(categories);
  }, [categories]);

  const loading = tournamentLoading || categoriesLoading;
  const error = tournamentError || categoriesError;

  const filteredCategories =
    genderFilter === "all"
      ? orderedCategories
      : orderedCategories.filter((c) => c.gender_type === genderFilter);

  const toggleFilter = (gender: "all" | "men" | "women" | "mixed") =>
    setGenderFilter((prev) => (prev === gender ? "all" : gender));

  const toggleOpen = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // DnD: フィルター中は並び替え無効
  const handleDragStart = (index: number) => {
    if (genderFilter !== "all") return;
    dragIndexRef.current = index;
    setDraggingId(orderedCategories[index].id);
  };

  const handleDragEnter = (index: number) => {
    if (genderFilter !== "all" || dragIndexRef.current === null || dragIndexRef.current === index) return;
    setDragOverId(orderedCategories[index].id);
    const next = [...orderedCategories];
    const [removed] = next.splice(dragIndexRef.current, 1);
    next.splice(index, 0, removed);
    dragIndexRef.current = index;
    setOrderedCategories(next);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <>
      {editingCategory && (
        <CategoryEditModal
          tournamentId={tournamentId}
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => { refetch(); setEditingCategory(null); }}
        />
      )}

      <main className="min-h-screen bg-white p-8 md:p-16">
        <div className="max-w-3xl mx-auto">
          {/* ヘッダー */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <button onClick={() => router.push("/tournament")} className="hover:text-gray-600 transition-colors">
                  大会一覧
                </button>
                <span>/</span>
                <span className="text-gray-500 font-medium">{tournament?.title ?? "..."}</span>
                <span>/</span>
                <span className="text-black font-semibold">カテゴリー一覧</span>
              </div>
              <h1 className="text-black font-bold text-2xl">カテゴリー一覧</h1>
              {tournament && <p className="text-gray-500 text-sm mt-1">{tournament.title}</p>}
            </div>
            <button
              onClick={() => router.push(`/tournament/${tournamentId}/categories`)}
              className="bg-black text-white px-4 py-2 text-sm font-bold rounded hover:opacity-80 transition-opacity whitespace-nowrap"
            >
              + カテゴリーを追加
            </button>
          </div>

          {/* ローディング / エラー */}
          {loading && <p className="text-center py-20 text-gray-400 text-sm">読み込み中...</p>}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* コンテンツ */}
          {!loading && !error && (
            <>
              {categories.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-16 text-center">
                  <p className="text-gray-500 font-semibold mb-1">カテゴリーがまだありません</p>
                  <p className="text-gray-400 text-sm mb-6">種目・形式を追加してトーナメントを構成しましょう</p>
                  <button
                    onClick={() => router.push(`/tournament/${tournamentId}/categories`)}
                    className="bg-black text-white px-6 py-2.5 text-sm font-bold rounded hover:opacity-80 transition-opacity"
                  >
                    カテゴリーを追加する
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* フィルターチップ */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">クリックで絞り込み</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(
                        [
                          { key: "all",   label: "合計",  color: "bg-black text-white",       active: "bg-black text-white" },
                          { key: "men",   label: "男子",  color: "bg-indigo-50 text-indigo-700", active: "bg-indigo-600 text-white" },
                          { key: "women", label: "女子",  color: "bg-pink-50 text-pink-700",   active: "bg-pink-600 text-white" },
                          { key: "mixed", label: "混合",  color: "bg-purple-50 text-purple-700", active: "bg-purple-600 text-white" },
                        ] as const
                      ).map(({ key, label, color, active }) => (
                        <StatChip
                          key={key}
                          label={label}
                          count={key === "all" ? categories.length : categories.filter((c) => c.gender_type === key).length}
                          colorClass={color}
                          activeColorClass={active}
                          isActive={genderFilter === key}
                          onClick={() => toggleFilter(key)}
                        />
                      ))}
                    </div>
                    {genderFilter !== "all" && (
                      <p className="text-xs text-gray-500 pt-1">
                        {GENDER_TYPE_LABELS[genderFilter]}のカテゴリーを表示中
                        <span className="ml-1 font-bold">({filteredCategories.length}件)</span>
                      </p>
                    )}
                  </div>

                  {/* 並び替えヒント */}
                  {genderFilter === "all" && orderedCategories.length > 1 && (
                    <p className="text-xs text-gray-400">⠿ をドラッグして順番を変更できます</p>
                  )}

                  {/* カテゴリー一覧 */}
                  {filteredCategories.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-10 text-center">
                      <p className="text-gray-400 text-sm">
                        {GENDER_TYPE_LABELS[genderFilter as keyof typeof GENDER_TYPE_LABELS]}のカテゴリーはまだありません
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCategories.map((category, index) => (
                        <CategoryRow
                          key={category.id}
                          category={category}
                          tournamentId={tournamentId}
                          index={index}
                          isOpen={openIds.has(category.id)}
                          isDragging={draggingId === category.id}
                          isDragOver={dragOverId === category.id}
                          onToggle={() => toggleOpen(category.id)}
                          onEdit={setEditingCategory}
                          onDragStart={handleDragStart}
                          onDragEnter={handleDragEnter}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                  )}

                  {/* フッターボタン */}
                  <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                    <button
                      onClick={() => router.push(`/tournament/${tournamentId}/categories`)}
                      className="text-sm text-black underline hover:opacity-70 transition-opacity"
                    >
                      + さらにカテゴリーを追加する
                    </button>
                    <button
                      onClick={() => router.push(`/tournament/${tournamentId}/participants`)}
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
