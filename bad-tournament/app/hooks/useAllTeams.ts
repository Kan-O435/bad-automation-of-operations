import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../lib/api";
import type { Team, CreateTeamParams, CreateTeamMemberParams } from "../types/team";

type UseAllTeamsReturn = {
  teams: Team[];
  loading: boolean;
  error: string | null;
  createTeamWithMembers: (
    tournamentId: number,
    categoryId: number,
    teamParams: CreateTeamParams,
    members: CreateTeamMemberParams[]
  ) => Promise<void>;
  deleteTeam: (
    tournamentId: number,
    categoryId: number,
    teamId: number
  ) => Promise<void>;
  refetch: () => Promise<void>;
};

export const useAllTeams = (tournamentId: number): UseAllTeamsReturn => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/tournaments/${tournamentId}/teams`, {
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
  }, [tournamentId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const categoryBase = (tId: number, cId: number) =>
    `${API_URL}/tournaments/${tId}/tournament_categories/${cId}`;

  const createTeamWithMembers = async (
    tId: number,
    cId: number,
    teamParams: CreateTeamParams,
    members: CreateTeamMemberParams[]
  ) => {
    // 1. チーム作成
    const teamRes = await fetch(`${categoryBase(tId, cId)}/teams`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: teamParams }),
    });
    if (!teamRes.ok) {
      const data = await teamRes.json();
      throw new Error(data.errors?.[0] ?? "チームの登録に失敗しました");
    }
    const team: Team = await teamRes.json();

    // 2. メンバー登録
    for (const member of members) {
      const memberRes = await fetch(
        `${categoryBase(tId, cId)}/teams/${team.id}/team_members`,
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

  const deleteTeam = async (tId: number, cId: number, teamId: number) => {
    const res = await fetch(`${categoryBase(tId, cId)}/teams/${teamId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("チームの削除に失敗しました");
    await fetchTeams();
  };

  return { teams, loading, error, createTeamWithMembers, deleteTeam, refetch: fetchTeams };
};
