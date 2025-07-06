import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Profile from '@/models/Profile';
import FlashcardSet, { IFlashcardSet } from '@/models/FlashcardSet';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard - Flashcard AI Pro',
  description: 'Manage your flashcard sets and review due cards.',
};

// Fetches all of the user's flashcard sets
async function getFlashcardSets(userId: string) {
    await dbConnect();
    const userProfiles = await Profile.find({ user: userId });
    if (userProfiles.length === 0) return [];
    
    const profileIds = userProfiles.map(p => p._id);
    const sets = await FlashcardSet.find({ profile: { $in: profileIds } }).sort({ createdAt: -1 });
    
    return JSON.parse(JSON.stringify(sets)) as IFlashcardSet[];
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  const flashcardSets = await getFlashcardSets(session.user.id);

  // Calculate due cards count for each set on the server
  const now = new Date();
  const setsWithDueCount = flashcardSets.map(set => {
    const dueCount = set.flashcards.filter(card => new Date(card.mlData.nextReviewDate) <= now).length;
    return { ...set, dueCount };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      
      {/* All Sets Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          My Flashcard Sets
        </h1>
        <div className="flex items-center gap-x-4">
            <Link 
                href="/analytics"
                className="text-sm font-semibold leading-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
                View Analytics
            </Link>
            <Link 
                href="/generate"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                Create New Set
            </Link>
        </div>
      </div>

      {setsWithDueCount.length > 0 ? (
        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {setsWithDueCount.map((set) => (
            <li key={set._id} className="col-span-1 divide-y divide-gray-200 dark:divide-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow">
              <div className="flex w-full items-center justify-between space-x-6 p-6">
                <div className="flex-1 truncate">
                  <div className="flex items-center space-x-3">
                    <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">{set.title}</h3>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{set.flashcards.length} cards</p>
                  {set.dueCount > 0 && (
                     <p className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">{set.dueCount} due for review</p>
                  )}
                </div>
              </div>
              <div>
                <div className="-mt-px flex divide-x divide-gray-200 dark:divide-gray-700">
                  <div className="flex w-0 flex-1">
                    <a
                      href={set.dueCount > 0 ? `/study/${set._id}/review` : `/study/${set._id}`}
                      className={`relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 ${set.dueCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                    >
                      {set.dueCount > 0 ? 'Review Due' : 'Study All'}
                    </a>
                  </div>
                   <div className="-ml-px flex w-0 flex-1">
                    <a
                      href={`/sets/${set._id}/preview`}
                      className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Preview
                    </a>
                  </div>
                  <div className="-ml-px flex w-0 flex-1">
                     <a
                      href={`/sets/${set._id}/edit`}
                      className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Edit
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">No flashcard sets found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new set.</p>
            <div className="mt-6">
                <Link 
                    href="/generate"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Create New Set
                </Link>
            </div>
        </div>
      )}
    </div>
  );
}
