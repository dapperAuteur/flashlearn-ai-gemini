/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET: Retrieve a single flashcard set
export async function GET(request: Request, { params }: { params: { setId: string } }) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const { setId } = params;

    const setDocRef = adminDb.collection('flashcard-sets').doc(setId);
    const setDoc = await setDocRef.get();

    if (!setDoc.exists) {
      return NextResponse.json({ error: 'Flashcard set not found' }, { status: 404 });
    }

    const setData = setDoc.data();

    // Ownership check: Ensure the user owns this set
    if (setData?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ id: setDoc.id, ...setData }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching flashcard set ${params.setId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update an existing flashcard set
export async function PUT(request: Request, { params }: { params: { setId: string } }) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const { setId } = params;
    const body = await request.json();

    const setDocRef = adminDb.collection('flashcard-sets').doc(setId);
    const setDoc = await setDocRef.get();

    if (!setDoc.exists) {
      return NextResponse.json({ error: 'Flashcard set not found' }, { status: 404 });
    }

    // Ownership check
    if (setDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, flashcards } = body;
    const updateData = {
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await setDocRef.update(updateData);

    return NextResponse.json({ id: setId, ...updateData }, { status: 200 });
  } catch (error) {
    console.error(`Error updating flashcard set ${params.setId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a flashcard set
export async function DELETE(request: Request, { params }: { params: { setId: string } }) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const { setId } = params;

    const setDocRef = adminDb.collection('flashcard-sets').doc(setId);
    const setDoc = await setDocRef.get();

    if (!setDoc.exists) {
      return NextResponse.json({ error: 'Flashcard set not found' }, { status: 404 });
    }

    // Ownership check
    if (setDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await setDocRef.delete();

    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful deletion
  } catch (error) {
    console.error(`Error deleting flashcard set ${params.setId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
