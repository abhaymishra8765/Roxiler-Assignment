// frontend/src/pages/AdminUsers.tsx
import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useForm } from "react-hook-form";

type UserRow = {
  id: number;
  name: string;
  email: string;
  address?: string;
  role: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    address: "",
    role: "",
  });
  const [page] = useState(1);
  const [pageSize] = useState(50);

  // For details panel (keep your existing UI)
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);

  // simple debounce
  const debounceRef = useRef<number | null>(null);
  const applyFiltersDebounced = (nextFilters: typeof filters) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      load(nextFilters);
    }, 300);
  };

  const load = async (overrideFilters?: Partial<typeof filters>) => {
    setLoading(true);
    try {
      const f = { ...filters, ...(overrideFilters || {}) };
      const params: any = { page, pageSize };
      if (f.name) params.name = f.name;
      if (f.email) params.email = f.email;
      if (f.address) params.address = f.address;
      if (f.role) params.role = f.role;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data.users || []);
    } catch (e: any) {
      console.error("Failed to load users", e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // called when user types in filter fields
  const onFilterChange = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    applyFiltersDebounced(next);
  };

  const clearFilters = () => {
    const next = { name: "", email: "", address: "", role: "" };
    setFilters(next);
    load(next);
  };

  const viewDetails = async (id: number) => {
    setSelectedUserDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      setSelectedUserDetail(res.data);
    } catch (err: any) {
      alert(
        "Failed to load user details: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await api.post("/admin/users", data);
      alert("User created");
      reset();
      load();
    } catch (e: any) {
      alert("Create failed: " + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Manage Users</h2>

      {/* FILTERS */}
      <section style={{ marginBottom: 12 }}>
        <strong>Filters:</strong>
        <div
          style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}
        >
          <input
            placeholder="Search name"
            value={filters.name}
            onChange={(e) => onFilterChange("name", e.target.value)}
          />
          <input
            placeholder="Search email"
            value={filters.email}
            onChange={(e) => onFilterChange("email", e.target.value)}
          />
          <input
            placeholder="Search address"
            value={filters.address}
            onChange={(e) => onFilterChange("address", e.target.value)}
          />
          <select
            value={filters.role}
            onChange={(e) => onFilterChange("role", e.target.value)}
          >
            <option value="">All roles</option>
            <option value="NORMAL_USER">Normal User</option>
            <option value="STORE_OWNER">Store Owner</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
          </select>

          <button onClick={() => load()}>Apply now</button>
          <button onClick={clearFilters}>Clear</button>
        </div>
      </section>

      {/* USERS TABLE */}
      <section style={{ marginBottom: 16 }}>
        <table
          border={1}
          cellPadding={6}
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th style={{ minWidth: 260 }}>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6}>No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.address ?? "-"}</td>
                  <td>{u.role}</td>
                  <td>
                    <button onClick={() => viewDetails(u.id)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* CREATE USER FORM (unchanged) */}
      <section>
        <h3>Create user</h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "grid", gap: 8, maxWidth: 600 }}
        >
          <input
            placeholder="Name (20-60 chars)"
            {...register("name")}
            required
          />
          <input placeholder="Email" {...register("email")} required />
          <input
            placeholder="Password"
            type="password"
            {...register("password")}
            required
          />
          <input placeholder="Address" {...register("address")} />
          <label>
            Role
            <select {...register("role")} defaultValue="NORMAL_USER">
              <option value="NORMAL_USER">Normal User</option>
              <option value="STORE_OWNER">Store Owner</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </select>
          </label>
          <div>
            <button type="submit">Create</button>
          </div>
        </form>
      </section>

      {/* Details panel (unchanged) */}
      <section style={{ marginTop: 24 }}>
        <h3>User details</h3>
        {detailLoading ? (
          <div>Loading details...</div>
        ) : !selectedUserDetail ? (
          <div>Click "View" on a user to see details</div>
        ) : (
          <div
            style={{
              border: "1px solid #ccc",
              padding: 12,
              borderRadius: 6,
              maxWidth: 900,
            }}
          >
            <div>
              <strong>Name:</strong> {selectedUserDetail.user.name}
            </div>
            <div>
              <strong>Email:</strong> {selectedUserDetail.user.email}
            </div>
            <div>
              <strong>Address:</strong> {selectedUserDetail.user.address ?? "-"}
            </div>
            <div>
              <strong>Role:</strong> {selectedUserDetail.user.role}
            </div>
            {selectedUserDetail.user.role === "STORE_OWNER" && (
              <>
                <hr />
                <h4>Store ratings</h4>
                {!selectedUserDetail.stores ||
                selectedUserDetail.stores.length === 0 ? (
                  <div>This owner has no stores.</div>
                ) : (
                  <>
                    <div>
                      <strong>Overall average:</strong>{" "}
                      {selectedUserDetail.overallAverageRating == null
                        ? "N/A"
                        : Number(
                            selectedUserDetail.overallAverageRating
                          ).toFixed(2)}
                    </div>
                    <div>
                      <strong>Total ratings:</strong>{" "}
                      {selectedUserDetail.overallRatingCount ?? 0}
                    </div>
                    <table border={1} cellPadding={6} style={{ marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>Store ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Address</th>
                          <th>Avg</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserDetail.storeRatings.map((sr: any) => (
                          <tr key={sr.storeId}>
                            <td>{sr.storeId}</td>
                            <td>{sr.storeName}</td>
                            <td>{sr.email ?? "-"}</td>
                            <td>{sr.address ?? "-"}</td>
                            <td>
                              {sr.avgRating == null
                                ? "N/A"
                                : Number(sr.avgRating).toFixed(2)}
                            </td>
                            <td>{sr.ratingCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
