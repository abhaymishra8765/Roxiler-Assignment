// src/App.tsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Stores from "./pages/Stores";
import { useAuth } from "./context/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminStores from "./pages/AdminStore";
import RequireRole from "./components/RequireRole";
import ChangePassword from "./pages/ChangePassword";
import OwnerDashboard from "./pages/OwnerDashboard";

export default function App() {
  // const { user, logout } = useAuth();
  const { user, logout } = (useAuth && useAuth()) || {
    user: undefined,
    logout: () => {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    },
  };

  return (
    <div className="p-4">
      <nav className="mb-4">
        {user?.role === "SYSTEM_ADMIN" && (
          <>
            <Link to="/admin/dashboard" style={{ marginRight: 8 }}>
              Dashboard
            </Link>
            <Link to="/admin/stores" style={{ marginRight: 8 }}>
              Admin Stores
            </Link>
            <Link to="/admin/users" style={{ marginRight: 8 }}>
              Admin Users
            </Link>
          </>
        )}
        {user?.role === "STORE_OWNER" && (
          <Link to="/owner/dashboard" style={{ marginRight: 8 }}>
            Owner Dashboard
          </Link>
        )}

        <Link to="/stores" className="mr-4">
          Stores
        </Link>
        {!user ? (
          <>
            <Link to="/login" className="mr-4">
              Login
            </Link>
            <Link to="/signup">Signup</Link>
          </>
        ) : (
          <>
            <Link to="/me/change-password" style={{ marginRight: 8 }}>
              Change password
            </Link>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Stores />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/admin"
          element={
            <RequireRole allowedRoles={["SYSTEM_ADMIN"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole allowedRoles={["SYSTEM_ADMIN"]}>
              <AdminUsers />
            </RequireRole>
          }
        />
        <Route
          path="/admin/stores"
          element={
            <RequireRole allowedRoles={["SYSTEM_ADMIN"]}>
              <AdminStores />
            </RequireRole>
          }
        />
        <Route
          path="/me/change-password"
          element={
            <RequireRole
              allowedRoles={["NORMAL_USER", "STORE_OWNER", "SYSTEM_ADMIN"]}
            >
              <ChangePassword />
            </RequireRole>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <RequireRole allowedRoles={["STORE_OWNER"]}>
              <OwnerDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireRole allowedRoles={["SYSTEM_ADMIN"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />
      </Routes>
    </div>
  );
}
