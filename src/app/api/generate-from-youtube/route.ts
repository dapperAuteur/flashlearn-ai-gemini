import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { FLASHCARD_MAX, FLASHCARD_MIN, MODEL } from '@/lib/constants';

export async function POST(req: Request) {
  console.log("youtube api");
  
  try {
    const { videoUrl } = await req.json();
    console.log('videoUrl :>> ', videoUrl);

    if (!videoUrl) {
      return new NextResponse('YouTube video URL is required', { status: 400 });
    }

    // 1. Fetch the transcript from the YouTube video
    const transcriptParts = await YoutubeTranscript.fetchTranscript(videoUrl);
    if (!transcriptParts || transcriptParts.length === 0) {
      return new NextResponse('Could not fetch transcript for this video. It may have transcripts disabled.', { status: 404 });
    }
    const transcript = transcriptParts.map(part => part.text).join(' ');


    // 2. Use the Gemini API to generate flashcards from the transcript
    const prompt = `
      Based on the following video transcript, generate a set of ${FLASHCARD_MIN} to ${FLASHCARD_MAX} flashcards
      that capture the key concepts and information.
      
      Transcript: "${transcript.substring(0, 30000)}" 
      
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

    return NextResponse.json({ flashcards });

  } catch (error) {
    console.error('YOUTUBE_GENERATION_ERROR', error); 
    // Type assertion to treat error as an object with a message property
    if (error instanceof Error && error.message.includes('Could not find a transcript')) {
        return new NextResponse('No transcript found for this video.', { status: 404 });
    }
    return new NextResponse('An internal error occurred while generating flashcards from YouTube.', { status: 500 });
  }
}
