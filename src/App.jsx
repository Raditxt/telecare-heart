import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./contexts/AuthProvider";
import RequireAuth from "./components/RequireAuth";
import DashboardLayout from "./components/Layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import PatientList from "./pages/Dashboard/PatientList";
import PatientDetail from "./pages/Dashboard/PatientDetail";
import RealtimeMonitor from "./pages/Dashboard/RealtimeMonitor";
import MonitoringHistory from "./pages/Dashboard/MonitoringHistory";
import UserProfile from "./pages/Dashboard/UserProfile";

function App() {
  return (
    <AuthProvider>
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
          <Route path="/monitor" element={
            <RequireAuth>
              <DashboardLayout>
                <RealtimeMonitor />
              </DashboardLayout>
            </RequireAuth>
          } />
          <Route path="/history" element={
            <RequireAuth>
              <DashboardLayout>
                <MonitoringHistory />
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
    </AuthProvider>
  );
}

export default App;