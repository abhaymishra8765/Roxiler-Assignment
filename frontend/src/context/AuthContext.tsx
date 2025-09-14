import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

interface AuthContextType {
  user: { id: number; email: string; role?: string } | null;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.userId,
          email: payload.email || "",
          role: payload.role,
        });
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  const login = (accessToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      setUser({
        id: payload.userId,
        email: payload.email || "",
        role: payload.role,
      });
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
