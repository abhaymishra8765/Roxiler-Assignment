// frontend/src/pages/AdminStores.tsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";

type StoreRow = {
  id: number;
  name: string;
  email?: string;
  address?: string;
  ownerId?: number;
  averageRating?: number | null;
};

export default function AdminStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [filters, setFilters] = useState<{ name?: string; address?: string }>(
    {}
  );

  const buildQuery = (p = 1) => {
    const q = new URLSearchParams();
    q.set("page", String(p));
    q.set("pageSize", "50");
    if (filters.name) q.set("name", filters.name);
    if (filters.address) q.set("address", filters.address);
    return q.toString();
  };

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/stores?${buildQuery(p)}`);
        setStores(res.data.stores || []);
      } catch (e: any) {
        console.error("Failed to load stores", e);
        setStores([]);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    load(1);
  }, [filters]); // reload when filters change

  const onSubmit = async (data: any) => {
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        address: data.address,
      };
      if (data.ownerId) payload.ownerId = Number(data.ownerId);
      await api.post("/admin/stores", payload);
      alert("Store created successfully");
      reset();
      load(1);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create store");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 28, marginBottom: 12 }}>Admin — Manage Stores</h2>

      <div style={{ marginBottom: 18 }}>
        <strong>Logged in as:</strong> {user?.email} ({user?.role})
      </div>

      <section style={{ marginBottom: 12 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(1);
          }}
          style={{ display: "flex", gap: 8, marginBottom: 8 }}
        >
          <input
            placeholder="Name"
            value={filters.name ?? ""}
            onChange={(e) =>
              setFilters((s) => ({ ...s, name: e.target.value }))
            }
          />
          <input
            placeholder="Address"
            value={filters.address ?? ""}
            onChange={(e) =>
              setFilters((s) => ({ ...s, address: e.target.value }))
            }
          />
          <button
            type="button"
            onClick={() => {
              setFilters({});
              load(1);
            }}
          >
            Clear
          </button>
          <button type="submit">Search</button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Create New Store</h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "grid", gap: 8, maxWidth: 600 }}
        >
          <input
            {...register("name")}
            placeholder="Store name (required)"
            required
          />
          <input {...register("email")} placeholder="Store email (optional)" />
          <input {...register("address")} placeholder="Address (optional)" />
          <input
            {...register("ownerId")}
            placeholder="Owner userId (optional, must be STORE_OWNER)"
          />
          <div>
            <button type="submit">Create Store</button>
          </div>
        </form>
      </section>

      <section>
        <h3 style={{ marginBottom: 8 }}>Stores</h3>
        {loading ? (
          <div>Loading stores…</div>
        ) : stores.length === 0 ? (
          <div>No stores found.</div>
        ) : (
          <table
            style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>ID</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Name</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Email</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>
                  Address
                </th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>
                  OwnerId
                </th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>
                  AvgRating
                </th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td style={{ border: "1px solid #eee", padding: 8 }}>
                    {s.id}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: 8 }}>
                    {s.name}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: 8 }}>
                    {s.email ?? "-"}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: 8 }}>
                    {s.address ?? "-"}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: 8 }}>
                    {s.ownerId ?? "-"}
                  </td>
                  <td style={{ border: "1px solid #eee", padding: 8 }}>
                    {s.averageRating == null
                      ? "N/A"
                      : Number(s.averageRating).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
