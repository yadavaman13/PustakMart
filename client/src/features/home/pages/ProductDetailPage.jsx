import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProductDetails } from "../hooks/useProductDetails.js";
import useAuth from "../../auth/hooks/useAuth.js";
import SEO from "../../shared/components/SEO.jsx";
import logoImg from "../../../assets/logo.jpg";

export default function ProductDetailPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
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
  } = useProductDetails();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (listingId) {
      fetchDetails(listingId);
    }
  }, [listingId, fetchDetails]);

  if (loading) {
    return (
      <div className="auth-loader">
        <div className="spinner"></div>
        <p>Loading book details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="pustakmart-home-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header className="home-header">
          <div className="header-left">
            <Link to="/" className="brand-logo-wrapper">
              <img src={logoImg} alt="PustakMart Logo" className="logo-icon-img" />
              <span className="brand-name">PustakMart</span>
            </Link>
          </div>
          <nav className="header-center-nav">
            <Link to="/">Home</Link>
            <Link to="/marketplace">Marketplace</Link>
          </nav>
        </header>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <i className="ri-error-warning-line" style={{ fontSize: "3.5rem", color: "var(--color-error)", marginBottom: "16px" }}></i>
          <h2>Unable to load product</h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>{error || "Listing not found."}</p>
          <button className="btn-buy" style={{ width: "auto", padding: "10px 24px" }} onClick={() => navigate("/marketplace")}>
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const sellerInfo = listing.seller || {};
  const images = listing.images?.length > 0 ? listing.images : ["https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500"];
  const currentUserId = user?.id || user?._id;
  const isOwnListing = sellerInfo._id && currentUserId && sellerInfo._id.toString() === currentUserId.toString();

  const handleChatClick = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const res = await initiateChat();
    if (res?.success) {
      navigate("/dashboard?mode=user&tab=messages");
    } else if (res?.error) {
      alert(res.error);
    }
  };

  const handleWishlistClick = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const res = await toggleWishlist();
    if (res?.error) {
      alert(res.error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const rounded = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={i <= rounded ? "ri-star-fill" : "ri-star-line"}
          style={{ color: "var(--color-brand)", marginRight: "2px" }}
        ></i>
      );
    }
    return stars;
  };

  return (
    <div className="pustakmart-home-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SEO
        title={`${listing.title} | Buy Used Textbooks`}
        description={listing.description || `Buy second-hand textbook ${listing.title} directly on campus at PustakMart.`}
      />

      {/* Header */}
      <header className="home-header">
        <div className="header-left">
          <Link to="/" className="brand-logo-wrapper">
            <img src={logoImg} alt="PustakMart Logo" className="logo-icon-img" />
            <span className="brand-name">PustakMart</span>
          </Link>
        </div>

        <nav className="header-center-nav">
          <Link to="/">Home</Link>
          <Link to="/marketplace">Marketplace</Link>
          <a href="/#requests">Book Requests</a>
          <a href="/#become-seller">Become Seller</a>
          <a href="/#about">About</a>
        </nav>

        <div className="header-right">
          {user ? (
            <div className="user-menu-wrapper" style={{ position: "relative" }}>
              <div className="user-menu-trigger" onClick={() => setShowUserDropdown(!showUserDropdown)}>
                <img
                  src={user.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"}
                  alt="avatar"
                  className="user-avatar"
                />
                <i className="ri-arrow-down-s-line"></i>
              </div>
              {showUserDropdown && (
                <>
                  <div className="dropdown-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} onClick={() => setShowUserDropdown(false)} />
                  <div className="user-profile-dropdown-menu" style={{ position: "absolute", top: "45px", right: 0, zIndex: 101 }}>
                    <div className="dropdown-header-info">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-menu-item" onClick={() => { setShowUserDropdown(false); navigate("/dashboard"); }}>
                      <i className="ri-dashboard-3-line"></i>
                      <span>Dashboard</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-menu-item logout-item" onClick={() => { setShowUserDropdown(false); logout(); }}>
                      <i className="ri-logout-box-line"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button className="btn-login" onClick={() => navigate("/auth")}>Login</button>
              <button className="btn-signup" onClick={() => navigate("/auth?mode=register")}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="product-detail-container" style={{ flex: 1 }}>


        <div className="back-btn-wrapper">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <i className="ri-arrow-left-line"></i> Back to Catalog
          </button>
        </div>

        <div className="detail-grid">
          {/* Gallery Column */}
          <div className="gallery-column">
            <div className="main-image-frame">
              <img src={images[activeImageIdx]} alt={listing.title} />
              <span className={`condition-badge cond-${listing.condition || "good"}`}>
                {(listing.condition || "good").replace("_", " ")}
              </span>
              {listing.listingType === "bundle" && (
                <span className="type-badge">Bundle</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="thumbnails-row">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumb-btn ${idx === activeImageIdx ? "active" : ""}`}
                    onClick={() => setActiveImageIdx(idx)}
                  >
                    <img src={img} alt={`${listing.title} thumb ${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Column */}
          <div className="info-column">
            <div className="metadata-row">
              <span className="category-tag">{listing.category?.replace("_", " ")}</span>
              {listing.semester && <span className="sem-tag">Semester {listing.semester}</span>}
            </div>

            <h1 className="title">{listing.title}</h1>
            {listing.author && (
              <p className="author">
                By <span>{listing.author}</span>
              </p>
            )}

            <div className="price-section">
              <div className="price-wrapper">
                <div className="price-val">₹{listing.price}</div>
              </div>
              <div className="location-tag">
                <i className="ri-map-pin-2-fill"></i>
                <span>
                  {listing.collegeName || "SVNIT Campus"}
                  {listing.city ? `, ${listing.city}` : ""}
                </span>
              </div>
            </div>

            <div className="actions-bar">
              {listing.status === "sold" ? (
                <button className="btn-buy" disabled>
                  <i className="ri-checkbox-circle-line"></i> Sold Out
                </button>
              ) : listing.status === "reserved" ? (
                <button className="btn-buy" disabled>
                  <i className="ri-time-line"></i> Reserved
                </button>
              ) : isOwnListing ? (
                <button
                  className="btn-buy"
                  onClick={() => navigate("/dashboard?mode=seller&tab=listings")}
                >
                  Your Listing
                </button>
              ) : (
                <button
                  className="btn-buy"
                  onClick={() => navigate(user ? `/checkout/${listing._id}` : "/auth")}
                >
                  Buy Now <i className="ri-shopping-cart-2-line"></i>
                </button>
              )}

              {!isOwnListing && (
                <button
                  className="btn-chat"
                  onClick={handleChatClick}
                  disabled={chatLoading}
                >
                  {chatLoading ? "Loading..." : (
                    <>
                      <i className="ri-chat-smile-2-line"></i> Chat
                    </>
                  )}
                </button>
              )}

              <button
                className={`btn-wishlist ${wishlisted ? "active" : ""}`}
                onClick={handleWishlistClick}
                disabled={wishlistLoading}
                title={wishlisted ? "Remove from Saved" : "Save Listing"}
              >
                <i className={wishlisted ? "ri-heart-3-fill" : "ri-heart-3-line"}></i>
              </button>
            </div>

            <div className="description-section">
              <h3>Details</h3>
              <p>{listing.description || "No description provided by the seller."}</p>

              {listing.listingType === "bundle" && listing.books?.length > 0 && (
                <div className="bundle-list-box">
                  <h4>Included Books:</h4>
                  <ul>
                    {listing.books.map((b, idx) => (
                      <li key={idx}>
                        <strong>{b.title}</strong> {b.author ? `by ${b.author}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <hr className="details-bottom-divider" />

        {/* Seller / Review bottom wrapper */}
        <div className="seller-section-wrapper">
          <div className="seller-card">
            <div className="avatar-wrap">
              <img
                src={sellerInfo.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"}
                alt={sellerInfo.name}
              />
            </div>
            <div className="name-row">
              <h3>{sellerInfo.name || "Campus Student"}</h3>
              {sellerInfo.sellerStatus === "verified" && (
                <i className="ri-verified-badge-fill" title="Verified Student"></i>
              )}
            </div>
            <p className="college">{sellerInfo.collegeName || "SVNIT Partner"}</p>
            
            <div className="metrics-row">
              <div className="metric">
                <span className="val">
                  <i className="ri-star-fill"></i> {sellerInfo.averageRating || "N/A"}
                </span>
                <span className="lbl">Rating</span>
              </div>
              <div className="metric">
                <span className="val">{sellerInfo.totalReviews || 0}</span>
                <span className="lbl">Reviews</span>
              </div>
            </div>
          </div>

          {/* Seller reviews list */}
          <div className="reviews-section">
            <h3>Seller Feedbacks</h3>
            {reviews.length === 0 ? (
              <div className="no-reviews">
                <i className="ri-chat-history-line"></i>
                <h4>No feedback yet</h4>
                <p>Be the first buyer to review this seller after exchange!</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((rev) => (
                  <article key={rev._id} className="review-item">
                    <div className="review-header">
                      <div className="buyer-info">
                        <img
                          src={rev.buyer?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"}
                          alt={rev.buyer?.name}
                        />
                        <h4>{rev.buyer?.name || "Student"}</h4>
                      </div>
                      <div className="stars">
                        {renderStars(rev.rating)}
                      </div>
                    </div>
                    <p className="review-text">{rev.review || "No review content left."}</p>
                    <div className="review-meta">
                      Traded: {rev.listing?.title || "Book Listing"} · {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer-section" style={{ marginTop: "40px" }}>
        <div className="home-container-inner">
          <div className="footer-bottom-bar" style={{ borderTop: "none", paddingTop: 0 }}>
            <p>© {new Date().getFullYear()} PustakMart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
