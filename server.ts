/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let pdfParse: any = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse could not be loaded via require:', e);
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with 15MB limit for PDF uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper: Calculate text metrics
function calculateStats(text: string) {
  const clean = text.trim();
  const charCount = clean.length;
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const pageCountApprox = Math.max(1, Math.round(charCount / 2200));
  const readingTimeMin = Math.max(1, Math.round(wordCount / 160));
  return {
    charCount,
    wordCount,
    pageCountApprox,
    readingTimeMin,
  };
}

// 1. Endpoint: Extract text from PDF or raw input
app.post('/api/extract-text', async (req: Request, res: Response) => {
  try {
    const { pdfBase64, rawText, filename } = req.body;

    let extractedText = '';

    if (pdfBase64) {
      if (!pdfParse) {
        return res.status(500).json({
          error: 'Модуль обработки PDF временно недоступен на сервере.',
        });
      }
      const buffer = Buffer.from(pdfBase64, 'base64');
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Размер файла превышает лимит 10 МБ.',
        });
      }

      const pdfData = await pdfParse(buffer);
      extractedText = (pdfData.text || '').replace(/\r\n/g, '\n').trim();

      // Check for scanned / empty PDF
      if (!extractedText || extractedText.length < 80) {
        return res.status(422).json({
          error:
            'В загруженном файле не обнаружен текстовый слой (вероятно, это графический скан, защищенный документ или фото). MVP версия обрабатывает только PDF с текстовым слоем. Пожалуйста, вставьте текст главы вручную.',
        });
      }
    } else if (typeof rawText === 'string') {
      extractedText = rawText.replace(/\r\n/g, '\n').trim();
    } else {
      return res.status(400).json({ error: 'Не переданы данные для анализа.' });
    }

    const stats = calculateStats(extractedText);
    const warnings: string[] = [];

    if (stats.charCount < 2000) {
      warnings.push(
        `Объем текста (${stats.charCount.toLocaleString('ru-RU')} симв.) меньше рекомендуемого минимума (2 000 симв.). Количество сгенерированных вопросов и карточек может быть сокращено.`
      );
    } else if (stats.charCount > 50000) {
      warnings.push(
        `Объем текста (${stats.charCount.toLocaleString('ru-RU')} симв.) превышает рекомендуемый лимит (50 000 симв.). Рекомендуется обрабатывать одну главу за раз.`
      );
    }

    // Check for formula / table markers
    if (/(\bтаблица\b|\bрисунок\b|\bрис\.\b|\bсхема\b|[\u2200-\u22FF])/i.test(extractedText)) {
      warnings.push(
        'Документ содержит ссылки на таблицы, формулы или иллюстрации. MVP обрабатывает только извлеченный текст.'
      );
    }

    return res.json({
      success: true,
      text: extractedText,
      stats,
      warnings,
      filename: filename || 'Вставленный текст',
    });
  } catch (err: any) {
    console.error('Text extraction failed:', err?.message || err);
    return res.status(500).json({
      error: 'Ошибка при обработке документа: ' + (err?.message || 'Неизвестная ошибка'),
    });
  }
});

// 2. Endpoint: Generate Full Study Kit using Gemini
app.post('/api/generate-kit', async (req: Request, res: Response) => {
  try {
    const { title, sourceText } = req.body;

    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length < 50) {
      return res.status(400).json({ error: 'Предоставьте достаточный учебный текст.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY не настроен на сервере. Пожалуйста, проверьте панель Settings > Secrets.',
      });
    }

    const truncatedSource = sourceText.slice(0, 60000);
    const charCount = truncatedSource.length;
    // Determine questions target (up to 10)
    const targetQuestions = charCount < 3000 ? 5 : charCount < 6000 ? 8 : 10;
    const targetCards = charCount < 3000 ? 8 : charCount < 6000 ? 12 : 15;

    const systemPrompt = `Ты — эксперт-методист и академический редактор учебных материалов высшей школы.
Твоя задача — преобразовать переданную главу учебника в целостный учебный комплект для самостоятельной подготовки студента на русском языке.

ТРЕБОВАНИЯ К КОМПЛЕКТУ:
1. КРАТКИЙ КОНСПЕКТ:
- overview: краткое, емкое описание темы (2-4 предложения).
- sections: 3-5 логических разделов. Каждый раздел содержит title, содержательный текст content, 2-4 ключевых пункта keyPoints, и ОБЯЗАТЕЛЬНО sourceQuote (дословная точная цитата из переданного текста, подтверждающая содержание).
- definitions: 3-6 ключевых понятий и терминов с четким определением и дословной цитатой sourceQuote.
- keyTakeaways: 3-5 фундаментальных положений блока «Что нужно запомнить» с точной цитатой sourceQuote.

2. ТЕСТ ДЛЯ САМОПРОВЕРКИ:
- Создай ${targetQuestions} вопросов с глубоким фокусом на понимание сути, а не формальную зубрежку.
- Каждый вопрос содержит:
  * question: четкая формулировка вопроса;
  * options: ровно 4 варианта ответа;
  * correctOptionIndex: индекс правильного ответа (0, 1, 2 или 3);
  * explanation: доходчивое объяснение, почему этот ответ правильный, а другие нет;
  * sourceQuote: точная дословная цитата из текста, доказывающая правильность ответа.

3. КАРТОЧКИ ДЛЯ ПОВТОРЕНИЯ:
- Создай ${targetCards} карточек:
  * front: вопрос или ключевой термин;
  * back: краткий точный ответ или формулировка сути;
  * category: тема/раздел карточки;
  * sourceQuote: подтверждающая цитата из текста.

ВАЖНЕЙШИЕ ПРАВИЛА:
- Опирайся ИСКЛЮЧИТЕЛЬНО на предоставленный текст главы. Не дополняй факты выдуманными деталями из внешних источников.
- Все sourceQuote ОБЯЗАТЕЛЬНО должны быть реальными предложениями или фрагментами из переданного текста, чтобы студент мог перейти к ним в источнике.
- Язык всех материалов — чистый академический русский язык.`;

    const userPrompt = `Тема главы: "${title || 'Учебный материал'}"

УЧЕБНЫЙ ТЕКСТ ГЛАВЫ:
"""
${truncatedSource}
"""

Сгенерируй полный учебный комплект строго по заданной JSON схеме.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING },
                sections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                      keyPoints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      sourceQuote: { type: Type.STRING },
                    },
                    required: ['title', 'content', 'keyPoints', 'sourceQuote'],
                  },
                },
                definitions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      sourceQuote: { type: Type.STRING },
                    },
                    required: ['term', 'definition', 'sourceQuote'],
                  },
                },
                keyTakeaways: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      point: { type: Type.STRING },
                      sourceQuote: { type: Type.STRING },
                    },
                    required: ['point', 'sourceQuote'],
                  },
                },
              },
              required: ['overview', 'sections', 'definitions', 'keyTakeaways'],
            },
            test: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctOptionIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  sourceQuote: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctOptionIndex', 'explanation', 'sourceQuote'],
              },
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  category: { type: Type.STRING },
                  sourceQuote: { type: Type.STRING },
                },
                required: ['front', 'back', 'category', 'sourceQuote'],
              },
            },
          },
          required: ['summary', 'test', 'flashcards'],
        },
      },
    });

    const jsonText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(jsonText);

    // Ensure IDs on test questions and flashcards
    if (Array.isArray(parsed.test)) {
      parsed.test = parsed.test.map((q: any, idx: number) => ({
        ...q,
        id: q.id || `q_${Date.now()}_${idx}`,
      }));
    }

    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards.map((c: any, idx: number) => ({
        ...c,
        id: c.id || `fc_${Date.now()}_${idx}`,
        status: 'unseen',
      }));
    }

    return res.json({
      success: true,
      summary: parsed.summary,
      test: parsed.test,
      flashcards: parsed.flashcards,
    });
  } catch (err: any) {
    console.error('Kit generation failed:', err?.message || err);
    return res.status(500).json({
      error: 'Не удалось сгенерировать учебный комплект: ' + (err?.message || 'Ошибка сервиса ИИ'),
    });
  }
});

// 3. Endpoint: Selective component regeneration
app.post('/api/regenerate-component', async (req: Request, res: Response) => {
  try {
    const { component, title, sourceText } = req.body;
    if (!aiClient) {
      return res.status(503).json({ error: 'GEMINI_API_KEY не настроен.' });
    }
    if (!['summary', 'test', 'flashcards'].includes(component)) {
      return res.status(400).json({ error: 'Неизвестный компонент.' });
    }

    const truncated = (sourceText || '').slice(0, 50000);

    let prompt = '';
    let responseSchema: any = null;

    if (component === 'test') {
      prompt = `Сгенерируй для темы "${title}" тест из 8-10 вопросов для самопроверки по тексту. Каждый вопрос содержит 4 варианта, 1 правильный индекс, объяснение и цитату из источника.`;
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctOptionIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            sourceQuote: { type: Type.STRING },
          },
          required: ['question', 'options', 'correctOptionIndex', 'explanation', 'sourceQuote'],
        },
      };
    } else if (component === 'flashcards') {
      prompt = `Сгенерируй для темы "${title}" 10-15 карточек для повторения (вопрос-ответ) с подтверждающими цитатами из текста.`;
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            front: { type: Type.STRING },
            back: { type: Type.STRING },
            category: { type: Type.STRING },
            sourceQuote: { type: Type.STRING },
          },
          required: ['front', 'back', 'category', 'sourceQuote'],
        },
      };
    } else {
      prompt = `Сгенерируй для темы "${title}" конспект (overview, sections, definitions, keyTakeaways) с подтверждающими цитатами из источника.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                sourceQuote: { type: Type.STRING },
              },
              required: ['title', 'content', 'keyPoints', 'sourceQuote'],
            },
          },
          definitions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
                sourceQuote: { type: Type.STRING },
              },
              required: ['term', 'definition', 'sourceQuote'],
            },
          },
          keyTakeaways: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                point: { type: Type.STRING },
                sourceQuote: { type: Type.STRING },
              },
              required: ['point', 'sourceQuote'],
            },
          },
        },
        required: ['overview', 'sections', 'definitions', 'keyTakeaways'],
      };
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Текст главы:\n"""\n${truncated}\n"""\n\n${prompt}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ошибка перегенерации: ' + err?.message });
  }
});

// Vite Middleware mounting in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Study Kit MVP server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
