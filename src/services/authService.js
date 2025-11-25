// src/services/authService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const authService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      return { 
        success: true, 
        user: response.data.user, 
        token: response.data.token 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  async register(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      return { 
        success: true, 
        user: response.data.user, 
        token: response.data.token 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  },

  async verifyToken(token) {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Token verification failed');
    }
  },

  // Tambahan method untuk patient management (doctor only)
  async getDoctorPatients(doctorId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch patients');
    }
  },

  async getFamilyPatients(familyId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients/family/${familyId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch family patients');
    }
  },

  async assignPatientToDoctor(doctorId, patientId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/patients/assign`, {
        doctorId,
        patientId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to assign patient');
    }
  },

  async updateProfile(userId, profileData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile/${userId}`, profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }
};