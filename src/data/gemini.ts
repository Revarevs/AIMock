import { type Question, type ScoreBreakdown } from './interviewSimulator';

const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';

export function getApiKey(): string {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
}

export function isApiKeyLoaded(): boolean {
  return !!getApiKey();
}

// Helper to strip markdown block wrap if present
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

async function callGemini(prompt: string, jsonMode: boolean = false): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key missing. Please set your Gemini API Key in the dashboard settings.');
  }

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  if (jsonMode) {
    payload.generationConfig = {
      responseMimeType: 'application/json'
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || response.statusText;
    throw new Error(`Gemini API Error: ${message}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Invalid response received from Gemini API.');
  }

  return text;
}

export async function askGeminiInterviewer(
  company: string,
  role: string,
  roundType: string,
  messages: { sender: string; text: string }[],
  currentQuestionText: string
): Promise<string> {
  const transcript = messages
    .map((m) => `${m.sender === 'candidate' ? 'Candidate' : m.sender === 'system' ? 'System Log' : 'AI Interrogator'}: ${m.text}`)
    .join('\n');

  const prompt = `You are a professional senior tech interviewer from ${company} conducting a ${roundType} interview for a ${role} position.
Your name is AI Interrogator. Respond as a human interviewer would.

Here is the transcript of the interview so far:
${transcript}

Your goals for the next message:
1. If the candidate just gave their answer, acknowledge their answer naturally and briefly.
2. If this is a follow-up or edge-case probe:
   - Ask a relevant follow-up question probing details of their answer, asking for algorithmic trade-offs (time/space complexity), or how they would scale/handle a specific edge case.
   - Do NOT introduce the next main question yet.
3. If we are done with the follow-up or the candidate has answered the probe, introduce the next main question:
   - Main Question: "${currentQuestionText}"
4. If the interview is finished, state that all metrics have been recorded and the system is grading.
5. Keep your response brief, engaging, and matching the style of a top tier company recruiter (1-3 sentences).

Do not output any metadata, system prompts, or labels. Return ONLY the spoken response text.`;

  return await callGemini(prompt);
}

export async function gradeGeminiSession(
  company: string,
  role: string,
  roundType: string,
  messages: { sender: string; text: string }[]
): Promise<ScoreBreakdown> {
  const transcript = messages
    .map((m) => `${m.sender === 'candidate' ? 'Candidate' : m.sender === 'system' ? 'System Log' : 'AI Interrogator'}: ${m.text}`)
    .join('\n');

  const prompt = `You are an expert technical recruiter and grader. Evaluate the following interview transcript and generate a structured scorecard feedback report.

Company: ${company}
Role: ${role}
Round Type: ${roundType}

Transcript:
${transcript}

You must return a JSON object that adheres strictly to the following TypeScript interface:
interface ScoreBreakdown {
  overall: number; // Composite score from 0 to 100
  technical: number; // Technical depth & correctness score from 0 to 100
  communication: number; // Communication structure & articulation score from 0 to 100
  optimality: number; // Code optimization & efficiency score from 0 to 100
  strengths: string[]; // List of 2 to 3 distinct strengths demonstrated by candidate
  weaknesses: string[]; // List of 2 to 3 constructive gap areas identified
  feedbackByQuestion: {
    question: string; // The interview question asked
    answer: string; // The candidate's response/code
    score: number; // Overall score for this question (0-100)
    review: string; // 2-3 sentences of highly detailed, constructive, technical feedback critique
  }[];
}

Ensure the feedback is highly specific, citing exact choices or algorithms mentioned by the candidate.
If the candidate wrote code (e.g., in JavaScript, Python, C++, Java), review the code for syntax, bug patterns, time complexity, and edge cases.

Return only the raw JSON string. Do not wrap it in markdown codeblocks.`;

  const rawJson = await callGemini(prompt, true);
  try {
    const cleaned = cleanJsonString(rawJson);
    return JSON.parse(cleaned) as ScoreBreakdown;
  } catch (err: any) {
    console.error('Failed to parse Gemini grading JSON. Raw:', rawJson);
    throw new Error(`Failed to parse AI scorecard response: ${err.message}`);
  }
}

export interface LeetCodeQuestionFetched {
  title: string;
  id: string;
  description: string;
  hint: string;
  constraints: string[];
  starterCodes: Record<string, string>; // language -> code template
  testCases: { input: string; output: string }[];
}

export async function fetchLeetCodeQuestion(idOrUrl: string): Promise<LeetCodeQuestionFetched> {
  const prompt = `You are an expert software engineer and LeetCode problem extractor. Given the following identifier or URL: "${idOrUrl}", retrieve or generate a LeetCode problem specification.
If it is a known LeetCode problem (like "Two Sum", "LRU Cache", "Merge k Sorted Lists", etc.), fetch the actual LeetCode definition. If it's a general topic or URL, generate a beautiful, authentic LeetCode problem profile.

You must return a JSON object adhering to this schema:
{
  "title": "Problem Title (e.g. Two Sum)",
  "id": "leetcode_1",
  "description": "Full problem description in markdown with examples, inputs, outputs, and constraints.",
  "hint": "Constructive hints regarding algorithm, data structure, or optimal approach.",
  "constraints": ["Array length constraint...", "Values constraint..."],
  "starterCodes": {
    "javascript": "function twoSum(nums, target) {\\n  // Write code here\\n}",
    "python": "def twoSum(nums: List[int], target: int) -> List[int]:\\n    pass",
    "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        \\n    }\\n};",
    "java": "class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        \\n    }\\n}",
    "go": "func twoSum(nums []int, target int) []int {\\n    \\n}"
  },
  "testCases": [
    {
      "input": "[2, 7, 11, 15], 9",
      "output": "[0, 1]"
    },
    {
      "input": "[3, 2, 4], 6",
      "output": "[1, 2]"
    }
  ]
}

Ensure the code formatting is clean, escaping double quotes properly. Output only the raw JSON.`;

  const rawJson = await callGemini(prompt, true);
  try {
    const cleaned = cleanJsonString(rawJson);
    return JSON.parse(cleaned) as LeetCodeQuestionFetched;
  } catch (err: any) {
    console.error('Failed to parse LeetCode dynamic question. Raw:', rawJson);
    throw new Error(`Failed to import LeetCode question specifications: ${err.message}`);
  }
}

export async function generateDynamicQuestions(
  company: string,
  role: string,
  roundType: string,
  extraRequirements: string = ''
): Promise<Question[]> {
  const prompt = `You are a senior tech interviewer from ${company} conducting a ${roundType} interview for a ${role} position.
Generate exactly 2 relevant, high-quality, professional interview questions tailored to the candidate's profile and requirements.
${extraRequirements ? `Additional candidate constraints/requirements: ${extraRequirements}` : ''}

You must return a JSON array containing exactly 2 question objects adhering strictly to this schema:
[
  {
    "id": "dyn_q_1",
    "text": "Full question prompt/problem statement (e.g. description of algorithm problem or system design scenario, formatted nicely)",
    "hint": "Constructive hints regarding algorithm, constraints, or optimal architecture",
    "keywords": ["list", "of", "technical", "keywords"],
    "starterCodes": {
      "javascript": "function solve(...) {\\n  // JS code\\n}",
      "python": "def solve(...):\\n    pass",
      "cpp": "class Solution {\\npublic:\\n    ...\\n};",
      "java": "class Solution {\\n    ...\\n}",
      "go": "func solve(...) {\\n    \\n}"
    },
    "testCases": [
      { "input": "sample input", "output": "sample output" }
    ]
  },
  {
    "id": "dyn_q_2",
    "text": "Full question prompt...",
    "hint": "...",
    "keywords": ["..."],
    "starterCodes": {
      "javascript": "...",
      "python": "...",
      "cpp": "...",
      "java": "...",
      "go": "..."
    },
    "testCases": [
      { "input": "...", "output": "..." }
    ]
  }
]

Ensure the JSON output is strictly formatted. Output only the raw JSON array.`;

  const rawJson = await callGemini(prompt, true);
  try {
    const cleaned = cleanJsonString(rawJson);
    return JSON.parse(cleaned) as Question[];
  } catch (err: any) {
    console.error('Failed to generate dynamic questions. Raw:', rawJson);
    throw new Error(`Failed to generate dynamic questions via Gemini: ${err.message}`);
  }
}

export async function evaluateCodeWithGemini(
  code: string,
  language: string,
  testCases: { input: string; output: string }[]
): Promise<any[]> {
  const prompt = `You are a remote code compiler sandbox instance. Given the following code in ${language}:
\`\`\`${language}
${code}
\`\`\`

Evaluate this code against these test cases:
${JSON.stringify(testCases)}

For each test case, execute or dry-run the logic to determine the output, expected value, and if it passed.
You must return a JSON array matching this interface:
interface TestResult {
  input: string;
  output: string; // The output value generated by the code (as a string, e.g. "[0,1]")
  expected: string; // The expected output value from testCases (as a string)
  passed: boolean;
  error?: string; // If the code has syntax errors or runtime issues, specify it here
}

Return only the raw JSON.`;

  const rawJson = await callGemini(prompt, true);
  try {
    const cleaned = cleanJsonString(rawJson);
    return JSON.parse(cleaned) as any[];
  } catch (err: any) {
    console.error('Failed to evaluate code with Gemini. Raw:', rawJson);
    throw new Error(`Failed to execute code via AI interpreter: ${err.message}`);
  }
}
