import axios from "axios";
import { API_BASE_URL } from "../../../app/runtime.config.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Fetch public book listings with optional filters (category, search, sorting)
 * @param {object} params - { category, search, page, limit }
 */
export const getHomeListingsApi = async (params = {}) => {
  const response = await api.get("/book", { params });
  return response.data;
};

// Get detailed info for a single book/bundle listing
export const getListingDetailsApi = async (id) => {
  const response = await api.get(`/book/${id}`);
  return response.data;
};

// Get reviews of a specific seller
export const getSellerReviewsApi = async (sellerId) => {
  const response = await api.get(`/reviews/${sellerId}`);
  return response.data;
};
