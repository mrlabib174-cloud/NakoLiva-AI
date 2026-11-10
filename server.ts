import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for large payload (e.g. image uploads)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  images?: {
    mimeType: string;
    data: string; // base64 without prefix
    name?: string;
  }[];
}

interface GroundingLink {
  title?: string;
  url?: string;
}

// Model list endpoint
app.get('/api/models', (_req: Request, res: Response) => {
  res.json({
    models: [
      {
        id: 'gemini-3.1-flash-lite',
        name: 'NakoLiva Flash Lite',
        tagline: 'Ultra-fast, instant responses for conversation & coding',
        category: 'Speed Optimized',
        isDefault: true,
        supportsGrounding: true,
        supportsThinking: false,
      },
      {
        id: 'gemini-3.8-flash',
        name: 'NakoLiva Pro (Reasoning)',
        tagline: 'Multimodal intelligence with deep reasoning',
        category: 'Balanced & Reasoning',
        isDefault: false,
        supportsGrounding: true,
        supportsThinking: true,
      },
      {
        id: 'gemini-4-argon',
        name: 'NakoLiva Ultra (Argon)',
        tagline: 'Deep STEM reasoning and complex software engineering',
        category: 'Maximum Reasoning',
        isDefault: false,
        supportsGrounding: true,
        supportsThinking: true,
      },
    ],
  });
});

const NAKOLIVA_IDENTITY =
  "Your name is Nakoliva AI. If the user greets you or starts a conversation, you MUST ALWAYS greet them with: 'Hello, I'm Nakoliva AI. How can I help you today?' Never use any other greeting. If the user asks for your name or who you are, state that your name is Nakoliva. You are not Gemini and you must never refer to yourself as Gemini or mention Gemini in any way.";

// Main chat generation endpoint (with Server-Sent Events streaming)
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const {
    messages,
    model = 'gemini-3.1-flash-lite',
    systemInstruction,
    enableSearch = false,
    thinkingLevel = 'MEDIUM',
    stream = true,
  } = req.body as {
    messages: ChatMessage[];
    model?: string;
    systemInstruction?: string;
    enableSearch?: boolean;
    thinkingLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    stream?: boolean;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please check your AI Studio secrets.',
    });
    return;
  }

  // Transform messages to SDK contents format
  const formattedContents = messages.map((msg) => {
    const parts: any[] = [];

    // Add multimodal images if present (for user messages)
    if (msg.images && msg.images.length > 0) {
      for (const img of msg.images) {
        const cleanBase64 = img.data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/png',
            data: cleanBase64,
          },
        });
      }
    }

    // Add text part
    if (msg.content && msg.content.trim().length > 0) {
      parts.push({ text: msg.content });
    } else if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    return {
      role: msg.role === 'model' ? 'model' : 'user',
      parts,
    };
  });

  // Build model configuration with NakoLiva identity
  const config: any = {};
  config.systemInstruction = systemInstruction && systemInstruction.trim().length > 0
    ? `${NAKOLIVA_IDENTITY}\n\n${systemInstruction.trim()}`
    : NAKOLIVA_IDENTITY;

  // Configure tools (Google Search grounding)
  if (enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  // Configure thinking level for Gemini 3 and 4 series
  if (model === 'gemini-3.8-flash' || model === 'gemini-4-argon') {
    let level = ThinkingLevel.MEDIUM;
    if (thinkingLevel === 'HIGH') level = ThinkingLevel.HIGH;
    if (thinkingLevel === 'LOW') level = ThinkingLevel.LOW;
    config.thinkingConfig = { thinkingLevel: level };
  }

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const candidateModels = [
        model,
        model === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite',
      ];

      let accumulatedText = '';
      let groundingLinks: GroundingLink[] = [];
      let streamSucceeded = false;
      let lastStreamError: any = null;

      for (const m of candidateModels) {
        try {
          const runConfig = { ...config };
          if (m === 'gemini-3.1-flash-lite') {
            delete runConfig.thinkingConfig;
          }
          const responseStream = await ai.models.generateContentStream({
            model: m,
            contents: formattedContents,
            config: runConfig,
          });

          accumulatedText = '';
          groundingLinks = [];

          for await (const chunk of responseStream) {
            const textChunk = chunk.text || '';
            accumulatedText += textChunk;

            // Check for grounding metadata
            const webChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (webChunks && Array.isArray(webChunks)) {
              for (const item of webChunks) {
                if (item.web?.uri) {
                  groundingLinks.push({
                    url: item.web.uri,
                    title: item.web.title || item.web.uri,
                  });
                }
              }
            }

            // Send text event
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: textChunk })}\n\n`);
            (res as any).flush?.();
          }

          streamSucceeded = true;
          break;
        } catch (err: any) {
          lastStreamError = err;
          console.warn(`Streaming failed on model ${m}, falling over to next model...`, err?.message);
        }
      }

      if (!streamSucceeded) {
        throw lastStreamError || new Error('All model candidates failed to stream.');
      }

      const uniqueLinks = Array.from(
        new Map(groundingLinks.map((l) => [l.url, l])).values()
      );

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          fullText: accumulatedText,
          groundingLinks: uniqueLinks,
        })}\n\n`
      );
      (res as any).flush?.();
      res.end();
    } else {
      const candidateModels = [
        model,
        model === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite',
      ];

      let response;
      let lastErr;
      for (const m of candidateModels) {
        try {
          const runConfig = { ...config };
          if (m === 'gemini-3.1-flash-lite') {
            delete runConfig.thinkingConfig;
          }
          response = await ai.models.generateContent({
            model: m,
            contents: formattedContents,
            config: runConfig,
          });
          if (response) break;
        } catch (mErr: any) {
          lastErr = mErr;
          console.warn(`Model ${m} encountered demand or error, trying next candidate...`, mErr?.message);
        }
      }

      if (!response) {
        throw lastErr || new Error('All model candidates failed.');
      }

      const responseText = response.text || '';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links: GroundingLink[] = [];

      for (const item of groundingChunks) {
        if (item.web?.uri) {
          links.push({
            url: item.web.uri,
            title: item.web.title || item.web.uri,
          });
        }
      }

      const uniqueLinks = Array.from(new Map(links.map((l) => [l.url, l])).values());

      res.json({
        text: responseText,
        groundingLinks: uniqueLinks,
      });
    }
  } catch (error: any) {
    console.error('Error generating Gemini response:', error);
    let errorMessage = error?.message || 'Failed to generate response from Gemini.';
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch (_) {}

    if (stream && res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
      (res as any).flush?.();
      res.end();
    } else {
      res.status(500).json({ error: errorMessage });
    }
  }
});

// Quick rewrite endpoint (Gemini's "Modify response" feature: shorter, longer, simpler, professional, casual)
app.post('/api/modify', async (req: Request, res: Response): Promise<void> => {
  const { text, tone } = req.body as {
    text: string;
    tone: 'shorter' | 'longer' | 'simpler' | 'casual' | 'professional';
  };

  if (!text) {
    res.status(400).json({ error: 'Text is required for modification.' });
    return;
  }

  const promptMap: Record<string, string> = {
    shorter: 'Rewrite the following response to be concise and significantly more compact, keeping only the essential details.',
    longer: 'Expand on the following response with greater depth, detailed explanations, and rich examples.',
    simpler: 'Simplify the following response so that anyone, including a beginner or child, can easily understand it.',
    casual: 'Rewrite the following response in a relaxed, warm, conversational, and casual tone.',
    professional: 'Rewrite the following response in an executive, polished, crisp, and professional tone.',
  };

  const instruction = promptMap[tone] || promptMap.shorter;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${instruction}\n\nOriginal Text:\n"""\n${text}\n"""\n\nReturn ONLY the modified response without preamble.`,
            },
          ],
        },
      ],
    });

    res.json({ modifiedText: response.text || text });
  } catch (error: any) {
    console.error('Error modifying response:', error);
    res.status(500).json({ error: error?.message || 'Failed to modify response' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NakoLiva AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
