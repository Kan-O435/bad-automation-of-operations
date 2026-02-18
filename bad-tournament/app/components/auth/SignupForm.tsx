"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export const SignupForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // パスワード確認のバリデーション
    if (password !== passwordConfirmation) {
      setErrors(["パスワードとパスワード確認が一致しません"]);
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          password_confirmation: passwordConfirmation
        }),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = { errors: [`サーバーエラー: ${res.status} ${res.statusText}`] };
        }
        
        const errorMessages = Array.isArray(errorData.errors) 
          ? errorData.errors 
          : ["登録に失敗しました"];
        setErrors(errorMessages);
        return;
      }

      const data = await res.json();
      alert("アカウントが作成されました！");
      router.push("/tournament");
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setErrors(["Railsサーバーに接続できません。サーバーが起動しているか確認してください。"]);
      } else {
        setErrors([`通信エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`]);
      }
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-10 border border-gray-100">
      <h2 className="text-lg font-bold mb-8 text-black">新規アカウント作成</h2>
      
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
        <Input label="お名前" value={name} onChange={setName} required />
        <Input label="メールアドレス" type="email" value={email} onChange={setEmail} required />
        <Input 
          label="パスワード" 
          type={showPassword ? "text" : "password"} 
          value={password} 
          onChange={setPassword} 
          required 
        />
        <Input 
          label="パスワード（確認）" 
          type={showPassword ? "text" : "password"} 
          value={passwordConfirmation} 
          onChange={setPasswordConfirmation} 
          required 
        />
        
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="show-pw-signup" 
            onChange={() => setShowPassword(!showPassword)} 
          />
          <label htmlFor="show-pw-signup" className="text-sm cursor-pointer text-black">パスワードを表示する</label>
        </div>

        <Button text="規約に同意して登録する" type="submit" />
      </form>
      
      <div className="mt-6">
        <button 
          type="button"
          onClick={() => router.push("/login")} 
          className="text-sm text-gray-500 underline decoration-gray-300"
        >
          ログイン画面に戻る
        </button>
      </div>
    </div>
  );
};