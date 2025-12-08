import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import { Save, ArrowLeft, User, Calendar, Phone, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PatientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    patient_id: '',
    name: '',
    date_of_birth: '',
    age: '',
    gender: '',
    room: '',
    condition: '',
    address: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const response = await patientsApi.getById(id);
      const patient = response.data.patient;
      
      setFormData({
        patient_id: patient.patient_id || '',
        name: patient.name || '',
        date_of_birth: patient.date_of_birth || '',
        age: patient.age || '',
        gender: patient.gender || '',
        room: patient.room || '',
        condition: patient.condition || '',
        address: patient.address || '',
        phone: patient.phone || ''
      });
    } catch (error) {
      toast.error('Failed to load patient data');
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate age from date of birth
    if (name === 'date_of_birth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({
        ...prev,
        age: age.toString()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (isEdit) {
        await patientsApi.update(id, formData);
        toast.success('Patient updated successfully');
      } else {
        await patientsApi.create(formData);
        toast.success('Patient created successfully');
      }
      navigate('/patients');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6" />
          {isEdit ? 'Edit Patient' : 'Add New Patient'}
        </h1>
        <p className="text-gray-600">
          {isEdit ? 'Update patient information' : 'Register a new patient for monitoring'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID {!isEdit && <span className="text-gray-400">(Auto-generated if empty)</span>}
              </label>
              <input
                type="text"
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                className="input-field"
                placeholder="PAT123456"
                disabled={isEdit}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="input-field"
                placeholder="45"
                min="0"
                max="150"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Number
              </label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="input-field"
                placeholder="ICU-101"
              />
            </div>
          </div>
        </div>

        {/* Contact & Medical Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact & Medical Information</h2>
          
          <div className="space-y-6">
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Condition
              </label>
              <textarea
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Hypertension, post-operative care, etc."
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="input-field"
                placeholder="Jl. Example No. 123, Jakarta"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="081234567890"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? 'Update Patient' : 'Create Patient'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;