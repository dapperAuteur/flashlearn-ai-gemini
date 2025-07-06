"use client";

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  // Show a loading state while authentication is being checked
  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Flashcard AI Pro
          </h1>
          {user ? (
            <div>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Welcome back, <span className="font-bold">{user.displayName || user.email}</span>!
              </p>
               <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                The intelligent way to study. Create flashcards with AI, optimize your learning with spaced repetition, and master any subject faster.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Get started
                </Link>
                <Link href="/features" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
