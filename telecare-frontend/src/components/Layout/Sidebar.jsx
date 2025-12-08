import React from 'react';
import { NavLink } from 'react-router-dom';
import  useAuth  from '../../hooks/useAuth';
import { 
  LayoutDashboard, Users, Activity, 
  Bell, FileText, Settings, Heart,
  PlusCircle, BarChart3
} from 'lucide-react';

const Sidebar = () => {
  const { isDoctor } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['doctor', 'family']
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: <Users className="h-5 w-5" />,
      roles: ['doctor', 'family']
    },
    {
      name: 'Live Monitoring',
      path: '/monitoring',
      icon: <Activity className="h-5 w-5" />,
      roles: ['doctor', 'family']
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: <Bell className="h-5 w-5" />,
      roles: ['doctor']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <FileText className="h-5 w-5" />,
      roles: ['doctor']
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ['doctor']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: ['doctor', 'family']
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(isDoctor ? 'doctor' : 'family')
  );

  return (
    <aside className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Heart className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-500">Frequently used features</p>
            </div>
          </div>
          
          {isDoctor && (
            <NavLink
              to="/patients/new"
              className="flex items-center gap-2 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors mb-3"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="font-medium">Add New Patient</span>
            </NavLink>
          )}
        </div>

        <nav className="space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* System Status */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">System Status</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">IoT Devices</span>
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">WebSocket</span>
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;