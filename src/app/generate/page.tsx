import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { GenerationForm } from '@/components/generation/GenerationForm';
import type { Metadata } from 'next';

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
                AI Flashcard Generator
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Let AI do the heavy lifting. Just enter a topic, and we'll create a set of flashcards for you in seconds.
            </p>
        </div>
        <div className="mt-16">
            <GenerationForm />
        </div>
      </div>
    </div>
  );
}
