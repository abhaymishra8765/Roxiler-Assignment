import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";

type StoreItem = {
  id: number;
  name: string;
  email?: string;
  address?: string;
  avgRating?: number | null;
  userSubmittedRating?: number | null;
};

export default function Stores() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const debounceRef = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, pageSize: 50 };
      if (nameQuery.trim()) params.name = nameQuery.trim();
      if (addressQuery.trim()) params.address = addressQuery.trim();
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/stores?${query}`);
      setStores(res.data.stores || []);
    } catch (err: any) {
      console.error("GET /stores failed", err?.response?.data ?? err.message);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      load();
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [nameQuery, addressQuery]);

  const submitRating = async (storeId: number, ratingValue: number) => {
    try {
      const res = await api.post(`/stores/${storeId}/rating`, {
        rating: ratingValue,
      });
      setStores((prev) =>
        prev.map((s) =>
          s.id === storeId
            ? {
                ...s,
                userSubmittedRating: res.data.rating.rating,
                avgRating: s.avgRating,
              }
            : s
        )
      );

      load();
    } catch (err: any) {
      console.error("submit rating failed", err?.response?.data ?? err.message);
      alert(
        "Failed to submit rating: " +
          (err?.response?.data?.error ?? err?.message ?? "Unknown")
      );
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Stores</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Search by name"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          placeholder="Search by address"
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : stores.length === 0 ? (
        <div>No stores found.</div>
      ) : (
        stores.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 12,
              borderRadius: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>{s.name}</h3>
            <div>{s.address}</div>
            <div>
              Overall Rating:{" "}
              {s.avgRating == null ? "N/A" : Number(s.avgRating).toFixed(2)}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>Your rating: </strong>
              {s.userSubmittedRating == null ? (
                <span style={{ color: "#777" }}>
                  You haven't rated this store yet.
                </span>
              ) : (
                <span>{s.userSubmittedRating} / 5</span>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ marginRight: 8 }}>Submit / Update rating:</label>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => submitRating(s.id, v)}
                  style={{
                    marginRight: 6,
                    background: s.userSubmittedRating === v ? "#222" : "#fff",
                    color: s.userSubmittedRating === v ? "#fff" : "#000",
                    border: "1px solid #ccc",
                    padding: "6px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  title={
                    s.userSubmittedRating === v
                      ? "Click to keep/update this rating"
                      : "Click to submit rating"
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
