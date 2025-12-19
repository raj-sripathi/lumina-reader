import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export const DEFAULT_DIGEST_PROMPT = `Please provide a concise summary of this content. Include:
- Main topic and key points
- Important takeaways
- Any notable conclusions or recommendations

Keep the summary clear and informative, around 3-5 paragraphs. Use bullets for clarity where appropriate.`;

export async function generateDigest(content: string, customPrompt?: string): Promise<string> {
  try {
    const prompt = customPrompt || DEFAULT_DIGEST_PROMPT;
    const fullPrompt = `${prompt}\n\nContent:\n${content}`;

    const response = await openai.responses.create({
      model: 'gpt-5',
      input: fullPrompt
    });

    return response.output_text;
  } catch (error) {
    console.error('Error generating digest:', error);
    throw new Error('Failed to generate digest');
  }
}
