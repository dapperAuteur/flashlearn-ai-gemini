import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB, FLASHCARD_MAX, FLASHCARD_MIN, MODEL } from '@/lib/constants';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse('No text file provided', { status: 400 });
    }

    if (file.size > FILE_SIZE_LIMIT_BYTES) {
        return new NextResponse(`File is too large. The maximum size is ${FILE_SIZE_LIMIT_MB}MB.`, { status: 413 });
    }

    // 1. Read the text content from the file
    const textContent = await file.text();

    if (!textContent) {
        return new NextResponse('Could not read text from the file.', { status: 500 });
    }

    // 2. Use the Gemini API to generate flashcards from the text
    const prompt = `
      Based on the following text content, generate a set of ${FLASHCARD_MIN} to ${FLASHCARD_MAX} flashcards
      that capture the key concepts, definitions, and important information.

      Text Content (first 30000 characters): "${textContent.substring(0, 30000)}" 
      
      Please respond with ONLY a valid JSON array of objects. Each object should represent a flashcard
      and have two properties: "front" (the question or term) and "back" (the answer or definition).
      Do not include any text, explanation, or markdown formatting before or after the JSON array.
    `;

    const result = await MODEL.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean and parse the response
    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const flashcards = JSON.parse(jsonText);

    return NextResponse.json({ flashcards, fileName: file.name });

  } catch (error) {
    console.error('TEXT_FILE_GENERATION_ERROR', error);
    return new NextResponse('An internal error occurred while processing the text file.', { status: 500 });
  }
}
