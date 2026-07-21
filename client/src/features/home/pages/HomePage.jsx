import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useHome } from "../hooks/useHome.js";
import useAuth from "../../auth/hooks/useAuth.js";
import SEO from "../../shared/components/SEO.jsx";
import logoImg from "../../../assets/logo.jpg";

// Helper Counter Component for Social Proof Section
function Counter({ value, trigger }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;

    const totalMiliseconds = 1500;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 100);
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, trigger]);

  return <span>{count}</span>;
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { listings, loading, error, fetchListings } = useHome();

  // Navigation states
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Parallax mouse state for Hero Illustration
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [socialVisible, setSocialVisible] = useState(false);

  // Track scrolling to shrink navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track mouse coordinates for Hero Parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouseCoords({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Fetch listings on mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle search submit from modal
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchModal(false);
      navigate(`/category/engineering?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Carousel ref and scrolling functions
  const carouselRef = useRef(null);
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === "next" ? scrollAmount : -scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Static Fallback & Showcase Mock listings to populate trending and bundles
  const fallbackListings = [
    {
      _id: "mock-1",
      title: "Database System Concepts",
      author: "Abraham Silberschatz",
      price: 450,
      condition: "good",
      category: "engineering",
      collegeName: "Delhi Technological University",
      images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=60"],
      seller: { name: "Rohan Sharma", sellerStatus: "verified" }
    },
    {
      _id: "mock-2",
      title: "Operating System Principles",
      author: "Peter B. Galvin",
      price: 380,
      condition: "like_new",
      category: "engineering",
      collegeName: "Netaji Subhas Univ of Technology",
      images: ["https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&auto=format&fit=crop&q=60"],
      seller: { name: "Ananya Iyer", sellerStatus: "verified" }
    },
    {
      _id: "mock-3",
      title: "Computer Networking",
      author: "James F. Kurose",
      price: 490,
      condition: "good",
      category: "engineering",
      collegeName: "IIIT Delhi",
      images: ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=60"],
      seller: { name: "Kabir Mehta", sellerStatus: "verified" }
    },
    {
      _id: "mock-4",
      title: "Introduction to Theory of Computation",
      author: "Michael Sipser",
      price: 320,
      condition: "good",
      category: "engineering",
      collegeName: "B.I.T.S. Pilani",
      images: ["https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=300&auto=format&fit=crop&q=60"],
      seller: { name: "Sneha Reddy", sellerStatus: "verified" }
    },
    {
      _id: "mock-5",
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      price: 600,
      condition: "like_new",
      category: "engineering",
      collegeName: "IIT Delhi",
      images: ["https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&auto=format&fit=crop&q=60"],
      seller: { name: "Varun Verma", sellerStatus: "verified" }
    }
  ];

  const activeListings = listings.length > 0 ? listings : fallbackListings;

  // Semester Discovery Card definitions
  const semesterStreams = [
    { name: "Computer Engineering", years: "Semester 1-8", books: 142, bundles: 14, icon: "ri-cpu-line", color: "#F4B400" },
    { name: "Information Technology", years: "Semester 1-8", books: 98, bundles: 9, icon: "ri-global-line", color: "#0077B5" },
    { name: "Mechanical Engineering", years: "Semester 1-8", books: 86, bundles: 7, icon: "ri-settings-4-line", color: "#E1306C" },
    { name: "Civil Engineering", years: "Semester 1-8", books: 64, bundles: 5, icon: "ri-compass-3-line", color: "#4CAF50" },
    { name: "Electrical Engineering", years: "Semester 1-8", books: 73, bundles: 6, icon: "ri-flashlight-line", color: "#FF9800" }
  ];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PustakMart",
    "url": "https://pustakmart.com",
    "logo": "https://ik.imagekit.io/cuq3fe9wm/PustakMart/logo.jpg"
  };

  return (
    <div className="pustakmart-home-container">
      <SEO 
        title="PustakMart | Buy and Sell Used Books Online"
        description="PustakMart is India's trusted platform for buying and selling second-hand academic books. Connect with students from your college or university and get the best deals on textbooks, and educational resources."
        keywords="pustakmart, buy used books, sell textbooks, college book marketplace, engineering used books, medical books exchange"
        schema={[orgSchema]}
      />

      {/* SECTION 1: STICKY NAVBAR */}
      <header className={`home-header ${isScrolled ? "shrunk" : ""}`}>
        <div className="header-left">
          <Link to="/" className="brand-logo-wrapper">
            <img src={logoImg} alt="PustakMart Logo" className="logo-icon-img" />
            <span className="brand-name">PustakMart</span>
          </Link>
        </div>

        <nav className="header-center-nav">
          <Link to="/" style={{ cursor: "pointer" }}>Home</Link>
          <Link to="/marketplace" style={{ cursor: "pointer" }}>Marketplace</Link>
          <a href="/#requests" style={{ cursor: "pointer" }}>Book Requests</a>
          <a href="/#become-seller" style={{ cursor: "pointer" }}>Become Seller</a>
          <a href="/#about" style={{ cursor: "pointer" }}>About</a>
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
              <AnimatePresence>
                {showUserDropdown && (
                  <>
                    <div className="dropdown-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} onClick={() => setShowUserDropdown(false)} />
                    <motion.div 
                      className="user-profile-dropdown-menu"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{ top: "45px", right: 0 }}
                    >
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
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button className="btn-login" onClick={() => navigate("/auth")}>Login</button>
              <button className="btn-signup" onClick={() => navigate("/auth?mode=register")}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      {/* NAVBAR SEARCH MODAL POPUP */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            className="navbar-search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="search-modal"
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
            >
              <button className="close-modal-btn" onClick={() => setShowSearchModal(false)}>
                <i className="ri-close-line"></i>
              </button>
              <form onSubmit={handleSearchSubmit}>
                <div className="search-input-wrapper">
                  <i className="ri-search-line"></i>
                  <input 
                    type="text" 
                    placeholder="Search by title, author, or semester..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button type="button" className="clear-btn" onClick={() => setSearchQuery("")}>
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 2: HERO SECTION */}
      <section className="hero-section-wrapper">
        <div className="home-container-inner hero-container">
          <motion.div 
            className="hero-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="badge-wrap">
              India's Student Book Marketplace
            </div>
            <h1>
              Find Affordable Books From Verified Seniors And Students Near You.
            </h1>
            <p className="hero-subhead">
              Buy, sell, and exchange academic books with students from your college and nearby campuses.
            </p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={() => {
                const element = document.getElementById("browse");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}>
                Browse Books <i className="ri-arrow-right-line"></i>
              </button>
              <button className="btn-secondary" onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}>
                Sell Books <i className="ri-price-tag-3-line"></i>
              </button>
            </div>

            <div className="hero-trust-indicators">
              <div className="indicator">
                <i className="ri-checkbox-circle-fill"></i>
                <span>Verified Students</span>
              </div>
              <div className="indicator">
                <i className="ri-checkbox-circle-fill"></i>
                <span>Semester-wise Discovery</span>
              </div>
              <div className="indicator">
                <i className="ri-checkbox-circle-fill"></i>
                <span>Local Exchange</span>
              </div>
            </div>
          </motion.div>

          <div className="hero-right">
            <div className="illustration-deck">
              {/* DBMS Float Card */}
              <motion.div 
                className="float-card deck-dbms"
                drag
                dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
                animate={{
                  x: mouseCoords.x * 12,
                  y: mouseCoords.y * 12,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
              >
                <p className="subject-title">Semester 5</p>
                <p className="book-name">DBMS</p>
                <p className="price">₹350</p>
              </motion.div>

              {/* OS Float Card */}
              <motion.div 
                className="float-card deck-os"
                drag
                dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
                animate={{
                  x: mouseCoords.x * -16,
                  y: mouseCoords.y * -16,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
              >
                <p className="subject-title">Semester 4</p>
                <p className="book-name">Operating Systems</p>
                <p className="price">₹300</p>
              </motion.div>

              {/* CN Float Card */}
              <motion.div 
                className="float-card deck-cn"
                drag
                dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
                animate={{
                  x: mouseCoords.x * 18,
                  y: mouseCoords.y * 18,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
              >
                <p className="subject-title">Semester 6</p>
                <p className="book-name">Computer Networks</p>
                <p className="price">₹400</p>
              </motion.div>

              {/* TOC Float Card */}
              <motion.div 
                className="float-card deck-toc"
                drag
                dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
                animate={{
                  x: mouseCoords.x * -10,
                  y: mouseCoords.y * -10,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
              >
                <p className="subject-title">Semester 5</p>
                <p className="book-name">T.O.C.</p>
                <p className="price">₹320</p>
              </motion.div>

              {/* Semester Bundle Card */}
              <motion.div 
                className="float-card deck-bundle"
                animate={{
                  x: mouseCoords.x * -8,
                  y: mouseCoords.y * 14,
                }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
              >
                <p className="title">Semester 5 Bundle</p>
                <p className="desc">Save ₹800 instantly</p>
              </motion.div>

              {/* Verified Seller Card */}
              <motion.div 
                className="float-card deck-verified"
                animate={{
                  x: mouseCoords.x * 15,
                  y: mouseCoords.y * -12,
                }}
                transition={{ type: "spring", stiffness: 90, damping: 22 }}
              >
                <i className="ri-verified-badge-fill"></i>
                <div className="details">
                  <h5>Verified Seller</h5>
                  <p>Delhi Tech Univ (DTU)</p>
                </div>
              </motion.div>

              {/* Book Request Card */}
              <motion.div 
                className="float-card deck-request"
                animate={{
                  x: mouseCoords.x * -14,
                  y: mouseCoords.y * -8,
                }}
                transition={{ type: "spring", stiffness: 80, damping: 24 }}
              >
                <div className="req-badge"></div>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Request: DBMS Korth</span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SOCIAL PROOF */}
      <section className="social-proof-section">
        <div className="home-container-inner">
          <motion.div 
            className="section-header text-center"
            style={{ marginBottom: "40px" }}
            onViewportEnter={() => setSocialVisible(true)}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>Trusted By Students Across Campuses</h2>
          </motion.div>

          <div className="metrics-grid">
            <div className="metric-item">
              <div className="number">
                <Counter value={500} trigger={socialVisible} />+
              </div>
              <div className="label">Listings</div>
            </div>
            <div className="metric-item">
              <div className="number">
                <Counter value={1000} trigger={socialVisible} />+
              </div>
              <div className="label">Students</div>
            </div>
            <div className="metric-item">
              <div className="number">
                <Counter value={300} trigger={socialVisible} />+
              </div>
              <div className="label">Exchanges</div>
            </div>
            <div className="metric-item">
              <div className="number">
                <Counter value={50} trigger={socialVisible} />+
              </div>
              <div className="label">Colleges</div>
            </div>
          </div>

          {/* Infinite Horizontal Logo Marquee */}
          <div className="marquee-wrapper">
            <div className="marquee-track">
              <div className="marquee-content">
                <div className="college-logo-item"><i className="ri-government-line"></i> IIT Delhi</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> BITS Pilani</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> DTU Delhi</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> NIT Trichy</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> VIT Vellore</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> NSUT Delhi</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> RVCE Bangalore</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> COEP Pune</div>
              </div>
              <div className="marquee-content">
                <div className="college-logo-item"><i className="ri-government-line"></i> IIT Delhi</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> BITS Pilani</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> DTU Delhi</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> NIT Trichy</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> VIT Vellore</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> NSUT Delhi</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> RVCE Bangalore</div>
                <div className="college-logo-item"><i className="ri-government-line"></i> COEP Pune</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section className="home-section" id="about">
        <div className="home-container-inner">
          <div className="section-header text-center">
            <span className="badge">Process</span>
            <h2>Exchange Books In Three Simple Steps</h2>
            <p>Direct student-to-student handover, built on trust and campus connection.</p>
          </div>

          <div className="timeline-grid">
            <motion.div 
              className="timeline-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
            >
              <div className="step-number">1</div>
              <div className="icon-wrapper">
                <i className="ri-search-line"></i>
              </div>
              <h3>Find Books</h3>
              <p>Browse semester-wise listings listed by seniors on your own campus or nearby colleges.</p>
            </motion.div>

            <motion.div 
              className="timeline-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
            >
              <div className="step-number">2</div>
              <div className="icon-wrapper">
                <i className="ri-chat-smile-3-line"></i>
              </div>
              <h3>Connect</h3>
              <p>Direct in-app secure chat with sellers. Haggle on price, specify condition, and agree to meet.</p>
            </motion.div>

            <motion.div 
              className="timeline-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3 }}
            >
              <div className="step-number">3</div>
              <div className="icon-wrapper">
                <i className="ri-shake-hands-line"></i>
              </div>
              <h3>Exchange</h3>
              <p>Meet up locally on campus (canteen, hostel, library), inspect the book, and finish the transaction.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SEMESTER DISCOVERY */}
      <section className="semester-discovery-section home-section bg-surface">
        <div className="home-container-inner">
          <div className="section-header text-center">
            <span className="badge">Discovery</span>
            <h2>Browse By Semester</h2>
            <p>Avoid searching blindly. Jump straight into the resources customized for your branch and semester.</p>
          </div>

          <div className="discovery-grid">
            {semesterStreams.map((stream, idx) => (
              <motion.div 
                key={idx}
                className="semester-card"
                onClick={() => navigate(`/category/engineering?stream=${encodeURIComponent(stream.name)}`)}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <i className={`${stream.icon} branch-icon`}></i>
                <h3>{stream.name}</h3>
                <p className="sem-years">{stream.years}</p>
                
                <div className="counts-wrap">
                  <span><i className="ri-book-open-line"></i> {stream.books} Books</span>
                  <span><i className="ri-folder-zip-line"></i> {stream.bundles} Sets</span>
                </div>

                <div className="hover-reveal-box">
                  <span>Explore Stream</span>
                  <i className="ri-arrow-right-line"></i>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: TRENDING BOOKS */}
      <section className="home-section" id="browse">
        <div className="home-container-inner">
          <div className="section-header">
            <span className="badge">Trending</span>
            <h2>Trending Resources</h2>
            <p>Popular textbooks and resources being exchanged right now across campuses.</p>
          </div>

          <div className="trending-carousel-container">
            <button className="carousel-scroll-button prev-btn" onClick={() => scrollCarousel("prev")}>
              <i className="ri-arrow-left-s-line"></i>
            </button>
            
            <div className="trending-carousel-track" ref={carouselRef}>
              {activeListings.map((book) => (
                <div key={book._id} className="trending-book-card">
                  <Link to={`/product/${book._id}`} className="img-wrapper" style={{ display: "block", textDecoration: "none" }}>
                    <img 
                      src={book.images?.[0] || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300"} 
                      alt={book.title} 
                    />
                    <div className="verified-chip">
                      <i className="ri-verified-badge-fill"></i> Verified
                    </div>
                  </Link>
                  <div className="details-wrapper">
                    <p className="college">{book.collegeName || "Verified Campus"}</p>
                    <Link to={`/product/${book._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <h3 className="title">{book.title}</h3>
                    </Link>
                    <div className="price-box">₹{book.price}</div>

                    <div className="quick-actions-layer">
                      {(() => {
                        const sellerId = book.seller?._id || book.seller;
                        const currentUserId = user?.id || user?._id;
                        const isOwnListing = sellerId && currentUserId && sellerId.toString() === currentUserId.toString();
                        
                        if (book.status === "sold") {
                          return (
                            <button className="btn-view" disabled style={{ opacity: 0.6, cursor: "not-allowed", backgroundColor: "var(--color-bg-surface-3)", color: "var(--color-text-secondary)" }}>
                              Sold
                            </button>
                          );
                        } else if (book.status === "reserved") {
                          return (
                            <button className="btn-view" disabled style={{ opacity: 0.6, cursor: "not-allowed", backgroundColor: "var(--color-bg-surface-3)", color: "var(--color-text-secondary)" }}>
                              Reserved
                            </button>
                          );
                        } else if (isOwnListing) {
                          return (
                            <button className="btn-view" onClick={() => navigate("/dashboard?mode=seller&tab=listings")}>
                              Your Listing
                            </button>
                          );
                        } else {
                          return (
                            <button className="btn-view" style={{ backgroundColor: "var(--color-brand)", color: "var(--color-text-on-brand)" }} onClick={() => navigate(user ? `/checkout/${book._id}` : "/auth")}>
                              Buy Now
                            </button>
                          );
                        }
                      })()}
                      <button className="btn-save" onClick={() => alert("Book saved to wishlist!")} title="Save">
                        <i className="ri-heart-line"></i> Save
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="carousel-scroll-button next-btn" onClick={() => scrollCarousel("next")}>
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>

          <div className="explore-more-wrap">
            <button className="btn-explore-more" onClick={() => navigate("/marketplace")}>
              Explore More Books <i className="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 7: SEMESTER BUNDLES */}
      <section className="home-section bg-surface">
        <div className="home-container-inner">
          <div className="section-header text-center">
            <span className="badge">Bundles</span>
            <h2>Buy Complete Semester Sets</h2>
            <p>Avoid buying individually. Get all curriculum reference books from verified seniors in one go.</p>
          </div>

          <div className="bundles-grid">
            {/* Bundle 1 */}
            <motion.div 
              className="bundle-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="bundle-header">
                <span className="badge">Popular</span>
                <h3>Computer Engineering - Semester 5 Set</h3>
                <p className="desc">All essential core reference guides included.</p>
              </div>
              <div className="books-stack">
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Database System Concepts (Silberschatz)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Computer Networking (Kurose)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Theory of Computation (Sipser)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Software Engineering (Pressman)</div>
              </div>
              <div className="bundle-pricing">
                <div className="price-block">
                  <div className="price">₹1,200</div>
                  <div className="saving">✓ Save ₹800 vs new books</div>
                </div>
                <button className="btn-buy-bundle" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                  Buy Set
                </button>
              </div>
            </motion.div>

            {/* Bundle 2 */}
            <motion.div 
              className="bundle-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="bundle-header">
                <span className="badge">Value</span>
                <h3>Information Technology - Semester 3 Set</h3>
                <p className="desc">Covers logic systems, code design, mathematics.</p>
              </div>
              <div className="books-stack">
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Data Structures and Algorithms (AHU)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Digital Logic Design (Mano)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Discrete Mathematics (Rosen)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Object Oriented Programming in C++</div>
              </div>
              <div className="bundle-pricing">
                <div className="price-block">
                  <div className="price">₹1,100</div>
                  <div className="saving">✓ Save ₹750 vs new books</div>
                </div>
                <button className="btn-buy-bundle" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                  Buy Set
                </button>
              </div>
            </motion.div>

            {/* Bundle 3 */}
            <motion.div 
              className="bundle-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="bundle-header">
                <span className="badge">Core</span>
                <h3>Mechanical - Semester 4 Set</h3>
                <p className="desc">Curated package for thermo & fluid dynamics sciences.</p>
              </div>
              <div className="books-stack">
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Thermodynamics: An Engineering Approach</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Fluid Mechanics (Cengel)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Theory of Machines (SS Rattan)</div>
                <div className="book-row"><i className="ri-checkbox-circle-line"></i> Kinematics of Machinery</div>
              </div>
              <div className="bundle-pricing">
                <div className="price-block">
                  <div className="price">₹1,350</div>
                  <div className="saving">✓ Save ₹900 vs new books</div>
                </div>
                <button className="btn-buy-bundle" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                  Buy Set
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 8: BOOK REQUESTS */}
      <section className="home-section" id="requests">
        <div className="home-container-inner requests-grid">
          <div className="request-form-side">
            <span className="badge">Requests</span>
            <h3>Can't Find Your Book?</h3>
            <p className="desc">
              Request it and let other students and seniors on your campus notify you directly when they have it ready to sell.
            </p>
            <button className="btn-request" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
              Request A Book <i className="ri-add-line"></i>
            </button>
          </div>

          <div className="request-cards-side">
            <div className="request-scroll-track">
              {/* Mock request cards sliding (repeated to scroll indefinitely) */}
              <div className="mock-request-card">
                <div className="req-info">
                  <h4>DBMS by Korth</h4>
                  <p>Requested by Sameer (DTU) • 2 hrs ago</p>
                </div>
                <div className="req-budget">₹300</div>
              </div>

              <div className="mock-request-card">
                <div className="req-info">
                  <h4>Theory of Computation by Sipser</h4>
                  <p>Requested by Priyanka (IITD) • 5 hrs ago</p>
                </div>
                <div className="req-budget">₹350</div>
              </div>

              <div className="mock-request-card">
                <div className="req-info">
                  <h4>Concepts of Physics Vol 1 (H.C. Verma)</h4>
                  <p>Requested by Rahul (NSUT) • 1 day ago</p>
                </div>
                <div className="req-budget">₹200</div>
              </div>

              {/* Repetition for continuous loop */}
              <div className="mock-request-card">
                <div className="req-info">
                  <h4>DBMS by Korth</h4>
                  <p>Requested by Sameer (DTU) • 2 hrs ago</p>
                </div>
                <div className="req-budget">₹300</div>
              </div>

              <div className="mock-request-card">
                <div className="req-info">
                  <h4>Theory of Computation by Sipser</h4>
                  <p>Requested by Priyanka (IITD) • 5 hrs ago</p>
                </div>
                <div className="req-budget">₹350</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: WHY PUSTAKMART */}
      <section className="home-section bg-surface">
        <div className="home-container-inner">
          <div className="section-header text-center">
            <span className="badge">Benefits</span>
            <h2>Why Students Choose PustakMart</h2>
            <p>A smart, localized trading platform tailored strictly for college campuses.</p>
          </div>

          <div className="why-pustakmart-grid">
            <div className="why-card">
              <div className="illustration-box">
                <svg className="why-svg-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h3>Verified Students</h3>
              <p>Signups allowed only via official college domain emails. Zero strangers.</p>
            </div>

            <div className="why-card">
              <div className="illustration-box">
                <svg className="why-svg-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3>Academic Focus</h3>
              <p>Strictly academic materials. No spam, no side products, just curriculum content.</p>
            </div>

            <div className="why-card">
              <div className="illustration-box">
                <svg className="why-svg-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h3>Semester-Based</h3>
              <p>Skip searching. Jump directly into standard book configurations tailored to semesters.</p>
            </div>

            <div className="why-card">
              <div className="illustration-box">
                <svg className="why-svg-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3>Local Exchange</h3>
              <p>No shipping delay. Exchange books instantly at canteen, canteen hubs, or campus gates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: BECOME A SELLER */}
      <section className="home-section" id="become-seller">
        <div className="home-container-inner become-seller-banner">
          <div className="banner-text">
            <h2>Your Old Books Can Help Another Student.</h2>
            <p>
              List your books in under 2 minutes. Earn back money and help clean up space in your room while supporting campus peers.
            </p>
            <button className="btn-seller-cta" onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}>
              Start Selling <i className="ri-price-tag-3-line"></i>
            </button>
          </div>

          <div className="banner-graphic">
            {/* Abstract clean vectors using raw SVG representing student handover */}
            <svg className="books-flow-graphic" viewBox="0 0 200 200" fill="none">
              <rect x="30" y="70" width="60" height="90" rx="8" fill="#F4B400" fillOpacity="0.2" stroke="#F4B400" strokeWidth="2" />
              <rect x="40" y="80" width="40" height="70" rx="4" fill="#F4B400" fillOpacity="0.3" />
              <rect x="110" y="50" width="60" height="90" rx="8" fill="#171717" fillOpacity="0.1" stroke="#171717" strokeWidth="2" />
              <path d="M90 100 H120 M110 90 L120 100 L110 110" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* SECTION 11: TESTIMONIALS */}
      <section className="home-section bg-surface">
        <div className="home-container-inner">
          <div className="section-header text-center">
            <span className="badge">Reviews</span>
            <h2>What Students Say</h2>
            <p>Hear from college peers who swapped books and saved thousands on PustakMart.</p>
          </div>

          <div className="testimonials-carousel-wrapper">
            <div className="testimonials-track">
              {/* Review 1 */}
              <div className="testimonial-card">
                <div className="stars-row" style={{ color: "var(--color-brand)", marginBottom: "12px", display: "flex", gap: "4px" }}>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                </div>
                <p className="quote">
                  "Found all my Sem 5 Computer Engineering reference books within 2 hours. Handed them over right in the canteen. Saved around ₹1200!"
                </p>
                <div className="profile">
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" alt="Student" />
                  <div className="info">
                    <h4>Siddharth Goel</h4>
                    <p>DTU Delhi, Comp Engg</p>
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div className="testimonial-card">
                <div className="stars-row" style={{ color: "var(--color-brand)", marginBottom: "12px", display: "flex", gap: "4px" }}>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                </div>
                <p className="quote">
                  "Selling my previous semester sets was seamless. Instead of selling to trash dealers, I gave them to a junior who actually needed them."
                </p>
                <div className="profile">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Student" />
                  <div className="info">
                    <h4>Preeti Sen</h4>
                    <p>IIT Delhi, Chemical Engg</p>
                  </div>
                </div>
              </div>

              {/* Review 3 */}
              <div className="testimonial-card">
                <div className="stars-row" style={{ color: "var(--color-brand)", marginBottom: "12px", display: "flex", gap: "4px" }}>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                </div>
                <p className="quote">
                  "I was looking for Korth's DBMS for ages. Requested it, and a senior notified me the same day. Incredible campus community feel!"
                </p>
                <div className="profile">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Student" />
                  <div className="info">
                    <h4>Aryan Verma</h4>
                    <p>NSUT Delhi, IT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 12: FINAL CTA */}
      <section className="home-section final-cta-section">
        <div className="home-container-inner">
          <h2>Ready To Find Your Next Semester's Books?</h2>
          <p>Explore verified listings on your college campus or start selling your old books now.</p>
          <div className="cta-buttons-wrap">
            <button className="btn-browse" onClick={() => {
              const element = document.getElementById("browse");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}>
              Browse Books <i className="ri-arrow-right-line"></i>
            </button>
            <button className="btn-sell" onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}>
              Sell Books <i className="ri-price-tag-3-line"></i>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 13: FOOTER */}
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
                <a href="#browse">Browse Catalog</a>
                <a href="#requests">Book Requests</a>
                <a href="#become-seller">Become Seller</a>
              </div>
            </div>

            <div className="footer-col-links">
              <h4>Company</h4>
              <div className="links-list">
                <a href="#about">About Us</a>
                <a href="#contact">Contact Support</a>
              </div>
            </div>

            <div className="footer-col-links">
              <h4>Resources</h4>
              <div className="links-list">
                <a href="#faq">FAQ</a>
                <a href="#terms">Terms of Service</a>
                <a href="#privacy">Privacy Policy</a>
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
