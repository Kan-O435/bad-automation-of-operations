export type TournamentDay = {
  id: number;
  day: string;
};

export type Tournament = {
  id: number;
  title: string;
  detail: string;
  created_at: string;
  updated_at: string;
  tournament_days?: TournamentDay[];
  categories_count?: number;
};
