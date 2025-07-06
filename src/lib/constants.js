// Define a size limit for uploads (e.g., 50MB)
import { GoogleGenerativeAI } from '@google/generative-ai';
export const FILE_SIZE_LIMIT_MB = 50;
export const FILE_SIZE_LIMIT_BYTES = FILE_SIZE_LIMIT_MB * 1024 * 1024;

// Using a multimodal model is essential for this task.
// AI Model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export const MODEL = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });