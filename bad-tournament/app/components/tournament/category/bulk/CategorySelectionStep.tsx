"use client";

import { useState } from "react";
import type {
  GenderType,
  EventType,
  FormatType,
} from "../../../../types/tournament_category";
import { FORMAT_TYPE_LABELS } from "../../../../types/tournament_category";

// ──────────────────────────────────────────────
// 定数
// ──────────────────────────────────────────────
const GENDERS: { value: GenderType; label: string }[] = [
  { value: "men", label: "男子" },
  { value: "women", label: "女子" },
  { value: "mixed", label: "混合" },
];

const EVENTS: { value: EventType; label: string }[] = [
  { value: "singles", label: "シングルス" },
  { value: "doubles", label: "ダブルス" },
  { value: "mixed_doubles", label: "ミックスダブルス" },
];

const FORMAT_OPTIONS: { value: FormatType; label: string }[] = [
  { value: "elimination", label: FORMAT_TYPE_LABELS.elimination },
  { value: "league", label: FORMAT_TYPE_LABELS.league },
  { value: "league_to_tournament", label: FORMAT_TYPE_LABELS.league_to_tournament },
];

// ランクのプリセット
const RANK_TABS = [
  { value: "level", label: "レベル別" },
  { value: "division", label: "部別" },
] as const;

const RANK_PRESETS: Record<string, string[]> = {
  level: ["A級", "B級", "C級", "オープン", "初級", "中級", "上級"],
  division: ["1部", "2部", "3部", "4部", "5部", "6部", "7部", "8部"],
};

// 年齢区分のプリセット
const AGE_TABS = [
  { value: "generation", label: "年代別" },
  { value: "school", label: "学齢別" },
] as const;

const AGE_PRESETS: Record<string, string[]> = {
  generation: ["一般", "シニア", "ジュニア", "マスターズ", "OB"],
  school: ["U-12", "U-15", "U-18", "U-20", "U-23"],
};

// ──────────────────────────────────────────────
// 汎用トグルチップグループ（性別・種目用）
// ──────────────────────────────────────────────
type ToggleChipGroupProps = {
  label: string;
  items: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (v: string) => void;
};

const ToggleChipGroup = ({
  label,
  items,
  selected,
  onToggle,
}: ToggleChipGroupProps) => (
  <div>
    <p className="text-sm font-bold text-black mb-2">{label}</p>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.has(item.value);
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            className={`px-4 py-1.5 text-sm border rounded-full transition-colors font-medium ${
              active
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            {active && <span className="mr-1 text-xs">✓</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  </div>
);

// ──────────────────────────────────────────────
// 汎用マルチ選択セレクター（ランク・年齢区分で共用）
// タブ切り替え + プリセットチップ + カスタム入力 + 選択済み表示
// ──────────────────────────────────────────────
type MultiChipSelectorProps = {
  tabs: readonly { value: string; label: string }[];
  presets: Record<string, string[]>;
  selected: Set<string>;
  onToggle: (value: string) => void;
  customPlaceholder: string;
  selectedLabel: string;
};

const MultiChipSelector = ({
  tabs,
  presets,
  selected,
  onToggle,
  customPlaceholder,
  selectedLabel,
}: MultiChipSelectorProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0].value);
  const [customInput, setCustomInput] = useState("");

  const handleAdd = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onToggle(trimmed);
    setCustomInput("");
  };

  return (
    <div className="space-y-3">
      {/* タブ */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* プリセットチップ */}
      <div className="flex flex-wrap gap-1.5">
        {presets[activeTab]?.map((val) => {
          const active = selected.has(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => onToggle(val)}
              className={`px-3 py-1 text-xs border rounded-full transition-colors font-medium ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-500"
              }`}
            >
              {active && "✓ "}
              {val}
            </button>
          );
        })}
      </div>

      {/* カスタム入力 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={customPlaceholder}
          className="flex-1 p-2 border border-gray-200 focus:outline-none focus:border-black text-black text-xs rounded"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!customInput.trim()}
          className="px-3 py-2 text-xs font-bold bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          + 追加
        </button>
      </div>

      {/* 選択済みチップ */}
      {selected.size > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">
            {selectedLabel}（{selected.size}件）:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selected).map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-black text-white rounded-full"
              >
                {val}
                <button
                  type="button"
                  onClick={() => onToggle(val)}
                  className="hover:text-gray-300 transition-colors ml-0.5"
                  aria-label={`${val}を削除`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// 4軸マトリックスプレビュー
// ──────────────────────────────────────────────
type MatrixPreviewProps = {
  genderCount: number;
  eventCount: number;
  rankCount: number;
  ageCount: number;
};

const MatrixPreview = ({
  genderCount,
  eventCount,
  rankCount,
  ageCount,
}: MatrixPreviewProps) => {
  const total = genderCount * eventCount * rankCount * ageCount;
  if (total === 0) return null;

  const axes = [
    { count: genderCount, label: "性別" },
    { count: eventCount, label: "種目" },
    { count: rankCount, label: "ランク" },
    { count: ageCount, label: "年齢区分" },
  ];

  return (
    <div className="py-3 px-4 bg-blue-50 border border-blue-100 rounded-lg">
      <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
        <span className="font-bold text-blue-800 mr-1">📊</span>
        {axes.map((axis, i) => (
          <span key={axis.label} className="flex items-center gap-1 text-blue-700">
            {i > 0 && <span className="text-blue-300 mx-0.5">×</span>}
            <span className="font-bold text-blue-900">{axis.count}</span>
            <span className="text-xs">{axis.label}</span>
          </span>
        ))}
        <span className="text-blue-300 mx-1">=</span>
        <span className="font-bold text-blue-900 text-base">{total}</span>
        <span className="text-blue-600 text-xs ml-0.5">件が生成されます</span>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// 公開型
// ──────────────────────────────────────────────
export type BulkSettings = {
  format_type: FormatType | "";
};

type Props = {
  selectedGenders: Set<GenderType>;
  selectedEvents: Set<EventType>;
  selectedRanks: Set<string>;
  selectedAgeTypes: Set<string>;
  bulkSettings: BulkSettings;
  onToggleGender: (v: GenderType) => void;
  onToggleEvent: (v: EventType) => void;
  onToggleRank: (rank: string) => void;
  onToggleAgeType: (age: string) => void;
  onChangeBulkSettings: (key: keyof BulkSettings, value: string) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  missingItems: string[];
};

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export const CategorySelectionStep = ({
  selectedGenders,
  selectedEvents,
  selectedRanks,
  selectedAgeTypes,
  bulkSettings,
  onToggleGender,
  onToggleEvent,
  onToggleRank,
  onToggleAgeType,
  onChangeBulkSettings,
  onGenerate,
  canGenerate,
  missingItems,
}: Props) => (
  <div className="space-y-4">
    {/* Step 1: 性別 × 種目 */}
    <div className="border border-gray-100 rounded-lg p-5 space-y-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Step 1 &mdash; 性別と種目を選択
      </p>
      <ToggleChipGroup
        label="性別"
        items={GENDERS}
        selected={selectedGenders as Set<string>}
        onToggle={(v) => onToggleGender(v as GenderType)}
      />
      <ToggleChipGroup
        label="種目"
        items={EVENTS}
        selected={selectedEvents as Set<string>}
        onToggle={(v) => onToggleEvent(v as EventType)}
      />
    </div>

    {/* Step 2: ランク（マトリックスの軸） */}
    <div className="border border-gray-100 rounded-lg p-5 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Step 2 &mdash; ランクを選択（複数可）
      </p>
      <p className="text-sm font-bold text-black">クラス / ランク</p>
      <MultiChipSelector
        tabs={RANK_TABS}
        presets={RANK_PRESETS}
        selected={selectedRanks}
        onToggle={onToggleRank}
        customPlaceholder="カスタムランクを入力（例: エキスパート）"
        selectedLabel="選択中のランク"
      />
    </div>

    {/* Step 3: 年齢区分（マトリックスの軸） */}
    <div className="border border-gray-100 rounded-lg p-5 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Step 3 &mdash; 年齢区分を選択（複数可）
      </p>
      <p className="text-sm font-bold text-black">年齢区分</p>
      <MultiChipSelector
        tabs={AGE_TABS}
        presets={AGE_PRESETS}
        selected={selectedAgeTypes}
        onToggle={onToggleAgeType}
        customPlaceholder="カスタム年齢区分を入力（例: 壮年）"
        selectedLabel="選択中の年齢区分"
      />
    </div>

    {/* Step 4: 共通設定（大会形式） */}
    <div className="border border-gray-100 rounded-lg p-5 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Step 4 &mdash; 共通設定（全カテゴリーに適用）
      </p>
      <div>
        <label className="block text-sm font-bold mb-1 text-black">
          大会形式 <span className="text-red-500">*</span>
        </label>
        <select
          value={bulkSettings.format_type}
          onChange={(e) => onChangeBulkSettings("format_type", e.target.value)}
          className="w-full p-2.5 border border-gray-300 focus:outline-none focus:border-black text-black bg-white text-sm"
        >
          <option value="">選択してください</option>
          {FORMAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          定員・グループ数などは次のステップで各カードから変更できます
        </p>
      </div>
    </div>

    {/* 4軸プレビュー */}
    <MatrixPreview
      genderCount={selectedGenders.size}
      eventCount={selectedEvents.size}
      rankCount={selectedRanks.size}
      ageCount={selectedAgeTypes.size}
    />

    {/* 生成ボタン */}
    <button
      type="button"
      onClick={onGenerate}
      disabled={!canGenerate}
      className={`w-full py-4 font-bold text-sm rounded transition-opacity ${
        canGenerate
          ? "bg-black text-white hover:opacity-80"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
      }`}
    >
      選択した組み合わせで下書きを作成
    </button>

    {!canGenerate && missingItems.length > 0 && (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 -mt-1">
        <p className="text-xs font-semibold text-amber-700 mb-1">
          以下を選択してください：
        </p>
        <div className="flex flex-wrap gap-1.5">
          {missingItems.map((item) => (
            <span
              key={item}
              className="inline-block px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-300"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);
