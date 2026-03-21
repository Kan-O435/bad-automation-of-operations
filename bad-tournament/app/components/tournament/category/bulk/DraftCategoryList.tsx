import type { DraftCategoryForm } from "../../../../types/tournament_category";
import { DraftCategoryCard } from "./DraftCategoryCard";

type Props = {
  drafts: DraftCategoryForm[];
  onChange: (localId: string, key: keyof DraftCategoryForm, value: string | boolean) => void;
  onRemove: (localId: string) => void;
};

export const DraftCategoryList = ({ drafts, onChange, onRemove }: Props) => {
  if (drafts.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded p-8 text-center">
        <p className="text-gray-400 text-sm">下書きがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft, index) => (
        <DraftCategoryCard
          key={draft.localId}
          draft={draft}
          index={index}
          onChange={onChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};
