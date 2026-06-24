import React, { useState, useEffect } from "react";
import useAuth from "../../auth/hooks/useAuth.js";
import { 
  updateProfileApi, 
  changePasswordApi, 
  deleteAccountApi,
  applySellerApi,
  getImageKitAuthParamsApi
} from "../services/dashboard.api.js";
import axios from "axios";

export const ProfileSettingsView = ({ showSellerStatus = true }) => {
  const { user, checkSession, logout } = useAuth();
  
  // Tab control inside settings
  const [activeSubTab, setActiveSubTab] = useState("edit-profile");

  // Profile Edit State
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password Change State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState("");

  // Action/Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState(""); // "change-password" | "delete-account"
  
  // Loaders / Messages
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [toast, setToast] = useState(null);

  // Seller application upload state
  const [idCardFile, setIdCardFile] = useState(null);
  const [isUploadingSeller, setIsUploadingSeller] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setMobileNumber(user.mobileNumber || "");
      setCollegeName(user.collegeName || "");
      setDepartment(user.department || "");
      setSemester(user.semester !== undefined ? String(user.semester) : "");
      setAvatarUrl(user.ProfilePicture || "");
    }
  }, [user]);

  const showLocalToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be smaller than 2MB.");
      showLocalToast("Avatar image must be smaller than 2MB.", "error");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);
      setSuccess(null);
      
      const authRes = await getImageKitAuthParamsApi();
      if (!authRes.success) throw new Error("Failed to authenticate with ImageKit server");

      const { signature, token, expire, publicKey } = authRes.data;
      let uploadedUrl = "";

      if (signature.startsWith("mock-") || token.startsWith("mock-")) {
        // Mock image upload
        await new Promise(resolve => setTimeout(resolve, 1500));
        uploadedUrl = `https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-avatar-${Date.now()}.png`;
      } else {
        const extension = file.name ? file.name.split('.').pop() : "png";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", `avatar_${user?.id || user?._id || "user"}_${Date.now()}.${extension}`);
        formData.append("publicKey", publicKey);
        formData.append("signature", signature);
        formData.append("token", token);
        formData.append("expire", expire);
        formData.append("folder", "/PustakMart/avatars");

        const uploadRes = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData);
        uploadedUrl = uploadRes.data.url;
      }

      setAvatarUrl(uploadedUrl);
      showLocalToast("Avatar uploaded. Please click Save Changes to record.", "success");
    } catch (err) {
      console.error(err);
      setError("Failed to upload avatar image.");
      showLocalToast("Avatar upload failed.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        name,
        mobileNumber,
        collegeName,
        department,
        semester: semester ? Number(semester) : undefined,
        ProfilePicture: avatarUrl
      };

      const res = await updateProfileApi(updateData);
      if (res.success) {
        setSuccess("Profile details updated successfully!");
        showLocalToast("Profile details updated successfully!", "success");
        await checkSession(); // Sync user profile context
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile details");
      showLocalToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setConfirmType("change-password");
    setShowConfirmModal(true);
  };

  const handleDeleteAccountSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!deletePassword) {
      setError("Please enter your current password to authorize deletion");
      return;
    }

    setConfirmType("delete-account");
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    setError(null);
    setSuccess(null);

    if (confirmType === "change-password") {
      try {
        setLoading(true);
        const res = await changePasswordApi({ oldPassword, newPassword });
        if (res.success) {
          setSuccess("Password changed successfully!");
          showLocalToast("Password changed successfully!", "success");
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to change password");
        showLocalToast(err.response?.data?.message || "Failed to change password", "error");
      } finally {
        setLoading(false);
      }
    } else if (confirmType === "delete-account") {
      try {
        setLoading(true);
        const res = await deleteAccountApi({ password: deletePassword });
        if (res.success) {
          setSuccess("Account deleted successfully. Logging you out...");
          showLocalToast("Account deleted successfully.", "success");
          setDeletePassword("");
          setTimeout(async () => {
            await logout();
          }, 1500);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete account");
        showLocalToast(err.response?.data?.message || "Failed to delete account", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUploadAndSubmitSeller = async (e) => {
    e.preventDefault();
    if (!idCardFile) return;

    try {
      setIsUploadingSeller(true);
      setError(null);
      setSuccess(null);
      
      const authRes = await getImageKitAuthParamsApi();
      if (!authRes.success) throw new Error("Failed to authenticate upload signature");

      const { signature, token, expire, publicKey } = authRes.data;
      let finalUrl = "";

      if (signature.startsWith("mock-") || token.startsWith("mock-")) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        finalUrl = `https://ik.imagekit.io/cuq3fe9wm/PustakMart/mock-imagekit-upload-${Date.now()}.png`;
      } else {
        const extension = idCardFile.name ? idCardFile.name.split('.').pop() : "png";
        const formData = new FormData();
        formData.append("file", idCardFile);
        formData.append("fileName", `ID_${user?.id || user?._id || "user"}_${Date.now()}.${extension}`);
        formData.append("publicKey", publicKey);
        formData.append("signature", signature);
        formData.append("token", token);
        formData.append("expire", expire);
        formData.append("folder", "/PustakMart/id_cards");

        const uploadRes = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData);
        finalUrl = uploadRes.data.url;
      }

      const applyRes = await applySellerApi(finalUrl);
      if (applyRes.success) {
        setSuccess("Your verification application has been submitted successfully!");
        showLocalToast("Verification application submitted successfully!", "success");
        setIdCardFile(null);
        await checkSession();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to upload file or apply");
      showLocalToast(err.response?.data?.message || "Failed to submit verification", "error");
    } finally {
      setIsUploadingSeller(false);
    }
  };

  return (
    <div className="profile-settings-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification-bubble ${toast.type}`}>
          <div className="toast-content">
            <i className={toast.type === "success" ? "ri-checkbox-circle-fill" : "ri-error-warning-fill"}></i>
            <span>{toast.message}</span>
          </div>
          <button className="toast-close-btn" onClick={() => setToast(null)} aria-label="Close notification">
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Alert Banners */}
      {error && <div className="dashboard-alert-banner error-banner">{error}</div>}
      {success && <div className="dashboard-alert-banner success-banner">{success}</div>}

      <div className="settings-tab-layout">
        {/* Settings Sub-Tabs Header */}
        <div className="settings-subtabs-menu">
          <button 
            type="button" 
            className={`subtab-btn ${activeSubTab === "edit-profile" ? "active" : ""}`}
            onClick={() => { setActiveSubTab("edit-profile"); setError(null); setSuccess(null); }}
          >
            <i className="ri-user-line"></i>
            <span>Edit Profile</span>
          </button>
          <button 
            type="button" 
            className={`subtab-btn ${activeSubTab === "security" ? "active" : ""}`}
            onClick={() => { setActiveSubTab("security"); setError(null); setSuccess(null); }}
          >
            <i className="ri-shield-keyhole-line"></i>
            <span>Security & Privacy</span>
          </button>
          {showSellerStatus && (
            <button 
              type="button" 
              className={`subtab-btn ${activeSubTab === "seller-status" ? "active" : ""}`}
              onClick={() => { setActiveSubTab("seller-status"); setError(null); setSuccess(null); }}
            >
              <i className="ri-verified-badge-line"></i>
              <span>Seller Status</span>
            </button>
          )}
        </div>

        {/* Content Panels */}
        <div className="settings-panel-content">
          {activeSubTab === "edit-profile" && (
            <form onSubmit={handleSaveProfile} className="settings-form animate-fade">
              <h3 className="settings-section-title">Edit Profile Details</h3>
              <p className="settings-section-subtitle">Update your personal information displayed on PustakMart.</p>
              
              {/* Avatar section */}
              <div className="avatar-uploader-section">
                <div className="avatar-preview-box">
                  <img src={avatarUrl || "https://ik.imagekit.io/cuq3fe9wm/PustakMart/Avatar.png"} alt="Avatar Preview" />
                  {uploadingAvatar && (
                    <div className="avatar-upload-loader">
                      <div className="spinner-mini"></div>
                    </div>
                  )}
                </div>
                <div className="avatar-upload-actions">
                  <label htmlFor="avatar-file-input" className="btn btn-outline btn-sm">
                    <i className="ri-upload-2-line"></i> Upload Photo
                  </label>
                  <input 
                    type="file" 
                    id="avatar-file-input" 
                    accept="image/*" 
                    onChange={handleAvatarFileChange} 
                    style={{ display: "none" }}
                    disabled={uploadingAvatar}
                  />
                  <p className="upload-hint">Square JPG or PNG, Max 2MB</p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="form-grid-layout">
                <div className="form-group-field">
                  <label htmlFor="settings-name">Full Name *</label>
                  <input 
                    type="text" 
                    id="settings-name" 
                    required 
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="settings-email">Email Address (Read-only)</label>
                  <input 
                    type="email" 
                    id="settings-email" 
                    disabled 
                    className="disabled-input"
                    value={user?.email || ""}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="settings-mobile">Mobile Number</label>
                  <input 
                    type="tel" 
                    id="settings-mobile" 
                    placeholder="e.g. 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="settings-college">College / University</label>
                  <input 
                    type="text" 
                    id="settings-college" 
                    placeholder="e.g. SVNIT Surat"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="settings-dept">Department</label>
                  <input 
                    type="text" 
                    id="settings-dept" 
                    placeholder="e.g. Computer Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="settings-sem">Semester</label>
                  <input 
                    type="number" 
                    id="settings-sem" 
                    placeholder="e.g. 4"
                    min="1"
                    max="10"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn btn-brand btn-wide" disabled={loading || uploadingAvatar}>
                  {loading ? (
                    <>
                      <span className="loading-spinner-xs"></span> Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeSubTab === "security" && (
            <div className="security-subpanel animate-fade">
              {/* Change Password Form */}
              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <h3 className="settings-section-title">Change Password</h3>
                <p className="settings-section-subtitle">Ensure your account is using a long, secure, and safe password.</p>

                <div className="form-group-field">
                  <label htmlFor="settings-old-pass">Current Password *</label>
                  <input 
                    type="password" 
                    id="settings-old-pass" 
                    required 
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="settings-new-pass">New Password *</label>
                  <input 
                    type="password" 
                    id="settings-new-pass" 
                    required 
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label htmlFor="settings-confirm-pass">Confirm New Password *</label>
                  <input 
                    type="password" 
                    id="settings-confirm-pass" 
                    required 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn btn-brand" disabled={loading}>
                    Update Password
                  </button>
                </div>
              </form>

              <hr className="settings-divider" />

              {/* Delete Account Danger Zone */}
              <div className="danger-zone-box">
                <h3 className="danger-title"><i className="ri-error-warning-line"></i> Danger Zone</h3>
                <p className="danger-desc">Once you delete your account, there is no going back. All of your data, academic listings, notifications, and chat records will be permanently removed.</p>
                
                <form onSubmit={handleDeleteAccountSubmit} className="delete-account-inline-form">
                  <div className="form-group-field">
                    <label htmlFor="settings-delete-pass">Confirm Account Deletion with Password</label>
                    <input 
                      type="password" 
                      id="settings-delete-pass" 
                      required 
                      placeholder="Enter your password to authorize account deletion"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-outline-danger" disabled={loading}>
                    Delete Account Permanently
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeSubTab === "seller-status" && showSellerStatus && (
            <div className="seller-status-subpanel animate-fade">
              <h3 className="settings-section-title">Seller Status & verification</h3>
              <p className="settings-section-subtitle">Manage your credentials to sell second-hand academic items.</p>
              
              {user?.sellerStatus !== "verified" ? (
                <div className="seller-application-widget">
                  <p className="application-info-text">
                    Apply to unlock the <b>Seller Dashboard. </b> Publish listings, view book request pipelines, access analytics, and sell books to SVNIT students.
                  </p>

                  <div className="seller-status-tracker-box">
                    <strong>Current Application Status:</strong>
                    <span className={`status-pill ${user?.sellerStatus}`}>
                      {user?.sellerStatus?.toUpperCase()?.replace("_", " ") || "NOT APPLIED"}
                    </span>
                  </div>

                  {user?.sellerStatus === "rejected" && (
                    <div className="dashboard-alert-banner error-banner" style={{ position: "static", marginTop: "12px", marginBottom: "16px", borderRadius: "8px" }}>
                      <p style={{ margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <strong>Rejection Reason / Remarks:</strong>
                        <span>{user?.sellerStatusComment || "Your previous application was rejected. Please re-upload a valid ID card."}</span>
                      </p>
                    </div>
                  )}

                  {(user?.sellerStatus === "not_applied" || user?.sellerStatus === "rejected" || !user?.sellerStatus) && (
                    <form className="modern-upload-form" onSubmit={handleUploadAndSubmitSeller}>
                      <div className="form-group-field">
                        <label htmlFor="id-card">Upload Student ID Card *</label>
                        <p className="field-hint">Upload a scan/photo of your SVNIT or other student ID card. (JPG, PNG, PDF supported, Max 2MB)</p>
                        <input 
                          type="file" 
                          id="id-card" 
                          accept="image/*,application/pdf"
                          required
                          onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        className="btn btn-brand btn-wide"
                        disabled={!idCardFile || isUploadingSeller}
                      >
                        {isUploadingSeller ? (
                          <>
                            <span className="loading-spinner-xs"></span> Submitting...
                          </>
                        ) : (
                          "Submit Verification Document"
                        )}
                      </button>
                    </form>
                  )}

                  {user?.sellerStatus === "pending" && (
                    <div className="pending-review-banner-alert">
                      <i className="ri-time-line animate-spin"></i>
                      <p>Our verification officers are currently auditing your student ID card upload. This typically takes 5-10 minutes. Please check back soon!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="seller-dashboard-intro">
                  <div className="icon-success-box"><i className="ri-checkbox-circle-fill"></i></div>
                  <h3>You are a Verified Seller!</h3>
                  <p>You have full access to both Buyer and Seller views. Select <b>Seller Dashboard</b> from the sidebar dropdown mode switcher to manage your listings and business analytics.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="dashboard-modal-backdrop animate-fade">
          <div className="dashboard-modal-card animate-slide-up">
            <div className="modal-header-section">
              <div className={`modal-icon-badge ${confirmType === "delete-account" ? "danger" : "warning"}`}>
                <i className={confirmType === "delete-account" ? "ri-error-warning-fill" : "ri-information-fill"}></i>
              </div>
              <h3>{confirmType === "delete-account" ? "Confirm Account Deletion" : "Confirm Password Update"}</h3>
            </div>
            
            <div className="modal-body-section">
              {confirmType === "delete-account" ? (
                <p className="modal-warning-text">
                  Are you sure you want to delete your PustakMart account? This action is <strong>irreversible</strong> and will delete all your book listings, reviews, messages, and bookmarks. You will be signed out immediately.
                </p>
              ) : (
                <p className="modal-warning-text">
                  Are you sure you want to change your password? This will update your credentials. You can continue using PustakMart with the new password.
                </p>
              )}
            </div>

            <div className="modal-footer-section">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => { setShowConfirmModal(false); setDeletePassword(""); }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={confirmType === "delete-account" ? "btn btn-outline-danger" : "btn btn-brand"}
                onClick={handleConfirmAction}
                disabled={loading}
              >
                {loading ? "Processing..." : (confirmType === "delete-account" ? "Yes, Delete Account" : "Confirm Change")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsView;
