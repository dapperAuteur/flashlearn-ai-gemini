import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import FlashcardSet, { IFlashcardSet } from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import { EditFlashcardSetForm } from '@/components/sets/EditFlashcardSetForm';

async function getFlashcardSet(setId: string, userId: string): Promise<IFlashcardSet | null> {
    try {
        await dbConnect();
        const set = await FlashcardSet.findById(setId);
        if (!set) return null;

        const profile = await Profile.findById(set.profile);
        if (profile?.user.toString() !== userId) return null;
        
        return JSON.parse(JSON.stringify(set));
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { setId: string } }): Promise<Metadata> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { title: 'Edit Set' };
    
    const set = await getFlashcardSet(params.setId, session.user.id);
    return {
        title: set ? `Editing: ${set.title}` : 'Set not found',
    };
}

export default async function EditSetPage({ params }: { params: { setId: string } }) {
    const session = await getServerSession(authOptions);
    const { setId } = params;

    if (!session?.user?.id) {
        redirect(`/auth/signin?callbackUrl=/sets/${setId}/edit`);
    }

    const flashcardSet = await getFlashcardSet(setId, session.user.id);

    if (!flashcardSet) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcard Set Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400">This set may not exist or you may not have permission to edit it.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-gray-900 dark:text-white">
                Edit Flashcard Set
            </h1>
            <EditFlashcardSetForm initialSet={flashcardSet} />
        </div>
    );
}
