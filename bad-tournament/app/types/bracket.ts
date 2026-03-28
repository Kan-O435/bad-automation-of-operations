// ─── 新しいブラケット型（APIフォーマット） ───────────────────────────────────

export type BracketMember = {
  name: string;
  affiliation: string;
};

export type BracketTeam = {
  id: number;
  members: BracketMember[];
};

export type BracketMatch = {
  id: number;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  score1: number | null;
  score2: number | null;
  winner_id: number | null;
};

export type BracketRound = {
  matches: BracketMatch[];
};

export type BracketData = {
  rounds: BracketRound[];
};

// ─── リーグ型（既存・互換用） ─────────────────────────────────────────────────

export type LeagueGroupEntry = {
  team_id: number;
  team_name: string;
  wins: number;
  losses: number;
  games_won: number;
  games_lost: number;
  points_won: number;
  points_lost: number;
  rank: number | null;
};

export type LeagueGroup = {
  id: number;
  name: string;
  group_number: number;
  entries: LeagueGroupEntry[];
  matches: BracketMatch[];
};
