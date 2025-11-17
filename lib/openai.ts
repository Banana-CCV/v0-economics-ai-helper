// econMarker.ts
// Uses OpenAI Node SDK v4
// Ensure: npm install openai
// Set OPENAI_API_KEY in your environment

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Types ===

export interface SentenceHighlight {
  text: string;
  role: 'analysis' | 'application' | 'knowledge' | 'evaluation' | 'setup' | 'misconception';
  quality: 'strong' | 'adequate' | 'weak';
  feedback: string;
  paragraphIndex?: number;
  sentenceIndex?: number;
  chainId?: number;
}

export interface ChainStep {
  step: string;
  type: 'analysis' | 'application' | 'knowledge' | 'evaluation';
}

export interface AnalysisChain {
  id: number;
  chain: ChainStep[];
  quality: 'strong' | 'adequate' | 'weak';
  feedback: string;
  paragraphIndex?: number;
}

export interface ParagraphMeta {
  index: number;
  rawText: string;
  function: 'Knowledge' | 'Application' | 'Analysis' | 'Evaluation' | 'Setup' | 'Mixed';
  summary: string;
  chainsFound: number[];
  applicationUsed: string[];
  missingApplication: string[];
}

export interface AoScore {
  score: number;
  total: number;
  feedback: string;
}

export interface MarkingResult {
  overallMark: number;
  totalMarks: number;
  percentage: number;
  level: string;
  gradeEstimate: string;
  aoBreakdown: {
    knowledge: AoScore;
    application: AoScore;
    analysis: AoScore;
    evaluation: AoScore;
  };
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  nextSteps: string;
  sentenceHighlights: SentenceHighlight[];
  analysisChains: AnalysisChain[];
  paragraphs: ParagraphMeta[];
  extractApplication?: {
    used: { text: string; paragraphIndex?: number; sentenceIndex?: number }[];
    unusedButRelevant: { text: string }[];
  };
}

// === Mark allocation helper ===

const defaultMarkSchemes: Record<number, { kaa: number; eval: number; structure: string }> = {
  25: { kaa: 15, eval: 10, structure: '6 paragraphs: Intro + 2 KAA (5+ chains each) + 2 Evaluation + Conclusion' },
  20: { kaa: 14, eval: 6, structure: '5 paragraphs: Intro + 2 KAA + 2 Evaluation + Conclusion' },
  15: { kaa: 9, eval: 6, structure: '4 paragraphs: Brief intro + 2 KAA + 2 Evaluation' },
  10: { kaa: 6, eval: 4, structure: '3-4 paragraphs: 2 KAA + 2 short Evaluation' },
  8: { kaa: 6, eval: 2, structure: '3 paragraphs: 2 KAA + 1 Evaluation' },
  5: { kaa: 5, eval: 0, structure: '1-2 paragraphs: KAA only, no evaluation needed' },
};

function getScheme(marks: number) {
  if (defaultMarkSchemes[marks]) return defaultMarkSchemes[marks];
  const kaa = Math.ceil(marks * 0.6);
  const evalMarks = Math.floor(marks * 0.4);
  return { kaa, eval: evalMarks, structure: 'Standard structure' };
}

// === JSON extraction helper ===

function extractJSONFromText(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// === Build prompt ===

function buildPrompt(question: string, marks: number, extractText?: string) {
  const scheme = getScheme(marks);

  return {
    scheme,
    promptHeader: `
You are "EconMarker", an expert Edexcel A-Level Economics examiner. Follow the WORKFLOW EXACTLY. Be fair, precise, and produce ONLY valid JSON matching the schema below.

QUESTION:
${question.trim()}

${extractText ? `EXTRACT:\n${extractText.trim()}\n` : ''}

MARKING CONTEXT:
- Total marks: ${marks}
- KAA marks: ${scheme.kaa}
- Evaluation marks: ${scheme.eval}
- Suggested essay structure: ${scheme.structure}

=== WORKFLOW ===
1) Read the ENTIRE essay first.
2) Split essay into paragraphs.
3) For each paragraph:
   - Determine its main function: Knowledge / Application / Analysis / Evaluation / Setup / Mixed
   - Summarise paragraph in one sentence
   - Extract reasoning chains (3+ links = adequate, 5+ = strong)
   - Integrate application/examples in chains
4) Extract 2-4 strongest analysis chains across the essay
5) Score Knowledge, Application, Analysis, Evaluation per Edexcel guidance
6) Sentence highlighting (10-15 max):
   - Highlight sentences with chain steps, application, misconception, or can be rewritten
   - DO NOT highlight pure setup/signposting sentences
7) If extract is provided:
   - Identify "extractApplication.used" and "extractApplication.unusedButRelevant"
8) Provide strengths, improvements, overallFeedback, nextSteps

SCORING LEVELS:
- Level 4: deep knowledge, 5+ link chains, strong evaluation
- Level 3: 3-4 link chains, adequate evaluation
- Level 2: 1-2 chains, weak application, minimal evaluation
- Level 1: fragmented/incorrect knowledge, no chains, no evaluation

=== REQUIRED OUTPUT JSON SCHEMA ===
Return a single JSON object matching MarkingResult

ESSAY:
{essay}
`.trim(),
  };
}

// === Main exported function ===

export async function markEssay(
  question: string,
  marks: number,
  essay: string,
  extractText?: string
): Promise<MarkingResult> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const { promptHeader } = buildPrompt(question, marks, extractText);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1-2025-11-13',
      messages: [
        {
          role: 'system',
          content:
            'You are EconMarker, an expert Edexcel A-Level Economics examiner. Follow instructions exactly and return only valid JSON.',
        },
        {
          role: 'user',
          content: promptHeader.replace('{essay}', essay),
        },
      ],
      temperature: 0.15,
      max_completion_tokens: 4000,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== 'string') throw new Error('No response from model');

    let jsonText = extractJSONFromText(raw);
    if (!jsonText) jsonText = extractJSONFromText(raw.replace(/```json|```/g, '').trim());
    if (!jsonText) throw new Error(`Failed to parse JSON from model output:\n${raw.slice(0, 1000)}`);

    const parsed = JSON.parse(jsonText) as MarkingResult;

    // Only normalize essential fields; do NOT overwrite highlights or chains
    parsed.totalMarks = marks;
    parsed.percentage = Math.round((parsed.overallMark / marks) * 1000) / 10;

    return parsed;
  } catch (err: any) {
    console.error('EconMarker error:', err);
    throw new Error('Failed to mark essay: ' + (err?.message || String(err)));
  }
}
