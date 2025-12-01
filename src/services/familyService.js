// src/services/familyService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const familyService = {
  // Assign family to patient (Doctor only)
  async assignFamilyToPatient(doctorId, familyEmail, patientId, relationship) {
    try {
      const response = await axios.post(`${API_BASE_URL}/family/assign-family`, {
        doctorId,
        familyEmail,
        patientId,
        relationship
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning family to patient:', error);
      throw new Error(error.response?.data?.error || 'Failed to assign family to patient');
    }
  },

  // Get family members for a patient
  async getPatientFamilies(patientId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/family/patients/${patientId}/families`);
      return response.data;
    } catch (error) {
      console.error('Error getting patient families:', error);
      throw new Error(error.response?.data?.error || 'Failed to get patient families');
    }
  },

  // Remove family access
  async removeFamilyAccess(familyId, patientId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/family/families/${familyId}/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing family access:', error);
      throw new Error(error.response?.data?.error || 'Failed to remove family access');
    }
  },

  // Get family's patients (for family user)
  async getFamilyPatients(familyId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/family/${familyId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting family patients:', error);
      throw new Error(error.response?.data?.error || 'Failed to get family patients');
    }
  },

  // ✅ TAMBAHKAN: Get all family users (for dropdown)
  async getFamilyUsers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/family/users`);
      return response.data;
    } catch (error) {
      console.error('Error getting family users:', error);
      throw new Error(error.response?.data?.error || 'Failed to get family users');
    }
  },

  // ✅ TAMBAHKAN: Get family assignments
  async getFamilyAssignments(familyId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/family/families/${familyId}/assignments`);
      return response.data;
    } catch (error) {
      console.error('Error getting family assignments:', error);
      throw new Error(error.response?.data?.error || 'Failed to get family assignments');
    }
  }
};