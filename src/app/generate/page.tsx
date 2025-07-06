import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { GenerationHub } from '@/components/generation/GenerationHub';

export const metadata: Metadata = {
  title: 'AI Flashcard Generator',
  description: 'Generate flashcards from any topic using AI.',
};

export default async function GeneratePage() {
  const session = await getServerSession(authOptions);

  // Protect the route
  if (!session) {
    redirect('/auth/signin?callbackUrl=/generate');
  }

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
