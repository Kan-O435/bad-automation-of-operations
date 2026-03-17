import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Admin } from "../types/admin";
import { API_URL } from "../lib/api";

export const useCurrentAdmin = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentAdmin = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setAdmin(null);
          setLoading(false);
          return;
        }
        throw new Error("ユーザー情報の取得に失敗しました");
      }

      const data = await res.json();
      setAdmin(data.admin);
    } catch (err) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);

  const clearAdmin = useCallback(() => {
    setAdmin(null);
  }, []);

  return {
    admin,
    loading,
    refetch: fetchCurrentAdmin,
    clearAdmin,
  };
};
