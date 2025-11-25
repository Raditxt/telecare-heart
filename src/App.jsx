// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider";
import AlertProvider from "./contexts/AlertProvider";
import RequireAuth from "./components/RequireAuth";
import RoleBasedRoute from "./components/RoleBasedRoute";
import DashboardLayout from "./components/Layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard/Dashboard";
import PatientList from "./pages/Dashboard/PatientList";
import PatientDetail from "./pages/Dashboard/PatientDetail";
import HistoryAnalytics from "./pages/Dashboard/HistoryAnalytics";
import DeviceMonitoring from "./pages/Dashboard/DeviceMonitoring";
import UserProfile from "./pages/Dashboard/UserProfile";
import PatientManagement from "./pages/Dashboard/PatientManagement"; // New page for doctors
import SystemTest from "./components/SystemTest"; // Import SystemTest component

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
            
            {/* Protected Routes dengan Role-Based Access */}
            
            {/* Dashboard - accessible by all authenticated users */}
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

            {/* Patient List - Doctors see all assigned patients, Family see only their patients */}
            <Route path="/patients" element={
              <RoleBasedRoute allowedRoles={['doctor', 'family']}>
                <DashboardLayout>
                  <PatientList />
                </DashboardLayout>
              </RoleBasedRoute>
            } />

            {/* Patient Detail - Accessible only if user has permission for that patient */}
            <Route path="/patients/:id" element={
              <RoleBasedRoute requirePatientAccess={true}>
                <DashboardLayout>
                  <PatientDetail />
                </DashboardLayout>
              </RoleBasedRoute>
            } />

            {/* History & Analytics - Doctors have full access, Family limited to their patients */}
            <Route path="/history" element={
              <RoleBasedRoute allowedRoles={['doctor', 'family']}>
                <DashboardLayout>
                  <HistoryAnalytics />
                </DashboardLayout>
              </RoleBasedRoute>
            } />

            {/* Device Monitoring - Mainly for doctors, but family can view if they have access */}
            <Route path="/device" element={
              <RoleBasedRoute allowedRoles={['doctor', 'family']}>
                <DashboardLayout>
                  <DeviceMonitoring />
                </DashboardLayout>
              </RoleBasedRoute>
            } />

            {/* Patient Management - Only for doctors */}
            <Route path="/manage-patients" element={
              <RoleBasedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <PatientManagement />
                </DashboardLayout>
              </RoleBasedRoute>
            } />

            {/* Profile - Accessible by all */}
            <Route path="/profile" element={
              <RequireAuth>
                <DashboardLayout>
                  <UserProfile />
                </DashboardLayout>
              </RequireAuth>
            } />

            {/* System Test Route - Accessible by all authenticated users for testing purposes */}
            <Route path="/system-test" element={
              <RequireAuth>
                <DashboardLayout>
                  <SystemTest />
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