import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Profile from '@/models/Profile';
import FlashcardSet, { IFlashcardSet } from '@/models/FlashcardSet';
import Link from 'next/link';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard - Flashcard AI Pro',
  description: 'Manage your flashcard sets and review due cards.',
};

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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  const dashboardData = await getDashboardData(session.user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          My Flashcard Sets
        </h1>
        <div className="flex items-center gap-x-6">
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
      
      <DashboardClient initialSets={dashboardData} />
    </div>
  );
}
