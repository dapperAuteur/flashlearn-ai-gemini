/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/firebase'; // Client-side firebase config

// Define the types for our data structures
interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  flashcards: Flashcard[];
}

export default function EditSetPage() {
  const router = useRouter();
  const params = useParams();
  const setId = params.setId as string;
  
  const [user, loadingAuth] = useAuthState(auth);
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the flashcard set data
  const fetchSet = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flashcard-sets/${setId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flashcard set. You may not have permission.');
      }
      const data = await response.json();
      setSet(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, setId]);

  useEffect(() => {
    if (!loadingAuth && user) {
      fetchSet();
    } else if (!loadingAuth && !user) {
      // If not logged in, redirect to login page
      router.push('/login');
    }
  }, [user, loadingAuth, fetchSet, router]);
  
  // Handle form input changes
  const handleSetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!set) return;
    const { name, value } = e.target;
    setSet({ ...set, [name]: value });
  };

  const handleCardChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!set) return;
    const { name, value } = e.target;
    const newFlashcards = [...set.flashcards];
    newFlashcards[index] = { ...newFlashcards[index], [name]: value };
    setSet({ ...set, flashcards: newFlashcards });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !set) return;
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flashcard-sets/${setId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(set),
      });

      if (!response.ok) {
        throw new Error('Failed to update flashcard set.');
      }
      
      // On success, redirect to the preview page
      router.push(`/sets/${setId}/preview`);

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading || loadingAuth) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!set) {
    return <div className="text-center p-8">Flashcard set not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Edit Flashcard Set</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-lg font-medium mb-1">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={set.title}
            onChange={handleSetChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-lg font-medium mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            value={set.description}
            onChange={handleSetChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
        {set.flashcards.map((card, index) => (
          <div key={card.id || index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded">
            <div>
              <label htmlFor={`question-${index}`} className="block font-medium mb-1">Question</label>
              <textarea
                id={`question-${index}`}
                name="question"
                value={card.question}
                onChange={(e) => handleCardChange(index, e)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label htmlFor={`answer-${index}`} className="block font-medium mb-1">Answer</label>
              <textarea
                id={`answer-${index}`}
                name="answer"
                value={card.answer}
                onChange={(e) => handleCardChange(index, e)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
        ))}

        <div className="mt-6">
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
            Save Changes
          </button>
          <button type="button" onClick={() => router.back()} className="ml-4 bg-gray-200 py-2 px-4 rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
