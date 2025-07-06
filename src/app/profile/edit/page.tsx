import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/User';

export const metadata: Metadata = {
  title: 'Edit Profile',
  description: 'Manage your account details.',
};

async function getCurrentUser(userId: string): Promise<IUser | null> {
    await dbConnect();
    const user = await User.findById(userId).select('-password').lean();
    return user ? JSON.parse(JSON.stringify(user)) : null;
}

export default async function EditProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect('/auth/signin?callbackUrl=/profile/edit');
    }

    const user = await getCurrentUser(session.user.id);

    if (!user) {
        return <div className="text-center py-12">User not found.</div>
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-gray-900 dark:text-white">
                Edit Your Profile
            </h1>
            <EditProfileForm user={user} />
        </div>
    );
}
