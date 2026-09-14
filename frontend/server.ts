import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing.');
    aiInstance = new GoogleGenAI({ apiKey: key });
  }

  return aiInstance;
}

async function callGemini(ai: GoogleGenAI, params: { contents: unknown; config?: unknown }) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: unknown;

  for (const model of models) {
    try {
      return await ai.models.generateContent({
        model,
        contents: params.contents as never,
        config: params.config as never,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

app.post('/api/ai/ask', async (req, res) => {
  const { mode, lessonContext, userMessage } = req.body;

  try {
    const instructions: Record<string, string> = {
      simplify: 'Simplify this concept so a 10-year-old can understand it with a clear everyday analogy.',
      analogy: 'Provide two memorable everyday analogies for this concept.',
      explain: 'Give a practical, conversational explanation of this concept.',
      partner: 'Give supportive and actionable feedback on the learner response.',
    };
    const response = await callGemini(getAI(), {
      contents: [{
        role: 'user',
        parts: [{
          text: `${instructions[mode] ?? 'Answer the learner question clearly and helpfully.'}\n\nLesson: ${lessonContext?.title ?? ''}\nObjective: ${lessonContext?.objective ?? ''}\nMaterial: ${lessonContext?.details ?? ''}\n\nLearner input: ${userMessage ?? ''}`,
        }],
      }],
    });

    res.json({ reply: response.text ?? '' });
  } catch (error) {
    console.error('AI Coach request failed:', error);
    res.status(503).json({ error: 'AI Coach sedang tidak tersedia. Silakan coba lagi.' });
  }
});

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname,
  });
  app.use(vite.middlewares);
}

const port = 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SkillPill frontend running at http://0.0.0.0:${port}`);
});
