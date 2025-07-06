'use client'

import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/firebase';
import { useRouter } from 'next/navigation';
import { GenerationHub } from '@/components/generation/GenerationHub';


export default function GeneratePage() {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();


  useEffect(() => {
    // If auth is not loading and there is no user, redirect to the login page.
    if (!loadingAuth && !user) {
      router.push('/login?callbackUrl=/generate');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return (
      <div className="text-center p-8">
        <h1 className="text-xl font-semibold">Loading...</h1>
        <p>Checking your credentials.</p>
      </div>
    );
  }
  


  // Protect the route
  if (!user) {
    redirect('/auth/signin?callbackUrl=/generate');
  }

  if (user) {
    return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                Create Flashcards
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Let AI do the heavy lifting. Generate a new study set from a text prompt, a YouTube video, and more.
            </p>
        </div>
        <div className="mt-16">
            <GenerationHub />
        </div>
      </div>
    </div>
  );
  }
  return null;
}
