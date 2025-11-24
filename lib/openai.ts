// lib/openai.ts
// Complete implementation with improved marking logic
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
  applicationIds?: string[];
}

export interface ChainStep {
  step: string;
  type: 'analysis' | 'application' | 'knowledge' | 'evaluation';
  applicationId?: string;
}

export interface AnalysisChain {
  id: number;
  chain: string[];
  quality: 'strong' | 'adequate' | 'weak';
  feedback: string;
  paragraphIndex?: number;
  applicationIntegrated: boolean;
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

export interface ExtractDataPoint {
  id: string;
  text: string;
  category: 'statistic' | 'context' | 'stakeholder' | 'policy' | 'other';
  relevance: 'high' | 'medium' | 'low';
  studentUsage: {
    used: boolean;
    usageQuality?: 'strong' | 'adequate' | 'weak';
    sentenceIds?: string[];
    paragraphIndices?: number[];
    potentialImpact?: string;
  };
}

export interface SentenceRewrite {
  originalText: string;
  rewrittenText: string;
  improvementType: 'analysis' | 'application' | 'evaluation' | 'clarity';
  explanation: string;
  impactOnMark: string;
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
    unusedButRelevant: { text: string; potentialUse: string }[];
  };
  extractDataPoints?: ExtractDataPoint[];
  sentenceRewrites?: SentenceRewrite[];
}

// === Mark allocation helper ===

const defaultMarkSchemes: Record<number, { kaa: number; eval: number; structure: string }> = {
  25: { 
    kaa: 15, 
    eval: 10, 
    structure: '6 paragraphs: Intro (define terms) + 2 KAA paragraphs (5+ link chains each) + 2 Evaluation paragraphs + Conclusion (justified judgement)' 
  },
  20: { 
    kaa: 14, 
    eval: 6, 
    structure: '5 paragraphs: Intro + 2 KAA (deep analysis) + 2 Evaluation + Conclusion' 
  },
  15: { 
    kaa: 9, 
    eval: 6, 
    structure: '4 paragraphs: Brief intro + 2 deep KAA + 2 Evaluation' 
  },
  10: { 
    kaa: 6, 
    eval: 4, 
    structure: '3-4 paragraphs: 2 KAA + 2 short Evaluation' 
  },
  8: { 
    kaa: 6, 
    eval: 2, 
    structure: '3 paragraphs: 2 KAA + 1 Evaluation' 
  },
  5: { 
    kaa: 5, 
    eval: 0, 
    structure: '1-2 paragraphs: KAA only, no evaluation needed' 
  },
};

function getScheme(marks: number) {
  if (defaultMarkSchemes[marks]) return defaultMarkSchemes[marks];
  const kaa = Math.ceil(marks * 0.6);
  const evalMarks = Math.floor(marks * 0.4);
  return { kaa, eval: evalMarks, structure: 'Standard essay structure' };
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

// === Enhanced prompt builder ===

function buildEnhancedPrompt(question: string, marks: number, essay: string, extractText?: string) {
  const scheme = getScheme(marks);
  const hasExtract = !!extractText;

  return `You are EconMarker, an expert Edexcel A-Level Economics examiner AI.

CORE PRINCIPLES:
1. Read FULL paragraphs before judging any sentence
2. Reward good economics and exam technique
3. Avoid nitpicking - context matters
4. NEVER criticise a sentence for missing content that appears later in the paragraph
5. Be fair and recognize when students demonstrate understanding even if wording isn't perfect

QUESTION:
${question.trim()}

${hasExtract ? `EXTRACT:\n${extractText.trim()}\n` : ''}

MARK ALLOCATION:
- Total marks: ${marks}
- KAA marks: ${scheme.kaa}
- Evaluation marks: ${scheme.eval}
- Suggested structure: ${scheme.structure}

=== STRICT WORKFLOW (FOLLOW EXACTLY) ===

STEP 1: FULL ESSAY PASS
- Read the entire essay without judgment
- Identify all paragraph boundaries
- Note overall structure and argument flow
- Get a sense of the student's understanding level

STEP 2: PARAGRAPH-BY-PARAGRAPH ANALYSIS
For each paragraph:
a) Determine main function: Knowledge / Application / Analysis / Evaluation / Setup / Mixed
b) Extract reasoning chains (must have 3+ linked causal steps)
c) Identify application usage (especially extract-based if provided)
d) Note evaluation techniques (prioritization, time lags, "depends on", trade-offs, significance)
e) Write a one-sentence summary of the paragraph's contribution

STEP 3: CHAIN EXTRACTION RULES
A valid analysis chain must:
- Show sequential causal reasoning with clear logical links
- Be extracted from the complete paragraph context (not isolated sentences)
- Have a minimum of 3 linked steps
- Integrate application naturally when relevant

Chain quality scoring:
- STRONG (5+ links): Sophisticated, multi-step reasoning with clear cause-effect relationships
  Example: "Lower interest rates → cheaper borrowing costs → firms increase investment → capital stock rises → productive capacity increases → LRAS shifts right → economic growth"
  
- ADEQUATE (3-4 links): Clear logical progression with decent depth
  Example: "Government spending increases → AD rises → firms increase output → employment rises"
  
- WEAK (1-2 links): Basic or incomplete reasoning
  Example: "Lower taxes → more spending" (only 2 links, lacks depth)

When a chain integrates application (e.g., extract data), note this explicitly and give credit.

STEP 4: SENTENCE HIGHLIGHTING RULES

Highlight a sentence ONLY if it meets ONE of these criteria:
✓ Contains a strong chain element worth praising
✓ Contains a weak chain element that could be expanded
✓ Uses application effectively (especially extract data)
✓ Misses obvious application opportunity
✓ Contains a significant misconception or economic error
✓ Can be substantially improved with rewriting (not just minor tweaks)

DO NOT highlight:
✗ Signposting sentences ("However...", "On the other hand...", "One argument is...")
✗ Setup/context sentences that become valid once the full paragraph is read
✗ Transitional phrases that are fine as-is
✗ Sentences that are adequate in context even if not perfect
✗ Minor wording issues that don't affect the economic understanding

CRITICAL RULE: Always read the ENTIRE paragraph before deciding to highlight any sentence in it.

For each highlighted sentence, provide:
- text: exact sentence text
- role: "analysis" | "application" | "knowledge" | "evaluation" | "misconception"
- quality: "strong" | "adequate" | "weak"
- feedback: specific, actionable feedback (2-3 sentences max)
- chainId: if this sentence is part of a chain, reference the chain number
- applicationIds: if using extract data, reference the data point ID

STEP 5: APPLICATION TRACKING ${hasExtract ? '(EXTRACT PROVIDED)' : '(NO EXTRACT)'}
${hasExtract ? `
Since an extract is provided:
1. Parse the extract into distinct data points (statistics, context, stakeholders, policies)
2. For each data point, track:
   - Was it used by the student? (check entire essay)
   - If used, how well? (strong/adequate/weak integration)
   - Which sentences/paragraphs used it?
   - If unused, what's the potential impact of using it?

3. Classify each extract data point:
   - USED: Student explicitly referenced this (give credit!)
   - UNUSED BUT HIGH RELEVANCE: Could significantly strengthen analysis
   - UNUSED BUT MEDIUM RELEVANCE: Could add some value
   - NOT APPLICABLE: Not really relevant to this question

4. In your feedback, specifically mention:
   - Which extract points were used well
   - Which high-value points were missed
   - How unused points could improve the answer
` : `
No extract provided. Track generic application:
- Real-world examples used
- Contextual awareness shown
- Appropriate use of economic scenarios
`}

STEP 6: MARK USING STRICT EDEXCEL LEVELS

Knowledge (AO1) - ${scheme.kaa >= 5 ? Math.floor(scheme.kaa * 0.35) : 2} marks:
- Level 4 (full marks): Precise definitions, sophisticated understanding, no errors
- Level 3 (80%): Accurate concepts, good understanding, minor errors acceptable
- Level 2 (60%): Basic definitions, some gaps or errors
- Level 1 (40%): Limited or incorrect knowledge

Application (AO2) - ${scheme.kaa >= 5 ? Math.floor(scheme.kaa * 0.25) : 1} marks:
- Level 4: Fully integrated, ${hasExtract ? 'extract-linked,' : ''} highly contextual throughout
- Level 3: Good use of context${hasExtract ? '/extract' : ''}, mostly relevant
- Level 2: Some context, ${hasExtract ? 'limited extract use,' : ''} rather generic
- Level 1: Generic, no real context

Analysis (AO3) - ${scheme.kaa >= 5 ? Math.ceil(scheme.kaa * 0.4) : 2} marks:
- Level 4: Multiple 5+ link chains, sophisticated reasoning, clear cause-effect
- Level 3: Clear 3-4 link chains, logical progression
- Level 2: Basic chains (1-2 links), some logical gaps
- Level 1: Descriptive, no real chains of reasoning

Evaluation (AO4) - ${scheme.eval} marks:
${scheme.eval > 0 ? `
- Level 4: Sophisticated judgments, prioritization, time lags, "significance depends on", weighing up
- Level 3: Clear evaluation, some weighing up, considers different perspectives
- Level 2: Basic evaluation, limited judgment, mostly one-sided
- Level 1: Assertion without real evaluation, no judgement
` : '(No evaluation marks for this question)'}

STEP 7: SENTENCE REWRITING (for weak sentences only)
For sentences highlighted as "weak", provide a rewritten version that would score higher.
Include:
- rewrittenText: the improved version
- improvementType: what aspect improved (analysis/application/evaluation/clarity)
- explanation: why the rewrite is better (1-2 sentences)
- impactOnMark: potential mark improvement ("+1", "+2", or "clarity only")

Only rewrite sentences where there's a clear, substantial improvement possible.

STEP 8: OUTPUT JSON STRUCTURE

Return ONLY valid JSON with this exact structure:

{
  "overallMark": <number>,
  "totalMarks": ${marks},
  "percentage": <calculated as (overallMark / totalMarks) * 100>,
  "level": "<e.g., 'Level 3', 'Level 4'>",
  "gradeEstimate": "<e.g., 'Grade A', 'Grade B', 'Grade C'>",
  "aoBreakdown": {
    "knowledge": {
      "score": <number>,
      "total": <number>,
      "feedback": "<specific feedback on knowledge quality>"
    },
    "application": {
      "score": <number>,
      "total": <number>,
      "feedback": "<specific feedback on application quality>"
    },
    "analysis": {
      "score": <number>,
      "total": <number>,
      "feedback": "<specific feedback on chains and reasoning>"
    },
    "evaluation": {
      "score": <number>,
      "total": <number>,
      "feedback": "<specific feedback on evaluation quality>"
    }
  },
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "improvements": [
    "<specific improvement 1>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ],
  "overallFeedback": "<2-3 sentences summary of performance>",
  "nextSteps": "<specific actionable advice for improvement>",
  "sentenceHighlights": [
    {
      "text": "<exact sentence text>",
      "role": "<analysis|application|knowledge|evaluation|misconception>",
      "quality": "<strong|adequate|weak>",
      "feedback": "<specific feedback>",
      "chainId": <optional chain number>,
      "paragraphIndex": <number>,
      "sentenceIndex": <number>
    }
  ],
  "analysisChains": [
    {
      "id": <number>,
      "chain": ["<step 1>", "<step 2>", "<step 3>", "..."],
      "quality": "<strong|adequate|weak>",
      "feedback": "<why this chain works or how to improve it>",
      "paragraphIndex": <number>,
      "applicationIntegrated": <true if uses extract/context data>
    }
  ],
  "paragraphs": [
    {
      "index": <number>,
      "function": "<Knowledge|Application|Analysis|Evaluation|Setup|Mixed>",
      "summary": "<one sentence summary>",
      "chainsFound": [<chain ids>],
      "applicationUsed": ["<extract points used>"],
      "missingApplication": ["<extract points that could have been used>"]
    }
  ]${hasExtract ? `,
  "extractApplication": {
    "used": [
      {
        "text": "<extract data point>",
        "paragraphIndex": <number>,
        "sentenceIndex": <number>
      }
    ],
    "unusedButRelevant": [
      {
        "text": "<unused extract data point>",
        "potentialUse": "<how it could strengthen the answer>"
      }
    ]
  },
  "extractDataPoints": [
    {
      "id": "<unique id>",
      "text": "<extract data point text>",
      "category": "<statistic|context|stakeholder|policy|other>",
      "relevance": "<high|medium|low>",
      "studentUsage": {
        "used": <boolean>,
        "usageQuality": "<strong|adequate|weak>",
        "sentenceIds": ["<sentence identifiers>"],
        "paragraphIndices": [<numbers>],
        "potentialImpact": "<if unused, explain potential value>"
      }
    }
  ]` : ''}${`,
  "sentenceRewrites": [
    {
      "originalText": "<weak sentence>",
      "rewrittenText": "<improved version>",
      "improvementType": "<analysis|application|evaluation|clarity>",
      "explanation": "<why the rewrite is better>",
      "impactOnMark": "<+1|+2|clarity>"
    }
  ]`}
}

REMEMBER: 
- Be fair and reward good economics
- Always read full paragraphs before criticizing any sentence
- Don't highlight sentences that are fine in context
- Focus on substance over minor wording issues
- Recognize different ways students can express economic understanding
- Give credit for good reasoning even if expression isn't perfect

=== ESSAY TO MARK ===

${essay}

=== END OF ESSAY ===

Now provide your marking as valid JSON following the schema above.`;
}

// === Main exported function ===

export async function markEssay(
  question: string,
  marks: number,
  essay: string,
  extractText?: string
): Promise<MarkingResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in environment variables');
  }

  const prompt = buildEnhancedPrompt(question, marks, essay, extractText);

  console.log('🤖 Starting essay marking with enhanced prompt...');
  console.log('📝 Question:', question.substring(0, 100) + '...');
  console.log('📊 Total marks:', marks);
  console.log('📄 Extract provided:', !!extractText);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1-2025-11-13',
      messages: [
        {
          role: 'system',
          content: 'You are EconMarker, an expert Edexcel A-Level Economics examiner. Follow all instructions precisely and return only valid JSON. Be fair, reward good economics, and always consider full paragraph context before highlighting any sentence.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.15,
      max_completion_tokens: 8000,
      response_format: {type: "json_object"}
    });

    console.log('✅ OpenAI call completed');
    console.log('📊 Completion structure:', {
      hasChoices: !!completion.choices,
      choicesLength: completion.choices?.length,
      firstChoice: completion.choices?.[0] ? 'exists' : 'missing',
      hasMessage: !!completion.choices?.[0]?.message,
      hasContent: !!completion.choices?.[0]?.message?.content,
      contentType: typeof completion.choices?.[0]?.message?.content,
      contentPreview: completion.choices?.[0]?.message?.content?.substring(0, 100)
    });

    const raw = completion.choices?.[0]?.message?.content;
    
    if (!raw || typeof raw !== 'string') {
      console.error('❌ Full completion object:', JSON.stringify(completion, null, 2));
      throw new Error('No response from model');
    }

    console.log('✅ Received response from OpenAI');

    // Try to extract JSON
    let jsonText = extractJSONFromText(raw);
    
    if (!jsonText) {
      // Try cleaning the response
      const cleaned = raw.replace(/```json|```/g, '').trim();
      jsonText = extractJSONFromText(cleaned);
    }
    
    if (!jsonText) {
      console.error('❌ Failed to extract JSON from response');
      console.error('Response preview:', raw.slice(0, 500));
      throw new Error('Failed to parse JSON from model output');
    }

    const parsed = JSON.parse(jsonText) as MarkingResult;

    // Normalize essential fields
    parsed.totalMarks = marks;
    parsed.percentage = Math.round((parsed.overallMark / marks) * 1000) / 10;

    // Ensure arrays exist
    parsed.sentenceHighlights = parsed.sentenceHighlights || [];
    parsed.analysisChains = parsed.analysisChains || [];
    parsed.paragraphs = parsed.paragraphs || [];
    parsed.strengths = parsed.strengths || [];
    parsed.improvements = parsed.improvements || [];
    parsed.sentenceRewrites = parsed.sentenceRewrites || [];

    console.log('✅ Essay marked successfully');
    console.log('📊 Score:', parsed.overallMark, '/', marks, `(${parsed.percentage}%)`);
    console.log('🎓 Grade estimate:', parsed.gradeEstimate);
    console.log('💡 Chains found:', parsed.analysisChains.length);
    console.log('✏️ Sentences highlighted:', parsed.sentenceHighlights.length);
    if (extractText) {
      console.log('📎 Extract data points analyzed:', parsed.extractDataPoints?.length || 0);
    }

    return parsed;
    
  } catch (err: any) {
    console.error('❌ EconMarker error:', err);
    
    // Provide more helpful error messages
    if (err.message?.includes('JSON')) {
      throw new Error('Failed to parse AI response. The model may have returned invalid JSON. Please try again.');
    }
    
    if (err.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing. Please check your environment variables.');
    }
    
    throw new Error('Failed to mark essay: ' + (err?.message || String(err)));
  }
}