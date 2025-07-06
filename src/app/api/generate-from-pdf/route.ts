import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB, FLASHCARD_MAX, FLASHCARD_MIN, MODEL } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse('No PDF file provided', { status: 400 });
    }

    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      return new NextResponse(`File is too large. The maximum size is ${FILE_SIZE_LIMIT_MB}MB.`, { status: 413 });
    }

    // 1. Parse the PDF to extract text
    const fileBuffer = await file.arrayBuffer();
    const pdfData = await pdf(Buffer.from(fileBuffer));
    const pdfText = pdfData.text;

    if (!pdfText) {
        return new NextResponse('Could not extract text from the PDF.', { status: 500 });
    }

    // 2. Use the Gemini API to generate flashcards from the text
    const prompt = `
      Based on the following text extracted from a PDF, generate a set of ${FLASHCARD_MIN} to ${FLASHCARD_MAX} flashcards
      that capture the key concepts, definitions, and important information.

      PDF Text (first 30000 characters): "${pdfText.substring(0, 30000)}" 
      
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
    console.error('PDF_GENERATION_ERROR', error);
    return new NextResponse('An internal error occurred while processing the PDF.', { status: 500 });
  }
}
