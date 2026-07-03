import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useAuth from "../../auth/hooks/useAuth.js";
import SEO from "../../shared/components/SEO.jsx";
import axios from "axios";
import { API_BASE_URL } from "../../../app/runtime.config.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const CheckoutPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponStatus, setCouponStatus] = useState("empty"); // "empty", "loading", "applied", "invalid"
  const [couponMessage, setCouponMessage] = useState("");

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fetch initial checkout details
  const fetchCheckoutDetails = async (code = "") => {
    try {
      if (!code) {
        setLoading(true);
      } else {
        setCouponStatus("loading");
      }

      const url = `/listings/${listingId}/checkout${code ? `?couponCode=${code}` : ""}`;
      const res = await api.get(url);

      if (res.data.success) {
        setListing(res.data.listing);
        setSeller(res.data.seller);
        setPriceBreakdown(res.data.priceBreakdown);

        if (code) {
          if (res.data.couponError) {
            setCouponStatus("invalid");
            setCouponMessage(res.data.couponError);
            setAppliedCoupon(null);
          } else if (res.data.couponDetails) {
            setCouponStatus("applied");
            setAppliedCoupon(res.data.couponDetails);
            const saved = res.data.priceBreakdown.couponDiscount;
            setCouponMessage(`Coupon Applied! You saved ₹${saved}.`);
          }
        }
      } else {
        setError(res.data.message || "Failed to load checkout details.");
      }
    } catch (err) {
      console.error(err);
      if (code) {
        setCouponStatus("invalid");
        setCouponMessage(err.response?.data?.message || "Failed to validate coupon.");
      } else {
        setError(err.response?.data?.message || "Error loading checkout details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchCheckoutDetails();
    }
  }, [listingId]);

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    fetchCheckoutDetails(couponCode);
  };

  // Remove Coupon
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponStatus("empty");
    setCouponMessage("");
    fetchCheckoutDetails();
  };

  // Buy Now Checkout Flow
  const handleBuyNow = async () => {
    if (checkoutLoading) return;

    // Direct Pre-Validations
    if (!user) {
      alert("Please login to proceed with purchase.");
      navigate("/auth");
      return;
    }

    if (seller?._id === user?.id || seller?._id === user?._id) {
      alert("You already own this listing.");
      return;
    }

    if (listing?.status === "reserved") {
      alert("This book is currently reserved.");
      return;
    }

    if (listing?.status === "sold") {
      alert("This book has already been sold.");
      return;
    }

    try {
      setCheckoutLoading(true);

      // 1. Create Razorpay order on backend
      const orderRes = await api.post("/payments/create-order", {
        listingId,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      });

      if (!orderRes.data.success) {
        alert(orderRes.data.message || "Failed to initiate transaction.");
        setCheckoutLoading(false);
        return;
      }

      const { razorpayOrder, razorpayKeyId, paymentBreakdown } = orderRes.data;

      // 2. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert("Failed to load Razorpay Payment Gateway. Check your internet connection.");
        setCheckoutLoading(false);
        return;
      }

      // 3. Configure Razorpay checkout popup options
      const options = {
        key: razorpayKeyId || "rzp_test_mockkeyid",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "PustakMart",
        description: `Buying "${listing.title}"`,
        image: "https://ik.imagekit.io/cuq3fe9wm/PustakMart/logo.jpg",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            setCheckoutLoading(true);
            // 4. Verify signature on backend
            const verifyRes = await api.post("/payments/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setPaymentData(verifyRes.data.data.payment);
              setPaymentSuccess(true);
            } else {
              alert(verifyRes.data.message || "Payment verification failed.");
            }
          } catch (err) {
            console.error(err);
            alert("Error during payment verification: " + (err.response?.data?.message || err.message));
          } finally {
            setCheckoutLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.mobileNumber || "",
        },
        notes: {
          listing_id: listingId,
        },
        theme: {
          color: "#F4B400",
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(false);
            console.log("Payment popup closed by user.");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "An error occurred during order generation.");
      setCheckoutLoading(false);
    }
  };

  // Success view
  if (paymentSuccess && paymentData) {
    return (
      <div className="checkout-main-container page-padding">
        <SEO title="Order Success | PustakMart" description="Your purchase is successfully completed and reserved." />
        <div className="checkout-content-card success-card animate-scale-up" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center", padding: "40px 32px" }}>
          <div className="success-icon-badge" style={{ fontSize: "56px", color: "var(--color-success)", marginBottom: "16px" }}>
            <i className="ri-checkbox-circle-fill"></i>
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", marginBottom: "8px", fontWeight: "700" }}>Order Placed!</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "15px", marginBottom: "28px" }}>
            Payment verified. The textbook <strong>"{listing?.title}"</strong> is now reserved for you.
          </p>

          <div className="receipt-box" style={{ background: "var(--color-bg-surface-2)", borderRadius: "12px", padding: "20px", textAlign: "left", marginBottom: "32px", border: "1px solid var(--color-border-subtle)" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Transaction Invoice</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
              <span>Transaction ID:</span>
              <strong style={{ fontFamily: "var(--font-mono)" }}>{(paymentData.razorpayPaymentId || paymentData._id)?.substring(0, 16)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
              <span>Book Price:</span>
              <span>₹{paymentData.bookPrice}</span>
            </div>
            {paymentData.couponDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "var(--color-success)" }}>
                <span>Coupon Discount:</span>
                <span>-₹{paymentData.couponDiscount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
              <span>Marketplace Platform Fee:</span>
              <span>₹{paymentData.marketplaceFee}</span>
            </div>
            <hr style={{ border: "0", borderTop: "1px solid var(--color-border-default)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "700" }}>
              <span>Total Paid:</span>
              <span style={{ color: "var(--color-text-primary)" }}>₹{paymentData.totalAmount}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button className="btn btn-outline" style={{ height: "44px", borderRadius: "12px", padding: "0 24px" }} onClick={() => navigate("/")}>
              Back to Home
            </button>
            <button className="btn btn-brand" style={{ height: "44px", borderRadius: "12px", padding: "0 24px" }} onClick={() => navigate("/dashboard?mode=user&tab=messages")}>
              Chat with Seller
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error view
  if (error) {
    return (
      <div className="checkout-main-container page-padding">
        <SEO title="Checkout Error | PustakMart" />
        <div className="checkout-content-card error-card animate-scale-up" style={{ maxWidth: "480px", margin: "60px auto", textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: "48px", color: "var(--color-error)", marginBottom: "12px" }}>
            <i className="ri-error-warning-line"></i>
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Unable to Checkout</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "24px" }}>{error}</p>
          <button className="btn btn-brand" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Loading skeleton state
  if (loading || !listing) {
    return (
      <div className="checkout-main-container page-padding" style={{ maxWidth: "1000px", margin: "40px auto" }}>
        <SEO title="Securing Checkout... | PustakMart" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          <div className="skeleton-box" style={{ height: "300px", borderRadius: "16px", background: "var(--color-bg-surface-2)", animation: "pulse 1.5s infinite" }}></div>
        </div>
      </div>
    );
  }

  const isSellerOwnListing = seller?._id === user?.id || seller?._id === user?._id;
  const isListingNotActive = listing?.status !== "active";

  return (
    <div className="checkout-main-container page-padding" style={{ maxWidth: "1050px", margin: "0 auto", padding: "40px 16px" }}>
      <SEO title={`Checkout - Buy ${listing.title} | PustakMart`} description={`Checkout order summary page for purchasing textbook listing: ${listing.title}`} />
      
      <div style={{ marginBottom: "24px" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)", cursor: "pointer", fontWeight: "500", fontSize: "14px" }}>
          <i className="ri-arrow-left-line"></i> Back to Listing
        </button>
      </div>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "32px", fontWeight: "800", marginBottom: "32px", letterSpacing: "-0.5px" }}>Secure Checkout</h1>

      <div className="checkout-grid-layout" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        {/* Left Side: Summary Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* SECTION 1: Product Information */}
          <div className="checkout-card" style={{ background: "var(--color-bg-surface)", borderRadius: "16px", border: "1px solid var(--color-border-default)", padding: "24px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <div className="checkout-img-container" style={{ width: "120px", height: "160px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border-subtle)", backgroundColor: "var(--color-bg-surface-2)" }}>
              <img 
                src={listing.images?.[0] || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300"} 
                alt={listing.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span className={`badge badge-${listing.condition === "new" || listing.condition === "like_new" ? "success" : "warning"}`} style={{ fontSize: "11px", textTransform: "capitalize", padding: "2px 8px", borderRadius: "20px" }}>
                  {listing.condition?.replace("_", " ")}
                </span>
                {listing.listingType === "bundle" && (
                  <span className="badge badge-brand" style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "20px", backgroundColor: "var(--color-brand-light)", color: "var(--color-brand-text)" }}>
                    Bundle
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "var(--color-text-primary)" }}>{listing.title}</h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginBottom: "16px", lineHeight: "1.4" }}>
                {listing.description || "No short description supplied."}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                <div>Category: <strong style={{ color: "var(--color-text-primary)", textTransform: "capitalize" }}>{listing.category?.replace("_", " ")}</strong></div>
                {listing.department && <div>Dept: <strong style={{ color: "var(--color-text-primary)" }}>{listing.department}</strong></div>}
                {listing.semester && <div>Semester: <strong style={{ color: "var(--color-text-primary)" }}>{listing.semester}</strong></div>}
              </div>

              {listing.listingType === "bundle" && listing.books && listing.books.length > 0 && (
                <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--color-bg-surface-2)", borderRadius: "12px", border: "1px solid var(--color-border-subtle)" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>Contains Bundle books:</h4>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {listing.books.map((b, i) => (
                      <li key={i}>
                        <strong>{b.title}</strong> {b.author ? `by ${b.author}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Seller Information */}
          <div className="checkout-card" style={{ background: "var(--color-bg-surface)", borderRadius: "16px", border: "1px solid var(--color-border-default)", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Seller Credentials</h3>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", border: "1px solid var(--color-border-subtle)" }}>
                <img 
                  src={seller.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
                  alt={seller.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-text-primary)" }}>{seller.name}</h4>
                  {seller.sellerStatus === "verified" && (
                    <span title="Verified Student" style={{ color: "var(--color-info)", display: "inline-flex", fontSize: "16px" }}>
                      <i className="ri-checkbox-circle-fill"></i>
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "2px 0 4px 0" }}>
                  {seller.collegeName || "SVNIT Partner"} · {seller.department || "General Department"}
                </p>
                <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                  <span><i className="ri-star-fill" style={{ color: "var(--color-brand)" }}></i> {seller.averageRating || "N/A"} ({seller.totalReviews || 0} reviews)</span>
                  <span><i className="ri-book-read-line"></i> {seller.booksSold || 0} sold</span>
                </div>
              </div>
              <div>
                <Link to={`/dashboard?mode=user&tab=messages`} className="btn btn-outline btn-sm" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  View Seller Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary & Coupon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Coupon Code Section */}
          <div className="checkout-card" style={{ background: "var(--color-bg-surface)", borderRadius: "16px", border: "1px solid var(--color-border-default)", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--color-text-primary)" }}>Apply Coupon Code</h3>
            
            {appliedCoupon ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--color-success-bg)", borderRadius: "12px", border: "1px solid var(--color-success)" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-success-text)" }}>{appliedCoupon.code} Applied</div>
                  <div style={{ fontSize: "12px", color: "var(--color-success-text)" }}>{couponMessage}</div>
                </div>
                <button onClick={handleRemoveCoupon} style={{ background: "none", border: "none", color: "var(--color-error-text)", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "12px" }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. DISCOUNT20"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    if (couponStatus !== "empty") {
                      setCouponStatus("empty");
                      setCouponMessage("");
                    }
                  }}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--color-border-medium)" }}
                />
                <button 
                  type="submit" 
                  className="btn btn-outline" 
                  disabled={!couponCode.trim() || couponStatus === "loading"}
                  style={{ padding: "0 16px", borderRadius: "8px", minWidth: "80px" }}
                >
                  {couponStatus === "loading" ? "Applying..." : "Apply"}
                </button>
              </form>
            )}

            {couponStatus === "invalid" && (
              <div style={{ marginTop: "8px", color: "var(--color-error-text)", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                <i className="ri-error-warning-fill"></i> {couponMessage}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="checkout-card" style={{ background: "var(--color-bg-surface)", borderRadius: "16px", border: "1px solid var(--color-border-default)", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px", color: "var(--color-text-primary)" }}>Price Breakdown</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Book Price:</span>
                <strong style={{ color: "var(--color-text-primary)" }}>₹{priceBreakdown.bookPrice}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Marketplace platform Fee:</span>
                <strong style={{ color: "var(--color-text-primary)" }}>₹{priceBreakdown.marketplaceFee}</strong>
              </div>
              {priceBreakdown.couponDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success)" }}>
                  <span>Coupon Discount:</span>
                  <strong>-₹{priceBreakdown.couponDiscount}</strong>
                </div>
              )}
            </div>

            <hr style={{ border: "0", borderTop: "1px solid var(--color-border-default)", marginBottom: "20px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800", marginBottom: "28px" }}>
              <span>Total Amount:</span>
              <span style={{ color: "var(--color-text-primary)" }}>₹{priceBreakdown.totalAmount}</span>
            </div>

            {isSellerOwnListing ? (
              <div style={{ background: "var(--color-error-bg)", color: "var(--color-error-text)", padding: "12px", borderRadius: "12px", fontSize: "13px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="ri-error-warning-fill"></i> You already own this listing. Buy Now is disabled.
              </div>
            ) : isListingNotActive ? (
              <div style={{ background: "var(--color-error-bg)", color: "var(--color-error-text)", padding: "12px", borderRadius: "12px", fontSize: "13px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="ri-error-warning-fill"></i> This book is currently {listing?.status}. Checkout is disabled.
              </div>
            ) : null}

            <button 
              className="btn btn-brand" 
              onClick={handleBuyNow} 
              disabled={isSellerOwnListing || isListingNotActive || checkoutLoading}
              style={{ width: "100%", height: "48px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {checkoutLoading ? (
                <>
                  <span className="loading-spinner-xs"></span> Securely Processing...
                </>
              ) : (
                <>
                  <i className="ri-shield-check-line"></i> Buy Now
                </>
              )}
            </button>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "11px", textAlign: "center", marginTop: "12px", lineHeight: "1.4" }}>
              Payments are secured with Razorpay SSL encryption. Placing this order reserves the listing. You will coordinate the handoff in Chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
