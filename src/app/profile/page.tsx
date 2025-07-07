'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';

// Define a type for the detailed user data we fetch from our API.
interface UserProfileData {
    firstName: string;
    lastName: string;
    email: string;
    zipCode: string;
    phoneNumber?: string;
    image?: string;
}

export default function ProfilePage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            router.push('/auth/signin?callbackUrl=/profile');
            return;
        }

        const fetchProfileData = async () => {
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch profile data.');
                const data = await response.json();
                setProfileData(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [user, isAuthLoading, router]);

    if (isAuthLoading || isLoading) {
        return <div className="text-center py-12">Loading Profile...</div>;
    }

    if (!profileData) {
        return <div className="text-center py-12">Could not load profile data.</div>;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-lg mx-auto bg-white dark:bg-gray-800/50 rounded-lg shadow-lg p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                        {profileData.image ? (
                            <Image src={profileData.image} alt="Profile" layout="fill" objectFit="cover" />
                        ) : (
                            <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.firstName} {profileData.lastName}</h1>
                    <p className="text-md text-gray-500 dark:text-gray-400">{profileData.email}</p>
                </div>
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{profileData.phoneNumber || 'Not provided'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Zip Code</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{profileData.zipCode}</dd>
                        </div>
                    </dl>
                </div>
                <div className="mt-8 flex justify-end gap-x-4">
                    <Link href="/data/manage" className="rounded-md bg-white dark:bg-gray-700 px-3.5 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                        Manage Data
                    </Link>
                    <Link href="/profile/edit" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                        Edit Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}
