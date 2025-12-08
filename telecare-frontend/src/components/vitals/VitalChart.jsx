import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const VitalChart = ({ data, type = 'line', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available for chart
      </div>
    );
  }

  const chartData = data.map(item => {
    // Helper function untuk parse angka dengan aman
    const parseSafeNumber = (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    const tempValue = parseSafeNumber(item.avg_temperature || item.temperature);
    
    return {
      date: new Date(item.date || item.hour || Date.now()).toLocaleDateString('id-ID', { 
        month: 'short', 
        day: 'numeric',
        ...(item.hour && { hour: '2-digit' })
      }),
      heart_rate: Math.round(parseSafeNumber(item.avg_heart_rate || item.heart_rate)),
      spo2: Math.round(parseSafeNumber(item.avg_spo2 || item.spo2)),
      temperature: parseFloat(tempValue.toFixed(1)),
      critical: parseSafeNumber(item.critical_count || 0),
      warning: parseSafeNumber(item.warning_count || 0)
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value} {entry.name === 'temperature' ? '°C' : entry.name === 'spo2' ? '%' : 'BPM'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="critical" fill="#ef4444" name="Critical Alerts" />
          <Bar yAxisId="left" dataKey="warning" fill="#f59e0b" name="Warnings" />
          <Line yAxisId="right" type="monotone" dataKey="heart_rate" stroke="#0ea5e9" name="Heart Rate (BPM)" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="heart_rate" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} name="Heart Rate" />
          <Area type="monotone" dataKey="spo2" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="SpO2" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default line chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="heart_rate"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Heart Rate (BPM)"
        />
        <Line
          type="monotone"
          dataKey="spo2"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="SpO2 (%)"
        />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Temperature (°C)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default VitalChart;