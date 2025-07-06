/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';

export default function DataManagementPage() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        try {
            const response = await fetch('/api/data/export');
            if (!response.ok) throw new Error('Failed to export data.');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flashcard_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }
        setIsImporting(true);
        setError(null);
        setSuccess(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: { data: any; }) => {
                try {
                    const response = await fetch('/api/data/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: results.data }),
                    });
                    if (!response.ok) throw new Error(await response.text());
                    const result = await response.json();
                    setSuccess(result.message);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsImporting(false);
                }
            },
            error: (err: any) => {
                setError(`CSV Parsing Error: ${err.message}`);
                setIsImporting(false);
            }
        });
    };

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-gray-900 dark:text-white">
                Manage Your Data
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Card */}
                <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Export Data</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Download all of your flashcard sets as a single CSV file. This is a great way to create a backup or move your data to another service.
                    </p>
                    <button onClick={handleExport} disabled={isExporting} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                        {isExporting ? 'Exporting...' : 'Export All Sets'}
                    </button>
                </div>

                {/* Import Card */}
                <div className="p-6 rounded-lg bg-white dark:bg-gray-800/50 shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Import Data</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Upload a CSV file to create new flashcard sets. Make sure your file follows the correct format.
                    </p>
                    <div className="space-y-4">
                        <input type="file" onChange={handleFileChange} accept=".csv" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900" />
                        <button onClick={handleImport} disabled={isImporting || !file} className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50">
                            {isImporting ? 'Importing...' : 'Import from CSV'}
                        </button>
                         <a href="/csv_template.csv" download className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block mt-2">
                            Download CSV Template
                        </a>
                    </div>
                </div>
            </div>
             {error && <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
             {success && <div className="mt-8 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md" role="alert"><p>{success}</p></div>}
        </div>
    );
}
