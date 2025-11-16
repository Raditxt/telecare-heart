import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider";
import AlertProvider from "./contexts/AlertProvider"; // ✅ Tambahkan AlertProvider
import RequireAuth from "./components/RequireAuth";
import DashboardLayout from "./components/Layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import PatientList from "./pages/Dashboard/PatientList";
import PatientDetail from "./pages/Dashboard/PatientDetail";
import HistoryAnalytics from "./pages/Dashboard/HistoryAnalytics";
import DeviceMonitoring from "./pages/Dashboard/DeviceMonitoring";
import UserProfile from "./pages/Dashboard/UserProfile";

function App() {
  return (
    <AuthProvider>
      <AlertProvider> {/* ✅ Wrap dengan AlertProvider */}
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes with Dashboard Layout */}
            <Route path="/" element={
              <RequireAuth>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </RequireAuth>
            } />
            <Route path="/dashboard" element={
              <RequireAuth>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </RequireAuth>
            } />
            <Route path="/patients" element={
              <RequireAuth>
                <DashboardLayout>
                  <PatientList />
                </DashboardLayout>
              </RequireAuth>
            } />
            <Route path="/patients/:id" element={
              <RequireAuth>
                <DashboardLayout>
                  <PatientDetail />
                </DashboardLayout>
              </RequireAuth>
            } />
            <Route path="/history" element={
              <RequireAuth>
                <DashboardLayout>
                  <HistoryAnalytics />
                </DashboardLayout>
              </RequireAuth>
            } />
            <Route path="/device" element={
              <RequireAuth>
                <DashboardLayout>
                  <DeviceMonitoring />
                </DashboardLayout>
              </RequireAuth>
            } />
            <Route path="/profile" element={
              <RequireAuth>
                <DashboardLayout>
                  <UserProfile />
                </DashboardLayout>
              </RequireAuth>
            } />
            
            {/* Default redirect */}
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;