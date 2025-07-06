/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET handler to fetch current user's profile
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findById(session.user.id).select('-password');
        if (!user) return new NextResponse('User not found', { status: 404 });
        return NextResponse.json(user);
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// PUT handler to update user's profile
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const currentUser = await User.findById(session.user.id);
        if (!currentUser) return new NextResponse('User not found', { status: 404 });

        const formData = await request.formData();
        const updates: Record<string, any> = {};
        
        // Process text fields
        for (const [key, value] of formData.entries()) {
            if (!['file', 'oldPassword', 'newPassword', 'confirmNewPassword'].includes(key) && value) {
                updates[key] = value;
            }
        }

        // Process password change
        const oldPassword = formData.get('oldPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        if (oldPassword && newPassword) {
            const isPasswordCorrect = await bcrypt.compare(oldPassword, currentUser.password);
            if (!isPasswordCorrect) {
                return new NextResponse('Incorrect old password.', { status: 403 });
            }
            updates.password = await bcrypt.hash(newPassword, 10);
        }

        // Process file upload
        const file = formData.get('file') as File | null;
        if (file) {
            const fileBuffer = await file.arrayBuffer();
            const fileUri = `data:${file.type};base64,${Buffer.from(fileBuffer).toString('base64')}`;
            const uploadResponse = await cloudinary.uploader.upload(fileUri, {
                folder: 'flashcard_ai_profiles', public_id: session.user.id, overwrite: true,
            });
            updates.image = uploadResponse.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(session.user.id, updates, { new: true }).select('-password');
        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('[PROFILE_UPDATE_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
