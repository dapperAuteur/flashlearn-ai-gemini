import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB} from '@/lib/constants';

// It's recommended to use a model that's optimized for multimodal inputs
// like gemini-1.5-flash when it becomes generally available.
// For now, we will prepare the structure.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse('No audio file provided', { status: 400 });
    }

    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      return new NextResponse(`File is too large. The maximum size is ${FILE_SIZE_LIMIT_MB}MB.`, { status: 413 });
    }

    // 1. Convert the audio file to a base64 string for the API
    const fileBuffer = await file.arrayBuffer();
    const audioBase64 = Buffer.from(fileBuffer).toString('base64');

    const audioPart: Part = {
      inlineData: {
        mimeType: file.type,
        data: audioBase64,
      },
    };

    // 2. Create the prompt for the Gemini API
    const prompt = `
      Listen to the following audio. Transcribe the content and then, based on that transcription, 
      generate a set of 5 to 15 flashcards that capture the key concepts and information.

      Please respond with ONLY a valid JSON array of objects. Each object should represent a flashcard
      and have two properties: "front" (the question or term) and "back" (the answer or definition).
      Do not include any text, explanation, or markdown formatting before or after the JSON array.
    `;

    // 3. Send the audio and prompt to the Gemini API
    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const text = await response.text();

    // 4. Clean and parse the JSON response
    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const flashcards = JSON.parse(jsonText);

    return NextResponse.json({ flashcards, fileName: file.name });

  } catch (error) {
    console.error('AUDIO_GENERATION_ERROR', error);
    return new NextResponse('An internal error occurred while processing the audio file.', { status: 500 });
  }
}
