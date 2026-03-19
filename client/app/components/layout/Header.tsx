"use client";

import { UserMenu } from "../auth/UserMenu";

export const Header = () => {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-end">
        <UserMenu />
      </div>
    </header>
  );
};
