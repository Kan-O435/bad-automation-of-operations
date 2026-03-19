"use client";

import { LoginForm } from "../components/auth/LoginForm";
import { SignupBox } from "../components/auth/SignupBox";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-black font-bold mb-12 ml-4 text-lg">ログイン</h1>
        
        <div className="flex flex-col md:flex-row gap-12">
          <LoginForm />

          <SignupBox />
        </div>
      </div>
    </main>
  );
}
