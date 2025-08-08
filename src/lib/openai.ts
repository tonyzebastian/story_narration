import OpenAI from 'openai';

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateStory(prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a creative storyteller. Generate engaging, well-structured stories based on user prompts.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  async editStory(
    fullStoryText: string,
    selectedText: string,
    selectionStart: number,
    selectionEnd: number,
    editPrompt: string,
    contextualPrompt?: string,
  ): Promise<string> {
    const systemPrompt = `You are an expert story editor. You will receive:
1. The full story for context
2. A specific text selection to modify
3. Instructions for the modification
4. Optional contextual guidelines

Your task is to return ONLY the replacement text for the selected portion. The replacement should:
- Maintain narrative coherence with the full story
- Follow the editing instructions precisely  
- Respect the contextual guidelines if provided
- Keep appropriate length and style consistency`;

    const userPrompt = `Full story context:
"${fullStoryText}"

Selected text to replace (characters ${selectionStart}-${selectionEnd}):
"${selectedText}"

Edit instruction: ${editPrompt}

${contextualPrompt ? `\nContextual guidelines: ${contextualPrompt}` : ''}

Return only the replacement text for the selected portion.`;

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || '';
  }
}


