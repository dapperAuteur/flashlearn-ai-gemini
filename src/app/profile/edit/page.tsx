'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { EditProfileForm } from '@/components/profile/EditProfileForm';

interface UserProfileData {
    firstName: string;
    lastName: string;
    email: string;
    zipCode: string;
    phoneNumber?: string;
    image?: string;
}

export default function EditProfilePage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            router.push('/auth/signin?callbackUrl=/profile/edit');
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
        return <div className="text-center py-12">Loading Profile Editor...</div>;
    }

    if (!profileData) {
        return <div className="text-center py-12">Could not load profile data to edit.</div>;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-gray-900 dark:text-white">
                Edit Your Profile
            </h1>
            <EditProfileForm user={profileData} />
        </div>
    );
}
