"use client";

import { SignupForm } from "../components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-black font-bold mb-12 ml-4 text-lg">アカウント作成</h1>
        
        <div className="flex flex-col md:flex-row gap-12">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}