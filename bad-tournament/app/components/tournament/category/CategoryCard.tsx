import type { TournamentCategory } from "../../../types/tournament_category";
import {
  GENDER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  FORMAT_TYPE_LABELS,
} from "../../../types/tournament_category";

type Props = {
  category: TournamentCategory;
  onEdit?: (category: TournamentCategory) => void;
  onRegisterParticipants?: (categoryId: number) => void;
};

type BadgeProps = {
  label: string;
  colorClass: string;
};

const Badge = ({ label, colorClass }: BadgeProps) => (
  <span
    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${colorClass}`}
  >
    {label}
  </span>
);

type InfoRowProps = {
  label: string;
  value: string | number;
};

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="flex items-center gap-2 text-sm text-gray-700">
    <span className="font-semibold text-gray-500 min-w-[120px]">{label}</span>
    <span>{value}</span>
  </div>
);

export const CategoryCard = ({ category, onEdit, onRegisterParticipants }: Props) => {
  const isLeagueFormat =
    category.format_type === "league" ||
    category.format_type === "league_to_tournament";
  const isTournamentFormat =
    category.format_type === "elimination" ||
    category.format_type === "league_to_tournament";

  return (
    <div className="bg-white border border-gray-200 rounded p-5 space-y-3 relative">
      {/* 右上ボタン群 */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="text-xs text-gray-400 hover:text-black border border-gray-200 hover:border-gray-400 px-2.5 py-1 rounded transition-colors"
          >
            編集
          </button>
        )}
        {onRegisterParticipants && (
          <button
            type="button"
            onClick={() => onRegisterParticipants(category.id)}
            className="text-xs text-white bg-black hover:opacity-75 px-2.5 py-1 rounded transition-opacity"
          >
            参加者登録
          </button>
        )}
      </div>

      {/* バッジ行 */}
      <div className="flex flex-wrap gap-2 pr-14">
        <Badge
          label={GENDER_TYPE_LABELS[category.gender_type]}
          colorClass="bg-indigo-100 text-indigo-700"
        />
        <Badge
          label={EVENT_TYPE_LABELS[category.event_type]}
          colorClass="bg-teal-100 text-teal-700"
        />
        {category.age_type && (
          <Badge
            label={category.age_type}
            colorClass="bg-gray-100 text-gray-700"
          />
        )}
        <Badge
          label={`クラス: ${category.rank}`}
          colorClass="bg-orange-100 text-orange-700"
        />
      </div>

      {/* 形式 */}
      <div className="text-sm font-bold text-black">
        {FORMAT_TYPE_LABELS[category.format_type]}
      </div>

      {/* 詳細情報 */}
      <div className="space-y-1 border-t border-gray-100 pt-3">
        {isLeagueFormat && category.group_size !== null && (
          <InfoRow label="1グループ人数" value={`${category.group_size}人`} />
        )}
        {isLeagueFormat && category.group_count !== null && (
          <InfoRow label="グループ数" value={`${category.group_count}グループ`} />
        )}
        {isTournamentFormat && category.max_participants !== null && (
          <InfoRow
            label="最大参加人数"
            value={`${category.max_participants}人`}
          />
        )}
        {category.format_type === "league_to_tournament" &&
          category.advance_count !== null && (
            <InfoRow
              label="本戦進出人数"
              value={`各グループ ${category.advance_count}人`}
            />
          )}
        {isTournamentFormat && (
          <InfoRow
            label="3位決定戦"
            value={category.has_third_place ? "あり" : "なし"}
          />
        )}
      </div>
    </div>
  );
};
