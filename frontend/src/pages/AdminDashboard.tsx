import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalStores: number;
    totalRatings: number;
  } | null>(null);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
  }, []);

  if (!stats) return <div>Loading...</div>;
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div style={{ display: "flex", gap: 16 }}>
        <div className="card">
          Users: <strong>{stats.totalUsers}</strong>
        </div>
        <div className="card">
          Stores: <strong>{stats.totalStores}</strong>
        </div>
        <div className="card">
          Ratings: <strong>{stats.totalRatings}</strong>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <Link to="/admin/users">Manage Users</Link> |{" "}
        <Link to="/admin/stores">Manage Stores</Link>
      </div>
    </div>
  );
}
