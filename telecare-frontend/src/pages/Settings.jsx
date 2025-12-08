import React, { useState } from 'react';
import  useAuth  from '../hooks/useAuth';
import { 
  User, Bell, Shield, Wifi, Download,
  Save, LogOut, Moon, Sun
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    warningAlerts: true,
    emailNotifications: false,
    pushNotifications: true
  });
  const [theme, setTheme] = useState('light');

  const handleProfileUpdate = async () => {
    const result = await updateProfile(profileData);
    if (result.success) {
      toast.success('Profile updated successfully');
    }
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive an email shortly.');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-8">Manage your account and preferences</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'devices', label: 'IoT Devices', icon: Wifi },
              { id: 'data', label: 'Data & Privacy', icon: Download }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left ${
                  activeTab === item.id
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Theme Toggle */}
          <div className="mt-8 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Theme</span>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <Moon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {theme === 'light' ? 'Light mode' : 'Dark mode'} enabled
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="input-field bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="input-field"
                      placeholder="081234567890"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role === 'doctor' ? '👨‍⚕️ Doctor' : '👨‍👩‍👧‍👦 Family Member'}
                      disabled
                      className="input-field bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Critical Alerts</p>
                      <p className="text-sm text-gray-600">Immediate notifications for critical patient conditions</p>
                    </div>
                    <button
                      onClick={() => setNotifications({...notifications, criticalAlerts: !notifications.criticalAlerts})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notifications.criticalAlerts ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notifications.criticalAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Warning Alerts</p>
                      <p className="text-sm text-gray-600">Notifications for patient warnings</p>
                    </div>
                    <button
                      onClick={() => setNotifications({...notifications, warningAlerts: !notifications.warningAlerts})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notifications.warningAlerts ? 'bg-yellow-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notifications.warningAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-600">Browser push notifications</p>
                    </div>
                    <button
                      onClick={() => setNotifications({...notifications, pushNotifications: !notifications.pushNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notifications.pushNotifications ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input type="password" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input type="password" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input type="password" className="input-field" />
                    </div>
                    <button className="btn-primary">Update Password</button>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-600">Chrome on Windows • Just now</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Active</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Mobile Session</p>
                        <p className="text-sm text-gray-600">Safari on iPhone • 2 hours ago</p>
                      </div>
                      <button className="text-sm text-red-600 hover:text-red-700">Revoke</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IoT Devices Tab */}
          {activeTab === 'devices' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                IoT Device Management
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Connected Devices</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Wifi className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">ESP32 Heart Monitor</p>
                          <p className="text-sm text-gray-600">Device ID: ESP32-001 • Last seen: 2 minutes ago</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Online</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Device API Key</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">arduino-telecare-secret-key-2024</span>
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use this key in your IoT device configuration
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy Tab */}
          {activeTab === 'data' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data & Privacy
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Data Export</h3>
                  <p className="text-gray-600 mb-4">
                    Download all your data including patient records, vital readings, and activity logs.
                  </p>
                  <button
                    onClick={handleExportData}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Request Data Export
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    You will receive an email with download links within 24 hours.
                  </p>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Account Deletion</h3>
                  <p className="text-gray-600 mb-4">
                    Deleting your account will permanently remove all your data from our systems.
                    This action cannot be undone.
                  </p>
                  <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;