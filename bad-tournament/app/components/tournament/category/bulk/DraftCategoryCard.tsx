"use client";

import type { DraftCategoryForm, FormatType } from "../../../../types/tournament_category";
import {
  GENDER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  FORMAT_TYPE_LABELS,
} from "../../../../types/tournament_category";

// ---- 小コンポーネント ----
type InlineSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
};

const InlineSelect = ({ label, value, onChange, options }: InlineSelectProps) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border border-gray-200 focus:outline-none focus:border-black text-black bg-white text-sm rounded"
    >
      <option value="">選択してください</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

type InlineNumberProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  required?: boolean;
};

const InlineNumber = ({ label, value, onChange, min = 1, required }: InlineNumberProps) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      className="w-full p-2 border border-gray-200 focus:outline-none focus:border-black text-black text-sm rounded"
    />
  </div>
);

type InlineTextProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

const InlineText = ({ label, value, onChange, placeholder }: InlineTextProps) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-200 focus:outline-none focus:border-black text-black text-sm rounded"
    />
  </div>
);

// ---- Props ----
type Props = {
  draft: DraftCategoryForm;
  index: number;
  onChange: (localId: string, key: keyof DraftCategoryForm, value: string | boolean) => void;
  onRemove: (localId: string) => void;
};

export const DraftCategoryCard = ({ draft, index, onChange, onRemove }: Props) => {
  const isLeague =
    draft.format_type === "league" || draft.format_type === "league_to_tournament";
  const isTournament =
    draft.format_type === "elimination" || draft.format_type === "league_to_tournament";
  const isLeagueToTournament = draft.format_type === "league_to_tournament";

  const set = (key: keyof DraftCategoryForm, value: string | boolean) =>
    onChange(draft.localId, key, value);

  return (
    <div className="border border-gray-200 rounded bg-white overflow-hidden">
      {/* カードヘッダー */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-gray-300 text-white text-xs flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
            {GENDER_TYPE_LABELS[draft.gender_type]}
          </span>
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-700">
            {EVENT_TYPE_LABELS[draft.event_type]}
          </span>
          {draft.format_type && (
            <span className="text-xs text-gray-500">
              {FORMAT_TYPE_LABELS[draft.format_type as FormatType]}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(draft.localId)}
          className="text-gray-400 hover:text-red-500 text-xs transition-colors"
          aria-label="削除"
        >
          ✕ 削除
        </button>
      </div>

      {/* 編集フィールド */}
      <div className="p-4 space-y-3">
        {/* 形式 / ランク / 年齢 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InlineSelect
            label="大会形式"
            value={draft.format_type}
            onChange={(v) => set("format_type", v)}
            options={[
              { value: "elimination", label: "トーナメント" },
              { value: "league", label: "リーグ" },
              { value: "league_to_tournament", label: "予選→本戦" },
            ]}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              クラス / ランク
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={draft.rank}
              onChange={(e) => set("rank", e.target.value)}
              placeholder="例: A級"
              className={`w-full p-2 border focus:outline-none text-black text-sm rounded ${
                !draft.rank.trim()
                  ? "border-orange-300 bg-orange-50 focus:border-orange-500"
                  : "border-gray-200 focus:border-black"
              }`}
            />
            {!draft.rank.trim() && (
              <p className="text-xs text-orange-500 mt-0.5">入力してください</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              年齢区分
              <span className="text-gray-400 ml-1 font-normal text-xs">（任意）</span>
            </label>
            <input
              type="text"
              value={draft.age_type}
              onChange={(e) => set("age_type", e.target.value)}
              placeholder="例: 一般・シニア（任意）"
              className="w-full p-2 border border-gray-200 focus:outline-none focus:border-black text-black text-sm rounded"
            />
          </div>
        </div>

        {/* リーグ設定 */}
        {isLeague && (
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-blue-50">
            <InlineNumber
              label="1グループ人数"
              value={draft.group_size}
              onChange={(v) => set("group_size", v)}
              min={2}
              required
            />
            <InlineNumber
              label="グループ数（任意）"
              value={draft.group_count}
              onChange={(v) => set("group_count", v)}
              min={1}
            />
          </div>
        )}

        {/* トーナメント設定 */}
        {isTournament && (
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-yellow-50">
            <InlineNumber
              label="最大参加人数"
              value={draft.max_participants}
              onChange={(v) => set("max_participants", v)}
              min={2}
              required
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.has_third_place}
                  onChange={(e) => set("has_third_place", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-700">3位決定戦あり</span>
              </label>
            </div>
          </div>
        )}

        {/* 予選→本戦進出人数 */}
        {isLeagueToTournament && (
          <div className="pt-1 border-t border-green-50">
            <InlineNumber
              label="各グループ本戦進出人数"
              value={draft.advance_count}
              onChange={(v) => set("advance_count", v)}
              min={1}
              required
            />
          </div>
        )}
      </div>
    </div>
  );
};
