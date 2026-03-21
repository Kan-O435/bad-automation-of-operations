"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTournamentCategories } from "../../../hooks/useTournamentCategories";
import { useCreateTournamentCategory } from "../../../hooks/useCreateTournamentCategory";
import { CategoryForm } from "../../../components/tournament/category/CategoryForm";
import { CategoryList } from "../../../components/tournament/category/CategoryList";
import { BulkCategoryCreator } from "../../../components/tournament/category/bulk/BulkCategoryCreator";
import { TournamentLoading } from "../../../components/tournament/TournamentComponents";
import { TournamentError } from "../../../components/tournament/TournamentComponents";
import type { CreateTournamentCategoryParams } from "../../../types/tournament_category";

type FormTab = "bulk" | "individual";

// ---- タブ切り替えコンポーネント ----
type TabBarProps = {
  active: FormTab;
  onChange: (tab: FormTab) => void;
};

const TabBar = ({ active, onChange }: TabBarProps) => {
  const tabs: { value: FormTab; label: string }[] = [
    { value: "bulk", label: "一括作成" },
    { value: "individual", label: "1件ずつ追加" },
  ];

  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            active === tab.value
              ? "border-black text-black"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ---- メインページ ----
export default function TournamentCategoriesPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = Number(params.id);

  const [activeTab, setActiveTab] = useState<FormTab>("bulk");
  const [individualSuccess, setIndividualSuccess] = useState(false);
  const [individualFormKey, setIndividualFormKey] = useState(0);

  const { categories, loading, error, refetch } =
    useTournamentCategories(tournamentId);
  const {
    createCategory,
    loading: creating,
    error: createError,
  } = useCreateTournamentCategory();

  const handleIndividualSubmit = async (
    formParams: CreateTournamentCategoryParams
  ) => {
    const created = await createCategory(tournamentId, formParams);
    if (created) {
      setIndividualSuccess(true);
      setIndividualFormKey((k) => k + 1); // フォームをリセット
      refetch();
      setTimeout(() => setIndividualSuccess(false), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-black font-bold text-2xl">カテゴリー設定</h1>
            <p className="text-gray-500 text-sm mt-1">
              この大会で行う種目・形式を追加してください
            </p>
          </div>
          <button
            onClick={() => router.push("/tournament")}
            className="text-gray-600 hover:text-black text-sm"
          >
            戻る
          </button>
        </div>

        {/* ステップ表示 */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
              ✓
            </span>
            <span className="text-sm text-gray-400">大会情報</span>
          </div>
          <div className="h-px w-6 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">
              2
            </span>
            <span className="text-sm font-bold text-black">カテゴリー設定</span>
          </div>
        </div>

        {/* 追加済みカテゴリー一覧 */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-black mb-4">
            追加済みカテゴリー
            {categories.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                （{categories.length}件）
              </span>
            )}
          </h2>

          {loading && <TournamentLoading />}
          {error && <TournamentError error={error} />}
          {!loading && !error && <CategoryList categories={categories} />}
        </section>

        {/* カテゴリー追加フォーム（タブ切り替え） */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-black mb-4">
            カテゴリーを追加
          </h2>

          <div className="bg-gray-50 border border-gray-100 rounded p-6 md:p-8">
            <TabBar active={activeTab} onChange={setActiveTab} />

            {activeTab === "bulk" && (
              <BulkCategoryCreator
                tournamentId={tournamentId}
                onSaveSuccess={refetch}
              />
            )}

            {activeTab === "individual" && (
              <>
                {individualSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <p className="text-green-700 text-sm">カテゴリーを追加しました</p>
                  </div>
                )}
                <CategoryForm
                  key={individualFormKey}
                  onSubmit={handleIndividualSubmit}
                  loading={creating}
                  error={createError}
                />
              </>
            )}
          </div>
        </section>

        {/* 完了ボタン */}
        <div className="border-t border-gray-200 pt-8">
          <button
            onClick={() => router.push(`/tournament/${tournamentId}/categories/list`)}
            className="w-full bg-[#1a1a1a] text-white py-4 font-bold hover:opacity-90 transition-opacity rounded"
          >
            設定を完了してカテゴリ一覧へ
          </button>
          {categories.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-2">
              ※ カテゴリーがなくても完了できますが、後から追加できます
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
