import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../lib/api";
import type {
  Team,
  CreateTeamParams,
  CreateTeamMemberParams,
} from "../types/team";

type UseTeamsReturn = {
  teams: Team[];
  loading: boolean;
  error: string | null;
  createTeamWithMembers: (
    teamParams: CreateTeamParams,
    members: CreateTeamMemberParams[]
  ) => Promise<void>;
  deleteTeam: (teamId: number) => Promise<void>;
  refetch: () => Promise<void>;
};

const baseUrl = (tournamentId: number, categoryId: number) =>
  `${API_URL}/tournaments/${tournamentId}/tournament_categories/${categoryId}`;

export const useTeams = (
  tournamentId: number,
  categoryId: number
): UseTeamsReturn => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!tournamentId || !categoryId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${baseUrl(tournamentId, categoryId)}/teams`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("参加チームの取得に失敗しました");
      const data: Team[] = await res.json();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [tournamentId, categoryId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeamWithMembers = async (
    teamParams: CreateTeamParams,
    members: CreateTeamMemberParams[]
  ) => {
    // 1. チーム作成
    const teamRes = await fetch(
      `${baseUrl(tournamentId, categoryId)}/teams`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: teamParams }),
      }
    );
    if (!teamRes.ok) {
      const data = await teamRes.json();
      throw new Error(data.errors?.[0] ?? "チームの登録に失敗しました");
    }
    const team: Team = await teamRes.json();

    // 2. メンバー登録
    for (const member of members) {
      const memberRes = await fetch(
        `${baseUrl(tournamentId, categoryId)}/teams/${team.id}/team_members`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team_member: member }),
        }
      );
      if (!memberRes.ok) {
        const data = await memberRes.json();
        throw new Error(data.errors?.[0] ?? "メンバーの登録に失敗しました");
      }
    }

    await fetchTeams();
  };

  const deleteTeam = async (teamId: number) => {
    const res = await fetch(
      `${baseUrl(tournamentId, categoryId)}/teams/${teamId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error("チームの削除に失敗しました");
    await fetchTeams();
  };

  return { teams, loading, error, createTeamWithMembers, deleteTeam, refetch: fetchTeams };
};
