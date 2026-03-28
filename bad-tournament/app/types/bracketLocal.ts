export type Member = {
  name: string;
  affiliation: string;
};

export type Team = {
  id: number;
  name: string;
  seed: number;
  members: Member[];
};

export type Match = {
  team1: Team | null;
  team2: Team | null;
};

export type Round = {
  round: number;
  matches: Match[];
};
