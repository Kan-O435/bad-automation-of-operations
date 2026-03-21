export type GenderType = "men" | "women" | "mixed";
export type EventType = "singles" | "doubles" | "mixed_doubles";
export type FormatType = "elimination" | "league" | "league_to_tournament";

export type TournamentCategory = {
  id: number;
  tournament_id: number;
  gender_type: GenderType;
  event_type: EventType;
  age_type: string;
  rank: string;
  format_type: FormatType;
  max_participants: number | null;
  group_size: number | null;
  group_count: number | null;
  advance_count: number | null;
  has_third_place: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateTournamentCategoryParams = {
  gender_type: GenderType;
  event_type: EventType;
  age_type: string;
  rank: string;
  format_type: FormatType;
  max_participants?: number | null;
  group_size?: number | null;
  group_count?: number | null;
  advance_count?: number | null;
  has_third_place?: boolean;
};

// 表示用ラベル
export const GENDER_TYPE_LABELS: Record<GenderType, string> = {
  men: "男子",
  women: "女子",
  mixed: "混合",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  singles: "シングルス",
  doubles: "ダブルス",
  mixed_doubles: "ミックスダブルス",
};

export const FORMAT_TYPE_LABELS: Record<FormatType, string> = {
  elimination: "トーナメント",
  league: "リーグ",
  league_to_tournament: "予選リーグ → 本戦トーナメント",
};

// 一括作成用の下書きカテゴリー型（フォーム入力値を string で保持）
export type DraftCategoryForm = {
  localId: string; // React key 用のローカルID
  gender_type: GenderType;
  event_type: EventType;
  age_type: string;
  rank: string;
  format_type: FormatType | "";
  max_participants: string;
  group_size: string;
  group_count: string;
  advance_count: string;
  has_third_place: boolean;
};
