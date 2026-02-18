"use client";
import { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ 
          email, 
          password
        }),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = { error: `サーバーエラー: ${res.status} ${res.statusText}` };
        }
        
        const errorMessages = errorData.error 
          ? [errorData.error] 
          : ["ログインに失敗しました"];
        setErrors(errorMessages);
        return;
      }

      const data = await res.json();
      router.push("/tournament");
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setErrors(["Railsサーバーに接続できません。サーバーが起動しているか確認してください。"]);
      } else {
        setErrors([`通信エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`]);
      }
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-10 border border-gray-100">
      <h2 className="text-lg font-bold mb-8 text-black">会員登録がお済みのお客様</h2>
      
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <ul className="list-disc list-inside text-sm text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="メールアドレス（ID）" value={email} onChange={setEmail} required />
        <Input 
          label="パスワード" 
          type={showPassword ? "text" : "password"} 
          value={password} 
          onChange={setPassword} 
          required 
        />
        
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="show-pw" 
            onChange={() => setShowPassword(!showPassword)} 
          />
          <label htmlFor="show-pw" className="text-sm cursor-pointer text-black">パスワードを表示する</label>
        </div>

        <Button text="ログインして進む" type="submit" />
      </form>
      <div className="mt-6">
        <a href="#" className="text-sm text-gray-500 underline decoration-gray-300">パスワードをお忘れですか？</a>
      </div>
    </div>
  );
};