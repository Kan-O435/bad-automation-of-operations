"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrentAdmin } from "../../hooks/useCurrentAdmin";
import { useLogout } from "../../hooks/useLogout";

export const UserMenu = () => {
  const { admin, loading, clearAdmin, refetch } = useCurrentAdmin();
  const { logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleLogin = () => {
      refetch();
    };

    window.addEventListener("user-logged-in", handleLogin);
    return () => {
      window.removeEventListener("user-logged-in", handleLogin);
    };
  }, [refetch]);

  if (loading || !admin) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-black hover:text-gray-700 text-sm font-medium px-3 py-2 rounded hover:bg-gray-100 transition-colors"
      >
        {admin.name}さん
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50">
          <button
            onClick={async () => {
              setIsOpen(false);
              clearAdmin();
              await logout();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
};
