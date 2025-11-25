// src/contexts/AuthContext.js
import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => ({ success: false, error: '' }),
  register: async () => ({ success: false, error: '' }),
  logout: () => {},
  updateUser: () => {},
  refreshUserData: async () => {},
  hasPermission: () => false,
  isDoctor: () => false,
  isFamily: () => false,
  isAdmin: () => false,
  getDisplayName: () => '',
  getRoleDisplay: () => ''
});