import { useState, useCallback } from "react";
import { getListingDetailsApi, getSellerReviewsApi } from "../services/home.api.js";
import { toggleSaveListingApi, getSavedListingsApi, createConversationApi } from "../../dashboard/services/dashboard.api.js";
import useAuth from "../../auth/hooks/useAuth.js";

export function useProductDetails() {
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchDetails = useCallback(async (listingId) => {
    setLoading(true);
    setError("");
    try {
      const listingRes = await getListingDetailsApi(listingId);
      if (listingRes.success && listingRes.listing) {
        const listingData = listingRes.listing;
        setListing(listingData);

        const sellerId = listingData.seller?._id || listingData.seller;
        if (sellerId) {
          const reviewsRes = await getSellerReviewsApi(sellerId);
          if (reviewsRes.success) {
            setReviews(reviewsRes.data.reviews || []);
          }
        }

        if (user) {
          try {
            const savedRes = await getSavedListingsApi();
            if (savedRes.success) {
              const isSaved = savedRes.data.bookmarks.some(
                (b) => {
                  const bListingId = b.listing?._id || b.listing;
                  return bListingId && bListingId.toString() === listingId.toString();
                }
              );
              setWishlisted(isSaved);
            }
          } catch (err) {
            console.error("Error checking saved status:", err);
          }
        }
      } else {
        setError("Listing not found.");
      }
    } catch (err) {
      console.error("Error fetching listing details:", err);
      setError(err.response?.data?.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleWishlist = useCallback(async () => {
    if (!user) {
      return { error: "Please log in to save listings." };
    }
    if (!listing) return;
    setWishlistLoading(true);
    try {
      const res = await toggleSaveListingApi(listing._id);
      if (res.success) {
        setWishlisted(res.data.saved);
        setListing(prev => ({
          ...prev,
          savedCount: res.data.saved ? (prev.savedCount || 0) + 1 : Math.max(0, (prev.savedCount || 0) - 1)
        }));
        return { success: true, saved: res.data.saved };
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      return { error: err.response?.data?.message || "Failed to update wishlist." };
    } finally {
      setWishlistLoading(false);
    }
  }, [user, listing]);

  const initiateChat = useCallback(async () => {
    if (!user) {
      return { error: "Please log in to chat with the seller." };
    }
    if (!listing) return;
    setChatLoading(true);
    try {
      const res = await createConversationApi(listing._id);
      if (res.success) {
        return { success: true, conversation: res.data.conversation };
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
      return { error: err.response?.data?.message || "Failed to start conversation." };
    } finally {
      setChatLoading(false);
    }
  }, [user, listing]);

  return {
    listing,
    reviews,
    loading,
    error,
    wishlisted,
    wishlistLoading,
    chatLoading,
    fetchDetails,
    toggleWishlist,
    initiateChat,
  };
}
