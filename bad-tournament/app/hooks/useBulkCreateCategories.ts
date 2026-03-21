import { useState } from "react";
import { API_URL } from "../lib/api";
import type {
  DraftCategoryForm,
  CreateTournamentCategoryParams,
  FormatType,
} from "../types/tournament_category";

type BulkResult = {
  successCount: number;
  failedCount: number;
};

type UseBulkCreateCategoriesReturn = {
  bulkCreate: (
    tournamentId: number,
    drafts: DraftCategoryForm[]
  ) => Promise<BulkResult | null>;
  loading: boolean;
  error: string | null;
};

/** DraftCategoryForm を APIリクエスト用 Params に変換 */
const toApiParams = (draft: DraftCategoryForm): CreateTournamentCategoryParams => {
  const format = draft.format_type as FormatType;
  const isLeague = format === "league" || format === "league_to_tournament";
  const isTournament = format === "elimination" || format === "league_to_tournament";

  return {
    gender_type: draft.gender_type,
    event_type: draft.event_type,
    age_type: draft.age_type,
    rank: draft.rank,
    format_type: format,
    has_third_place: draft.has_third_place,
    ...(isLeague && {
      group_size: draft.group_size ? Number(draft.group_size) : null,
      group_count: draft.group_count ? Number(draft.group_count) : null,
    }),
    ...(isTournament && {
      max_participants: draft.max_participants
        ? Number(draft.max_participants)
        : null,
    }),
    ...(format === "league_to_tournament" && {
      advance_count: draft.advance_count ? Number(draft.advance_count) : null,
    }),
  };
};

export const useBulkCreateCategories = (): UseBulkCreateCategoriesReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkCreate = async (
    tournamentId: number,
    drafts: DraftCategoryForm[]
  ): Promise<BulkResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled(
        drafts.map((draft) =>
          fetch(
            `${API_URL}/tournaments/${tournamentId}/tournament_categories`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                tournament_category: toApiParams(draft),
              }),
            }
          ).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              const msg = Array.isArray(data.errors)
                ? data.errors.join(", ")
                : `保存失敗 (${res.status})`;
              throw new Error(msg);
            }
            return res.json();
          })
        )
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (failedCount > 0) {
        const firstError = results.find(
          (r): r is PromiseRejectedResult => r.status === "rejected"
        );
        setError(
          `${failedCount}件の保存に失敗しました: ${firstError?.reason?.message ?? "不明なエラー"}`
        );
      }

      return { successCount, failedCount };
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { bulkCreate, loading, error };
};
