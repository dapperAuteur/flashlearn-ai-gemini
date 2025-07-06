/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/models/User';
import Image from 'next/image';

export const EditProfileForm = ({ user }: { user: IUser }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        zipCode: user.zipCode,
        phoneNumber: user.phoneNumber || '',
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.image || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (formData.newPassword && !formData.oldPassword) {
            setError('Please enter your old password to set a new one.');
            return;
        }

        setIsLoading(true);
        const data = new FormData();
        // Append all form data fields
        Object.entries(formData).forEach(([key, value]) => {
            if (value) data.append(key, value);
        });
        if (file) data.append('file', file);

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                body: data,
            });
            if (!response.ok) throw new Error(await response.text());
            setSuccess('Profile updated successfully!');
            // Clear password fields after successful submission
            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmNewPassword: '' }));
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md" role="alert"><p>{success}</p></div>}

            <div className="flex flex-col items-center space-y-4">
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Profile preview" layout="fill" objectFit="cover" />
                    ) : (
                        <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    )}
                </div>
                <label htmlFor="file-upload" className="cursor-pointer rounded-md bg-white dark:bg-gray-700 px-2.5 py-1.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <span>Change Photo</span>
                    <input id="file-upload" name="file" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">First Name</label>
                        <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Last Name</label>
                        <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                    <div className="sm:col-span-4">
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="zipCode" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Zip Code</label>
                        <input type="text" name="zipCode" id="zipCode" value={formData.zipCode} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Phone Number (Optional)</label>
                        <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
                    <h3 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Change Password</h3>
                    <div className="sm:col-span-6">
                        <label htmlFor="oldPassword" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Old Password</label>
                        <input type="password" name="oldPassword" id="oldPassword" value={formData.oldPassword} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="newPassword" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">New Password</label>
                        <input type="password" name="newPassword" id="newPassword" value={formData.newPassword} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="confirmNewPassword" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Confirm New Password</label>
                        <input type="password" name="confirmNewPassword" id="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={isLoading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};
