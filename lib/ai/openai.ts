import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MarkingResult {
  overallMark: number;
  totalMarks: number;
  percentage: number;
  level: string;
  gradeEstimate: string;
  aoBreakdown: {
    knowledge: { score: number; total: number; feedback: string };
    application: { score: number; total: number; feedback: string };
    analysis: { score: number; total: number; feedback: string };
    evaluation: { score: number; total: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  nextSteps: string;
  sentenceHighlights: Array<{
    text: string;
    quality: 'strong' | 'adequate' | 'weak';
    ao: string;
    feedback: string;
    chainId?: number;
  }>;
  analysisChains: Array<{
    id: number;
    chain: string[];
    quality: 'strong' | 'adequate' | 'weak';
    feedback: string;
  }>;
}

export async function markEssay(
  question: string,
  marks: number,
  essay: string,
  extractText?: string
): Promise<MarkingResult> {
  // Correct KAA/EV splits per mark allocation
  const markSchemes: Record<number, { kaa: number; eval: number; structure: string }> = {
    25: { 
      kaa: 15, 
      eval: 10,
      structure: '6 paragraphs: Intro + 2 KAA (with 5+ chains each) + 2 Evaluation + Conclusion'
    },
    20: { 
      kaa: 14, 
      eval: 6,
      structure: '5 paragraphs: Intro + 2 KAA + 2 Evaluation + Conclusion'
    },
    15: { 
      kaa: 9, 
      eval: 6,
      structure: '4 paragraphs: Brief intro + 2 KAA + 2 Evaluation'
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

  const scheme = markSchemes[marks] || { kaa: Math.ceil(marks * 0.6), eval: Math.floor(marks * 0.4), structure: 'Standard structure' };

  const prompt = `You are a fair but rigorous Edexcel A-Level Economics examiner. Mark according to Edexcel standards but be FAIR - recognize good work while identifying areas for improvement.

QUESTION: ${question}
${extractText ? `\nEXTRACT/DATA:\n${extractText}\n` : ''}

MARK SCHEME:
- Total: ${marks} marks
- KAA (Knowledge, Application, Analysis): ${scheme.kaa} marks
- Evaluation: ${scheme.eval} marks
- Expected structure: ${scheme.structure}

CRITICAL CONTEXT-AWARE MARKING RULES:

1. PARAGRAPH/SECTION CONTEXT:
   - READ THE ENTIRE PARAGRAPH before judging individual sentences
   - Introductory/setup sentences are FINE - they prepare for analysis
   - Don't penalize "signpost" sentences if they lead to good content
   - Look at paragraphs as UNITS, not just isolated sentences
   - Example: "However, there are limitations" is FINE if followed by actual evaluation

2. CHAINS OF ANALYSIS (Most Important):
   - A chain = series of linked reasoning steps (3+ links minimum)
   - Example chain: "Interest rates ↓ → borrowing costs ↓ → investment ↑ → AD ↑ → GDP ↑ → employment ↑"
   - Award marks for COMPLETE chains, not fragments
   - Strong chain (Level 4) = 5+ clear links with economic reasoning
   - Adequate chain (Level 3) = 3-4 links with some reasoning
   - Weak chain (Level 2) = 1-2 links or broken logic

3. FAIR MARKING - DON'T BE TOO HARSH:
   - If knowledge is present and correct, award the marks
   - If application is attempted (even if not perfect), give credit
   - If analysis shows reasoning (even if short), acknowledge it
   - Only mark as "weak" if genuinely poor or wrong
   - Most student work falls in "adequate" or "strong" range

4. KNOWLEDGE (K):
   - Correct definitions/concepts = award marks
   - Must show understanding, not just mention terms
   - Examples: defining PED, explaining LRAS, describing market failure

5. APPLICATION (Ap):
   - Using data/context from question = strong application
   - Real-world examples relevant to question = good application
   - Generic textbook examples = adequate (still award marks)
   - No context use = weak

6. ANALYSIS (An):
   - Look for "because", "therefore", "this leads to", "as a result"
   - Count the links in reasoning chains
   - Award more marks for longer, clearer chains
   - Don't penalize short sentences if they're part of a larger chain

7. EVALUATION (E):
   - Must have JUDGEMENT with reasoning
   - "However" alone is NOT evaluation
   - Good evaluation: weighs up, prioritizes, considers significance
   - Strong evaluation: uses criteria (time, magnitude, context-dependency)

8. DIAGRAMS:
   - Students should explain diagrams in [Square brackets]
   - Example: "[Draw supply and demand diagram showing rightward shift of supply curve]"
   - Award marks if diagram would support the argument

LEVEL BOUNDARIES (Be fair - most essays are Level 2-3):

Level 4 (Excellent): ${marks === 25 ? '19-25' : marks === 20 ? '16-20' : marks === 15 ? '12-15' : marks === 10 ? '8-10' : '4-5'} marks
- Detailed, accurate knowledge
- Strong, specific application
- SUSTAINED analysis with 5+ link chains
- Evaluation with supported, justified judgements

Level 3 (Good): ${marks === 25 ? '13-18' : marks === 20 ? '11-15' : marks === 15 ? '8-11' : marks === 10 ? '6-7' : '3'} marks
- Good knowledge, mostly accurate
- Adequate application (may be somewhat generic)
- Clear analysis with 3-4 link chains
- Some evaluation but may lack full depth

Level 2 (Basic): ${marks === 25 ? '7-12' : marks === 20 ? '6-10' : marks === 15 ? '4-7' : marks === 10 ? '3-5' : '2'} marks
- Limited knowledge with some gaps
- Weak application, mostly generic
- Basic analysis with 1-2 link chains
- Minimal evaluation

Level 1 (Poor): ${marks === 25 ? '1-6' : marks === 20 ? '1-5' : marks === 15 ? '1-3' : '1-2'} marks
- Fragmented knowledge
- No real application
- No chains of reasoning
- No evaluation

STUDENT ESSAY:
${essay}

MARKING INSTRUCTIONS:
1. Read the ENTIRE essay first
2. Identify clear chains of analysis and label them
3. Be FAIR - if it's good work, award good marks
4. Don't be harsh on setup/intro sentences in paragraphs
5. Look at paragraphs as complete units
6. Award marks for depth over breadth

Return ONLY this JSON (no markdown, no code blocks):

{
  "overallMark": 18,
  "totalMarks": ${marks},
  "percentage": 72.0,
  "level": "Level 3",
  "gradeEstimate": "Grade B",
  "aoBreakdown": {
    "knowledge": {
      "score": ${Math.floor(scheme.kaa * 0.35)},
      "total": ${Math.ceil(scheme.kaa * 0.35)},
      "feedback": "Specific feedback on knowledge"
    },
    "application": {
      "score": ${Math.floor(scheme.kaa * 0.25)},
      "total": ${Math.ceil(scheme.kaa * 0.25)},
      "feedback": "Specific feedback on application"
    },
    "analysis": {
      "score": ${Math.floor(scheme.kaa * 0.4)},
      "total": ${Math.floor(scheme.kaa * 0.4)},
      "feedback": "Specific feedback on analysis chains"
    },
    "evaluation": {
      "score": ${Math.floor(scheme.eval * 0.7)},
      "total": ${scheme.eval},
      "feedback": "Specific feedback on evaluation"
    }
  },
  "strengths": [
    "Specific strength with example",
    "Another specific strength",
    "Third strength"
  ],
  "improvements": [
    "Specific improvement with HOW to fix",
    "Another area to improve",
    "Third improvement"
  ],
  "overallFeedback": "Fair, balanced 2-3 paragraph summary. Start positive, then constructive criticism, end with encouragement.",
  "nextSteps": "Concrete actions: (1) specific step (2) another step (3) third step",
  "sentenceHighlights": [
    {
      "text": "EXACT sentence from essay",
      "quality": "strong",
      "ao": "Analysis",
      "feedback": "Positive, specific feedback on why this is strong",
      "chainId": 1
    },
    {
      "text": "Another EXACT sentence",
      "quality": "adequate",
      "ao": "Knowledge",
      "feedback": "Fair feedback - what's good and what could improve"
    }
  ],
  "analysisChains": [
    {
      "id": 1,
      "chain": ["Interest rates fall", "Borrowing becomes cheaper", "Firms invest more", "AD increases", "GDP rises"],
      "quality": "strong",
      "feedback": "Excellent 5-link chain showing clear cause-effect reasoning"
    }
  ]
}

IMPORTANT:
- Highlight 10-15 key sentences (not every sentence)
- Be FAIR in marking - reward good work
- Identify 2-4 analysis chains if present
- Focus on constructive feedback
- Most essays are Level 2-3 (that's normal and okay!)`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-chat-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a fair, experienced Edexcel Economics examiner. You understand context and paragraph structure. You reward good work and provide constructive feedback. Return ONLY valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4, // Slightly higher for more balanced marking
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content || '';
    let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^json\n?/g, '').trim();
    
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to mark essay. Please try again.');
  }
}