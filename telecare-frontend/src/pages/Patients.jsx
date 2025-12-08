import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PatientList from '../components/patients/PatientList';
import PatientForm from '../components/patients/PatientForm';
import PatientDetail from '../components/patients/PatientDetail';

const Patients = () => {
  return (
    <Routes>
      <Route index element={<PatientList />} />
      <Route path="new" element={<PatientForm />} />
      <Route path=":id" element={<PatientDetail />} />
      <Route path=":id/edit" element={<PatientForm />} />
    </Routes>
  );
};

export default Patients;