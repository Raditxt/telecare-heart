import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const patientService = {
  // Get all patients (doctor only)
  async getAllPatients() {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch patients');
    }
  },

  // Get doctor's assigned patients
  async getDoctorPatients(doctorId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch doctor patients');
    }
  },

  // Get family's assigned patients
  async getFamilyPatients(familyId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/family/${familyId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch family patients');
    }
  },

  // Get patient details
  async getPatient(patientId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients/${patientId}`);
      return response.data;
    } catch (error) {
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
      throw new Error(error.response?.data?.error || 'Failed to fetch realtime vitals');
    }
  },

  // Get patients list
  async getPatients() {
    try {
      const response = await axios.get(`${API_BASE_URL}/mysql/patients`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch patients');
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
      throw new Error(error.response?.data?.error || 'Failed to add family relationship');
    }
  }
};

// Export individual functions untuk backward compatibility
export const getPatient = patientService.getPatient;
export const getPatientVitals = patientService.getPatientVitals;
export const getPatients = patientService.getPatients;
export const getMonitoringHistory = patientService.getMonitoringHistory;
export const getRealtimeVitals = patientService.getRealtimeVitals;