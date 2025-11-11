import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Topbar */}
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />
        
        {/* Page Content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}