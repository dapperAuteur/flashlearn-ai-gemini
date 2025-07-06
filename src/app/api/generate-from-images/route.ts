import { NextRequest, NextResponse } from 'next/server';
import { Part } from '@google/generative-ai';
import { IMAGE_MAX_FILES, IMAGE_MAX_FILE_SIZE_MB, IMAGE_MAX_FILE_SIZE_BYTES, FLASHCARD_MAX, FLASHCARD_MIN, MODEL } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new NextResponse('No image files provided', { status: 400 });
    }

    if (files.length > IMAGE_MAX_FILES) {
        return new NextResponse(`You can upload a maximum of ${IMAGE_MAX_FILES} images at a time.`, { status: 413 });
    }

    const imageParts: Part[] = [];

    for (const file of files) {
        if (file.size > IMAGE_MAX_FILE_SIZE_BYTES) {
            return new NextResponse(`File "${file.name}" exceeds the ${IMAGE_MAX_FILE_SIZE_MB}MB size limit.`, { status: 413 });
        }
        const buffer = await file.arrayBuffer();
        imageParts.push({
            inlineData: {
                mimeType: file.type,
                data: Buffer.from(buffer).toString('base64'),
            },
        });
    }

    // 2. Create the prompt for the Gemini API
    const prompt = `
      Analyze the following image(s), which might be pages from a textbook, slides, or diagrams.
      Based on the text and visual information, generate a comprehensive set of ${FLASHCARD_MIN} to ${FLASHCARD_MAX} flashcards.
      Prioritize key terms, definitions, and concepts.

      Please respond with ONLY a valid JSON array of objects. Each object should represent a flashcard
      and have two properties: "front" (the question or term) and "back" (the answer or definition).
      Do not include any text, explanation, or markdown formatting before or after the JSON array.
    `;

    // 3. Send the prompt and all image parts to the Gemini API
    const result = await MODEL.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = await response.text();

    // 4. Clean and parse the JSON response
    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const flashcards = JSON.parse(jsonText);

    return NextResponse.json({ flashcards, fileName: "Flashcards from images" });

  } catch (error) {
    console.error('IMAGE_GENERATION_ERROR', error);
    return new NextResponse('An internal error occurred while processing the images.', { status: 500 });
  }
}
