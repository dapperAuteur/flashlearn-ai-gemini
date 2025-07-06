/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IFlashcardSet, IFlashcard } from '@/types';
import Link from 'next/link';

type Props = {
  initialSet: IFlashcardSet;
};

// A simple confirmation modal component
const ConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void; }) => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Are you sure?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                This will remove the set from your library. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-x-4">
                <button onClick={onCancel} className="rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600">Cancel</button>
                <button onClick={onConfirm} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">Delete Set</button>
            </div>
        </div>
    </div>
);


export const EditFlashcardSetForm = ({ initialSet }: Props) => {
  const router = useRouter();
  const [title, setTitle] = useState(initialSet.title);
  const [cards, setCards] = useState<Partial<IFlashcard>[]>(initialSet.flashcards);
  const [isPublic, setIsPublic] = useState(initialSet.isPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCardChange = (index: number, field: 'front' | 'back', value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const addCard = () => {
    setCards([...cards, { front: '', back: '' }]);
  };

  const removeCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcard-sets/${initialSet._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, flashcards: cards, isPublic }),
      });
      if (!response.ok) throw new Error(await response.text() || 'Failed to update the set.');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
      setIsLoading(true);
      setError(null);
      try {
          const response = await fetch(`/api/flashcard-sets/${initialSet._id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete the set.');
          router.push('/dashboard');
          router.refresh();
      } catch (err: any) {
          setError(err.message);
          setIsLoading(false);
      }
  };

  return (
    <>
      {showDeleteConfirm && <ConfirmationModal onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />}
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
        
        <div className="flex justify-between items-center">
            <div>
                <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Set Title</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full md:w-96 rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" required />
            </div>
            <div className="flex items-center space-x-3">
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    {isPublic ? 'Public' : 'Private'}
                </label>
                <button type="button" onClick={() => setIsPublic(!isPublic)} className={`${isPublic ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`} role="switch" aria-checked={isPublic}>
                    <span className={`${isPublic ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                </button>
            </div>
        </div>

        <div className="space-y-6">
          {cards.map((card, index) => (
            <div key={card._id || index} className="relative rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Card {index + 1}</p>
              <div>
                  <label htmlFor={`front-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300">Front</label>
                  <textarea id={`front-${index}`} value={card.front} onChange={(e) => handleCardChange(index, 'front', e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
              </div>
              <div>
                  <label htmlFor={`back-${index}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300">Back</label>
                  <textarea id={`back-${index}`} value={card.back} onChange={(e) => handleCardChange(index, 'back', e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
              </div>
              <button type="button" onClick={() => removeCard(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-between items-center">
            <button type="button" onClick={addCard} className="rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">Add Card</button>
            <div className="flex items-center gap-x-4">
                <Link href="/dashboard" className="rounded-md px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">Cancel</Link>
                <button type="submit" disabled={isLoading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">{isLoading ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>

        <div className="border-t border-red-500/30 pt-6">
            <h3 className="text-base font-semibold leading-7 text-red-600 dark:text-red-400">Danger Zone</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Removing this set from your library cannot be undone.</p>
            <div className="mt-4">
                <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={isLoading} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50">Delete this set</button>
            </div>
        </div>
      </form>
    </>
  );
};
