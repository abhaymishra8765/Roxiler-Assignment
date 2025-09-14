import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: React.ReactElement;
  allowedRoles: string[];
};

export default function RequireRole({ children, allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role || "")) {
    return (
      <div style={{ padding: 20 }}>
        403 — Forbidden: you don’t have access to this page
      </div>
    );
  }

  return children;
}
