"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Admin = {
  id: number;
  email: string;
  name: string;
};

type AuthContextType = {
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);

  return (
    <AuthContext.Provider value={{ admin, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};