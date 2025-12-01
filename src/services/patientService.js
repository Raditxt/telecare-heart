// src/services/patientService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const patientService = {
  // Get all patients (doctor only)
  async getAllPatients() {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all patients:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch patients');
    }
  },

  // Get doctor's patients
  async getDoctorPatients(doctorId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch doctor patients');
    }
  },

  // Get family's patients
  async getFamilyPatients(familyId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/family/${familyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching family patients:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch family patients');
    }
  },

  // Get available patients for assignment
  async getAvailablePatients(doctorId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/available/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available patients:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch available patients');
    }
  },

  // Get patient details
  async getPatient(patientId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch patient');
    }
  },

  // Get patient vitals
  async getPatientVitals(patientId, limit = 100) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/vitals/${patientId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vitals:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch vitals');
    }
  },

  // Get monitoring history (alias untuk getPatientVitals)
  async getMonitoringHistory(patientId, limit = 100) {
    return this.getPatientVitals(patientId, limit);
  },

  // Get realtime vitals (latest data)
  async getRealtimeVitals(patientId) {
    try {
      const vitals = await this.getPatientVitals(patientId, 1);
      return vitals[0] || null;
    } catch (error) {
      console.error('Error fetching realtime vitals:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch realtime vitals');
    }
  },

  // Get patients list (alias untuk getAllPatients)
  async getPatients() {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch patients');
    }
  },

  // ✅ TAMBAHKAN: Add new patient
  async addPatient(patientData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/mysql/patients`, patientData);
      return response.data;
    } catch (error) {
      console.error('Error adding patient:', error);
      throw new Error(error.response?.data?.error || 'Failed to add patient');
    }
  },

  // Assign patient to doctor
  async assignPatientToDoctor(doctorId, patientId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/mysql/patients/assign`, {
        doctorId,
        patientId
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning patient:', error);
      throw new Error(error.response?.data?.error || 'Failed to assign patient');
    }
  },

  // Add family relationship
  async addFamilyRelationship(familyId, patientId, relationship) {
    try {
      const response = await axios.post(`${API_BASE_URL}/mysql/patients/family`, {
        familyId,
        patientId,
        relationship
      });
      return response.data;
    } catch (error) {
      console.error('Error adding family relationship:', error);
      throw new Error(error.response?.data?.error || 'Failed to add family relationship');
    }
  },

  // Unassign patient from doctor
  async unassignPatientFromDoctor(doctorId, patientId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/mysql/doctor-patients/${doctorId}/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error unassigning patient:', error);
      throw new Error(error.response?.data?.error || 'Failed to unassign patient');
    }
  },

  // ✅ TAMBAHKAN: Update patient
  async updatePatient(patientId, patientData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/mysql/patients/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error(error.response?.data?.error || 'Failed to update patient');
    }
  },

  // ✅ TAMBAHKAN: Delete patient
  async deletePatient(patientId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/mysql/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete patient');
    }
  },

  // ✅ TAMBAHKAN: Search patients
  async searchPatients(query) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw new Error(error.response?.data?.error || 'Failed to search patients');
    }
  }
};

// Export individual functions untuk backward compatibility
export const getPatient = patientService.getPatient;
export const getPatientVitals = patientService.getPatientVitals;
export const getPatients = patientService.getPatients;
export const getMonitoringHistory = patientService.getMonitoringHistory;
export const getRealtimeVitals = patientService.getRealtimeVitals;

// Export functions
export const getDoctorPatients = patientService.getDoctorPatients;
export const getFamilyPatients = patientService.getFamilyPatients;
export const getAllPatients = patientService.getAllPatients;
export const getAvailablePatients = patientService.getAvailablePatients;

// ✅ TAMBAHKAN export untuk method baru
export const addPatient = patientService.addPatient;
export const assignPatientToDoctor = patientService.assignPatientToDoctor;
export const addFamilyRelationship = patientService.addFamilyRelationship;
export const unassignPatientFromDoctor = patientService.unassignPatientFromDoctor;
export const updatePatient = patientService.updatePatient;
export const deletePatient = patientService.deletePatient;
export const searchPatients = patientService.searchPatients;