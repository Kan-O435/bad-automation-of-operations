import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../lib/api";

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const logout = async () => {
    try {
      setLoading(true);
      await fetch(`${API_URL}/logout`, {
        method: "DELETE",
        credentials: "include",
      });
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return {
    logout,
    loading,
  };
};
