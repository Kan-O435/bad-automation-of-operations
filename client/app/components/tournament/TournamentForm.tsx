"use client";

import { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

type Props = {
  onSubmit: (title: string, detail: string, days: string[]) => void;
  loading: boolean;
  error: string | null;
  initialTitle?: string;
  initialDetail?: string;
  initialDays?: string[];
  submitButtonText?: string;
};

export const TournamentForm = ({
  onSubmit,
  loading,
  error,
  initialTitle = "",
  initialDetail = "",
  initialDays = [""],
  submitButtonText = "大会を作成する",
}: Props) => {
  const [title, setTitle] = useState(initialTitle);
  const [detail, setDetail] = useState(initialDetail);
  const [days, setDays] = useState<string[]>(initialDays.length > 0 ? initialDays : [""]);

  const addDay = () => {
    setDays([...days, ""]);
  };

  const removeDay = (index: number) => {
    if (days.length > 1) {
      setDays(days.filter((_, i) => i !== index));
    }
  };

  const updateDay = (index: number, value: string) => {
    const newDays = [...days];
    newDays[index] = value;
    setDays(newDays);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validDays = days.filter((day) => day.trim() !== "");
    onSubmit(title, detail, validDays);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <Input
        label="大会名"
        value={title}
        onChange={setTitle}
        required
      />

      <div>
        <label className="block text-sm font-bold mb-2 text-black">詳細</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={8}
          className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black text-black resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-black">開催予定日</label>
          <button
            type="button"
            onClick={addDay}
            className="text-sm text-gray-600 hover:text-black underline"
          >
            + 日付を追加
          </button>
        </div>
        <div className="space-y-3">
          {days.map((day, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="date"
                value={day}
                onChange={(e) => updateDay(index, e.target.value)}
                className="flex-1 p-3 border border-gray-300 focus:outline-none focus:border-black text-black"
              />
              {days.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(index)}
                  className="text-red-600 hover:text-red-800 text-sm px-2"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        text={loading ? "処理中..." : submitButtonText}
        type="submit"
        onClick={undefined}
        className={loading ? "opacity-50 cursor-not-allowed" : ""}
      />
    </form>
  );
};
