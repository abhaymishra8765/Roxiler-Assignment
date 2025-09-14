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
      // map API shape -> StoreItem
      const items: StoreItem[] = (res.data.stores || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        avgRating: s.avgRating ?? null,
        userSubmittedRating: s.userSubmittedRating ?? null,
      }));
      setStores(items);
    } catch (err: any) {
      console.error("GET /stores failed", err?.response?.data ?? err.message);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // small debounce for queries
    debounceRef.current = window.setTimeout(() => {
      load();
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameQuery, addressQuery]);

  const submitRating = async (storeId: number, ratingValue: number) => {
    try {
      const res = await api.post(`/stores/${storeId}/rating`, {
        rating: ratingValue,
      });
      // update local store rating quickly (server also returns avg)
      setStores((prev) =>
        prev.map((s) =>
          s.id === storeId
            ? {
                ...s,
                userSubmittedRating: res.data.rating.rating,
                avgRating: res.data.averageRating ?? s.avgRating,
              }
            : s
        )
      );
    } catch (err: any) {
      console.error("submit rating failed", err?.response?.data ?? err.message);
      alert(
        "Failed to submit rating: " +
          (err?.response?.data?.error ?? err?.message ?? "Unknown")
      );
    }
  };

  return (
    <div>
      <h1 className="mb-3">Stores</h1>

      <div className="row search-row mb-3 g-2">
        <div className="col-sm-6">
          <input
            className="form-control"
            placeholder="Search by name"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>
        <div className="col-sm-6">
          <input
            className="form-control"
            placeholder="Search by address"
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : stores.length === 0 ? (
        <div className="alert alert-light">No stores found.</div>
      ) : (
        stores.map((s) => (
          <div key={s.id} className="store-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h4 style={{ margin: 0 }}>{s.name}</h4>
                <div className="small-muted">
                  {s.address ? (
                    s.address
                  ) : (
                    <span className="text-muted">No address</span>
                  )}
                </div>
                {s.email && <div className="small-muted">Email: {s.email}</div>}
              </div>
              <div className="text-end small-muted">
                Overall Rating:{" "}
                <strong>
                  {s.avgRating == null ? "N/A" : Number(s.avgRating).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="mt-3">
              <div>
                <strong>Your rating: </strong>
                {s.userSubmittedRating == null ? (
                  <span className="text-muted">
                    You haven't rated this store yet.
                  </span>
                ) : (
                  <span>{s.userSubmittedRating} / 5</span>
                )}
              </div>

              <div className="mt-2 d-flex gap-2 align-items-center">
                <label className="me-2 mb-0">Submit / Update rating:</label>
                <div className="btn-group" role="group" aria-label="rating">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => submitRating(s.id, v)}
                      className={
                        "btn btn-sm btn-outline-secondary btn-rating " +
                        (s.userSubmittedRating === v
                          ? "btn-dark text-white"
                          : "")
                      }
                      title={
                        s.userSubmittedRating === v
                          ? "Your rating (click to keep or send again)"
                          : "Click to submit rating"
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
