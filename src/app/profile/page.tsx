import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'View your profile details.',
};

async function getCurrentUser(userId: string): Promise<IUser | null> {
    await dbConnect();
    const user = await User.findById(userId).select('-password').lean();
    return user ? JSON.parse(JSON.stringify(user)) : null;
}

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect('/auth/signin?callbackUrl=/profile');
    }

    const user = await getCurrentUser(session.user.id);

    if (!user) {
        return <div className="text-center py-12">User not found.</div>
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-lg mx-auto bg-white dark:bg-gray-800/50 rounded-lg shadow-lg p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                        {user.image ? (
                            <Image src={user.image} alt="Profile" layout="fill" objectFit="cover" />
                        ) : (
                            <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h1>
                    <p className="text-md text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.phoneNumber || 'Not provided'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Zip Code</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.zipCode}</dd>
                        </div>
                    </dl>
                </div>
                <div className="mt-8 flex justify-end">
                    <Link href="/profile/edit" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                        Edit Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}
