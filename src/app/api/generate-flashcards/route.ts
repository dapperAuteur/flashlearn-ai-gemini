import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new NextResponse('A prompt is required', { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    console.log('model :>> ', model);

    // This is a carefully crafted prompt to ensure the AI returns a valid JSON array.
    const fullPrompt = `
      Based on the following topic, generate a set of 5 to 10 flashcards.
      The topic is: "${prompt}".
      Please respond with ONLY a valid JSON array of objects. Each object should represent a flashcard
      and have two properties: "front" (the question or term) and "back" (the answer or definition).
      Do not include any text, explanation, or markdown formatting before or after the JSON array.

      Example format:
      [
        {
          "front": "What is the capital of France?",
          "back": "Paris"
        },
        {
          "front": "What is 2 + 2?",
          "back": "4"
        }
      ]
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the response to ensure it's valid JSON
    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Attempt to parse the JSON response from the AI
    const flashcards = JSON.parse(jsonText);

    return NextResponse.json({ flashcards });

  } catch (error) {
    console.error('FLASHCARD_GENERATION_ERROR', error);
    // It's helpful to know what the AI returned if parsing fails
    if (error instanceof SyntaxError) {
        return new NextResponse('Failed to parse the response from the AI. The format was invalid.', { status: 500 });
    }
    return new NextResponse('An internal error occurred while generating flashcards.', { status: 500 });
  }
}
