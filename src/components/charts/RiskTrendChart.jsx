import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const RiskTrendChart = ({ sessions }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-secondary">
        No session data available for risk trend visualization.
      </div>
    );
  }

  // Sort sessions by timestamp
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Prepare data for the chart
  const labels = sortedSessions.map((session, idx) => {
    const date = new Date(session.timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const riskScores = sortedSessions.map(s => s.riskScore);

  // Color code based on risk level
  const backgroundColors = sortedSessions.map(session => {
    if (session.riskLevel === 'HIGH') return 'rgba(239, 68, 68, 0.1)';
    if (session.riskLevel === 'MEDIUM') return 'rgba(251, 191, 36, 0.1)';
    return 'rgba(34, 197, 94, 0.1)';
  });

  const borderColors = sortedSessions.map(session => {
    if (session.riskLevel === 'HIGH') return 'rgb(239, 68, 68)';
    if (session.riskLevel === 'MEDIUM') return 'rgb(251, 191, 36)';
    return 'rgb(34, 197, 94)';
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Risk Score (%)',
        data: riskScores,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        pointBackgroundColor: borderColors,
        pointBorderColor: borderColors,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.3,
        fill: true,
      },
      // Add threshold lines
      {
        label: 'High Risk Threshold',
        data: Array(labels.length).fill(70),
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Medium Risk Threshold',
        data: Array(labels.length).fill(40),
        borderColor: 'rgba(251, 191, 36, 0.3)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              const session = sortedSessions[context.dataIndex];
              return [
                `Risk Score: ${context.parsed.y.toFixed(1)}%`,
                `Risk Level: ${session.riskLevel}`,
                `SAC: ${session.sac.toFixed(4)}`,
                `IES: ${session.ies.toFixed(4)}`
              ];
            }
            return context.dataset.label + ': ' + context.parsed.y;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Risk Score (%)',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        title: {
          display: true,
          text: 'Session Date',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default RiskTrendChart;
