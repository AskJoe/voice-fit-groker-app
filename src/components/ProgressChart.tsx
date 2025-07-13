import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProgressChartProps {
  logs: any[];
}

export function ProgressChart({ logs }: ProgressChartProps) {
  // Prepare data for the chart
  const weightData = logs
    .filter(log => log.data.weight)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(log => ({
      date: new Date(log.date).toLocaleDateString(),
      weight: log.data.weight
    }));

  // If no data, show placeholder
  if (weightData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No weight data yet</p>
          <p className="text-sm">Start logging your weight to see progress!</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: weightData.map(d => d.date),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: weightData.map(d => d.weight),
        borderColor: 'hsl(210, 100%, 56%)',
        backgroundColor: 'hsl(210, 100%, 56%, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'hsl(210, 100%, 56%)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Target Weight',
        data: Array(weightData.length).fill(210),
        borderColor: 'hsl(150, 100%, 40%)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'hsl(210, 100%, 56%)',
        borderWidth: 1
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Weight (lbs)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        min: Math.min(...weightData.map(d => d.weight), 210) - 5,
        max: Math.max(...weightData.map(d => d.weight)) + 5
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}