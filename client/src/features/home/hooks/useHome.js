import { useState, useCallback } from "react";
import { getHomeListingsApi } from "../services/home.api.js";

export function useHome() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchListings = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await getHomeListingsApi(params);
      if (res.listings) {
        setListings(res.listings);
        setTotal(res.total || res.listings.length);
      }
    } catch (err) {
      console.error("Error fetching homepage listings:", err);
      setError(err.response?.data?.message || "Failed to load book listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    listings,
    total,
    loading,
    error,
    fetchListings,
  };
}
