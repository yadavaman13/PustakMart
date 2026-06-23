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
