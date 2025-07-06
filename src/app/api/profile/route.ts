/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase'; // Use client-side app for storage operations

const storage = getStorage(app);

// GET handler to fetch the current user's profile data from Firestore
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const decodedToken = await adminAuth.verifyIdToken(token);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            return new NextResponse('User profile not found in Firestore.', { status: 404 });
        }
        return NextResponse.json(userDoc.data());
    } catch (error) {
        console.error('[GET_PROFILE_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}


// PUT handler to update the user's profile
export async function PUT(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });
        
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const formData = await req.formData();
        const updates: Record<string, any> = {};
        const authUpdates: Record<string, any> = {};

        // Process text fields
        for (const [key, value] of formData.entries()) {
            if (key !== 'file' && key !== 'newPassword' && value) {
                updates[key] = value;
            }
        }
        if (updates.firstName || updates.lastName) {
            authUpdates.displayName = `${updates.firstName || decodedToken.name?.split(' ')[0]} ${updates.lastName || ''}`.trim();
        }
        if (updates.email) {
            authUpdates.email = updates.email;
        }

        // Process file upload to Firebase Storage
        const file = formData.get('file') as File | null;
        if (file) {
            const fileUri = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
            const storageRef = ref(storage, `profile-images/${userId}`);
            await uploadString(storageRef, fileUri, 'data_url');
            const photoURL = await getDownloadURL(storageRef);
            authUpdates.photoURL = photoURL;
            updates.image = photoURL;
        }

        // Process password change
        const newPassword = formData.get('newPassword') as string;
        if (newPassword) {
            authUpdates.password = newPassword;
        }
        
        // --- Perform Updates ---
        // 1. Update Firebase Authentication
        if (Object.keys(authUpdates).length > 0) {
            await adminAuth.updateUser(userId, authUpdates);
        }

        // 2. Update Firestore document
        if (Object.keys(updates).length > 0) {
            await adminDb.collection('users').doc(userId).update(updates);
        }

        return NextResponse.json({ message: 'Profile updated successfully' });

    } catch (error: any) {
        console.error('[UPDATE_PROFILE_ERROR]', error);
        // Provide more specific error messages from Firebase
        if (error.code === 'auth/email-already-exists') {
            return new NextResponse('The email address is already in use by another account.', { status: 409 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
