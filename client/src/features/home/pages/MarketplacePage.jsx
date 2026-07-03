import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useHome } from "../hooks/useHome.js";
import useAuth from "../../auth/hooks/useAuth.js";
import SEO from "../../shared/components/SEO.jsx";
import logoImg from "../../../assets/logo.jpg";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "engineering", label: "Engineering" },
  { value: "novel", label: "Novels & Fiction" },
  { value: "competitive_exam", label: "Competitive Exams" },
  { value: "medical", label: "Medical Sciences" },
  { value: "school", label: "School & K-12" },
  { value: "other", label: "Other / General" },
];

const CONDITIONS = [
  { value: "", label: "Any Condition" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const TYPES = [
  { value: "", label: "All Types" },
  { value: "book", label: "Single Book" },
  { value: "bundle", label: "Semester Bundle" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "views", label: "Most Popular / Viewed" },
];

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParamsState] = useSearchParams();
  const { user, logout } = useAuth();
  const { listings, total, loading, error, fetchListings } = useHome();

  // Read initial states from Search Params
  const querySearch = searchParams.get("search") || "";
  const queryCategory = searchParams.get("category") || "";
  const queryCondition = searchParams.get("condition") || "";
  const queryType = searchParams.get("listingType") || "";
  const querySort = searchParams.get("sortBy") || "newest";
  const queryPage = parseInt(searchParams.get("page") || "1");

  // State
  const [searchInput, setSearchInput] = useState(querySearch);
  const [category, setCategory] = useState(queryCategory);
  const [condition, setCondition] = useState(queryCondition);
  const [listingType, setListingType] = useState(queryType);
  const [sortBy, setSortBy] = useState(querySort);
  const [page, setPage] = useState(queryPage);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const limit = 12;

  // Sync state with URL change (e.g. back/forward navigation)
  useEffect(() => {
    setSearchInput(querySearch);
    setCategory(queryCategory);
    setCondition(queryCondition);
    setListingType(queryType);
    setSortBy(querySort);
    setPage(queryPage);
  }, [querySearch, queryCategory, queryCondition, queryType, querySort, queryPage]);

  // Fetch listings when query states change
  useEffect(() => {
    const params = {
      page,
      limit,
      sortBy,
      status: "active"
    };
    if (querySearch) params.search = querySearch;
    if (category) params.category = category;
    if (condition) params.condition = condition;
    if (listingType) params.listingType = listingType;

    fetchListings(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [querySearch, category, condition, listingType, sortBy, page, fetchListings]);

  // Update Search Params helper
  const updateUrlParams = (updates) => {
    const current = {};
    searchParams.forEach((val, key) => {
      current[key] = val;
    });
    const next = { ...current, ...updates };
    
    // Cleanup empty keys
    Object.keys(next).forEach((key) => {
      if (!next[key] || next[key] === "1" && key === "page" || next[key] === "newest" && key === "sortBy") {
        delete next[key];
      }
    });

    setSearchParamsState(next);
  };

  // Handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: "1" });
  };

  const handleFilterChange = (field, value) => {
    if (field === "category") {
      setCategory(value);
      updateUrlParams({ category: value, page: "1" });
    } else if (field === "condition") {
      setCondition(value);
      updateUrlParams({ condition: value, page: "1" });
    } else if (field === "listingType") {
      setListingType(value);
      updateUrlParams({ listingType: value, page: "1" });
    } else if (field === "sortBy") {
      setSortBy(value);
      updateUrlParams({ sortBy: value, page: "1" });
    }
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setCategory("");
    setCondition("");
    setListingType("");
    setSortBy("newest");
    setPage(1);
    setSearchParamsState({});
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    updateUrlParams({ page: newPage.toString() });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Generate pagination buttons
  const renderPaginationRange = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${page === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="pustakmart-home-container marketplace-page-wrapper">
      <SEO
        title="Explore Second-Hand Textbooks Marketplace | PustakMart"
        description="Search and browse verified college listings of used textbooks, reference books, and semester bundles. Trade directly on campus at PustakMart."
      />

      {/* HEADER */}
      <header className="home-header">
        <div className="header-left">
          <Link to="/" className="brand-logo-wrapper">
            <img src={logoImg} alt="PustakMart Logo" className="logo-icon-img" />
            <span className="brand-name">PustakMart</span>
          </Link>
        </div>

        <nav className="header-center-nav">
          <Link to="/">Home</Link>
          <Link to="/marketplace" className="active-nav-link">Marketplace</Link>
          <a href="/#requests">Book Requests</a>
          <a href="/#become-seller">Become Seller</a>
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
                  <div className="user-dropdown-menu" style={{ position: "absolute", top: "100%", right: 0, zIndex: 101 }}>
                    <div className="dropdown-user-info">
                      <p className="user-name">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-menu-item" onClick={() => { setShowUserDropdown(false); navigate("/dashboard"); }}>
                      <i className="ri-dashboard-line"></i>
                      <span>Dashboard</span>
                    </button>
                    <button className="dropdown-menu-item logout-item" onClick={() => { setShowUserDropdown(false); logout(); }}>
                      <i className="ri-logout-box-line"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button className="btn-login-header" onClick={() => navigate("/auth")}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* BREADCRUMB */}
      <nav className="breadcrumb-nav-strip">
        <Link to="/">Home</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Marketplace</span>
      </nav>

      {/* HERO / HEADER SECTION */}
      <section className="marketplace-hero">
        <div className="home-container-inner">
          <h1>Browse The Campus Bookstore</h1>
          <p>Find study manuals, core books, and bundles listed by fellow students directly on your campus.</p>
        </div>
      </section>

      {/* MAIN CONTENT AREA (GRID + SIDEBAR FILTERS) */}
      <main className="marketplace-main home-container-inner">
        <div className="marketplace-layout-grid">
          
          {/* SIDEBAR FILTERS */}
          <aside className="filters-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <h3>Filters</h3>
                {(querySearch || category || condition || listingType || sortBy !== "newest") && (
                  <button className="btn-clear-all" onClick={handleClearFilters}>
                    Clear All
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <form onSubmit={handleSearchSubmit} className="filter-group search-filter-box">
                <label htmlFor="search-input">Search Keywords</label>
                <div className="search-input-wrapper">
                  <i className="ri-search-line search-icon"></i>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Title, author..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && (
                    <button type="button" className="clear-search-btn" onClick={() => { setSearchInput(""); updateUrlParams({ search: "", page: "1" }); }}>
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>
              </form>

              {/* Category */}
              <div className="filter-group">
                <label htmlFor="category-select">Category</label>
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Listing Type */}
              <div className="filter-group">
                <label htmlFor="type-select">Format</label>
                <select
                  id="type-select"
                  value={listingType}
                  onChange={(e) => handleFilterChange("listingType", e.target.value)}
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div className="filter-group">
                <label htmlFor="condition-select">Book Condition</label>
                <select
                  id="condition-select"
                  value={condition}
                  onChange={(e) => handleFilterChange("condition", e.target.value)}
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting */}
              <div className="filter-group">
                <label htmlFor="sort-select">Sort By</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* LISTINGS DISPLAY GRID */}
          <section className="listings-display-section">
            <div className="listings-stats-header">
              <p className="results-count">
                Showing <strong>{listings.length}</strong> of <strong>{total}</strong> active listings
              </p>
            </div>

            {error && <div className="home-error-alert">{error}</div>}

            {loading ? (
              <div className="home-loading-block">
                <div className="home-spinner"></div>
                <p>Loading marketplace listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="home-empty-block">
                <i className="ri-book-3-line" style={{ fontSize: "3rem", color: "var(--color-text-tertiary)" }}></i>
                <h4>No Listings Found</h4>
                <p>Try refining your search queries or listing a book yourself!</p>
                <button className="btn btn-brand btn-empty-reset" onClick={handleClearFilters}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="listings-grid">
                  {listings.map((book) => (
                    <article key={book._id} className="book-card-item">
                      <div className="book-cover-frame">
                        <img
                          src={book.images?.[0] || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300"}
                          alt={`${book.title} book by ${book.author || "student"}`}
                          loading="lazy"
                          className="book-image"
                        />
                        <span className={`condition-tag cond-${book.condition || "good"}`}>
                          {(book.condition || "good").replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="book-card-details">
                        <div className="book-meta-top">
                          <span className="book-category-label">
                            {CATEGORIES.find((c) => c.value === book.category)?.label || book.category}
                          </span>
                          {book.semester && <span className="book-sem-label">Sem {book.semester}</span>}
                        </div>

                        <h4 className="book-title" title={book.title}>{book.title}</h4>
                        <p className="book-author">By {book.author || "Unknown Author"}</p>

                        <div className="seller-meta-strip">
                          <img
                            src={book.seller?.ProfilePicture || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"}
                            alt={`${book.seller?.name || "Student"} avatar`}
                            loading="lazy"
                            width="24"
                            height="24"
                            className="seller-tiny-avatar"
                          />
                          <div className="seller-tiny-info">
                            <h5>{book.seller?.name || "College Student"}</h5>
                            <p>{book.collegeName || "Verified College"}</p>
                          </div>
                        </div>

                        <div className="book-card-footer">
                          <div className="price-tag-block">
                            <span className="price-val">₹{book.price}</span>
                          </div>
                          
                          {(() => {
                            const sellerId = book.seller?._id || book.seller;
                            const currentUserId = user?.id || user?._id;
                            const isOwnListing = sellerId && currentUserId && sellerId.toString() === currentUserId.toString();
                            
                            if (book.status === "sold") {
                              return (
                                <button className="btn-card-buy" disabled style={{ opacity: 0.6, cursor: "not-allowed", backgroundColor: "var(--color-bg-surface-3)", color: "var(--color-text-secondary)" }}>
                                  Sold
                                </button>
                              );
                            } else if (book.status === "reserved") {
                              return (
                                <button className="btn-card-buy" disabled style={{ opacity: 0.6, cursor: "not-allowed", backgroundColor: "var(--color-bg-surface-3)", color: "var(--color-text-secondary)" }}>
                                  Reserved
                                </button>
                              );
                            } else if (isOwnListing) {
                              return (
                                <button className="btn-card-buy" onClick={() => navigate("/dashboard?mode=seller&tab=listings")}>
                                  Mine
                                </button>
                              );
                            } else {
                              return (
                                <button 
                                  className="btn-card-buy"
                                  onClick={() => navigate(user ? `/checkout/${book._id}` : "/auth")}
                                >
                                  Buy Now
                                </button>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* PAGINATION WRAPPER */}
                {totalPages > 1 && (
                  <div className="pagination-wrapper">
                    <button
                      className="pagination-arrow-btn"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <i className="ri-arrow-left-s-line"></i> Prev
                    </button>
                    
                    <div className="pagination-numbers">
                      {renderPaginationRange()}
                    </div>

                    <button
                      className="pagination-arrow-btn"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer-section">
        <div className="home-container-inner">
          <div className="footer-inner-grid">
            <div className="footer-col-info">
              <div className="logo-row">
                <img src={logoImg} alt="PustakMart Logo" className="logo-box-img" />
                <span>PustakMart</span>
              </div>
              <p className="description">
                Verified student-to-student marketplace for second-hand academic books and campus educational resources.
              </p>
            </div>

            <div className="footer-col-links">
              <h4>Product</h4>
              <div className="links-list">
                <a href="/#browse">Browse Catalog</a>
                <a href="/#requests">Book Requests</a>
                <a href="/#become-seller">Become Seller</a>
              </div>
            </div>

            <div className="footer-col-links">
              <h4>Company</h4>
              <div className="links-list">
                <a href="/#about">About Us</a>
                <a href="/#contact">Contact Support</a>
              </div>
            </div>

            <div className="footer-col-links">
              <h4>Resources</h4>
              <div className="links-list">
                <a href="/#faq">FAQ</a>
                <a href="/#terms">Terms of Service</a>
                <a href="/#privacy">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© {new Date().getFullYear()} PustakMart. Built for students, by students. All rights reserved.</p>
            <div className="social-row">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><i className="ri-linkedin-fill"></i></a>
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub"><i className="ri-github-fill"></i></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="ri-instagram-line"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
