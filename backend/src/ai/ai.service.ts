import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private config: ConfigService) {
    // Gemini exposes an OpenAI-compatible endpoint —
    // same SDK, just point it at Google's base URL
    this.client = new OpenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY')!,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }

  // ─── GENERATE JOB DESCRIPTION ─────────────────────────────
  async generateDescription(title: string, points: string) {
    const completion = await this.client.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional recruiter. Write clear, compelling job descriptions. ' +
            'Use a few short paragraphs and a bulleted responsibilities list. No fluff.',
        },
        {
          role: 'user',
          content: `Write a job description for the role: "${title}".\n\nKey points to include:\n${points}`,
        },
      ],
    });

    return { description: completion.choices[0].message.content };
  }

  // ─── SCORE A CANDIDATE ────────────────────────────────────
  async scoreCandidate(
    jobTitle: string,
    jobDescription: string,
    coverLetter: string,
  ) {
    const completion = await this.client.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a hiring assistant. Score how well a candidate fits a job from 0 to 100 ' +
            'based on their cover letter. Respond ONLY with valid JSON in this exact format: ' +
            '{"score": <number>, "reason": "<one sentence>"}. No markdown, no extra text.',
        },
        {
          role: 'user',
          content: `Job: ${jobTitle}\n\nDescription: ${jobDescription}\n\nCandidate cover letter: ${coverLetter}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content || '{}';
    // strip any markdown code fences the model might add
    const cleaned = raw.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return { score: parsed.score ?? null, reason: parsed.reason ?? null };
    } catch {
      return { score: null, reason: null };
    }
  }
}
