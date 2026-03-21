import type { TournamentCategory } from "../../../types/tournament_category";
import { CategoryCard } from "./CategoryCard";

type Props = {
  categories: TournamentCategory[];
  onEdit?: (category: TournamentCategory) => void;
};

export const CategoryList = ({ categories, onEdit }: Props) => {
  if (categories.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-8 text-center">
        <p className="text-gray-500 text-sm">
          カテゴリーがまだ追加されていません
        </p>
        <p className="text-gray-400 text-xs mt-1">
          下のフォームからカテゴリーを追加してください
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};
