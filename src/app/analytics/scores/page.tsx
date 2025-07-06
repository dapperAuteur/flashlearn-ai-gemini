/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface ScoreSummary {
  overallCorrect: number;
  dailyCorrect: number;
  weeklyCorrect: number;
  monthlyCorrect: number;
  topSetsByScore: { title: string; correctCount: number }[];
  bottomSetsByScore: { title: string; correctCount: number }[];
  allSetsByScore: { title: string; correctCount: number }[];
}

const StatCard = ({ title, value }: { title: string; value: string }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</p>
    </div>
);

const SetListByScore = ({ title, sets }: { title: string, sets: { title: string; correctCount: number }[]}) => (
    <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <ul className="space-y-3">
            {sets.map((s, i) => (
                <li key={i} className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{s.title}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{s.correctCount} Correct</span>
                </li>
            ))}
        </ul>
    </div>
);


export default function ScoreSummaryPage() {
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/score-summary');
        if (!response.ok) throw new Error('Failed to fetch score summary.');
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
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading Score Report...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  if (!summary || summary.allSetsByScore.length === 0) {
    return (
        <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Not Enough Data</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Complete a few study sessions to see your score report.</p>
        </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Score Report
            </h1>
             <Link href="/dashboard" className="text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                &larr; Back to Dashboard
            </Link>
        </div>

      {/* Correct Count Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Correct Today" value={`${summary.dailyCorrect}`} />
        <StatCard title="Correct This Week" value={`${summary.weeklyCorrect}`} />
        <StatCard title="Correct This Month" value={`${summary.monthlyCorrect}`} />
        <StatCard title="Correct All Time" value={`${summary.overallCorrect}`} />
      </div>

      {/* Top and Bottom Sets */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SetListByScore title="Top Sets by Score" sets={summary.topSetsByScore} />
        <SetListByScore title="Lowest Scored Sets" sets={summary.bottomSetsByScore} />
      </div>

      {/* Overall Set Scores Chart */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Total Correct Answers per Set</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={summary.allSetsByScore} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.3)" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="title" width={150} />
            <Tooltip cursor={{fill: 'rgba(238,237,254,0.5)'}}/>
            <Legend />
            <Bar dataKey="correctCount" name="Correct Answers" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
