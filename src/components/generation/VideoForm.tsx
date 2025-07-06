/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { FlashcardResult } from '@/components/flashcards/FlashcardResult';
import { IFlashcard } from '@/types';
import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB} from '@/lib/constants';

export const VideoForm = () => {
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
          setError(null);
          setFile(selectedFile);
        }
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a video file.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFlashcards([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/generate-from-video', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(await response.text() || 'Failed to generate flashcards from video.');
            const data = await response.json();
            setFlashcards(data.flashcards);
            setFileName(data.fileName || 'Flashcards from Video');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload a video file to generate flashcards from its content.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="video_file" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Video File</label>
                    <div className="mt-2">
                        <input id="video_file" name="video_file" type="file" onChange={handleFileChange} accept="video/mp4,video/webm,video/quicktime" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900" required />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Accepted formats: MP4, WebM, MOV. Max size: {FILE_SIZE_LIMIT_MB}MB.
                    </p>
                </div>
                <button type="submit" disabled={isLoading || !file} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">{isLoading ? 'Analyzing & Generating...' : 'Generate Flashcards'}</button>
            </form>
            {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Processing video, this may take several moments...</p>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
            <FlashcardResult flashcards={flashcards} initialTitle={fileName} source="Video" onSaveSuccess={() => { setFlashcards([]); setFile(null); }} />
        </div>
    );
};