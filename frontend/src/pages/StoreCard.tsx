import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

type Store = {
  id: number;
  name: string;
  address?: string;
  overallRating?: number | null;
  myRating?: number | null;
};

export default function StoreCard({
  store,
  onRated,
}: {
  store: Store;
  onRated?: () => void;
}) {
  const [myRating, setMyRating] = useState<number | null>(
    store.myRating ?? null
  );
  const { user } = useAuth();

  const submitRating = async (rating: number) => {
    if (!user) {
      alert("Please login to rate");
      return;
    }
    try {
      await api.post(`/stores/${store.id}/rating`, { rating });
      setMyRating(rating);
      if (onRated) onRated();
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to submit rating");
    }
  };

  return (
    <div className="p-2 border rounded">
      <h3 className="font-bold">{store.name}</h3>
      <div>{store.address}</div>
      <div>
        Average:{" "}
        {store.overallRating ? store.overallRating.toFixed(2) : "No ratings"}
      </div>
      <div>Your rating: {myRating ?? "Not rated"}</div>
      <div className="mt-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => submitRating(n)}
            className="mr-1 px-2 border"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
