/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import html2canvas from 'html2canvas';
import Image from 'next/image';

// Define types for our leaderboard data
type UserStats = { totalCorrect: number; averageAccuracy: number; };
type UserRank = { userId: string; name: string; rank: number; daily: any; weekly: any; monthly: any; image: string; overall: any; };
type LeaderboardData = { top10: UserRank[]; currentUser?: UserRank; };
type LeaderboardCategory = { daily: LeaderboardData; weekly: LeaderboardData; monthly: LeaderboardData; overall: LeaderboardData; };
type FullLeaderboard = { percentage: LeaderboardCategory; score: LeaderboardCategory; };

const ShareButton = ({ listRef, listTitle }: { listRef: React.RefObject<HTMLDivElement>, listTitle: string }) => {
    const share = async () => {
        if (!listRef.current) return;
        try {
            const canvas = await html2canvas(listRef.current, { 
                backgroundColor: '#1f2937', // Use a simple hex code for the background
                logging: false, // Disable logging to keep console clean
                useCORS: true, 
            });
            const imageUrl = canvas.toDataURL('image/png');
            
            const blob = await fetch(imageUrl).then(res => res.blob());
            const file = new File([blob], `${listTitle.replace(/ /g, '_')}_leaderboard.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Flashcard AI Pro Leaderboard: ${listTitle}`,
                    text: `Check out the leaderboard for ${listTitle} on Flashcard AI Pro!`,
                    files: [file],
                });
            } else {
                // Fallback for browsers that don't support sharing files
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `${listTitle.replace(/ /g, '_')}_leaderboard.png`;
                link.click();
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Could not share the image. It may have been saved to your downloads.');
        }
    };

    return <button onClick={share} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Share</button>;
};


const LeaderboardList = ({ data, metric, currentUser, title }: { data: UserRank[], metric: 'averageAccuracy' | 'totalCorrect', currentUser?: UserRank, title: string }) => {
    const listRef = useRef<HTMLDivElement>(null);
    return (
        <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                <ShareButton listRef={listRef} listTitle={title} />
            </div>
            <div ref={listRef} className="p-4 bg-white dark:bg-gray-900">
                <ul className="space-y-3">
                    {data.map((user, i) => (
                        <li key={i} className={`flex justify-between items-center p-2 rounded-md ${user.userId === currentUser?.userId ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}>
                            <div className="flex items-center gap-x-4">
                                <span className="font-bold text-gray-500 dark:text-gray-400 w-6 text-center">{user.rank}</span>
                                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                    {user.image ? (
                                        <Image src={user.image} alt={`${user.name}'s profile`} layout="fill" objectFit="cover" />
                                    ) : (
                                        <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    )}
                                </div>
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
                            <li className="flex justify-between items-center p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/50">
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
        </div>
    );
};

export default function LeaderboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState<FullLeaderboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'percentage' | 'score'>('percentage');
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'overall'>('overall');


    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            // User is not logged in, no need to fetch
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/leaderboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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
    }, [user, isAuthLoading]);

    if (isLoading || isAuthLoading) return <div className="text-center py-12">Loading Leaderboards...</div>;
    if (!user) return <div className="text-center py-12">Please sign in to view the leaderboards.</div>;
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
