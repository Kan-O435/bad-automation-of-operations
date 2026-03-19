"use client";

import { useRouter } from "next/navigation";
import { Button } from "./components/ui/Button";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black">ようこそ</h1>
        
        <div className="space-y-6 mb-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            このアプリケーションへようこそ。ログインまたは新規登録を行ってください。
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-black">ご利用方法</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• 既にアカウントをお持ちの方は、ログインページからログインしてください</li>
              <li>• 新規登録の方は、アカウント作成ページから登録を行ってください</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Button 
              text="ログイン" 
              onClick={() => router.push("/login")}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Button 
              text="アカウント作成" 
              onClick={() => router.push("/signup")}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
