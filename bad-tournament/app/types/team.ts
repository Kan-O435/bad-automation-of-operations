import type {
  GenderType,
  EventType,
  FormatType,
} from "./tournament_category";

export type TeamMemberGenderType = "men" | "women";

// teams エンドポイントで返ってくるカテゴリ情報
export type TeamCategory = {
  id: number;
  gender_type: GenderType;
  event_type: EventType;
  age_type: string;
  rank: string;
  format_type: FormatType;
};

export type TeamMember = {
  id: number;
  team_id: number;
  name: string;
  gender_type: TeamMemberGenderType;
  age: number | null;
  affiliation: string | null;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: number;
  tournament_category_id: number;
  name: string;
  affiliation: string | null;
  seed_number: number | null;
  team_members: TeamMember[];
  tournament_category?: TeamCategory;
  created_at: string;
  updated_at: string;
};

export type CreateTeamParams = {
  name: string;
  affiliation?: string | null;
  seed_number?: number | null;
};

export type CreateTeamMemberParams = {
  name: string;
  gender_type: TeamMemberGenderType;
  age?: number | null;
  affiliation?: string | null;
};

export const TEAM_MEMBER_GENDER_LABELS: Record<TeamMemberGenderType, string> = {
  men: "男性",
  women: "女性",
};
