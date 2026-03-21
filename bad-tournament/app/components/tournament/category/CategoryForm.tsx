"use client";

import { useState } from "react";
import { Button } from "../../ui/Button";
import type {
  GenderType,
  EventType,
  FormatType,
  CreateTournamentCategoryParams,
} from "../../../types/tournament_category";

type Props = {
  onSubmit: (params: CreateTournamentCategoryParams) => void;
  loading: boolean;
  error: string | null;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
}: SelectFieldProps) => (
  <div>
    <label className="block text-sm font-bold mb-2 text-black">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black text-black bg-white"
    >
      <option value="">選択してください</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  required?: boolean;
  hint?: string;
};

const NumberField = ({
  label,
  value,
  onChange,
  min = 1,
  required = false,
  hint,
}: NumberFieldProps) => (
  <div>
    <label className="block text-sm font-bold mb-2 text-black">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      required={required}
      className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black text-black"
    />
  </div>
);

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: TextFieldProps) => (
  <div>
    <label className="block text-sm font-bold mb-2 text-black">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black text-black"
    />
  </div>
);

// フォームの初期値
const initialState = {
  gender_type: "" as GenderType | "",
  event_type: "" as EventType | "",
  age_type: "",
  rank: "",
  format_type: "" as FormatType | "",
  max_participants: "",
  group_size: "",
  group_count: "",
  advance_count: "",
  has_third_place: false,
};

export const CategoryForm = ({ onSubmit, loading, error }: Props) => {
  const [form, setForm] = useState(initialState);
  const [localError, setLocalError] = useState<string | null>(null);

  const setField = <K extends keyof typeof initialState>(
    key: K,
    value: (typeof initialState)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setLocalError(null);
  };

  // format_type に応じた表示制御
  const isLeagueFormat =
    form.format_type === "league" ||
    form.format_type === "league_to_tournament";
  const isTournamentFormat =
    form.format_type === "elimination" ||
    form.format_type === "league_to_tournament";
  const isLeagueToTournament = form.format_type === "league_to_tournament";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // 基本フィールドのバリデーション（age_type は任意）
    if (!form.gender_type || !form.event_type || !form.format_type || !form.rank) {
      setLocalError("性別・種目・クラス/ランク・大会形式はすべて必須です");
      return;
    }

    // 形式別の必須フィールドバリデーション
    if (isTournamentFormat && !form.max_participants) {
      setLocalError("最大参加人数を入力してください（2以上の整数）");
      return;
    }
    if (isLeagueFormat && !form.group_size) {
      setLocalError("1グループの人数を入力してください（1以上の整数）");
      return;
    }
    if (isLeagueToTournament && !form.advance_count) {
      setLocalError("各グループからの本戦進出人数を入力してください");
      return;
    }

    const params: CreateTournamentCategoryParams = {
      gender_type: form.gender_type,
      event_type: form.event_type,
      age_type: form.age_type,
      rank: form.rank,
      format_type: form.format_type,
      has_third_place: form.has_third_place,
    };

    if (isLeagueFormat) {
      params.group_size = form.group_size ? Number(form.group_size) : null;
      params.group_count = form.group_count ? Number(form.group_count) : null;
    }

    if (isTournamentFormat) {
      params.max_participants = form.max_participants
        ? Number(form.max_participants)
        : null;
    }

    if (isLeagueToTournament) {
      params.advance_count = form.advance_count
        ? Number(form.advance_count)
        : null;
    }

    onSubmit(params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {(localError || error) && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600 text-sm">{localError || error}</p>
        </div>
      )}

      {/* 基本情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="性別"
          value={form.gender_type}
          onChange={(v) => setField("gender_type", v as GenderType)}
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
          onChange={(v) => setField("event_type", v as EventType)}
          options={[
            { value: "singles", label: "シングルス" },
            { value: "doubles", label: "ダブルス" },
            { value: "mixed_doubles", label: "ミックスダブルス" },
          ]}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="年齢区分（任意）"
          value={form.age_type}
          onChange={(v) => setField("age_type", v)}
          placeholder="例: 一般, ジュニア, シニア"
        />
        <TextField
          label="クラス / ランク"
          value={form.rank}
          onChange={(v) => setField("rank", v)}
          placeholder="例: A, B, C, オープン"
          required
        />
      </div>

      {/* 形式 */}
      <SelectField
        label="大会形式"
        value={form.format_type}
        onChange={(v) => {
          setField("format_type", v as FormatType);
          // 形式が変わったら関連フィールドをリセット
          setForm((prev) => ({
            ...prev,
            format_type: v as FormatType,
            max_participants: "",
            group_size: "",
            group_count: "",
            advance_count: "",
            has_third_place: false,
          }));
        }}
        options={[
          { value: "elimination", label: "トーナメント（シングルエリミネーション）" },
          { value: "league", label: "リーグ（総当たり）" },
          { value: "league_to_tournament", label: "予選リーグ → 本戦トーナメント" },
        ]}
        required
      />

      {/* リーグ要素がある場合 */}
      {isLeagueFormat && (
        <div className="bg-blue-50 border border-blue-100 rounded p-4 space-y-4">
          <p className="text-sm font-bold text-blue-800">リーグ設定</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberField
              label="1グループの人数"
              value={form.group_size}
              onChange={(v) => setField("group_size", v)}
              min={2}
              required
              hint="グループあたりの参加者数"
            />
            <NumberField
              label="グループ数（任意）"
              value={form.group_count}
              onChange={(v) => setField("group_count", v)}
              min={1}
              hint="未入力の場合は参加者数から自動計算"
            />
          </div>
        </div>
      )}

      {/* トーナメント要素がある場合 */}
      {isTournamentFormat && (
        <div className="bg-yellow-50 border border-yellow-100 rounded p-4 space-y-4">
          <p className="text-sm font-bold text-yellow-800">トーナメント設定</p>
          <NumberField
            label="最大参加人数"
            value={form.max_participants}
            onChange={(v) => setField("max_participants", v)}
            min={2}
            required
            hint="トーナメントに参加できる最大人数"
          />

          {/* 3位決定戦 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="has_third_place"
              checked={form.has_third_place}
              onChange={(e) => setField("has_third_place", e.target.checked)}
              className="w-4 h-4 border border-gray-300 rounded"
            />
            <label
              htmlFor="has_third_place"
              className="text-sm font-bold text-black"
            >
              3位決定戦あり
            </label>
          </div>
        </div>
      )}

      {/* 予選リーグ → 本戦の場合 */}
      {isLeagueToTournament && (
        <div className="bg-green-50 border border-green-100 rounded p-4">
          <p className="text-sm font-bold text-green-800 mb-3">本戦進出設定</p>
          <NumberField
            label="各グループからの本戦進出人数"
            value={form.advance_count}
            onChange={(v) => setField("advance_count", v)}
            min={1}
            required
            hint="予選リーグの各グループから本戦へ進む人数"
          />
        </div>
      )}

      <Button
        text={loading ? "追加中..." : "カテゴリーを追加する"}
        type="submit"
        className={loading ? "opacity-50 cursor-not-allowed" : ""}
      />
    </form>
  );
};
