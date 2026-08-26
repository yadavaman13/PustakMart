import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { submitPlatformReviewApi } from "../services/home.api.js";
import logoImg from "../../../assets/logo.jpg";

export default function RateUsPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await submitPlatformReviewApi({ rating, review });
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setError(response.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Submit review error:", err);
      setError(
        err.response?.data?.message || "An error occurred while submitting your review."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rate-us-container">
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
        </nav>
      </header>

      {/* Main Content */}
      <main className="rate-us-main">
        <motion.div
          className="rate-us-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {success ? (
            <div className="success-state">
              <div className="success-icon-wrapper">
                <i className="ri-checkbox-circle-fill"></i>
              </div>
              <h2>Thank You For Your Feedback!</h2>
              <p>Your review has been submitted successfully.</p>
              <p className="redirect-text">Redirecting you back to home page...</p>
              <button className="btn-home-fallback" onClick={() => navigate("/")}>
                Back to Home Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-header">
                <h2>Rate PustakMart</h2>
                <p>Your feedback helps us make campus book exchanges even better for students.</p>
              </div>

              {error && (
                <div className="error-alert">
                  <i className="ri-error-warning-line"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="rating-section">
                <label className="section-label">Your Rating</label>
                <div className="stars-row-interactive">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        className="star-btn"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${star} stars`}
                      >
                        <i className={isActive ? "ri-star-fill" : "ri-star-line"}></i>
                      </button>
                    );
                  })}
                </div>
                {rating > 0 && (
                  <p className="rating-hint">
                    {rating === 5
                      ? "Excellent! Love it!"
                      : rating === 4
                      ? "Good, very satisfied"
                      : rating === 3
                      ? "Decent experience"
                      : rating === 2
                      ? "Could be better"
                      : "Unsatisfied, needs improvement"}
                  </p>
                )}
              </div>

              <div className="comment-section">
                <label className="section-label" htmlFor="review-textarea">
                  Tell us more about your experience (optional)
                </label>
                <textarea
                  id="review-textarea"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What do you like about PustakMart? What can we improve?"
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit-review" disabled={loading}>
                  {loading ? (
                    <span className="btn-spinner-wrapper">
                      <span className="btn-spinner"></span>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Review"
                  )}
                </button>
                <button
                  type="button"
                  className="btn-cancel-review"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
}
