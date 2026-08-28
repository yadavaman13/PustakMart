import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppRoutes from './app/app.routes.jsx';
import useAuth from './features/auth/hooks/useAuth.js';
import MaintenancePage from './features/shared/components/MaintenancePage.jsx';

const App = () => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await axios.get('/api/system/maintenance');
      if (response.data && response.data.success) {
        setMaintenance(response.data.data);
      } else {
        setMaintenance({ enabled: false, message: '', startedAt: null, isAdmin: false });
      }
    } catch (error) {
      console.error("Failed to fetch maintenance status:", error);
      // Fail-open: if the request fails (e.g. route missing or offline), default to false
      setMaintenance({ enabled: false, message: '', startedAt: null, isAdmin: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMaintenanceStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="auth-loader">
        <div className="spinner"></div>
        <p>Connecting to PustakMart...</p>
      </div>
    );
  }

  // Backdoor: Allow access to login/verify pages for administrators to authenticate
  const isAuthPath = window.location.pathname === "/auth" || window.location.pathname === "/verify-email";

  if (maintenance && maintenance.enabled && !maintenance.isAdmin && !isAuthPath) {
    return (
      <MaintenancePage
        message={maintenance.message}
        startedAt={maintenance.startedAt}
        onRetry={checkMaintenanceStatus}
      />
    );
  }

  return (
    <AppRoutes />
  );
};

export default App;