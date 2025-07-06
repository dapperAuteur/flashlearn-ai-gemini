/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Profile from '@/models/Profile';
import FlashcardSet, { IFlashcardSet } from '@/models/FlashcardSet';
import Link from 'next/link';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin'; // We will create this

export const metadata: Metadata = {
  title: 'Dashboard - Flashcard AI Pro',
  description: 'Manage your flashcard sets and review due cards.',
};

// This server-side function checks for an authenticated user
// Note: This requires a Firebase Admin setup for server-side auth checks
async function checkAuth(cookie: string | undefined) {
    if (!cookie) return null;
    try {
        const decodedToken = await getAuth(adminApp).verifySessionCookie(cookie, true);
        return decodedToken;
    } catch (error) {
        return null;
    }
}

// This server-side function fetches all necessary data for the dashboard
async function getDashboardData(userId: string) {
    await dbConnect();
    const userProfiles = await Profile.find({ user: userId });
    if (userProfiles.length === 0) return [];
    
    const profileIds = userProfiles.map(p => p._id);
    const sets = await FlashcardSet.find({ profile: { $in: profileIds } }).sort({ createdAt: -1 });
    
    const now = new Date();
    const setsWithDueCount = sets.map(set => {
        const dueCount = set.flashcards.filter(card => new Date(card.mlData.nextReviewDate) <= now).length;
        return { ...JSON.parse(JSON.stringify(set)), dueCount };
    });

    return setsWithDueCount;
}

export default async function DashboardPage({ cookies }: any) {
    // This is a placeholder for server-side auth with Firebase
    // For a fully client-rendered approach, this page can be simpler.
    // const session = await checkAuth(cookies().get('session')?.value);
    // if (!session) {
    //     redirect('/auth/signin');
    // }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          My Flashcard Sets
        </h1>
        <div className="flex items-center gap-x-6">
            <Link 
                href="/leaderboard"
                className="text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
                Leaderboard
            </Link>
            <Link 
                href="/analytics/summary"
                className="text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
                Performance
            </Link>
             <Link 
                href="/analytics/scores"
                className="text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
                Score Report
            </Link>
            <Link 
                href="/generate"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                Create New Set
            </Link>
        </div>
      </div>
      
      <DashboardClient />
    </div>
  );
}
