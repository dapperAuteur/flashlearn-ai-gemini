/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { IStudyAnalytics } from '@/types';

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<IStudyAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics data.');
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading Analytics...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  if (analyticsData.length === 0) {
    return (
        <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No Analytics Data</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Study a set to see your performance here.</p>
        </div>
    );
  }
  
  // Find the set with the most history for the performance chart
  const mainChartData = analyticsData.reduce((prev, current) => (prev.performanceHistory.length > current.performanceHistory.length) ? prev : current);


  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        My Performance
      </h1>

      {/* Overall Set Accuracy Chart */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Overall Set Accuracy (%)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.map(d => ({ name: d.set.title, accuracy: d.setPerformance.averageScore.toFixed(2) }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="accuracy" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Over Time Chart */}
       <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Performance Over Time: {mainChartData.set.title}</h2>
         <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mainChartData.performanceHistory.map(h => ({ name: (h.date instanceof Date ? h.date : h.date.toDate()).toLocaleDateString(), accuracy: h.accuracy.toFixed(2) }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="accuracy" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
