import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useHome } from "../hooks/useHome.js";
import useAuth from "../../auth/hooks/useAuth.js";
import SEO from "../../shared/components/SEO.jsx";
import logoImg from "../../../assets/logo.jpg";

const CATEGORY_MAP = {
  engineering: {
    label: "Engineering Textbooks",
    description: "Find second-hand engineering textbooks on PustakMart. Connect directly with student sellers on campus for computer science, mechanical, electrical, civil, and electronics reference books.",
    keywords: "engineering books, second hand engineering books, cse textbooks, mechanical engineering, computer science books",
    h1: "Buy & Sell Second-Hand Engineering Textbooks on Campus",
    richContent: "Skip bookstore markups and direct shipping delays. Discover student listings for core streams: computer science, software engineering, circuits, machinery, and structures. Handover directly at your library or hostels.",
  },
  novel: {
    label: "Novels & Fiction Library",
    description: "Browse cheap second-hand novels, sci-fi classics, romance stories, and popular fiction. Trade directly on campus with fellow literature enthusiasts.",
    keywords: "second hand novels, buy cheap books, campus fiction exchange, used novels",
    h1: "Verified Student Used Novels & Fiction exchange",
    richContent: "Explore stories and student-verified fiction listings. Clean paperbacks and hardcovers are available locally on your college campus without shipping charges or processing fees.",
  },
  competitive_exam: {
    label: "Competitive Exams Guides",
    description: "Get used guides for GATE, JEE, CAT, UPSC, and GRE exams. Prepare for your future careers using low-cost prep resources traded directly on campus.",
    keywords: "GATE books, used JEE books, competitive exam guides, second hand UPSC materials",
    h1: "Affordable Used Competitive Exams Preparation Material",
    richContent: "Prep materials can be expensive. Save up to 80% on guidebooks, previous year solved question papers, and notes listed directly by students who have cleared these exams.",
  },
  medical: {
    label: "Medical Sciences Textbooks",
    description: "Search used books for MBBS, BDS, Nursing, and Pharmacy students. Exchange anatomy, pharmacology, and pathology references on campus.",
    keywords: "medical textbooks, used MBBS books, anatomy books, nursing notes, used pharmacy textbooks",
    h1: "Second-Hand Medical & Life Sciences Books",
    richContent: "Medical school guides are heavy and expensive. Buy lightly-used anatomy, physiology, and pharmacology manuals from senior students. Zero commission, face-to-face verified checkout.",
  },
  school: {
    label: "School & K-12 Textbook Library",
    description: "Explore affordable pre-owned school textbooks and workbook study guides for CBSE, ICSE, and state boards, listed by students in your neighborhood.",
    keywords: "school textbooks, used CBSE books, pre owned school books, cheap school books",
    h1: "Pre-Owned School Books & Board Study Guides",
    richContent: "Get ready for board examinations with used guides and textbook materials. Great for quick school reviews and local community circular trade.",
  },
  other: {
    label: "General Books & Resources",
    description: "Discover general textbooks, skill guides, magazines, and other study resources listed for direct campus handover on PustakMart.",
    keywords: "used textbooks, second hand resource books, general books trade",
    h1: "Campus Trade General Books & Miscellaneous Resources",
    richContent: "Looking for general reads or niche textbooks? Check these student-posted academic listings available for exchange on your campus.",
  },
};

export default function CategoryLandingPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, loading, error, fetchListings } = useHome();

  const categoryInfo = CATEGORY_MAP[categoryId] || {
    label: "Academic Books",
    description: "Browse academic textbooks and reference materials listed directly by college students on PustakMart.",
    keywords: "used college textbooks, second hand textbooks, student book trade",
    h1: "Pre-Owned Academic Textbooks & Study Materials",
    richContent: "Access affordable reference volumes, guidebooks, and study resources listed on campus.",
  };

  useEffect(() => {
    fetchListings({ category: categoryId });
  }, [categoryId, fetchListings]);

  // Breadcrumb Structured Schema (JSON-LD)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pustakmart.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryInfo.label,
        "item": `https://pustakmart.com/category/${categoryId}`
      }
    ]
  };

  return (
    <div className="pustakmart-home-container">
      {/* Reusable Helmet tags injection */}
      <SEO
        title={`${categoryInfo.label} | Used Books Marketplace`}
        description={categoryInfo.description}
        keywords={categoryInfo.keywords}
        schema={breadcrumbSchema}
      />

      {/* HEADER */}
      <header className="home-header">
        <div className="header-left">
          <div className="brand-logo-wrapper" onClick={() => navigate("/")}>
            <img src={logoImg} alt="PustakMart Logo" className="header-logo" />
            <div className="brand-name-block">
              <span className="brand-title-text" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.5rem", color: "var(--color-text-primary)" }}>PustakMart</span>
            </div>
          </div>
        </div>

        <div className="header-right-actions">
          <Link to="/" style={{ color: "var(--color-brand-text)", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}>
            <i className="ri-arrow-left-line"></i> Back to Main Home
          </Link>
        </div>
      </header>

      {/* BREADCRUMB UI */}
      <nav className="breadcrumb-nav-strip" style={{ padding: "16px 24px", background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-border-subtle)", fontSize: "0.9rem" }}>
        <Link to="/" style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>Home</Link>
        <span style={{ margin: "0 8px", color: "var(--color-text-tertiary)" }}>&gt;</span>
        <span style={{ color: "var(--color-brand-text)", fontWeight: 500 }}>{categoryInfo.label}</span>
      </nav>

      {/* HERO SECTION */}
      <section className="category-hero-section" style={{ padding: "48px 24px", background: "linear-gradient(135deg, var(--color-brand-light) 0%, rgba(254,243,199,0.3) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "2.25rem", color: "var(--color-text-primary)", marginBottom: "16px" }}>
            {categoryInfo.h1}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", lineHeight: "1.6", marginBottom: "24px" }}>
            {categoryInfo.richContent}
          </p>
          <div style={{ display: "inline-block", background: "white", padding: "8px 16px", borderRadius: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-success-text)" }}>
            <i className="ri-shield-check-fill"></i> Zero platform fees. Direct student handover.
          </div>
        </div>
      </section>

      {/* ACTIVE LISTINGS GRID */}
      <section className="home-listings-section" style={{ padding: "40px 24px" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.75rem", marginBottom: "8px" }}>
          Active listings in {categoryInfo.label}
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
          Verify conditions, chat with students, and meet on campus for circular books exchange.
        </p>

        {error && <div className="home-error-alert">{error}</div>}

        {loading ? (
          <div className="home-loading-block">
            <div className="home-spinner"></div>
            <p>Loading category textbooks...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="home-empty-block" style={{ padding: "64px 16px" }}>
            <i className="ri-book-3-line" style={{ fontSize: "3rem", color: "var(--color-text-tertiary)" }}></i>
            <h4>No Active Listings Under {categoryInfo.label}</h4>
            <p>Be the first to upload a textbook in this category and earn money on campus!</p>
            <button className="btn-empty-reset" onClick={() => navigate("/dashboard")}>
              List a Book Now
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((book) => (
              <article key={book._id} className="book-card-item">
                <div className="book-cover-frame">
                  <img
                    src={book.images?.[0] || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300"}
                    alt={`${book.title} book by ${book.author || "student"}`}
                    loading="lazy"
                    width="260"
                    height="200"
                    className="book-image"
                  />
                  <span className={`condition-tag cond-${book.condition || "good"}`}>
                    {(book.condition || "good").replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="book-card-details">
                  <div className="book-meta-top">
                    <span className="book-category-label">{book.category}</span>
                    {book.semester && <span className="book-sem-label">Sem {book.semester}</span>}
                  </div>

                  <h4 className="book-title">{book.title}</h4>
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
                    
                    <button 
                      className="btn-card-buy"
                      onClick={() => navigate(user ? "/dashboard" : "/auth")}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PustakMart. Dynamic Category Landing Index. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
