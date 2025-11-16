// components/Charts/VitalTrendChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function VitalTrendChart({ data, color, height = 250, range, unit }) {
  const [minRange, maxRange] = range;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[minRange, maxRange]}
            tick={{ fontSize: 11 }}
          />
          <Tooltip 
            formatter={(value) => [`${value} ${unit}`, 'Value']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <ReferenceLine y={minRange} stroke="#ef4444" strokeDasharray="3 3" />
          <ReferenceLine y={maxRange} stroke="#ef4444" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}