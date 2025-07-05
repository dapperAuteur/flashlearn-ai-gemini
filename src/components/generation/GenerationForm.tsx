'use client';

import { useState } from 'react';

// Define the structure of a single flashcard
interface Flashcard {
  front: string;
  back: string;
}

export const GenerationForm = () => {
  const [prompt, setPrompt] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [setTitle, setSetTitle] = useState('');

  const handleGenerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setFlashcards([]);
    setSetTitle(prompt); // Default the set title to the prompt

    try {
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to generate flashcards.');
      }

      const data = await response.json();
      setFlashcards(data.flashcards);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
        const response = await fetch('/api/flashcard-sets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: setTitle, flashcards }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to save the set.');
        }

        setSuccessMessage('Flashcard set saved successfully!');
        // Optionally clear the form
        setFlashcards([]);
        setPrompt('');

    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while saving.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleGenerationSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
            Enter a topic
          </label>
          <div className="mt-2">
            <textarea
              id="prompt"
              name="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., The key events of the American Revolution"
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-indigo-600 dark:focus:ring-indigo-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Flashcards'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
          <p>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md" role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      {flashcards.length > 0 && (
        <form onSubmit={handleSaveSubmit} className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Flashcards</h2>
             <div>
                <label htmlFor="setTitle" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">
                    Set Title
                </label>
                <div className="mt-2">
                    <input
                    id="setTitle"
                    name="setTitle"
                    type="text"
                    value={setTitle}
                    onChange={(e) => setSetTitle(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-indigo-600 dark:focus:ring-indigo-500"
                    required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcards.map((card, index) => (
                    <div key={index} className="rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm p-6">
                        <p className="font-semibold text-gray-900 dark:text-white">{card.front}</p>
                        <hr className="my-4 border-gray-200 dark:border-gray-600" />
                        <p className="text-gray-600 dark:text-gray-300">{card.back}</p>
                    </div>
                ))}
            </div>
             <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
                >
                {isSaving ? 'Saving...' : 'Save Set'}
            </button>
        </form>
      )}
    </div>
  );
};
