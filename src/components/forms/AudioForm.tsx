/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { FlashcardResult } from '@/components/flashcards/FlashcardResult';
import { IFlashcard } from '@/models/FlashcardSet';

export const AudioForm = () => {
    const [file, setFile] = useState<File | null>(null);
    const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select an audio file.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFlashcards([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/generate-from-audio', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(await response.text() || 'Failed to generate flashcards from audio.');
            const data = await response.json();
            setFlashcards(data.flashcards);
            setFileName(data.fileName || 'Flashcards from Audio');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload an audio file (MP3, WAV, M4A) to generate flashcards from its transcription.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="audio_file" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Audio File</label>
                    <div className="mt-2">
                        <input id="audio_file" name="audio_file" type="file" onChange={handleFileChange} accept="audio/mpeg,audio/wav,audio/x-m4a" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900" required />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">{isLoading ? 'Transcribing & Generating...' : 'Generate Flashcards'}</button>
            </form>
            {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Processing audio, this may take a few moments...</p>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
            <FlashcardResult flashcards={flashcards} initialTitle={fileName} source="Audio" onSaveSuccess={() => { setFlashcards([]); setFile(null); }} />
        </div>
    );
};