import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import  useAuth  from '../../hooks/useAuth';
import { 
  Bell, LogOut, User, Menu, X, 
  Activity, Heart, Settings 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Header = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const getRoleBadge = () => {
    if (user?.role === 'doctor') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          👨‍⚕️ Doctor
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        👨‍👩‍👧‍👦 Family
      </span>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            <Link to="/dashboard" className="ml-4 lg:ml-0 flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Telecare Heart</h1>
                <p className="text-xs text-gray-500">Real-time Monitoring</p>
              </div>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Connection Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="h-8 w-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                  <div className="px-4 py-3 border-b">
                    <div className="font-medium text-gray-900">{user?.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      {user?.email}
                      {getRoleBadge()}
                    </div>
                  </div>
                  
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                  
                  <Link
                    to="/monitoring"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Activity className="h-5 w-5" />
                    <span>Live Monitoring</span>
                  </Link>
                  
                  <div className="border-t mt-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Activity className="h-5 w-5" />
              Dashboard
            </Link>
            
            <Link
              to="/patients"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="h-5 w-5" />
              Patients
            </Link>
            
            <Link
              to="/monitoring"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Activity className="h-5 w-5" />
              Live Monitoring
            </Link>
            
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;