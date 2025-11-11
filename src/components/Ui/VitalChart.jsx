import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

export default function VitalChart({ data, type = 'line' }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: type,
        data: {
          labels: data.map(d => d.timestamp.toLocaleTimeString()),
          datasets: [{
            label: 'Heart Rate',
            data: data.map(d => d.hr),
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              min: 50,
              max: 120
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type]);

  return <canvas ref={chartRef} />;
}