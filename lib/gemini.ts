import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const DEFAULT_DIGEST_PROMPT = `Please provide a concise summary of this content. Include:
- Main topic and key points
- Important takeaways
- Any notable conclusions or recommendations

Keep the summary clear and informative, around 3-5 paragraphs.`;

export async function generateDigest(content: string, customPrompt?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = customPrompt || DEFAULT_DIGEST_PROMPT;
    const fullPrompt = `${prompt}\n\nContent:\n${content}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating digest:', error);
    throw new Error('Failed to generate digest');
  }
}
