/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { defaultSkills } from './src/defaultSkills.js';
import { SkillPill, UserProfile, UserProgress, Order } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini AI
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is missing. Please add it via the Secrets panel in AI Studio.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper to call Gemini with model fallback and error handling
async function callGemini(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`Gemini API call failed for ${model}, trying fallback...`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError;
}
const skillsStore: Record<string, SkillPill> = {};
defaultSkills.forEach(s => {
  skillsStore[s.id] = s;
});

// Seed mock user profile
let activeProfile: UserProfile = {
  id: 'user-123',
  name: 'Alex Mercer',
  email: 'tebar66721@gmail.com', // Match the metadata email!
  role: 'user',
  joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  purchasedSkillPills: ['closing-sales'], // Already owns one to showcase dashboard continuing
  wishlist: ['negotiation-anchor'],
  collections: [
    {
      id: 'col-1',
      title: 'Power Presenter',
      description: 'Master the art of high-impact communications and deal closures.',
      skills: ['closing-sales', 'negotiation-anchor']
    }
  ],
  learningHours: 3.5,
  completedSkillCount: 0,
  streakDays: 4
};

// Seed mock user progress
const progressStore: Record<string, UserProgress> = {
  'closing-sales': {
    skillId: 'closing-sales',
    completedLessons: ['cs-l1'],
    isCompleted: false,
    practiceAnswers: {},
    reflectionAnswers: {},
    bookmarked: false,
    favorite: true,
    notes: {}
  }
};

// Seed mock purchase orders
const ordersStore: Order[] = [
  {
    id: 'ord-98217',
    userId: 'user-123',
    items: [
      {
        skillId: 'closing-sales',
        title: 'The Three-Option Close',
        price: 1.00
      }
    ],
    total: 1.00,
    discount: 0,
    paymentMethod: 'Credit Card (•••• 4242)',
    status: 'paid',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// --- API ENDPOINTS ---

// GET /api/skills - list all skills
app.get('/api/skills', (req, res) => {
  res.json(Object.values(skillsStore));
});

// GET /api/skills/:id - fetch specific skill
app.get('/api/skills/:id', (req, res) => {
  const skill = skillsStore[req.params.id];
  if (!skill) {
    return res.status(404).json({ error: 'SkillPill not found' });
  }
  res.json(skill);
});

// PUT /api/skills/:id - update specific skill (for admin reference edits, etc.)
app.put('/api/skills/:id', (req, res) => {
  const skillId = req.params.id;
  if (!skillsStore[skillId]) {
    return res.status(404).json({ error: 'SkillPill not found' });
  }
  skillsStore[skillId] = {
    ...skillsStore[skillId],
    ...req.body
  };
  res.json(skillsStore[skillId]);
});

// DELETE /api/skills/:id - delete specific skill
app.delete('/api/skills/:id', (req, res) => {
  const skillId = req.params.id;
  if (!skillsStore[skillId]) {
    return res.status(404).json({ error: 'SkillPill not found' });
  }
  delete skillsStore[skillId];
  res.json({ success: true, message: 'SkillPill deleted successfully' });
});

// POST /api/skills/generate - Use Gemini to write a micro skill (SkillPill) from a prompt
app.post('/api/skills/generate', async (req, res) => {
  const { topic, category } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const ai = getAI();
    const prompt = `
      You are a world-class Learning Experience Designer and domain expert.
      Generate a complete, production-ready micro skill (SkillPill) JSON for the topic: "${topic}".
      The category should be: "${category || 'General'}".
      
      A SkillPill solves exactly ONE specific problem and can be learned in 20-30 minutes.
      The output MUST be a valid JSON matching this TypeScript schema:
      
      {
        id: string (kebab-case-short-id),
        title: string (highly compelling and specific, e.g. "The 10-Second Breathe Gap"),
        shortDescription: string (captivating description of the problem solved),
        category: string,
        estimatedTime: string (e.g. "20 mins", "15 mins"),
        difficulty: "Beginner" | "Intermediate" | "Advanced",
        price: number (always 1.00),
        coverUrl: string (Unsplash URL representing this concept, search-friendly image link),
        author: string (Author name + professional subtitle),
        problem: string (clear description of the pain point),
        transformation: string (clear description of the after-state after mastering this),
        whyLearnThis: string[] (3 powerful benefits),
        evidence: string (brief citation of scientific or market validation),
        testimonials: Array<{name: string, role: string, quote: string, rating: number}>,
        faq: Array<{question: string, answer: string}>,
        curriculum: Array<{id: string, title: string, duration: string}> (exactly 2 or 3 lessons),
        lessons: Array<{
          id: string,
          title: string,
          learningObjective: string,
          bigPicture: string,
          definition: string,
          whyItMatters: string,
          analogy: string,
          howItWorks: string[] (3 or 4 actionable sequential sub-steps),
          visualType: "diagram" | "workflow" | "formula" | "comparison" | "timeline",
          visualData: {
            title: string,
            nodes?: Array<{label: string, sub: string}>,
            connections?: string[],
            leftTitle?: string,
            leftItems?: string[],
            rightTitle?: string,
            rightItems?: string[],
            steps?: Array<{label: string, desc: string}>
          },
          realExample: string,
          commonMistakes: string[],
          keyTakeaway: string,
          checklist: string[],
          practiceChallenge: {
            title: string,
            instruction: string,
            sampleAnswer: string
          },
          reflectionPrompt: string,
          summary: string
        }> (must match length and ids of curriculum!),
        practice: Array<{id: string, title: string, instruction: string, scenario: string, interactiveType: "input" | "multiple-choice" | "checklist" | "roleplay", options?: string[], correctOption?: string, checklistItems?: string[], sampleAnswer?: string}> (at least 1 or 2 items),
        reflection: Array<{id: string, question: string, context: string, helperPrompt: string}>,
        summary: string,
        actionPlan: Array<{step: string, description: string, timeline: string}> (3 actionable post-course steps),
        relatedSkills: string[] (empty or strings)
      }

      Return ONLY the raw JSON block without markdown formatting or code blocks. Ensure all text matches the warm, elegant, human-centric tone of Blinkist and Headway. Avoid mechanical technical-sounding AI terms.
    `;

    const response = await callGemini(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const skillData = JSON.parse(response.text?.trim() || '{}') as SkillPill;
    
    // Fill required defaults
    skillData.id = skillData.id || `ai-${Date.now()}`;
    skillData.price = 1.00;
    if (!skillData.coverUrl || !skillData.coverUrl.startsWith('http')) {
      skillData.coverUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800';
    }
    skillData.isCustom = true;
    
    // Store in-memory
    skillsStore[skillData.id] = skillData;

    res.json(skillData);
  } catch (err: any) {
    console.error('Gemini Generation Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate SkillPill' });
  }
});

// POST /api/skills/manual - manually create a skill
app.post('/api/skills/manual', (req, res) => {
  const customSkill = req.body as SkillPill;
  if (!customSkill.title || !customSkill.shortDescription) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  customSkill.id = customSkill.id || `custom-${Date.now()}`;
  const submittedPrice = Number(customSkill.price);
  customSkill.price = Number.isFinite(submittedPrice) && submittedPrice >= 0 ? submittedPrice : 1.00;
  customSkill.isCustom = true;
  if (!customSkill.coverUrl) {
    customSkill.coverUrl = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800';
  }

  skillsStore[customSkill.id] = customSkill;
  res.json(customSkill);
});

// POST /api/skills/import - Import material and turn it into a structured SkillPill using Gemini
app.post('/api/skills/import', async (req, res) => {
  const { fileName, fileContent, category } = req.body;
  if (!fileContent) {
    return res.status(400).json({ error: 'File content is required' });
  }

  try {
    const ai = getAI();
    const prompt = `
      You are an instructional designer. Convert the following raw imported course materials/notes into a beautiful, structured 30-minute micro-learning "SkillPill".
      
      File Name: ${fileName || 'Imported Material'}
      Raw Material:
      """
      ${fileContent}
      """

      The category should be: "${category || 'Imported'}".
      
      You MUST organize it into exactly 2 or 3 lessons, with clear objectives, analogies, practices, and reflections.
      The output MUST be a valid JSON matching this exact structure:
      
      {
        id: string (kebab-case-id),
        title: string (highly focused actionable title),
        shortDescription: string,
        category: string,
        estimatedTime: "25 mins",
        difficulty: "Intermediate",
        price: 1.00,
        coverUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800",
        author: "AI Import Engine",
        problem: string,
        transformation: string,
        whyLearnThis: string[],
        evidence: string,
        testimonials: Array<{name: string, role: string, quote: string, rating: number}>,
        faq: Array<{question: string, answer: string}>,
        curriculum: Array<{id: string, title: string, duration: string}>,
        lessons: Array<{
          id: string,
          title: string,
          learningObjective: string,
          bigPicture: string,
          definition: string,
          whyItMatters: string,
          analogy: string,
          howItWorks: string[],
          visualType: "comparison" | "timeline" | "diagram",
          visualData: { title: string, leftTitle?: string, leftItems?: string[], rightTitle?: string, rightItems?: string[] },
          realExample: string,
          commonMistakes: string[],
          keyTakeaway: string,
          checklist: string[],
          practiceChallenge: { title: string, instruction: string, sampleAnswer: string },
          reflectionPrompt: string,
          summary: string
        }>,
        practice: Array<{id: string, title: string, instruction: string, scenario: string, interactiveType: "input", sampleAnswer: string}>,
        reflection: Array<{id: string, question: string, context: string, helperPrompt: string}>,
        summary: string,
        actionPlan: Array<{step: string, description: string, timeline: string}>,
        relatedSkills: []
      }

      Return ONLY the raw JSON block without markdown formatting or code blocks.
    `;

    const response = await callGemini(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const skillData = JSON.parse(response.text?.trim() || '{}') as SkillPill;
    skillData.id = skillData.id || `import-${Date.now()}`;
    skillData.price = 1.00;
    skillData.isCustom = true;

    skillsStore[skillData.id] = skillData;
    res.json(skillData);
  } catch (err: any) {
    console.error('Import Generation Error:', err);
    res.status(500).json({ error: err.message || 'Failed to parse and import materials' });
  }
});

// GET /api/profile - fetch active user profile
app.get('/api/profile', (req, res) => {
  res.json({
    profile: activeProfile,
    progress: progressStore,
    orders: ordersStore
  });
});

// POST /api/profile/purchase - Purchase a SkillPill
app.post('/api/profile/purchase', (req, res) => {
  const { skillId, paymentMethod, couponCode } = req.body;
  const skill = skillsStore[skillId];
  if (!skill) {
    return res.status(404).json({ error: 'SkillPill not found' });
  }

  if (activeProfile.purchasedSkillPills.includes(skillId)) {
    return res.json({ success: true, message: 'Already purchased' });
  }

  // Deduct/Apply coupon
  let finalPrice = skill.price;
  if (couponCode && couponCode.toUpperCase() === 'PILLFREE') {
    finalPrice = 0;
  }

  // Create order
  const orderId = `ord-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder: Order = {
    id: orderId,
    userId: activeProfile.id,
    items: [
      {
        skillId: skill.id,
        title: skill.title,
        price: finalPrice
      }
    ],
    total: finalPrice,
    discount: skill.price - finalPrice,
    paymentMethod: paymentMethod || 'Visa Ending in 4242',
    status: 'paid',
    createdAt: new Date().toISOString()
  };

  ordersStore.unshift(newOrder);

  // Update profile
  activeProfile.purchasedSkillPills.push(skillId);
  
  // Set initial empty progress
  if (!progressStore[skillId]) {
    progressStore[skillId] = {
      skillId,
      completedLessons: [],
      isCompleted: false,
      practiceAnswers: {},
      reflectionAnswers: {},
      bookmarked: false,
      favorite: false,
      notes: {}
    };
  }

  res.json({
    success: true,
    profile: activeProfile,
    progress: progressStore,
    order: newOrder
  });
});

// POST /api/profile/wishlist - Toggle wishlist
app.post('/api/profile/wishlist', (req, res) => {
  const { skillId } = req.body;
  const index = activeProfile.wishlist.indexOf(skillId);
  if (index >= 0) {
    activeProfile.wishlist.splice(index, 1);
  } else {
    activeProfile.wishlist.push(skillId);
  }
  res.json({ wishlist: activeProfile.wishlist });
});

// POST /api/profile/progress - Update learning progress
app.post('/api/profile/progress', (req, res) => {
  const { skillId, completedLessons, isCompleted, practiceAnswers, reflectionAnswers, favorite, bookmarked, notes } = req.body;
  
  if (!progressStore[skillId]) {
    progressStore[skillId] = {
      skillId,
      completedLessons: [],
      isCompleted: false,
      practiceAnswers: {},
      reflectionAnswers: {},
      bookmarked: false,
      favorite: false,
      notes: {}
    };
  }

  const p = progressStore[skillId];
  if (completedLessons) p.completedLessons = completedLessons;
  if (isCompleted !== undefined) {
    if (isCompleted && !p.isCompleted) {
      activeProfile.completedSkillCount += 1;
      activeProfile.learningHours += 0.5; // Approx 30 mins added
    }
    p.isCompleted = isCompleted;
  }
  if (practiceAnswers) p.practiceAnswers = { ...p.practiceAnswers, ...practiceAnswers };
  if (reflectionAnswers) p.reflectionAnswers = { ...p.reflectionAnswers, ...reflectionAnswers };
  if (notes) p.notes = { ...p.notes, ...notes };
  if (favorite !== undefined) p.favorite = favorite;
  if (bookmarked !== undefined) p.bookmarked = bookmarked;

  res.json({ progress: p, profile: activeProfile });
});

// POST /api/ai/ask - Lesson Helper (Explain, Simplify, Analogy, Partner)
app.post('/api/ai/ask', async (req, res) => {
  const { mode, lessonContext, userMessage, chatHistory } = req.body;
  
  try {
    const ai = getAI();
    let promptInstruction = '';

    if (mode === 'simplify') {
      promptInstruction = 'You are a compassionate learning coach. Simplify the following concept so a 10-year-old can understand it instantly with a cheerful, clear analogy.';
    } else if (mode === 'analogy') {
      promptInstruction = 'Generate 2 highly memorable, vivid analogies from everyday life to explain this specific concept.';
    } else if (mode === 'explain') {
      promptInstruction = 'Provide a deep, expert, yet conversational breakdown of this concept. Focus heavily on practical real-world execution.';
    } else if (mode === 'partner') {
      promptInstruction = 'You are an interactive learning companion. Coach the user on their reflection or practice response. Give supportive, constructive, and highly actionable feedback.';
    } else {
      promptInstruction = 'You are a warm, educational coach. Answer the user’s question about this micro skill lesson with high clarity.';
    }

    const messages = [
      {
        role: 'user',
        parts: [{
          text: `
            ${promptInstruction}
            
            Lesson Context:
            - Lesson: "${lessonContext.title}"
            - Objective: "${lessonContext.objective}"
            - Concept details: "${lessonContext.details}"

            User Query/State: "${userMessage}"
          `
        }]
      }
    ];

    const response = await callGemini(ai, {
      contents: messages,
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('Lesson AI Help Error:', err);
    res.status(500).json({ error: err.message || 'Failed to request AI Coach helper' });
  }
});


// Serve static Vite assets in production, or hook up dev middlewares
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  // Serve built assets from dist/
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res, next) => {
    // If it's not an API call, serve index.html
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // Dev mode: use Vite middleware
  console.log('Running in Development mode. Initializing Vite middleware...');
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.join(__dirname, '.')
  });
  app.use(vite.middlewares);
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SkillPill full-stack platform server running at http://0.0.0.0:${PORT}`);
});
