// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider";
import AlertProvider from "./contexts/AlertProvider";
import RequireAuth from "./components/RequireAuth";
import DashboardLayout from "./components/Layout/Layout";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

// Common Dashboard Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import UserProfile from "./pages/Dashboard/UserProfile";
import SystemTest from "./components/SystemTest";

// Doctor-Specific Pages
import PatientList from "./pages/Dashboard/PatientList";
import PatientDetail from "./pages/Dashboard/PatientDetail";
import HistoryAnalytics from "./pages/Dashboard/HistoryAnalytics";
import DeviceMonitoring from "./pages/Dashboard/DeviceMonitoring";
import PatientManagement from "./pages/Dashboard/PatientManagement";

// Family-Specific Pages
import FamilyDashboard from "./pages/FamilyDashboard/FamilyDashboard";
import FamilyPatientList from "./pages/FamilyDashboard/FamilyPatientList";
import FamilyPatientDetail from "./pages/FamilyDashboard/FamilyPatientDetail";
import FamilyMonitoring from "./pages/FamilyDashboard/FamilyMonitoring";
import FamilyHistory from "./pages/FamilyDashboard/FamilyHistory";
import FamilyProfile from "./pages/FamilyDashboard/FamilyProfile";

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Root Redirect based on Role */}
            <Route path="/" element={
              <RequireAuth>
                {(user) => (
                  user?.role === 'family' 
                    ? <Navigate to="/family-dashboard" replace />
                    : <Navigate to="/dashboard" replace />
                )}
              </RequireAuth>
            } />
            
            {/* ========== DOCTOR ROUTES ========== */}
            
            {/* Dashboard - Only for Doctors */}
            <Route path="/dashboard" element={
              <RequireAuth requiredRole="doctor">
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Patient List - Doctors see ALL patients */}
            <Route path="/patients" element={
              <RequireAuth requiredRole="doctor">
                <DashboardLayout>
                  <PatientList />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Patient Detail - Doctors can access all patients */}
            <Route path="/patients/:id" element={
              <RequireAuth requiredRole="doctor" requirePatientAccess={true}>
                <DashboardLayout>
                  <PatientDetail />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* History & Analytics - Doctors have full access */}
            <Route path="/history" element={
              <RequireAuth requiredRole="doctor">
                <DashboardLayout>
                  <HistoryAnalytics />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Device Monitoring - Mainly for doctors */}
            <Route path="/device" element={
              <RequireAuth requiredRole="doctor">
                <DashboardLayout>
                  <DeviceMonitoring />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Patient Management - Only for doctors */}
            <Route path="/manage-patients" element={
              <RequireAuth requiredRole="doctor">
                <DashboardLayout>
                  <PatientManagement />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* ========== FAMILY ROUTES ========== */}
            
            {/* Family Dashboard */}
            <Route path="/family-dashboard" element={
              <RequireAuth requiredRole="family">
                <DashboardLayout>
                  <FamilyDashboard />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Family Patient List - Only their assigned patients */}
            <Route path="/family/patients" element={
              <RequireAuth requiredRole="family">
                <DashboardLayout>
                  <FamilyPatientList />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Family Patient Detail */}
            <Route path="/family/patients/:patientId" element={
              <RequireAuth requiredRole="family" requirePatientAccess={true}>
                <DashboardLayout>
                  <FamilyPatientDetail />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Family Patient Monitoring */}
            <Route path="/family/patients/:patientId/monitoring" element={
              <RequireAuth requiredRole="family" requirePatientAccess={true}>
                <DashboardLayout>
                  <FamilyMonitoring />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Family History - Limited to their patients */}
            <Route path="/family/history" element={
              <RequireAuth requiredRole="family">
                <DashboardLayout>
                  <FamilyHistory />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* Family Profile */}
            <Route path="/family/profile" element={
              <RequireAuth requiredRole="family">
                <DashboardLayout>
                  <FamilyProfile />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* ========== COMMON ROUTES ========== */}
            
            {/* Common Profile (fallback) */}
            <Route path="/profile" element={
              <RequireAuth>
                {(user) => (
                  user?.role === 'family' 
                    ? <Navigate to="/family/profile" replace />
                    : <DashboardLayout><UserProfile /></DashboardLayout>
                )}
              </RequireAuth>
            } />

            {/* System Test - Accessible by all authenticated users */}
            <Route path="/system-test" element={
              <RequireAuth>
                <DashboardLayout>
                  <SystemTest />
                </DashboardLayout>
              </RequireAuth>
            } />
            
            {/* Catch all - Redirect based on role */}
            <Route path="*" element={
              <RequireAuth>
                {(user) => (
                  user?.role === 'family' 
                    ? <Navigate to="/family-dashboard" replace />
                    : <Navigate to="/dashboard" replace />
                )}
              </RequireAuth>
            } />
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;