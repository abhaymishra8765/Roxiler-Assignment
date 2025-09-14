import React, { useEffect, useState } from "react";
import api from "../api/axios";

type StoreRow = {
  id: number;
  name: string;
  email?: string;
  address?: string;
  averageRating?: number | null;
  ratingCount?: number;
};

type RatingRow = {
  id: number;
  rating: number;
  createdAt: string;
  user: { id: number; name: string; email?: string };
};

export default function OwnerDashboard() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStores = async () => {
    setLoadingStores(true);
    try {
      const res = await api.get("/stores/owner/stores");
      setStores(res.data.stores || []);
    } catch (e: any) {
      console.error("loadStores error", e);
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const viewRatings = async (storeId: number) => {
    setSelectedStoreId(storeId);
    setLoadingRatings(true);
    try {
      const res = await api.get(`/stores/${storeId}/ratings`);
      setRatings(res.data.ratings || []);
    } catch (e: any) {
      console.error("viewRatings error", e);
      setError(e.response?.data?.error || e.message);
      setRatings([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Store Owner Dashboard</h1>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <section style={{ marginBottom: 20 }}>
        <h2>Your stores</h2>
        {loadingStores ? (
          <div>Loading stores…</div>
        ) : stores.length === 0 ? (
          <div>
            No stores found. Ask admin to assign you as owner or create a store.
          </div>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>AvgRating</th>
                <th>Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.address}</td>
                  <td>
                    {s.averageRating == null
                      ? "N/A"
                      : Number(s.averageRating).toFixed(2)}
                  </td>
                  <td>{s.ratingCount ?? 0}</td>
                  <td>
                    <button onClick={() => viewRatings(s.id)}>
                      View ratings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Ratings {selectedStoreId ? `(Store ${selectedStoreId})` : ""}</h2>
        {loadingRatings ? (
          <div>Loading ratings…</div>
        ) : ratings.length === 0 ? (
          <div>No ratings found for selected store.</div>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.id}>
                  <td>{r.user?.name ?? r.user?.id}</td>
                  <td>{r.user?.email}</td>
                  <td>{r.rating}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
