/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
// import Link from 'next/link';
import { IFlashcardSet } from '@/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';

// Define a type for our Firestore flashcard set documents
interface FlashcardSetDocument {
  id: string;
  title: string;
  isPublic: boolean;
  flashcards: any[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueCount: number;
}

// The dashboard page will pass this augmented data
type SetWithDueCount = IFlashcardSet & { dueCount: number };

// type Props = {
//   initialSets: SetWithDueCount[];
// };

export const DashboardClient = () => {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSetDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState('dateAdded_desc');

  useEffect(() => {
    if (!user) {
      // If there's no user, we don't need to fetch anything.
      // The parent page will handle the redirect.
      setIsLoading(false);
      return;
    }

    // Set up a real-time listener for the user's flashcard sets
    const setsCollection = collection(db, 'flashcardSets');
    const q = query(setsCollection, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const now = new Date();
      const userSets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const dueCount = data.flashcards.filter((card: any) => 
          card.mlData.nextReviewDate.toDate() <= now
        ).length;

        return {
          id: doc.id,
          title: data.title,
          isPublic: data.isPublic,
          flashcards: data.flashcards,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          dueCount,
        };
      });
      
      setSets(userSets);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching flashcard sets:", error);
      setIsLoading(false);
    });

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [user]);

  const filteredAndSortedSets = useMemo(() => {
    let filtered = [...sets];
    if (searchQuery) {
      filtered = filtered.filter(set => set.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterStatus === 'needsReview') {
      filtered = filtered.filter(set => set.dueCount > 0);
    } else if (filterStatus === 'unstudied') {
      filtered = filtered.filter(set => set.dueCount === 0);
    }

    const [key, direction] = sortOption.split('_');
    filtered.sort((a, b) => {
      let valA, valB;
      switch (key) {
        case 'title': valA = a.title.toLowerCase(); valB = b.title.toLowerCase(); break;
        case 'dueCount': valA = a.dueCount; valB = b.dueCount; break;
        case 'lastStudied': valA = a.updatedAt.toMillis(); valB = b.updatedAt.toMillis(); break;
        default: valA = a.createdAt.toMillis(); valB = b.createdAt.toMillis(); break;
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [sets, searchQuery, filterStatus, sortOption]);

  if (isLoading) {
    return <div className="text-center py-12">Loading Sets...</div>;
  }

  return (
    <div>
        {/* Filter and Sort Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-800/50">
            {/* Text Search */}
            <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search by Title</label>
                <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., American Revolution"
                    className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700"
                />
            </div>
            {/* Filter by Status */}
            <div>
                <label htmlFor="filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by</label>
                <select id="filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700">
                    <option value="all">All Sets</option>
                    <option value="needsReview">Needs Review</option>
                    <option value="unstudied">Unstudied</option>
                </select>
            </div>
            {/* Sort by */}
            <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sort by</label>
                <select id="sort" value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700">
                    <option value="dateAdded_desc">Date Added (Newest)</option>
                    <option value="dateAdded_asc">Date Added (Oldest)</option>
                    <option value="title_asc">Title (A-Z)</option>
                    <option value="title_desc">Title (Z-A)</option>
                    <option value="lastStudied_desc">Last Studied (Recent)</option>
                    <option value="lastStudied_asc">Last Studied (Oldest)</option>
                    <option value="dueCount_desc">Review Cards (Most)</option>
                    <option value="dueCount_asc">Review Cards (Least)</option>
                </select>
            </div>
        </div>

        {/* Sets List */}
        {filteredAndSortedSets.length > 0 ? (
            <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedSets.map((set) => (
                <li key={set.id} className="col-span-1 flex flex-col divide-y divide-gray-200 dark:divide-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="flex flex-1 flex-col p-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-x-2">
                            {set.isPublic ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" title="Public" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.724 7.724l.001-.002M12 12h.01M16.276 7.724l-.001-.002M11 11a1 1 0 112 0 1 1 0 01-2 0z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" title="Private" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            )}
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
                        <a href={set.dueCount > 0 ? `/study/${set.id}/review` : `/study/${set.id}`} className={`relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 ${set.dueCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                        {set.dueCount > 0 ? 'Review Due' : 'Study All'}
                        </a>
                    </div>
                    <div className="-ml-px flex w-0 flex-1">
                        <a href={`/sets/${set.id}/leaderboard`} className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                        Leaders
                        </a>
                    </div>
                    <div className="-ml-px flex w-0 flex-1">
                        <a href={`/sets/${set.id}/preview`} className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                        Preview
                        </a>
                    </div>
                    <div className="-ml-px flex w-0 flex-1">
                        <a href={`/sets/${set.id}/edit`} className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
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
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new set.</p>
            </div>
        )}
    </div>
  );
};
