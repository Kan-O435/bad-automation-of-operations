"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export const SignupBox = () => {
  const router = useRouter();

  return (
    <div className="flex-1 bg-gray-50 p-10 border border-gray-100">
      <h2 className="text-lg font-bold mb-8 text-black">初めての方</h2>
      <p className="text-sm leading-relaxed mb-12 text-black">
        登録がお済みでない方はこちらよりアカウントを作成してください。
      </p>
      <Button text="アカウント作成" onClick={() => router.push("/signup")} />
    </div>
  );
};