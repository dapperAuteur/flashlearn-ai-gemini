/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/forms/CsvForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/firebase';
import Papa from 'papaparse';
// import { FlashcardResult } from '@/components/flashcards/FlashcardResult'; // Assuming a result component exists
import { IFlashcard } from '@/types';
import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB} from '@/lib/constants';

export const CsvForm = () => {
    const [user] = useAuthState(auth);
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
          if (selectedFile.size > FILE_SIZE_LIMIT_MB * FILE_SIZE_LIMIT_BYTES) {
          setError(`File size exceeds the ${FILE_SIZE_LIMIT_MB}MB limit.`);
          setFile(null);
        } else {
          setFile(selectedFile);
          setFileName(selectedFile.name);
          setError(null);
          setFlashcards([]); // Reset previous results

          // Parse the CSV file on the client side
          Papa.parse(selectedFile, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                  if (results.errors.length) {
                      setError(`Error parsing CSV: ${results.errors[0].message}`);
                      return;
                  }
                  // Validate required columns
                  if (!results.meta.fields?.includes('question') || !results.meta.fields?.includes('answer')) {
                      setError("CSV file must include 'question' and 'answer' columns.");
                      return;
                  }
                  // Map to IFlashcard structure
                  const parsedFlashcards = (results.data as any[]).map(row => ({
                      id: crypto.randomUUID(),
                      question: row.question,
                      answer: row.answer,
                  }));
                  setFlashcards(parsedFlashcards);
              },
              error: (err) => {
                  setError(`Error parsing CSV: ${err.message}`);
              }
          });
        }
            
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || flashcards.length === 0 || !user) {
            setError('Please select a valid CSV file and ensure it has been parsed correctly.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/generate-from-csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: `Imported from ${fileName}`,
                    flashcards: flashcards,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create flashcard set from CSV.');
            }

            const newSet = await response.json();
            // Redirect to the newly created set's preview page
            router.push(`/sets/${newSet.id}/preview`);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload a CSV file with &quot;front&quot; and &quot;back&quot; columns to create a new set.
            </p>
             <a href="/csv_template.csv" download className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Download CSV Template
            </a>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="csv_file" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">CSV File</label>
                    <div className="mt-2">
                        <input id="csv_file" name="csv_file" type="file" onChange={handleFileChange} accept=".csv" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900" required />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Accepted formats: CSV. Max size: {FILE_SIZE_LIMIT_MB}MB.
                    </p>
                </div>
                <button type="submit" disabled={isLoading || flashcards.length === 0} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                    {isLoading ? 'Creating Set...' : 'Create Flashcard Set'}
                </button>
            </form>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
            {flashcards.length > 0 && !isLoading && (
                 <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md" role="alert">
                    <p>Successfully parsed {flashcards.length} flashcards. Click &quot;Create Flashcard Set&quot; to save.</p>
                </div>
            )}
        </div>
    );
};
