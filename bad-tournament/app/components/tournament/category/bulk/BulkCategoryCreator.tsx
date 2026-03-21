"use client";

import { useState } from "react";
import { useBulkCreateCategories } from "../../../../hooks/useBulkCreateCategories";
import { CategorySelectionStep } from "./CategorySelectionStep";
import { DraftCategoryList } from "./DraftCategoryList";
import type {
  GenderType,
  EventType,
  FormatType,
  DraftCategoryForm,
} from "../../../../types/tournament_category";
import {
  GENDER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from "../../../../types/tournament_category";
import type { BulkSettings } from "./CategorySelectionStep";

type Phase = "selection" | "review";

type SaveResult = {
  successCount: number;
  failedCount: number;
} | null;

// 生成時の選択内容を保持（review フェーズのサマリー表示用）
type GenerationSummary = {
  genders: GenderType[];
  events: EventType[];
  ranks: string[];
  ageTypes: string[];
};

type Props = {
  tournamentId: number;
  onSaveSuccess: () => void;
};

/** Set のトグル操作ユーティリティ */
const toggleSetItem = <T,>(set: Set<T>, item: T): Set<T> => {
  const next = new Set(set);
  next.has(item) ? next.delete(item) : next.add(item);
  return next;
};

/** ローカルIDを生成 */
const makeLocalId = () =>
  `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const BulkCategoryCreator = ({ tournamentId, onSaveSuccess }: Props) => {
  // ── マトリックスの4軸 ──
  const [phase, setPhase] = useState<Phase>("selection");
  const [selectedGenders, setSelectedGenders] = useState<Set<GenderType>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<EventType>>(new Set());
  const [selectedRanks, setSelectedRanks] = useState<Set<string>>(new Set());
  const [selectedAgeTypes, setSelectedAgeTypes] = useState<Set<string>>(new Set());

  // ── 共通設定（大会形式）──
  const [bulkSettings, setBulkSettings] = useState<BulkSettings>({
    format_type: "",
  });

  // ── 下書き ──
  const [drafts, setDrafts] = useState<DraftCategoryForm[]>([]);
  const [summary, setSummary] = useState<GenerationSummary | null>(null);

  // ── 保存状態 ──
  const { bulkCreate, loading, error } = useBulkCreateCategories();
  const [saveResult, setSaveResult] = useState<SaveResult>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // 保存成功後に selection フェーズでも表示するメッセージ
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // ── 4軸全組み合わせで下書きを生成 ──
  const handleGenerate = () => {
    const newDrafts: DraftCategoryForm[] = [];
    setSuccessBanner(null); // 新しい生成を始めたらバナーをクリア

    // 形式に応じたデフォルト値（バリデーション通過に必要な最低限の値）
    const fmt = bulkSettings.format_type as FormatType;
    const isTournamentFmt = fmt === "elimination" || fmt === "league_to_tournament";
    const isLeagueFmt = fmt === "league" || fmt === "league_to_tournament";
    const isHybridFmt = fmt === "league_to_tournament";

    // 未選択の軸は空文字列1件として扱い、カードで個別入力できるようにする
    const ranksToUse = selectedRanks.size > 0 ? Array.from(selectedRanks) : [""];
    const ageTypesToUse = selectedAgeTypes.size > 0 ? Array.from(selectedAgeTypes) : [""];

    selectedGenders.forEach((gender) => {
      selectedEvents.forEach((event) => {
        ranksToUse.forEach((rank) => {
          ageTypesToUse.forEach((ageType) => {
            newDrafts.push({
              localId: makeLocalId(),
              gender_type: gender,
              event_type: event,
              age_type: ageType,
              rank,
              format_type: fmt,
              max_participants: isTournamentFmt ? "16" : "",
              group_size: isLeagueFmt ? "4" : "",
              group_count: "",
              advance_count: isHybridFmt ? "2" : "",
              has_third_place: false,
            });
          });
        });
      });
    });

    setDrafts(newDrafts);
    setSummary({
      genders: Array.from(selectedGenders),
      events: Array.from(selectedEvents),
      ranks: Array.from(selectedRanks),
      ageTypes: Array.from(selectedAgeTypes),
    });
    setPhase("review");
    setSaveResult(null);
    setValidationError(null);
  };

  // ── カード操作 ──
  const handleChangeDraft = (
    localId: string,
    key: keyof DraftCategoryForm,
    value: string | boolean
  ) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.localId !== localId) return d;
        const updated = { ...d, [key]: value };

        // 大会形式が変わった場合、必須項目にデフォルト値を設定
        if (key === "format_type") {
          const newFmt = value as FormatType | "";
          const isTournament =
            newFmt === "elimination" || newFmt === "league_to_tournament";
          const isLeague =
            newFmt === "league" || newFmt === "league_to_tournament";
          const isHybrid = newFmt === "league_to_tournament";

          if (isTournament && !updated.max_participants) {
            updated.max_participants = "16";
          }
          if (!isTournament) {
            updated.max_participants = "";
          }
          if (isLeague && !updated.group_size) {
            updated.group_size = "4";
          }
          if (!isLeague) {
            updated.group_size = "";
            updated.group_count = "";
          }
          if (isHybrid && !updated.advance_count) {
            updated.advance_count = "2";
          }
          if (!isHybrid) {
            updated.advance_count = "";
          }
        }

        return updated;
      })
    );
  };

  const handleRemoveDraft = (localId: string) => {
    setDrafts((prev) => prev.filter((d) => d.localId !== localId));
  };

  // ── 一括保存 ──
  const handleSave = async () => {
    setSaveResult(null);
    setValidationError(null);

    // 各ドラフトの必須フィールドをチェック
    const invalidDrafts = drafts.filter((d) => {
      const fmt = d.format_type as FormatType;
      if (!fmt) return true; // 形式が未選択
      if (!d.rank.trim()) return true; // ランクは必須
      // age_type は任意なのでチェックしない

      const needsMaxParticipants =
        fmt === "elimination" || fmt === "league_to_tournament";
      const needsGroupSize = fmt === "league" || fmt === "league_to_tournament";
      const needsAdvanceCount = fmt === "league_to_tournament";

      if (needsMaxParticipants && !d.max_participants) return true;
      if (needsGroupSize && !d.group_size) return true;
      if (needsAdvanceCount && !d.advance_count) return true;
      return false;
    });

    if (invalidDrafts.length > 0) {
      setValidationError(
        `${invalidDrafts.length}件のカードで必須項目（ランク・定員など）が未入力です。各カードを確認してください。`
      );
      return;
    }

    const result = await bulkCreate(tournamentId, drafts);
    if (!result) return;

    setSaveResult(result);

    if (result.successCount > 0) {
      onSaveSuccess(); // 一覧を更新

      if (result.failedCount === 0) {
        // 全件成功 → 成功バナーを設定してから selection に戻る
        setSuccessBanner(
          `${result.successCount}件のカテゴリーを保存しました！上の一覧に反映されています。`
        );
        setDrafts([]);
        setPhase("selection");
        setSummary(null);
        setSaveResult(null);
      }
      // 一部失敗した場合はreviewフェーズに留まり失敗分のみ残す
    }
  };

  const handleBackToSelection = () => {
    setPhase("selection");
    setSaveResult(null);
    setValidationError(null);
  };

  // ── バリデーション ──
  const missingItems: string[] = [];
  if (selectedGenders.size === 0) missingItems.push("性別");
  if (selectedEvents.size === 0) missingItems.push("種目");
  // ランクと年齢区分はどちらか一方でもあれば生成可能
  if (selectedRanks.size === 0 && selectedAgeTypes.size === 0)
    missingItems.push("ランクまたは年齢区分（どちらか1つ以上）");
  if (!bulkSettings.format_type) missingItems.push("大会形式");

  const canGenerate = missingItems.length === 0;
  const canSave = drafts.length > 0 && !loading;

  return (
    <div className="space-y-5">
      {/* ── 保存成功バナー（フェーズをまたいで表示） ── */}
      {successBanner && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
          <span className="text-green-500 text-lg leading-none mt-0.5">✓</span>
          <div className="flex-1">
            <p className="text-green-800 text-sm font-semibold">{successBanner}</p>
            <p className="text-green-600 text-xs mt-0.5">
              続けてカテゴリーを追加する場合は、下の選択からやり直してください。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-green-400 hover:text-green-700 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Phase: selection ── */}
      {phase === "selection" && (
        <CategorySelectionStep
          selectedGenders={selectedGenders}
          selectedEvents={selectedEvents}
          selectedRanks={selectedRanks}
          selectedAgeTypes={selectedAgeTypes}
          bulkSettings={bulkSettings}
          onToggleGender={(v) =>
            setSelectedGenders((prev) => toggleSetItem(prev, v))
          }
          onToggleEvent={(v) =>
            setSelectedEvents((prev) => toggleSetItem(prev, v))
          }
          onToggleRank={(rank) =>
            setSelectedRanks((prev) => toggleSetItem(prev, rank))
          }
          onToggleAgeType={(age) =>
            setSelectedAgeTypes((prev) => toggleSetItem(prev, age))
          }
          onChangeBulkSettings={(key, value) =>
            setBulkSettings((prev) => ({ ...prev, [key]: value as FormatType | "" }))
          }
          onGenerate={handleGenerate}
          canGenerate={canGenerate}
          missingItems={missingItems}
        />
      )}

      {/* ── Phase: review ── */}
      {phase === "review" && (
        <div className="space-y-5">
          {/* 生成サマリー */}
          {summary && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-black">
                    生成された下書き: {drafts.length} 件
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                    <span>
                      <span className="font-semibold text-gray-700">性別: </span>
                      {summary.genders.map((g) => GENDER_TYPE_LABELS[g]).join(", ")}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-700">種目: </span>
                      {summary.events.map((e) => EVENT_TYPE_LABELS[e]).join(", ")}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-700">ランク: </span>
                      {summary.ranks.join(", ")}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-700">年齢区分: </span>
                      {summary.ageTypes.join(", ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    各カードで形式・定員などを個別に変更できます
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  className="text-xs text-gray-500 hover:text-black underline whitespace-nowrap transition-colors"
                >
                  ← やり直す
                </button>
              </div>
            </div>
          )}

          {/* バリデーションエラー */}
          {validationError && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-700 text-sm font-semibold">⚠ {validationError}</p>
            </div>
          )}

          {/* APIエラー（一部失敗） */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-semibold">⚠ {error}</p>
              <p className="text-red-600 text-xs mt-1">
                失敗したカードを修正して再度保存してください。
              </p>
            </div>
          )}

          {/* 一部成功のフィードバック */}
          {saveResult && saveResult.failedCount > 0 && saveResult.successCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm font-semibold">
                {saveResult.successCount}件保存済み・{saveResult.failedCount}件失敗
              </p>
            </div>
          )}

          {/* 下書きカード一覧 */}
          <DraftCategoryList
            drafts={drafts}
            onChange={handleChangeDraft}
            onRemove={handleRemoveDraft}
          />

          {/* 保存ボタン */}
          {drafts.length > 0 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full py-4 font-bold text-sm rounded transition-opacity ${
                canSave
                  ? "bg-black text-white hover:opacity-80"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading
                ? `保存中... (${drafts.length}件)`
                : `確定して保存する（${drafts.length}件）`}
            </button>
          )}

          {/* 全削除時 */}
          {drafts.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">
                下書きがすべて削除されました
              </p>
              <button
                type="button"
                onClick={handleBackToSelection}
                className="text-sm text-black underline hover:opacity-70"
              >
                最初からやり直す
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
