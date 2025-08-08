import OpenAI from 'openai';

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  // Background rules that apply to all requests
  private getBackgroundRules(): string {
    return `IMPORTANT RULES:
- Do not add quotation marks around your responses
- Give direct answers to what is being asked
- No need for any next questions at the end or beginning
- Keep responses concise and focused
- Maintain consistent tone and style
- Avoid unnecessary explanations or meta-commentary`;
  }

  async generateStory(prompt: string, storyContext?: string): Promise<string> {
    const systemPrompt = `You are a creative storyteller. Generate engaging, well-structured stories based on user prompts.

${this.getBackgroundRules()}

Your task is to create a complete story based on the provided prompt and context.`;

    const userPrompt = `${storyContext ? `Story Context and Guidelines:\n${storyContext}\n\n` : ''}Story Prompt:\n${prompt}`;

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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
- Keep appropriate length and style consistency

${this.getBackgroundRules()}`;

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

  async generateContentWithContext(
    prompt: string,
    existingContent: string,
    contextualPrompt?: string,
  ): Promise<string> {
    const systemPrompt = `You are a creative content generator. You will receive:
1. A prompt describing what content to generate
2. Existing content for context
3. Optional contextual guidelines

Your task is to generate content that fits naturally into the existing context.

${this.getBackgroundRules()}`;

    const userPrompt = `${contextualPrompt ? `Contextual Guidelines:\n${contextualPrompt}\n\n` : ''}Prompt: ${prompt}

Existing content for context:
"${existingContent}"

Generate content that fits naturally into this context.`;

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.6,
    });

    return completion.choices[0]?.message?.content || '';
  }
}


