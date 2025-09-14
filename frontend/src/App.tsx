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
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

export default function App() {
  const { user, logout } = (useAuth && useAuth()) || {
    user: undefined,
    logout: () => {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    },
  };

  return (
    <div className="container-app">
      <nav className="d-flex align-items-center justify-content-between mb-4">
        <div className="navbar-links">
          {user?.role === "SYSTEM_ADMIN" && (
            <>
              <Link to="/admin/dashboard" className="btn btn-link">
                Dashboard
              </Link>
              <Link to="/admin/stores" className="btn btn-link">
                Admin Stores
              </Link>
              <Link to="/admin/users" className="btn btn-link">
                Admin Users
              </Link>
            </>
          )}
          {user?.role === "STORE_OWNER" && (
            <Link to="/owner/dashboard" className="btn btn-link">
              Owner Dashboard
            </Link>
          )}
          <Link to="/stores" className="btn btn-link">
            Stores
          </Link>
        </div>

        <div>
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline-primary me-2">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Signup
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/me/change-password"
                className="btn btn-sm btn-outline-secondary me-2"
              >
                Change password
              </Link>
              <button onClick={logout} className="btn btn-danger btn-sm">
                Logout
              </button>
            </>
          )}
        </div>
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
