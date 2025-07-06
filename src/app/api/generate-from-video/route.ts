import { NextRequest, NextResponse } from 'next/server';
import { Part } from '@google/generative-ai';
import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB, MODEL} from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse('No video file provided', { status: 400 });
    }

    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      return new NextResponse(`File is too large. The maximum size is ${FILE_SIZE_LIMIT_MB}MB.`, { status: 413 });
    }

    // 1. Convert the video file to a base64 string for the API
    const fileBuffer = await file.arrayBuffer();
    const videoBase64 = Buffer.from(fileBuffer).toString('base64');

    const videoPart: Part = {
      inlineData: {
        mimeType: file.type,
        data: videoBase64,
      },
    };

    // 2. Create the prompt for the Gemini API
    const prompt = `
      Analyze the following video. Based on its visual and audio content, 
      generate a set of 5 to 15 flashcards that capture the key concepts and information presented.

      Please respond with ONLY a valid JSON array of objects. Each object should represent a flashcard
      and have two properties: "front" (the question or term) and "back" (the answer or definition).
      Do not include any text, explanation, or markdown formatting before or after the JSON array.
    `;

    // 3. Send the video and prompt to the Gemini API
    const result = await MODEL.generateContent([prompt, videoPart]);
    const response = await result.response;
    const text = await response.text();

    // 4. Clean and parse the JSON response
    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const flashcards = JSON.parse(jsonText);

    return NextResponse.json({ flashcards, fileName: file.name });

  } catch (error) {
    console.error('VIDEO_GENERATION_ERROR', error);
    return new NextResponse('An internal error occurred while processing the video file.', { status: 500 });
  }
}
