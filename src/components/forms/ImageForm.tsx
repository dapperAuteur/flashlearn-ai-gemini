/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { FlashcardResult } from '@/components/flashcards/FlashcardResult';
import { IFlashcard } from '@/models/FlashcardSet';
import { IMAGE_MAX_FILES, IMAGE_MAX_FILE_SIZE_MB, IMAGE_MAX_FILE_SIZE_BYTES } from '@/lib/constants';

export const ImageForm = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            
            if (selectedFiles.length > IMAGE_MAX_FILES) {
                setError(`You can only upload a maximum of ${IMAGE_MAX_FILES} images.`);
                return;
            }

            for (const file of selectedFiles) {
                if (file.size > IMAGE_MAX_FILE_SIZE_BYTES) {
                    setError(`File "${file.name}" exceeds the ${IMAGE_MAX_FILE_SIZE_MB}MB size limit.`);
                    return;
                }
            }
            
            setError(null);
            setFiles(selectedFiles);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            setError('Please select one or more image files.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFlashcards([]);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/generate-from-images', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(await response.text() || 'Failed to generate flashcards from images.');
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload one or more images (e.g., textbook pages, slides) to generate flashcards.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="image_files" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Image Files</label>
                    <div className="mt-2">
                        <input id="image_files" name="image_files" type="file" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" multiple className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900" required />
                    </div>
                     <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Accepted formats: JPG, PNG, WebP. Max {IMAGE_MAX_FILES} images. Max size per image: {IMAGE_MAX_FILE_SIZE_MB}MB.
                    </p>
                </div>
                <button type="submit" disabled={isLoading || files.length === 0} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">{isLoading ? 'Analyzing & Generating...' : 'Generate Flashcards'}</button>
            </form>
             {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Selected files ({files.length}):</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {files.map((file, i) => <li key={i}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>)}
                </ul>
              </div>
            )}
            {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Processing images, this may take several moments...</p>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
            <FlashcardResult flashcards={flashcards} initialTitle="Flashcards from Images" source="Image" onSaveSuccess={() => { setFlashcards([]); setFiles([]); }} />
        </div>
    );
};