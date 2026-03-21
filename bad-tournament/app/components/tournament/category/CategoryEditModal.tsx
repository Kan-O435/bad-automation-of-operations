"use client";

import { useState, useEffect } from "react";
import { useUpdateTournamentCategory } from "../../../hooks/useUpdateTournamentCategory";
import type {
  TournamentCategory,
  GenderType,
  EventType,
  FormatType,
  CreateTournamentCategoryParams,
} from "../../../types/tournament_category";

// ── 共通フォームパーツ ──────────────────────────
type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
};

const SelectField = ({ label, value, onChange, options, required }: SelectFieldProps) => (
  <div>
    <label className="block text-sm font-bold mb-1.5 text-black">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 border border-gray-300 focus:outline-none focus:border-black text-black bg-white text-sm rounded"
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

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
};

const TextField = ({ label, value, onChange, placeholder, required }: TextFieldProps) => (
  <div>
    <label className="block text-sm font-bold mb-1.5 text-black">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2.5 border border-gray-300 focus:outline-none focus:border-black text-black text-sm rounded"
    />
  </div>
);

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  required?: boolean;
  hint?: string;
};

const NumberField = ({ label, value, onChange, min = 1, required, hint }: NumberFieldProps) => (
  <div>
    <label className="block text-sm font-bold mb-1.5 text-black">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      className="w-full p-2.5 border border-gray-300 focus:outline-none focus:border-black text-black text-sm rounded"
    />
  </div>
);

// ── フォーム状態 ────────────────────────────────
type FormState = {
  gender_type: GenderType | "";
  event_type: EventType | "";
  age_type: string;
  rank: string;
  format_type: FormatType | "";
  max_participants: string;
  group_size: string;
  group_count: string;
  advance_count: string;
  has_third_place: boolean;
};

const categoryToForm = (c: TournamentCategory): FormState => ({
  gender_type: c.gender_type,
  event_type: c.event_type,
  age_type: c.age_type ?? "",
  rank: c.rank,
  format_type: c.format_type,
  max_participants: c.max_participants != null ? String(c.max_participants) : "",
  group_size: c.group_size != null ? String(c.group_size) : "",
  group_count: c.group_count != null ? String(c.group_count) : "",
  advance_count: c.advance_count != null ? String(c.advance_count) : "",
  has_third_place: c.has_third_place,
});

// ── Props ────────────────────────────────────────
type Props = {
  tournamentId: number;
  category: TournamentCategory;
  onClose: () => void;
  onSuccess: () => void;
};

// ── メインコンポーネント ────────────────────────
export const CategoryEditModal = ({
  tournamentId,
  category,
  onClose,
  onSuccess,
}: Props) => {
  const [form, setForm] = useState<FormState>(() => categoryToForm(category));
  const [localError, setLocalError] = useState<string | null>(null);
  const { updateCategory, loading, error: apiError } = useUpdateTournamentCategory();

  // categoryが切り替わったらフォームをリセット
  useEffect(() => {
    setForm(categoryToForm(category));
    setLocalError(null);
  }, [category]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setLocalError(null);
  };

  // 形式変更時にデフォルト値を自動セット
  const handleFormatChange = (newFmt: string) => {
    const fmt = newFmt as FormatType | "";
    const isTournament = fmt === "elimination" || fmt === "league_to_tournament";
    const isLeague = fmt === "league" || fmt === "league_to_tournament";
    const isHybrid = fmt === "league_to_tournament";

    setForm((prev) => ({
      ...prev,
      format_type: fmt,
      max_participants: isTournament ? (prev.max_participants || "16") : "",
      group_size: isLeague ? (prev.group_size || "4") : "",
      group_count: isLeague ? prev.group_count : "",
      advance_count: isHybrid ? (prev.advance_count || "2") : "",
    }));
    setLocalError(null);
  };

  const isLeague = form.format_type === "league" || form.format_type === "league_to_tournament";
  const isTournament = form.format_type === "elimination" || form.format_type === "league_to_tournament";
  const isHybrid = form.format_type === "league_to_tournament";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!form.gender_type || !form.event_type || !form.format_type || !form.rank) {
      setLocalError("性別・種目・クラス/ランク・大会形式は必須です");
      return;
    }
    if (isTournament && !form.max_participants) {
      setLocalError("最大参加人数を入力してください");
      return;
    }
    if (isLeague && !form.group_size) {
      setLocalError("1グループの人数を入力してください");
      return;
    }
    if (isHybrid && !form.advance_count) {
      setLocalError("本戦進出人数を入力してください");
      return;
    }

    const params: CreateTournamentCategoryParams = {
      gender_type: form.gender_type,
      event_type: form.event_type,
      age_type: form.age_type,
      rank: form.rank,
      format_type: form.format_type,
      has_third_place: form.has_third_place,
      ...(isTournament && {
        max_participants: form.max_participants ? Number(form.max_participants) : null,
      }),
      ...(isLeague && {
        group_size: form.group_size ? Number(form.group_size) : null,
        group_count: form.group_count ? Number(form.group_count) : null,
      }),
      ...(isHybrid && {
        advance_count: form.advance_count ? Number(form.advance_count) : null,
      }),
    };

    const updated = await updateCategory(tournamentId, category.id, params);
    if (updated) {
      onSuccess();
      onClose();
    }
  };

  const displayError = localError || apiError;

  return (
    // オーバーレイ
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-xl mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-black">カテゴリーを編集</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors text-xl leading-none"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm">{displayError}</p>
            </div>
          )}

          {/* 性別・種目 */}
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="性別"
              value={form.gender_type}
              onChange={(v) => set("gender_type", v as GenderType)}
              options={[
                { value: "men", label: "男子" },
                { value: "women", label: "女子" },
                { value: "mixed", label: "混合" },
              ]}
              required
            />
            <SelectField
              label="種目"
              value={form.event_type}
              onChange={(v) => set("event_type", v as EventType)}
              options={[
                { value: "singles", label: "シングルス" },
                { value: "doubles", label: "ダブルス" },
                { value: "mixed_doubles", label: "ミックスダブルス" },
              ]}
              required
            />
          </div>

          {/* ランク・年齢区分 */}
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="クラス / ランク"
              value={form.rank}
              onChange={(v) => set("rank", v)}
              placeholder="例: A級"
              required
            />
            <TextField
              label="年齢区分（任意）"
              value={form.age_type}
              onChange={(v) => set("age_type", v)}
              placeholder="例: 一般・シニア"
            />
          </div>

          {/* 大会形式 */}
          <SelectField
            label="大会形式"
            value={form.format_type}
            onChange={handleFormatChange}
            options={[
              { value: "elimination", label: "トーナメント（シングルエリミネーション）" },
              { value: "league", label: "リーグ（総当たり）" },
              { value: "league_to_tournament", label: "予選リーグ → 本戦トーナメント" },
            ]}
            required
          />

          {/* リーグ設定 */}
          {isLeague && (
            <div className="bg-blue-50 border border-blue-100 rounded p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase">リーグ設定</p>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="1グループの人数"
                  value={form.group_size}
                  onChange={(v) => set("group_size", v)}
                  min={1}
                  required
                />
                <NumberField
                  label="グループ数（任意）"
                  value={form.group_count}
                  onChange={(v) => set("group_count", v)}
                  min={1}
                  hint="未入力で自動計算"
                />
              </div>
            </div>
          )}

          {/* トーナメント設定 */}
          {isTournament && (
            <div className="bg-yellow-50 border border-yellow-100 rounded p-4 space-y-3">
              <p className="text-xs font-bold text-yellow-700 uppercase">トーナメント設定</p>
              <NumberField
                label="最大参加人数"
                value={form.max_participants}
                onChange={(v) => set("max_participants", v)}
                min={2}
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_third_place}
                  onChange={(e) => set("has_third_place", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold text-black">3位決定戦あり</span>
              </label>
            </div>
          )}

          {/* 予選→本戦 進出設定 */}
          {isHybrid && (
            <div className="bg-green-50 border border-green-100 rounded p-4">
              <p className="text-xs font-bold text-green-700 uppercase mb-3">本戦進出設定</p>
              <NumberField
                label="各グループからの本戦進出人数"
                value={form.advance_count}
                onChange={(v) => set("advance_count", v)}
                min={1}
                required
              />
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 text-sm font-bold rounded transition-opacity ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-80"
              }`}
            >
              {loading ? "保存中..." : "変更を保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
