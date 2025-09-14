// src/pages/ChangePassword.tsx
import React, { useState } from "react";
import api from "../api/axios"; // your axios instance (adds Authorization header)

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validateClient = () => {
    if (newPassword !== confirm) {
      setMessage("New password and confirmation do not match");
      return false;
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      setMessage("Password must be 8-16 characters");
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setMessage("Password must include at least one uppercase letter");
      return false;
    }
    if (!/\W/.test(newPassword)) {
      setMessage("Password must include at least one special character");
      return false;
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!validateClient()) return;
    setLoading(true);
    try {
      const res = await api.patch("/users/me/password", {
        currentPassword,
        newPassword,
      });
      setMessage(res.data?.message || "Password changed");
      alert(res.data?.message || "Password changed");
    } catch (err: any) {
      const server = err?.response?.data;
      setMessage(
        server?.error ||
          (server?.errors && server.errors.map((x: any) => x.msg).join(", ")) ||
          err.message ||
          "Failed"
      );
    } finally {
      setLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>Change Password</h2>
      {message && (
        <div
          style={{
            marginBottom: 12,
            color: message.includes("success") ? "green" : "red",
          }}
        >
          {message}
        </div>
      )}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <div>
          <button type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;
