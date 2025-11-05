import React from "react";
import { useAuth } from "../hooks/useAuth"; // ✅ Import useAuth dari hooks
import { logout } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Welcome, {user?.email}</h1>
        <button 
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-green-100 rounded">HR: -- bpm</div>
        <div className="p-4 bg-green-100 rounded">SpO₂: -- %</div>
        <div className="p-4 bg-green-100 rounded">Temp: -- °C</div>
        <div className="p-4 bg-green-100 rounded">Status: --</div>
      </div>
      <div className="mt-6 p-4 bg-white shadow rounded">
        <h2 className="text-xl font-semibold mb-2">EKG Waveform</h2>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}