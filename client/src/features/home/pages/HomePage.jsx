import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useHome } from "../hooks/useHome.js";
import useAuth from "../../auth/hooks/useAuth.js";
import SEO from "../../shared/components/SEO.jsx";
import logoImg from "../../../assets/logo.jpg";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { listings, loading, error, fetchListings } = useHome();

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Load listings on mount and on category change
  useEffect(() => {
    const params = {};
    if (selectedCategory !== "all") {
      params.category = selectedCategory;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }
    fetchListings(params);
  }, [selectedCategory, fetchListings]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (selectedCategory !== "all") {
      params.category = selectedCategory;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }
    fetchListings(params);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
  };

  // Pre-defined category definitions
  const categoriesList = [
    { key: "all", label: "All Books", icon: "ri-book-open-line" },
    { key: "engineering", label: "Engineering", icon: "ri-cpu-line" },
    { key: "novel", label: "Novels & Fiction", icon: "ri-quill-pen-line" },
    { key: "competitive_exam", label: "Competitive Exams", icon: "ri-award-line" },
    { key: "medical", label: "Medical Sciences", icon: "ri-heart-pulse-line" },
    { key: "school", label: "School Books", icon: "ri-bookmark-line" },
    { key: "other", label: "Other Resources", icon: "ri-more-fill" },
  ];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PustakMart",
    "url": "https://pustakmart.com",
    "logo": "https://ik.imagekit.io/cuq3fe9wm/PustakMart/logo.jpg",
    "sameAs": [
      "https://www.linkedin.com/company/pustakmart",
      "https://github.com/yadavaman13/PustakMart"
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pustakmart.com/"
      }
    ]
  };

  return (
    <div className="pustakmart-home-container">
      <SEO 
        title="Direct Campus Book Exchange" 
        description="Buy, sell, and request academic textbooks directly from peers on your campus. Save up to 70% with zero commission fees and zero shipping delays."
        keywords="pustakmart, buy used books, sell textbooks, college book marketplace, engineering used books, medical books exchange"
        schema={[orgSchema, breadcrumbSchema]}
      />
      
      {/* 1. HEADER NAVIGATION BAR */}
      <header className="home-header">
        <div className="header-left">
          <div className="brand-logo-wrapper" onClick={() => navigate("/")}>
            <img src={logoImg} alt="PustakMart Logo" className="header-logo" />
            <div className="brand-name-block">
              <h1>PustakMart</h1>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <form className="header-search-form" onSubmit={handleSearchSubmit}>
          <i className="ri-search-line search-icon"></i>
          <input
            type="text"
            placeholder="Search by book title, author, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <i className="ri-close-line"></i>
            </button>
          )}
          <button type="submit" className="search-submit-btn">Search</button>
        </form>

        {/* Header Right Actions */}
        <div className="header-right-actions">
          {user ? (
            <div className="user-profile-dropdown-wrapper">
              <div 
                className="user-profile-trigger"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <img 
                  src={user.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} 
                  alt="User avatar" 
                  className="user-avatar"
                />
                <span className="user-name-label">{user.name.split(" ")[0]}</span>
                <i className={`ri-arrow-down-s-line arrow-icon ${showUserDropdown ? "rotated" : ""}`}></i>
              </div>

              {showUserDropdown && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowUserDropdown(false)}></div>
                  <div className="user-profile-dropdown-menu">
                    <div className="dropdown-header-info">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                      <span className="role-badge">{user.role.toUpperCase()}</span>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button 
                      className="dropdown-menu-item"
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigate("/dashboard");
                      }}
                    >
                      <i className="ri-dashboard-3-line"></i>
                      <span>My Dashboard</span>
                    </button>

                    {user.role === "admin" && (
                      <button 
                        className="dropdown-menu-item admin-highlight"
                        onClick={() => {
                          setShowUserDropdown(false);
                          navigate("/admin");
                        }}
                      >
                        <i className="ri-shield-user-line"></i>
                        <span>Admin Control Panel</span>
                      </button>
                    )}

                    <div className="dropdown-divider"></div>

                    <button 
                      className="dropdown-menu-item logout-item"
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                    >
                      <i className="ri-logout-box-line"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="auth-buttons-group">
              <button className="btn-auth-signin" onClick={() => navigate("/auth")}>
                Sign In
              </button>
              <button className="btn-auth-register" onClick={() => navigate("/auth?mode=register")}>
                Join as Student
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. HERO SLIDER BANNER */}
      <section className="home-hero-section">
        <div className="hero-banner-card">
          {/* Animated floating books in background */}
          <div className="floating-book book-1">
            <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150" alt="Moving Book 1" loading="lazy" width="150" height="200" />
          </div>
          <div className="floating-book book-2">
            <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150" alt="Moving Book 2" loading="lazy" width="150" height="200" />
          </div>
          <div className="floating-book book-3">
            <img src="https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=150" alt="Moving Book 3" loading="lazy" width="150" height="200" />
          </div>
          <div className="floating-book book-4">
            <img src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=150" alt="Moving Book 4" loading="lazy" width="150" height="200" />
          </div>

          <div className="hero-content">
            <span className="hero-tag">Direct Campus Book Exchange</span>
            <h2>Smart Bookstore for Smart Students</h2>
            <p className="hero-subtitle">
              Buy, sell, and request academic textbooks directly from peers on your campus. Save up to 70% with zero commission fees and zero shipping delays.
            </p>
            <div className="hero-ctas">
              <a href="#listings-browse" className="btn-hero-primary">
                Browse Campus Listings
                <i className="ri-arrow-right-line"></i>
              </a>
              {!user && (
                <button className="btn-hero-secondary" onClick={() => navigate("/auth?mode=register")}>
                  Start Selling Now
                </button>
              )}
            </div>
          </div>
          <div className="hero-graphic-block">
            <div className="hero-book-showcase">
              <img 
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60" 
                alt="Featured Book Cover Mockup" 
                className="showcase-cover"
                loading="eager"
                width="340"
                height="420"
              />
              <div className="showcase-badge">
                <i className="ri-verified-badge-fill text-gold"></i>
                <div>
                  <h4>100% Student Verified</h4>
                  <p>Trustworthy Campus Handover</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CATEGORIES NAVIGATION SLIDER */}
      <section className="home-categories-section">
        <div className="section-header">
          <h3>Popular Categories</h3>
          <p>Filter books by study stream or interest areas</p>
        </div>

        <div className="categories-pills-slider">
          {categoriesList.map((cat) => (
            <Link
              key={cat.key}
              to={cat.key === "all" ? "/" : `/category/${cat.key}`}
              className={`category-pill-btn ${selectedCategory === cat.key ? "active" : ""}`}
              onClick={(e) => {
                if (cat.key === "all") {
                  e.preventDefault();
                  setSelectedCategory("all");
                }
              }}
              style={{ textDecoration: "none" }}
            >
              <i className={cat.icon}></i>
              <span>{cat.label}</span>
            </Link>
          ))}

        </div>
      </section>

      {/* 4. ACTIVE LISTINGS GRID */}
      <section id="listings-browse" className="home-listings-section">
        <div className="section-header-split">
          <div>
            <h3>Active Student Listings</h3>
            <p>Real academic books currently available for exchange across college campuses</p>
          </div>
          {(selectedCategory !== "all" || searchQuery) && (
            <button className="btn-reset-filters" onClick={handleResetFilters}>
              <i className="ri-refresh-line"></i>
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        {error && <div className="home-error-alert">{error}</div>}

        {loading ? (
          <div className="home-loading-block">
            <div className="home-spinner"></div>
            <p>Loading catalog items...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="home-empty-block">
            <i className="ri-book-3-line"></i>
            <h4>No Book Listings Available</h4>
            <p>There are no listings matching the selected category or search keyword. Try clearing filters or searching for something else.</p>
            <button className="btn-empty-reset" onClick={handleResetFilters}>View All Listings</button>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((book) => {
              // Product structured data (JSON-LD) for each book listing
              const productSchema = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": book.title,
                "description": `Buy second-hand textbook ${book.title} by ${book.author || "Unknown Author"} in ${book.condition || "good"} condition on PustakMart. Traded directly by student ${book.seller?.name || "peer"} on campus.`,
                "image": book.images?.[0] || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300",
                "offers": {
                  "@type": "Offer",
                  "price": book.price,
                  "priceCurrency": "INR",
                  "availability": "https://schema.org/InStock",
                  "itemCondition": book.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
                }
              };

              return (
                <article key={book._id} className="book-card-item">
                  {/* Structured product schema dynamically generated */}
                  <script type="application/ld+json">
                    {JSON.stringify(productSchema)}
                  </script>

                  <div className="book-cover-frame">
                    <img
                      src={book.images?.[0] || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300"}
                      alt={`${book.title} second hand textbook by ${book.author || "student"}`}
                      loading="lazy"
                      width="260"
                      height="200"
                      className="book-image"
                    />
                    <span className={`condition-tag cond-${book.condition || "good"}`}>
                      {(book.condition || "good").replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <div className="book-card-details" style={{ display: "flex", flexDirection: "column", height: "calc(100% - 200px)" }}>
                    <div className="book-meta-top">
                      <Link to={`/category/${book.category}`} className="book-category-label" style={{ textDecoration: "none" }}>{book.category}</Link>
                      {book.semester && <span className="book-sem-label">Sem {book.semester}</span>}
                    </div>

                    <h4 className="book-title">{book.title}</h4>
                    <p className="book-author">By {book.author || "Unknown Author"}</p>

                    <div className="rating-box">
                      <div className="stars">
                        <i className="ri-star-fill"></i>
                        <i className="ri-star-fill"></i>
                        <i className="ri-star-fill"></i>
                        <i className="ri-star-fill"></i>
                        <i className="ri-star-half-fill"></i>
                      </div>
                      <span>4.5</span>
                    </div>

                    <div className="seller-meta-strip" style={{ marginTop: "auto" }}>
                      <img
                        src={book.seller?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"}
                        alt={`${book.seller?.name || "Seller"} student profile avatar`}
                        loading="lazy"
                        width="24"
                        height="24"
                        className="seller-tiny-avatar"
                      />
                      <div className="seller-tiny-info">
                        <h5>{book.seller?.name || "College Student"}</h5>
                        <p>{book.collegeName || "Verified College"}</p>
                      </div>
                      {book.seller?.sellerStatus === "verified" && (
                        <i className="ri-verified-badge-fill verified-badge-icon" title="Verified Seller"></i>
                      )}
                    </div>

                    {/* Social Growth Sharing Strip */}
                    <div className="book-share-strip" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Share:</span>
                      <a 
                        href={`https://api.whatsapp.com/send?text=Check%20out%20this%20used%20textbook%20%22${encodeURIComponent(book.title)}%22%20on%20PustakMart!%20https://pustakmart.com/`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Share on WhatsApp"
                        style={{ color: "#25D366", fontSize: "0.95rem" }}
                      >
                        <i className="ri-whatsapp-line"></i>
                      </a>
                      <a 
                        href={`https://twitter.com/intent/tweet?text=Check%20out%20this%20used%20textbook%20%22${encodeURIComponent(book.title)}%22%20on%20PustakMart!&url=https://pustakmart.com/`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Share on X"
                        style={{ color: "#000000", fontSize: "0.95rem" }}
                      >
                        <i className="ri-twitter-x-line"></i>
                      </a>
                      <a 
                        href={`https://www.facebook.com/sharer/sharer.php?u=https://pustakmart.com/`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Share on Facebook"
                        style={{ color: "#1877F2", fontSize: "0.95rem" }}
                      >
                        <i className="ri-facebook-box-line"></i>
                      </a>
                      <a 
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=https://pustakmart.com/`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Share on LinkedIn"
                        style={{ color: "#0A66C2", fontSize: "0.95rem" }}
                      >
                        <i className="ri-linkedin-box-line"></i>
                      </a>
                    </div>

                    <div className="book-card-footer" style={{ marginTop: "12px", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px" }}>
                      <div className="price-tag-block">
                        <span className="price-val">₹{book.price}</span>
                        {book.price > 300 && <span className="old-price">₹{Math.floor(book.price * 1.8)}</span>}
                      </div>
                      
                      <button 
                        className="btn-card-buy"
                        onClick={() => {
                          if (!user) {
                            navigate("/auth");
                          } else {
                            // Redirect to chat/exchange flow
                            navigate("/dashboard");
                          }
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

          </div>
        )}
      </section>

      {/* 5. BENEFITS BANNER SECTION */}
      <section className="home-benefits-banner">
        <div className="benefits-banner-card">
          <div className="banner-visual">
            <img 
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=60" 
              alt="Promo stack" 
              className="banner-stack-image"
            />
          </div>
          <div className="banner-content">
            <h3>Enjoy Up to 70% Off Bestsellers & Tech Textbooks</h3>
            <p>
              Why buy brand new reference books when you can get them in clean, verified condition from seniors right next door in the hostel? Save money and contribute to a sustainable environment.
            </p>
            <div className="benefits-checks">
              <div className="check-item">
                <i className="ri-checkbox-circle-fill"></i>
                <span>Direct on-campus exchange</span>
              </div>
              <div className="check-item">
                <i className="ri-checkbox-circle-fill"></i>
                <span>Zero commission / listing fees</span>
              </div>
              <div className="check-item">
                <i className="ri-checkbox-circle-fill"></i>
                <span>Cryptographically secure payments</span>
              </div>
            </div>
            <a href="#listings-browse" className="btn-banner-action">Explore Academic Catalog</a>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS SECTION */}
      <section className="home-how-it-works">
        <div className="section-header text-center">
          <h3>How PustakMart Works</h3>
          <p>Exchange books in three simple steps</p>
        </div>

        <div className="how-it-works-grid">
          <div className="step-card">
            <div className="step-icon-wrapper bg-gold-light">
              <i className="ri-search-eye-line text-gold"></i>
            </div>
            <h4>1. Find Your Books</h4>
            <p>Search by textbook titles, branch, or semester filters. Locate items listed by peers on campus.</p>
          </div>

          <div className="step-card">
            <div className="step-icon-wrapper bg-green-light">
              <i className="ri-chat-smile-line text-green"></i>
            </div>
            <h4>2. Chat & Reserve</h4>
            <p>Initiate direct in-app chat with student sellers. Align on price, meet location, and verify the book state.</p>
          </div>

          <div className="step-card">
            <div className="step-icon-wrapper bg-blue-light">
              <i className="ri-handshake-line text-blue"></i>
            </div>
            <h4>3. Handover on Campus</h4>
            <p>Meet on campus (Library, Hostels, Canteen) to verify and receive your book, with secure digital receipt updates.</p>
          </div>
        </div>
      </section>

      {/* 7. NEWSLETTER & FOOTER */}
      <footer className="home-footer">
        <div className="footer-top">
          <div className="footer-info-block">
            <div className="footer-logo">
              <img src={logoImg} alt="Logo" />
              <h2>PustakMart</h2>
            </div>
            <p>
              Your official student-to-student textbook trading platform. Empowering local commerce, peer support, and academic resource circularity across colleges.
            </p>
            <div className="social-links">
              <a href="#github"><i className="ri-github-fill"></i></a>
              <a href="#twitter"><i className="ri-twitter-fill"></i></a>
              <a href="#linkedin"><i className="ri-linkedin-box-fill"></i></a>
            </div>
          </div>

          <div className="footer-links-group">
            <h4>Quick Links</h4>
            <a href="#listings-browse" onClick={() => setSelectedCategory("all")}>Browse Catalog</a>
            <Link to="/category/engineering">Engineering Books</Link>
            <Link to="/category/novel">Fiction Library</Link>
          </div>

          <div className="footer-links-group">
            <h4>Support Portal</h4>
            <button className="link-btn" onClick={() => navigate("/auth")}>Login to Portal</button>
            <button className="link-btn" onClick={() => navigate("/auth?mode=register")}>Student Signup</button>
            <a href="#help">Help Center & Trust</a>
          </div>

          <div className="footer-links-group contact-info">
            <h4>Campus Hub</h4>
            <p><i className="ri-map-pin-line"></i> Available across all major engineering, medical, and science universities globally</p>
            <p><i className="ri-mail-line"></i> support@pustakmart.com</p>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PustakMart. Built for College Students. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
}
