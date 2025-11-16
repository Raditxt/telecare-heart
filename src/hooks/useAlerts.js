// hooks/useAlerts.js
import { useContext } from 'react';
import AlertContext from '../contexts/alertContext';

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}