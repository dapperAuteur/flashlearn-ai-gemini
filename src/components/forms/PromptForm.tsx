/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { FlashcardResult } from '@/components/flashcards/FlashcardResult';
import { IFlashcard } from '@/models/FlashcardSet';

export const PromptForm = () => {
    const [prompt, setPrompt] = useState('');
    const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setFlashcards([]);
        try {
            const response = await fetch('/api/generate-flashcards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            if (!response.ok) throw new Error(await response.text() || 'Failed to generate flashcards.');
            const data = await response.json();
            setFlashcards(data.flashcards);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Enter a topic, paste some text, or describe what you want to learn.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="sr-only">Prompt</label>
                    <textarea id="prompt" name="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., The key events of the American Revolution" className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-indigo-600 dark:focus:ring-indigo-500" required />
                </div>
                <button type="submit" disabled={isLoading} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">{isLoading ? 'Generating...' : 'Generate Flashcards'}</button>
            </form>
            {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Generating, please wait...</p>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
            <FlashcardResult flashcards={flashcards} initialTitle={prompt} source="Prompt" onSaveSuccess={() => { setFlashcards([]); setPrompt(''); }} />
        </div>
    );
};