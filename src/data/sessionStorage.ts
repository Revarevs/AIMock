import { type ScoreBreakdown, type Question } from './interviewSimulator';

export interface RecordedSession {
  id: string;
  company: string;
  role: string;
  roundType: string;
  startTime: number;
  completedAt?: number;
  durationMinutes: number;
  status: 'completed' | 'in-progress' | 'abandoned';
  scoreBreakdown?: ScoreBreakdown;
  questions: Question[];
  answers: string[];
  codes?: string[];
  languages?: string[];
  isLiveAi?: boolean;
  requirements?: string;
}

const STORAGE_KEY = 'aimock_recorded_sessions_v2';

// High-quality initial mock sessions for realistic presentation on first load
const SAMPLE_SESSIONS: RecordedSession[] = [
  {
    id: 'rec_sess_sample_1',
    company: 'Google',
    role: 'Software Development Engineer (SDE)',
    roundType: 'DSA',
    startTime: Date.now() - 86400000 * 2, // 2 days ago
    completedAt: Date.now() - 86400000 * 2 + 1800000,
    durationMinutes: 30,
    status: 'completed',
    isLiveAi: false,
    scoreBreakdown: {
      overall: 87,
      technical: 90,
      communication: 82,
      optimality: 88,
      strengths: [
        'Optimal O(N) hash map solution for Two Sum problem.',
        'Clear articulation of time and space trade-offs.',
        'Systematic approach to boundary cases.'
      ],
      weaknesses: [
        'Could elaborate further on memory layout in heap allocation.',
        'Initial test case verification was rushed.'
      ],
      feedbackByQuestion: [
        {
          question: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
          answer: 'We can solve this in linear O(N) time using a single pass with a Hash Map. For each number x, we check if target - x exists in our lookup table. If yes, we return the pair of indices; otherwise, we insert x and its index.',
          code: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
          language: 'javascript',
          score: 92,
          review: 'Optimal solution implemented with clean O(N) time and O(N) auxiliary space. High code readability and proper early termination.'
        },
        {
          question: 'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`-th day. Return the maximum profit you can achieve.',
          answer: 'We maintain a running minimum price and compare the profit of selling today against the historical maximum profit. Single pass O(N) time with O(1) space.',
          code: 'function maxProfit(prices) {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else if (price - minPrice > maxProfit) maxProfit = price - minPrice;\n  }\n  return maxProfit;\n}',
          language: 'javascript',
          score: 84,
          review: 'Accurate greedy tracking with constant auxiliary space. Good handling of decreasing sequences.'
        }
      ]
    },
    questions: [
      {
        id: 'two_sum',
        text: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
        hint: 'Use a hash map to store the value and index as you iterate.',
        keywords: ['hashmap', 'array', 'indices', 'target', 'two sum', 'O(n)']
      },
      {
        id: 'stock_profit',
        text: 'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`-th day. Return the maximum profit you can achieve.',
        hint: 'Track the minimum price seen so far as you iterate through the prices array.',
        keywords: ['stock', 'maximize profit', 'minimum', 'linear time', 'constant space']
      }
    ],
    answers: [
      'We can solve this in linear O(N) time using a single pass with a Hash Map. For each number x, we check if target - x exists in our lookup table. If yes, we return the pair of indices; otherwise, we insert x and its index.',
      'We maintain a running minimum price and compare the profit of selling today against the historical maximum profit. Single pass O(N) time with O(1) space.'
    ],
    codes: [
      'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      'function maxProfit(prices) {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else if (price - minPrice > maxProfit) maxProfit = price - minPrice;\n  }\n  return maxProfit;\n}'
    ],
    languages: ['javascript', 'javascript']
  },
  {
    id: 'rec_sess_sample_2',
    company: 'Microsoft',
    role: 'Frontend Engineer',
    roundType: 'System Design',
    startTime: Date.now() - 86400000 * 5, // 5 days ago
    completedAt: Date.now() - 86400000 * 5 + 2400000,
    durationMinutes: 40,
    status: 'completed',
    isLiveAi: false,
    scoreBreakdown: {
      overall: 83,
      technical: 82,
      communication: 86,
      optimality: 80,
      strengths: [
        'Structured breakdown of client-side cache and service workers.',
        'Strong communication of latency bottlenecks and accessibility.',
        'Well-reasoned component state synchronization.'
      ],
      weaknesses: [
        'Could provide deeper formulas on CDN bandwidth estimates.',
        'Cache invalidation edge cases need explicit TTL strategy.'
      ],
      feedbackByQuestion: [
        {
          question: 'Design a high-performance Client-Side Asset Caching & Offline Sync architecture for enterprise web portals.',
          answer: 'We employ a layered caching hierarchy: Memory Cache -> Service Worker Cache Storage (Cache First for static assets) -> IndexedDB for offline transactions -> Network fallback with Background Sync API.',
          code: '',
          language: '',
          score: 83,
          review: 'Comprehensive multi-tier browser storage strategy with sensible offline fallback patterns.'
        }
      ]
    },
    questions: [
      {
        id: 'fe_arch_1',
        text: 'Design a high-performance Client-Side Asset Caching & Offline Sync architecture for enterprise web portals.',
        hint: 'Consider Service Worker lifecycle, CacheStorage API, and IndexedDB for mutation queueing.',
        keywords: ['service worker', 'cache storage', 'offline', 'indexeddb', 'cdn']
      }
    ],
    answers: [
      'We employ a layered caching hierarchy: Memory Cache -> Service Worker Cache Storage (Cache First for static assets) -> IndexedDB for offline transactions -> Network fallback with Background Sync API.'
    ],
    codes: [''],
    languages: ['']
  },
  {
    id: 'rec_sess_sample_3',
    company: 'Amazon',
    role: 'Software Development Engineer (SDE)',
    roundType: 'Behavioral',
    startTime: Date.now() - 86400000 * 8, // 8 days ago
    completedAt: Date.now() - 86400000 * 8 + 1500000,
    durationMinutes: 25,
    status: 'completed',
    isLiveAi: false,
    scoreBreakdown: {
      overall: 89,
      technical: 85,
      communication: 93,
      optimality: 86,
      strengths: [
        'Exemplary STAR method structure with measurable business outcomes.',
        'Demonstrated Customer Obsession and Disagree and Commit principles.',
        'Strong authentic conflict resolution narrative.'
      ],
      weaknesses: [
        'Could quantify the latency reduction metrics with exact percentiles (p99).'
      ],
      feedbackByQuestion: [
        {
          question: 'Tell me about a time when you faced a high-stakes technical disagreement with a team member.',
          answer: 'Situation: Our team was divided between migrating to a GraphQL gateway or maintaining existing REST microservices. Task: I needed to evaluate the decision objectively. Action: Built a lightweight prototype benchmark measuring payload sizes, p99 latency, and caching overhead. Result: Data showed GraphQL reduced mobile round-trips by 38%, which persuaded leadership while establishing shared telemetry.',
          score: 89,
          review: 'Outstanding STAR alignment. Concrete data-driven leadership action and positive team consensus result.'
        }
      ]
    },
    questions: [
      {
        id: 'beh_star_1',
        text: 'Tell me about a time when you faced a high-stakes technical disagreement with a team member.',
        hint: 'Use the STAR format: Situation, Task, Action, Result. Highlight data-driven decisions.',
        keywords: ['situation', 'task', 'action', 'result', 'disagreement', 'data']
      }
    ],
    answers: [
      'Situation: Our team was divided between migrating to a GraphQL gateway or maintaining existing REST microservices. Task: I needed to evaluate the decision objectively. Action: Built a lightweight prototype benchmark measuring payload sizes, p99 latency, and caching overhead. Result: Data showed GraphQL reduced mobile round-trips by 38%, which persuaded leadership while establishing shared telemetry.'
    ],
    codes: [''],
    languages: ['']
  }
];

export function getRecordedSessions(): RecordedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic samples
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SESSIONS));
      return SAMPLE_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_SESSIONS;
  } catch (err) {
    console.error('Error loading session history:', err);
    return SAMPLE_SESSIONS;
  }
}

export function saveRecordedSession(session: RecordedSession): void {
  try {
    const existing = getRecordedSessions();
    const index = existing.findIndex(s => s.id === session.id);
    let updated: RecordedSession[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = session;
    } else {
      updated = [session, ...existing];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save session record:', err);
  }
}

export function deleteRecordedSession(sessionId: string): void {
  try {
    const existing = getRecordedSessions();
    const filtered = existing.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete session record:', err);
  }
}

export function clearAllRecordedSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session history:', err);
  }
}

export interface CandidateAggregateStats {
  totalSessions: number;
  completedSessions: number;
  averageOverall: number;
  averageTechnical: number;
  averageCommunication: number;
  averageOptimality: number;
  totalDurationMinutes: number;
  totalQuestionsAnswered: number;
  passRate: number; // Percentage of sessions >= 75%
  strongestSkill: string;
  growthArea: string;
}

export function calculateCandidateAggregates(sessions: RecordedSession[]): CandidateAggregateStats {
  const completed = sessions.filter(s => s.status === 'completed' && s.scoreBreakdown);

  if (completed.length === 0) {
    return {
      totalSessions: sessions.length,
      completedSessions: 0,
      averageOverall: 70,
      averageTechnical: 70,
      averageCommunication: 70,
      averageOptimality: 70,
      totalDurationMinutes: 0,
      totalQuestionsAnswered: 0,
      passRate: 0,
      strongestSkill: 'Baseline Initiated',
      growthArea: 'Complete first mock'
    };
  }

  let sumOverall = 0;
  let sumTech = 0;
  let sumComm = 0;
  let sumOpt = 0;
  let totalTime = 0;
  let totalQuestions = 0;
  let passedCount = 0;

  completed.forEach(s => {
    const b = s.scoreBreakdown!;
    sumOverall += b.overall;
    sumTech += b.technical;
    sumComm += b.communication;
    sumOpt += b.optimality;
    totalTime += s.durationMinutes || 20;
    totalQuestions += s.answers ? s.answers.filter(a => a && a.trim().length > 0).length : 1;
    if (b.overall >= 75) passedCount++;
  });

  const count = completed.length;
  const avgOverall = Math.round(sumOverall / count);
  const avgTech = Math.round(sumTech / count);
  const avgComm = Math.round(sumComm / count);
  const avgOpt = Math.round(sumOpt / count);

  // Identify highest and lowest skill
  const skillScores = [
    { name: 'Technical Accuracy', score: avgTech },
    { name: 'Communication Clarity', score: avgComm },
    { name: 'Solution Optimality', score: avgOpt }
  ];
  skillScores.sort((a, b) => b.score - a.score);

  return {
    totalSessions: sessions.length,
    completedSessions: count,
    averageOverall: avgOverall,
    averageTechnical: avgTech,
    averageCommunication: avgComm,
    averageOptimality: avgOpt,
    totalDurationMinutes: totalTime,
    totalQuestionsAnswered: totalQuestions,
    passRate: Math.round((passedCount / count) * 100),
    strongestSkill: skillScores[0].name,
    growthArea: skillScores[skillScores.length - 1].name
  };
}
