/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

// Define the structure of the data we expect from the API
interface AnalyticsSummary {
  overallAverage: number;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  topSets: { title: string; accuracy: number }[];
  bottomSets: { title:string; accuracy: number }[];
  allSets: { title: string; accuracy: number }[];
}

// A reusable component for displaying a single stat
const StatCard = ({ title, value }: { title: string; value: string }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</p>
    </div>
);

// A reusable component for displaying a list of sets
const SetList = ({ title, sets }: { title: string, sets: { title: string; accuracy: number }[]}) => (
    <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <ul className="space-y-3">
            {sets.map((s, i) => (
                <li key={i} className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{s.title}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{s.accuracy.toFixed(1)}%</span>
                </li>
            ))}
        </ul>
    </div>
);


export default function AnalyticsSummaryPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/summary');
        if (!response.ok) throw new Error('Failed to fetch analytics summary.');
        const data = await response.json();
        setSummary(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading Analytics Summary...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  if (!summary || summary.allSets.length === 0) {
    return (
        <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Not Enough Data</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Complete a few study sessions to see your performance summary.</p>
        </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Analytics Summary
            </h1>
             <Link href="/dashboard" className="text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                &larr; Back to Dashboard
            </Link>
        </div>

      {/* Average Score Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Daily Average" value={`${summary.dailyAverage.toFixed(1)}%`} />
        <StatCard title="Weekly Average" value={`${summary.weeklyAverage.toFixed(1)}%`} />
        <StatCard title="Monthly Average" value={`${summary.monthlyAverage.toFixed(1)}%`} />
        <StatCard title="Overall Average" value={`${summary.overallAverage.toFixed(1)}%`} />
      </div>

      {/* Top and Bottom Sets */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SetList title="Top Performing Sets" sets={summary.topSets} />
        <SetList title="Sets Needing Review" sets={summary.bottomSets} />
      </div>

      {/* Overall Set Accuracy Chart */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">All Sets Accuracy (%)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={summary.allSets} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.3)" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="title" width={150} />
            <Tooltip cursor={{fill: 'rgba(238,237,254,0.5)'}}/>
            <Legend />
            <Bar dataKey="accuracy" name="Accuracy" fill="#8884d8" background={{ fill: '#eee' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
