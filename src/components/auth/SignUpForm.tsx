/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';

export const SignUpForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    zipCode: '',
    phoneNumber: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Step 2: Update the Firebase Auth profile with the user's name
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      // Step 3: Create a new user document in Firestore
      // The document ID will be the user's UID from Firebase Auth
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        zipCode: formData.zipCode,
        phoneNumber: formData.phoneNumber,
        createdAt: new Date(),
        // Initialize other fields as needed
        subscriptionTier: 'Free',
      });

      // Step 4: Redirect to the dashboard on successful signup
      router.push('/dashboard');

    } catch (err: any) {
      // Handle Firebase-specific errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. It must be at least 6 characters long.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
          <p>{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">First Name *</label>
          <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Last Name *</label>
          <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Email address *</label>
          <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Password *</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
        </div>
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Zip Code *</label>
          <input id="zipCode" name="zipCode" type="text" autoComplete="postal-code" required value={formData.zipCode} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Phone Number</label>
          <input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" value={formData.phoneNumber} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700" />
        </div>
      </div>
      <div className="pt-4">
        <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
  );
};
