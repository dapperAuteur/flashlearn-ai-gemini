/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useRef } from 'react';
// import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import html2canvas from 'html2canvas';

// --- Type Definitions ---
type UserStats = { totalCorrect: number; averageAccuracy: number; };
type UserRank = { userId: string; name: string; rank: number; daily: UserStats; weekly: UserStats; monthly: UserStats; overall: UserStats; };
type LeaderboardData = { top10: UserRank[]; currentUser?: UserRank; };
type LeaderboardCategory = { daily: LeaderboardData; weekly: LeaderboardData; monthly: LeaderboardData; overall: LeaderboardData; };
type SetLeaderboard = { setTitle: string; percentage: LeaderboardCategory; score: LeaderboardCategory; };

// --- Reusable Components ---
const ShareButton = ({ listRef, listTitle }: { listRef: React.RefObject<HTMLDivElement>, listTitle: string }) => {
    const share = async () => {
        if (!listRef.current) return;
        try {
            const canvas = await html2canvas(listRef.current, { backgroundColor: '#111827', useCORS: true });
            const blob = await canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], `${listTitle.replace(/ /g, '_')}_leaderboard.png`, { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: `Leaderboard: ${listTitle}` });
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${listTitle.replace(/ /g, '_')}_leaderboard.png`;
                    link.click();
                }
            });
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Could not share the image.');
        }
    };
    return <button onClick={share} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Share</button>;
};

const SetLeaderboardList = ({ data, metric, timeframe, currentUser, title }: { data: UserRank[], metric: 'percentage' | 'score', timeframe: 'daily' | 'weekly' | 'monthly' | 'overall', currentUser?: UserRank, title: string }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const metricKey = metric === 'percentage' ? 'averageAccuracy' : 'totalCorrect';

    return (
        <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                <ShareButton listRef={listRef} listTitle={title} />
            </div>
            <div ref={listRef} className="p-4 bg-white dark:bg-gray-900">
                <ul className="space-y-3">
                    {data.map((user) => (
                        <li key={user.userId} className={`flex justify-between items-center p-2 rounded-md ${user.userId === currentUser?.userId ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}>
                            <div className="flex items-center gap-x-4">
                                <span className="font-bold text-gray-500 dark:text-gray-400 w-6 text-center">{user.rank}</span>
                                <span className="text-gray-700 dark:text-gray-300 truncate">{user.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {metric === 'percentage' ? `${user[timeframe][metricKey].toFixed(1)}%` : user[timeframe][metricKey]}
                            </span>
                        </li>
                    ))}
                    {currentUser && currentUser.rank > 10 && (
                        <>
                            <li className="text-center text-gray-500">...</li>
                            <li className="flex justify-between items-center p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/50">
                                <div className="flex items-center gap-x-4">
                                    <span className="font-bold text-gray-500 dark:text-gray-400 w-6 text-center">{currentUser.rank}</span>
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{currentUser.name}</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {metric === 'percentage' ? `${currentUser[timeframe][metricKey].toFixed(1)}%` : currentUser[timeframe][metricKey]}
                                </span>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function SetLeaderboardPage() {
    const params = useParams();
    const setId = params.setId as string;
    const [leaderboard, setLeaderboard] = useState<SetLeaderboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'percentage' | 'score'>('score');
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'overall'>('overall');

    useEffect(() => {
        if (!setId) return;
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/leaderboard/${setId}`);
                if (!response.ok) throw new Error('Failed to fetch leaderboard data.');
                const data = await response.json();
                setLeaderboard(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [setId]);

    if (isLoading) return <div className="text-center py-12">Loading Set Leaderboard...</div>;
    if (!leaderboard) return <div className="text-center py-12">Could not load data for this set.</div>;

    const currentData = leaderboard[view][timeframe];
    const title = `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} ${view === 'percentage' ? 'Performance' : 'Top Scores'}`;

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Set Leaderboard</h1>
                <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">{leaderboard.setTitle}</p>
            </div>
            <div className="flex flex-wrap gap-4">
                <div className="flex p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <button onClick={() => setView('score')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'score' ? 'bg-white dark:bg-gray-900' : ''}`}>Top Score</button>
                    <button onClick={() => setView('percentage')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'percentage' ? 'bg-white dark:bg-gray-900' : ''}`}>Top Performance</button>
                </div>
                <div className="flex p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <button onClick={() => setTimeframe('daily')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'daily' ? 'bg-white dark:bg-gray-900' : ''}`}>Daily</button>
                    <button onClick={() => setTimeframe('weekly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'weekly' ? 'bg-white dark:bg-gray-900' : ''}`}>Weekly</button>
                    <button onClick={() => setTimeframe('monthly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'monthly' ? 'bg-white dark:bg-gray-900' : ''}`}>Monthly</button>
                    <button onClick={() => setTimeframe('overall')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'overall' ? 'bg-white dark:bg-gray-900' : ''}`}>Overall</button>
                </div>
            </div>
            <SetLeaderboardList data={currentData.top10} metric={view} timeframe={timeframe} currentUser={currentData.currentUser} title={title} />
        </div>
    );
}
