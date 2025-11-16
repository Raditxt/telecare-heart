import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => {
    console.log('Toggling sidebar:', !sidebarOpen); // Debug log
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    console.log('Closing sidebar'); // Debug log
    setSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        onToggle={toggleSidebar}
      />
      
      {/* Main Content */}
      <div className={`${styles.mainContent} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        {/* Topbar */}
        <Topbar 
          onMenuClick={toggleSidebar}
          user={user}
          sidebarOpen={sidebarOpen}
        />
        
        {/* Page Content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}