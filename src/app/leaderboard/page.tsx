/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import html2canvas from 'html2canvas';

// Define types for our leaderboard data
type UserRank = { userId: string; name: string; rank: number; daily: any; weekly: any; monthly: any; overall: any; };
type LeaderboardData = { top10: UserRank[]; currentUser?: UserRank; };
type LeaderboardCategory = { daily: LeaderboardData; weekly: LeaderboardData; monthly: LeaderboardData; overall: LeaderboardData; };
type FullLeaderboard = { percentage: LeaderboardCategory; score: LeaderboardCategory; };

const ShareButton = ({ listRef, listTitle }: { listRef: React.RefObject<HTMLDivElement>, listTitle: string }) => {
    const share = async () => {
        if (!listRef.current) return;
        const canvas = await html2canvas(listRef.current, { backgroundColor: '#111827' });
        const imageUrl = canvas.toDataURL('image/png');
        
        // This is a simplified share. A real app would use a library or more robust logic.
        const shareData = {
            title: `Flashcard AI Pro Leaderboard: ${listTitle}`,
            text: `Check out the leaderboard for ${listTitle} on Flashcard AI Pro!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for desktop
                alert('Sharing is not supported on this browser. You can save the image or copy the link.');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return <button onClick={share} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Share</button>;
};


const LeaderboardList = ({ data, metric, currentUser, title }: { data: UserRank[], metric: 'averageAccuracy' | 'totalCorrect', currentUser?: UserRank, title: string }) => {
    const listRef = useRef<HTMLDivElement>(null);
    return (
        <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow" ref={listRef}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                <ShareButton listRef={listRef} listTitle={title} />
            </div>
            <ul className="space-y-3">
                {data.map((user, i) => (
                    <li key={i} className={`flex justify-between items-center p-2 rounded-md ${user.userId === currentUser?.userId ? 'bg-indigo-500/20' : ''}`}>
                        <div className="flex items-center gap-x-4">
                            <span className="font-bold text-gray-500 dark:text-gray-400 w-6 text-center">{user.rank}</span>
                            <span className="text-gray-700 dark:text-gray-300 truncate">{user.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {metric === 'averageAccuracy' ? `${user.overall.averageAccuracy.toFixed(1)}%` : user.overall.totalCorrect}
                        </span>
                    </li>
                ))}
                 {currentUser && !data.some(u => u.userId === currentUser.userId) && (
                     <>
                        <li className="text-center text-gray-500">...</li>
                        <li className="flex justify-between items-center p-2 rounded-md bg-indigo-500/20">
                             <div className="flex items-center gap-x-4">
                                <span className="font-bold text-gray-500 dark:text-gray-400 w-6 text-center">{currentUser.rank}</span>
                                <span className="text-gray-700 dark:text-gray-300 truncate">{currentUser.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                               {metric === 'averageAccuracy' ? `${currentUser.overall.averageAccuracy.toFixed(1)}%` : currentUser.overall.totalCorrect}
                            </span>
                        </li>
                     </>
                 )}
            </ul>
        </div>
    );
};

export default function LeaderboardPage() {
    const { data: session } = useSession();
    const [leaderboardData, setLeaderboardData] = useState<FullLeaderboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'percentage' | 'score'>('percentage');
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'overall'>('overall');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/leaderboard');
                if (!response.ok) throw new Error('Failed to fetch leaderboard data.');
                const data = await response.json();
                setLeaderboardData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <div className="text-center py-12">Loading Leaderboards...</div>;
    if (!leaderboardData) return <div className="text-center py-12">Could not load leaderboard data.</div>;

    const currentData = leaderboardData[view][timeframe];
    const metric = view === 'percentage' ? 'averageAccuracy' : 'totalCorrect';

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Leaderboards</h1>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-4">
                {/* View Toggle */}
                <div className="flex p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <button onClick={() => setView('percentage')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'percentage' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>Performance %</button>
                    <button onClick={() => setView('score')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'score' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>Score</button>
                </div>
                 {/* Timeframe Toggle */}
                <div className="flex p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <button onClick={() => setTimeframe('daily')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'daily' ? 'bg-white dark:bg-gray-900' : ''}`}>Daily</button>
                    <button onClick={() => setTimeframe('weekly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'weekly' ? 'bg-white dark:bg-gray-900' : ''}`}>Weekly</button>
                    <button onClick={() => setTimeframe('monthly')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'monthly' ? 'bg-white dark:bg-gray-900' : ''}`}>Monthly</button>
                    <button onClick={() => setTimeframe('overall')} className={`px-3 py-1 text-sm font-medium rounded-md ${timeframe === 'overall' ? 'bg-white dark:bg-gray-900' : ''}`}>Overall</button>
                </div>
            </div>

            <LeaderboardList data={currentData.top10} metric={metric} currentUser={currentData.currentUser} title={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} ${view === 'percentage' ? 'Performance' : 'Top Scores'}`} />
        </div>
    );
}
