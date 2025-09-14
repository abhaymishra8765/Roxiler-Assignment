import React from "react";

type Store = {
  id: number;
  name: string;
  address?: string;
  overallRating?: number | null;
  myRating?: number | null;
};

export default function StoreCard({ store }: { store: Store }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        borderRadius: "8px",
        marginBottom: "8px",
      }}
    >
      <h3 style={{ margin: 0 }}>{store.name}</h3>
      <p style={{ margin: "4px 0" }}>{store.address || "No address"}</p>
      <p style={{ margin: "4px 0" }}>
        Overall Rating: {store.overallRating ?? "N/A"}
      </p>
      {store.myRating && <p>Your Rating: {store.myRating}</p>}
    </div>
  );
}
