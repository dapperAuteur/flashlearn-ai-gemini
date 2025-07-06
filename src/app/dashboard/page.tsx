/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'; // This page now needs to be a client component to use the useAuth hook

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect if the user is not logged in after auth check is complete
        if (!isLoading && !user) {
            router.push('/auth/signin');
        }
    }, [user, isLoading, router]);

    // Show a loading state while we wait for the auth check
    if (isLoading) {
        return <div className="text-center py-12">Authenticating...</div>
    }

    // If there's no user, we'll be redirecting, so render nothing.
    if (!user) {
        return null;
    }

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
