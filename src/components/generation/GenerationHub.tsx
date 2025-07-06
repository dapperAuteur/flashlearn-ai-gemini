/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { PromptForm } from '@/components/forms/PromptForm';
import { YouTubeForm } from '@/components/forms/YouTubeForm';
import { PdfForm } from '@/components/forms/PdfForm';
import { AudioForm } from '@/components/forms/AudioForm';
import { VideoForm } from '../forms/VideoForm';
import { TextForm } from '../forms/TextForm';
import { ImageForm } from '../forms/ImageForm';


const tabs = [
  { name: 'From Prompt', component: PromptForm },
  { name: 'From YouTube', component: YouTubeForm },
  { name: 'From PDF', component: PdfForm },
  { name: 'From Audio', component: AudioForm },
  { name: 'From Video', component: VideoForm },
  { name: 'From Text', component: TextForm },
  { name: 'From Images', component: ImageForm },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Main component that manages the tabs
export const GenerationHub = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component || PromptForm;

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">Select a tab</label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          {tabs.map((tab) => (<option key={tab.name}>{tab.name}</option>))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={classNames(
                  tab.name === activeTab
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
                  'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className="mt-8">
        <ActiveComponent />
      </div>
    </div>
  );
};
