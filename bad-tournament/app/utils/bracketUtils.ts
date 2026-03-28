import type { Team, Match, Round } from "../types/bracketLocal";

export function formatTeamDisplay(team: Team): string {
  return team.members.map((m) => `${m.name}（${m.affiliation}）`).join("\n");
}

export function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function addByeTeams(teams: Team[]): Team[] {
  const total = nextPowerOf2(teams.length);
  const byeCount = total - teams.length;

  const byeTeams: Team[] = Array.from({ length: byeCount }, (_, i) => ({
    id: -(i + 1),
    name: "BYE",
    seed: total - i,
    members: [],
  }));

  return [...teams, ...byeTeams];
}

export function sortBySeed(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => a.seed - b.seed);
}

export function generateFirstRoundMatches(teams: Team[]): Match[] {
  const half = teams.length / 2;
  return Array.from({ length: half }, (_, i) => ({
    team1: teams[i],
    team2: teams[teams.length - 1 - i],
  }));
}

export function generateRounds(firstRoundMatches: Match[]): Round[] {
  const rounds: Round[] = [];
  let currentMatches = firstRoundMatches;
  let roundNumber = 1;

  while (currentMatches.length > 0) {
    rounds.push({ round: roundNumber, matches: currentMatches });
    if (currentMatches.length === 1) break;

    currentMatches = Array.from(
      { length: currentMatches.length / 2 },
      () => ({ team1: null, team2: null })
    );
    roundNumber++;
  }

  return rounds;
}

export function generateBracket(teams: Team[]): Round[] {
  const withBye = addByeTeams(teams);
  const sorted = sortBySeed(withBye);
  const firstRound = generateFirstRoundMatches(sorted);
  return generateRounds(firstRound);
}
