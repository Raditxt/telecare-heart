import React, { useState, useEffect } from 'react';
import { Users, User, Activity } from 'lucide-react';
import webSocketService from '../../services/websocket';

const OnlineDoctors = () => {
  const [onlineDoctors, setOnlineDoctors] = useState([]);

  useEffect(() => {
    const handleDoctorStatus = (data) => {
      if (data.status === 'online') {
        setOnlineDoctors(prev => {
          const exists = prev.find(d => d.id === data.doctor_id);
          if (exists) return prev;
          return [...prev, {
            id: data.doctor_id,
            name: data.doctor_name,
            status: 'online'
          }];
        });
      } else {
        setOnlineDoctors(prev => prev.filter(d => d.id !== data.doctor_id));
      }
    };

    // Listen for doctor status updates
    webSocketService.on('doctor_status', handleDoctorStatus);

    // Initial fetch (you might want to add an API for this)
    // For now, we'll rely on WebSocket events

    return () => {
      webSocketService.off('doctor_status', handleDoctorStatus);
    };
  }, []);

  if (onlineDoctors.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Users className="h-5 w-5" />
          <span className="font-medium">Online Doctors</span>
        </div>
        <p className="text-sm text-gray-500">No doctors online</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-900">
          <Users className="h-5 w-5" />
          <span className="font-medium">Online Doctors</span>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
          {onlineDoctors.length} online
        </span>
      </div>
      
      <div className="space-y-2">
        {onlineDoctors.map((doctor) => (
          <div key={doctor.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <div className="relative">
              <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{doctor.name}</p>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-600" />
                <span className="text-xs text-gray-500">Available</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineDoctors;