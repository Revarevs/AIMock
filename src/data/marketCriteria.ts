export interface CompanyCriteria {
  id: string;
  name: string;
  tier: 'Tier 1 FAANG+' | 'Enterprise Cloud' | 'High-Growth Tech';
  color: 'cyan' | 'blue' | 'pink' | 'green' | 'orange';
  slogan: string;
  logoLetter: string;
  minOverall: number;
  minTechnical: number;
  minOptimality: number;
  minCommunication: number;
  evaluatedPillars: {
    title: string;
    description: string;
    weight: number;
  }[];
  primaryFocus: string[];
  interviewFormat: string;
  cultureInsight: string;
}

export const MARKET_COMPANIES: CompanyCriteria[] = [
  {
    id: 'Google',
    name: 'Google',
    tier: 'Tier 1 FAANG+',
    color: 'cyan',
    slogan: 'Organize the world\'s information with high algorithmic rigour',
    logoLetter: 'G',
    minOverall: 88,
    minTechnical: 90,
    minOptimality: 88,
    minCommunication: 82,
    interviewFormat: '4-5 Rounds: 2x Coding/DSA, 1-2x System Design/Large Scale, 1x Googleyness & Leadership',
    cultureInsight: 'Deep focus on algorithmic optimality, Big-O trade-offs, and humility (Googleyness). Expect ambiguous problems where you must probe edge cases and defend data structure choices.',
    primaryFocus: [
      'Graph Traversal (BFS/DFS, Topological Sort)',
      'Dynamic Programming & Memoization',
      'Distributed Cache & Big-Data Ingestion',
      'Clean Modular Production Code'
    ],
    evaluatedPillars: [
      { title: 'Algorithmic Mastery', description: 'Optimal time/space bounds, handling 1B+ ops/sec', weight: 40 },
      { title: 'Scalable Architecture', description: 'Horizontal partitioning, consistency vs availability', weight: 30 },
      { title: 'Googleyness & Autonomy', description: 'Intellectual curiosity, navigating ambiguity, teamwork', weight: 30 }
    ]
  },
  {
    id: 'Amazon',
    name: 'Amazon',
    tier: 'Tier 1 FAANG+',
    color: 'orange',
    slogan: 'Customer obsession, high bar on leadership principles',
    logoLetter: 'A',
    minOverall: 85,
    minTechnical: 84,
    minOptimality: 82,
    minCommunication: 90,
    interviewFormat: '4 Rounds: 1x Bar Raiser (Deep LP), 2x Coding & Object-Oriented Design, 1x High-Scale System Design',
    cultureInsight: 'Every technical question is accompanied by 15-20 minutes of Behavioral Leadership Principles. Using the STAR format with concrete business metrics is strictly mandatory.',
    primaryFocus: [
      '16 Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action)',
      'Object-Oriented Design & Clean Extensibility',
      'Microservice Resiliency (Circuit Breakers, SQS, DynamoDB)',
      'Trees, Heaps, and Dynamic Programming'
    ],
    evaluatedPillars: [
      { title: 'STAR Behavioral Rigor', description: 'Quantifiable customer impact and principled conflict resolution', weight: 40 },
      { title: 'System Resilience', description: 'Decoupled services, event-driven architectures, SLA delivery', weight: 35 },
      { title: 'Practical Coding', description: 'Clean working code over theoretical perfection', weight: 25 }
    ]
  },
  {
    id: 'Meta',
    name: 'Meta',
    tier: 'Tier 1 FAANG+',
    color: 'blue',
    slogan: 'Move fast, build social connectivity, execute at blazing speed',
    logoLetter: 'M',
    minOverall: 87,
    minTechnical: 89,
    minOptimality: 87,
    minCommunication: 84,
    interviewFormat: '4 Rounds: 2x Speed Coding (2 LeetCode Medium/Hard in 45m each), 1x System Design (Product Architecture), 1x Behavioral',
    cultureInsight: 'Meta values coding speed and precision under strict time pressure. You are expected to solve 2 distinct problems per 45-minute coding round with near-bugless execution.',
    primaryFocus: [
      'Rapid DSA Execution (Two Pointers, Sliding Window, BFS)',
      'Product Architecture & Live Feed Feasibility',
      'WebSocket Pub/Sub Realtime Pipelines',
      'Impact-Driven Mindset & Direct Communication'
    ],
    evaluatedPillars: [
      { title: 'Implementation Velocity', description: 'Rapid bug-free code syntax within minutes', weight: 40 },
      { title: 'Product Architecture', description: 'Feed ranking, notification engines, client-server protocols', weight: 35 },
      { title: 'Communication Clarity', description: 'Thinking aloud smoothly while typing at speed', weight: 25 }
    ]
  },
  {
    id: 'Microsoft',
    name: 'Microsoft',
    tier: 'Enterprise Cloud',
    color: 'green',
    slogan: 'Empower every person and organization on the planet',
    logoLetter: 'MS',
    minOverall: 82,
    minTechnical: 84,
    minOptimality: 82,
    minCommunication: 85,
    interviewFormat: '4-5 Rounds: 2x Coding/DSA, 1x Low-Level & OOP Design, 1x Cloud/Distributed Systems, 1x As Appropriate (AA)',
    cultureInsight: 'Microsoft places immense value on growth mindset, clean maintainable code, defensive error handling, and collaborative code reviews.',
    primaryFocus: [
      'OOP Principles & Clean Design Patterns (Factory, Strategy, Observer)',
      'Concurrency, Threads & Mutex Synchronization',
      'Linked Lists, Trees, and Trie Search structures',
      'Cloud Scalability (Azure/AWS distributed storage)'
    ],
    evaluatedPillars: [
      { title: 'Engineering Quality', description: 'Clean maintainable types, unit-testable modular logic', weight: 35 },
      { title: 'Growth Mindset', description: 'Receptive to hints, thoughtful refactoring, collaborative spirit', weight: 35 },
      { title: 'Foundational CS', description: 'Memory management, concurrency, OS synchronization', weight: 30 }
    ]
  },
  {
    id: 'Netflix',
    name: 'Netflix',
    tier: 'Tier 1 FAANG+',
    color: 'pink',
    slogan: 'Freedom & responsibility with stellar senior craftsmanship',
    logoLetter: 'N',
    minOverall: 90,
    minTechnical: 92,
    minOptimality: 91,
    minCommunication: 88,
    interviewFormat: '4-5 Rounds: 1x Deep Domain Architecture, 1x Concurrency & Low Latency, 1x System Resiliency & Chaos, 2x Culture & Autonomy',
    cultureInsight: 'Netflix hires predominantly senior/staff engineers. They expect autonomous decision making, top-of-market compensation mindset, and mastery over distributed streaming systems.',
    primaryFocus: [
      'Chaos Engineering & Fault Injection (Simian Army)',
      'Sub-millisecond Global Caching & CDN Routing',
      'Distributed Tracing & Zero-Downtime Deployments',
      'Extreme Autonomy & Unfiltered Feedback'
    ],
    evaluatedPillars: [
      { title: 'Senior Architectural Judgment', description: 'Evaluating tradeoffs without hand-holding', weight: 45 },
      { title: 'Low-Latency Optimality', description: 'Memory zero-copy, efficient serialization (Protobuf/gRPC)', weight: 35 },
      { title: 'Culture Alignment', description: 'Uncompromising high-performance standard and candor', weight: 20 }
    ]
  },
  {
    id: 'Apple',
    name: 'Apple',
    tier: 'Tier 1 FAANG+',
    color: 'cyan',
    slogan: 'Uncompromising craftsmanship at hardware-software intersections',
    logoLetter: 'AP',
    minOverall: 86,
    minTechnical: 88,
    minOptimality: 88,
    minCommunication: 80,
    interviewFormat: '5-6 Rounds: 2x Coding/DSA, 2x Domain/Systems Internals, 1x Architecture, 1x Team/Hiring Manager',
    cultureInsight: 'Deeply team-dependent. Heavy focus on system resource utilization, memory limits, battery life, and pixel-perfect design sensibilities.',
    primaryFocus: [
      'Low-Level Systems & Memory Layout (C++, Swift, Rust)',
      'Concurrency & Thread Safety (GCD, atomics)',
      'Binary Search, Bitwise Operations & Custom Memory Pools',
      'Hardware Constraints & Real-Time Performance'
    ],
    evaluatedPillars: [
      { title: 'Resource Efficiency', description: 'Minimal memory footprint and battery-conscious design', weight: 40 },
      { title: 'Algorithmic Precision', description: 'Deterministic latency and cache-friendly data structures', weight: 35 },
      { title: 'Discretion & Craft', description: 'Pixel perfection and relentless attention to detail', weight: 25 }
    ]
  },
  {
    id: 'Uber',
    name: 'Uber',
    tier: 'High-Growth Tech',
    color: 'blue',
    slogan: 'Go anywhere, get anything with real-time geospatial scale',
    logoLetter: 'U',
    minOverall: 85,
    minTechnical: 87,
    minOptimality: 86,
    minCommunication: 82,
    interviewFormat: '4-5 Rounds: 2x Algorithms/DSA, 1x Real-Time Geospatial System Design, 1x Practical Debugging/Refactor, 1x Behavioral',
    cultureInsight: 'Uber focuses heavily on real-time stream processing, geospatial indexing (H3 hexagonal coordinates), distributed dispatch algorithms, and dynamic pricing.',
    primaryFocus: [
      'Geospatial Indexing (QuadTrees, Geohash, H3)',
      'High-Throughput Kafka Stream Processing',
      'Shortest Path & Network Flow (Dijkstra, A*)',
      'High Concurrency Ride Dispatch Engines'
    ],
    evaluatedPillars: [
      { title: 'Real-Time System Design', description: 'Stream processing, low-latency ride matching', weight: 40 },
      { title: 'Graph & Spatial Algorithms', description: 'Efficient spatial partitioning and shortest paths', weight: 35 },
      { title: 'System Resilience', description: 'Graceful degradation during surging demand spikes', weight: 25 }
    ]
  },
  {
    id: 'Stripe',
    name: 'Stripe',
    tier: 'High-Growth Tech',
    color: 'pink',
    slogan: 'Increase the GDP of the internet with developer-first precision',
    logoLetter: 'S',
    minOverall: 89,
    minTechnical: 91,
    minOptimality: 86,
    minCommunication: 88,
    interviewFormat: '5 Rounds: 1x Bug Hunt/Debugging, 1x API Design & Integration, 1x System Architecture, 1x DSA, 1x Culture/Values',
    cultureInsight: 'Stripe does practical, real-world engineering interviews: you code on your local IDE, read existing codebases, write unit tests, and design clean developer APIs with idempotency.',
    primaryFocus: [
      'API Design & Ergonomics (RESTful, Webhooks, Idempotency)',
      'Distributed Transactions & Financial Consistency (ACID)',
      'Real-world Debugging & Navigating Unknown Codebases',
      'Rigorous Edge-Case and Error Handling'
    ],
    evaluatedPillars: [
      { title: 'Practical Developer Craft', description: 'Clean APIs, robust error responses, defensive typing', weight: 40 },
      { title: 'Financial Consistency', description: 'Idempotency keys, duplicate charge prevention, distributed locking', weight: 35 },
      { title: 'Collaborative Problem-Solving', description: 'Working through ambiguity in a realistic pair-programming setup', weight: 25 }
    ]
  }
];

export interface BenchmarkComparisonResult {
  company: CompanyCriteria;
  matchPercentage: number;
  status: 'READY_TO_INTERVIEW' | 'COMPETITIVE' | 'PREPARATION_NEEDED';
  statusLabel: string;
  statusColor: 'green' | 'cyan' | 'pink';
  scoreDeltas: {
    overall: number; // positive = above bar, negative = below bar
    technical: number;
    optimality: number;
    communication: number;
  };
  keyGaps: string[];
  strengthsAgainstBar: string[];
  recommendedAction: string;
}

export function evaluateCompanyMatch(
  candidateScores: {
    overall: number;
    technical: number;
    communication: number;
    optimality: number;
  },
  company: CompanyCriteria
): BenchmarkComparisonResult {
  const deltaOverall = candidateScores.overall - company.minOverall;
  const deltaTech = candidateScores.technical - company.minTechnical;
  const deltaOpt = candidateScores.optimality - company.minOptimality;
  const deltaComm = candidateScores.communication - company.minCommunication;

  // Calculate weighted match percentage (0 to 100)
  const ratioOverall = Math.min(1.2, Math.max(0.4, candidateScores.overall / company.minOverall));
  const ratioTech = Math.min(1.2, Math.max(0.4, candidateScores.technical / company.minTechnical));
  const ratioOpt = Math.min(1.2, Math.max(0.4, candidateScores.optimality / company.minOptimality));
  const ratioComm = Math.min(1.2, Math.max(0.4, candidateScores.communication / company.minCommunication));

  const weightedRatio = (ratioOverall * 0.35) + (ratioTech * 0.3) + (ratioOpt * 0.2) + (ratioComm * 0.15);
  const matchPercentage = Math.round(Math.min(100, Math.max(20, weightedRatio * 100)));

  let status: 'READY_TO_INTERVIEW' | 'COMPETITIVE' | 'PREPARATION_NEEDED' = 'COMPETITIVE';
  let statusLabel = 'COMPETITIVE CANDIDATE';
  let statusColor: 'green' | 'cyan' | 'pink' = 'cyan';

  if (deltaOverall >= 0 && deltaTech >= -2 && deltaComm >= -3) {
    status = 'READY_TO_INTERVIEW';
    statusLabel = 'BAR CLEARED // READY TO APPLY';
    statusColor = 'green';
  } else if (matchPercentage >= 75) {
    status = 'COMPETITIVE';
    statusLabel = 'COMPETITIVE // TARGETED DRILL NEEDED';
    statusColor = 'cyan';
  } else {
    status = 'PREPARATION_NEEDED';
    statusLabel = 'GAP IDENTIFIED // FOCUS PREP';
    statusColor = 'pink';
  }

  // Construct specific gaps
  const keyGaps: string[] = [];
  const strengthsAgainstBar: string[] = [];

  if (deltaTech < 0) {
    keyGaps.push(`Technical Accuracy is ${Math.abs(deltaTech)}% below ${company.name}'s minimum threshold of ${company.minTechnical}%.`);
  } else {
    strengthsAgainstBar.push(`Exceeds Technical Accuracy bar by +${deltaTech}%.`);
  }

  if (deltaOpt < 0) {
    keyGaps.push(`Solution Optimality is ${Math.abs(deltaOpt)}% below required bar (${company.minOptimality}%). Focus on Big-O memory & runtime.`);
  } else {
    strengthsAgainstBar.push(`Exceeds Optimality benchmark by +${deltaOpt}%.`);
  }

  if (deltaComm < 0) {
    keyGaps.push(`Communication clarity is ${Math.abs(deltaComm)}% below bar (${company.minCommunication}%). Practice STAR framing & rationale.`);
  } else {
    strengthsAgainstBar.push(`Communication score exceeds ${company.name} criteria (+${deltaComm}%).`);
  }

  // Provide recommended concrete action
  let recommendedAction = '';
  if (status === 'READY_TO_INTERVIEW') {
    recommendedAction = `Your metrics indicate you meet or exceed ${company.name}'s hiring bar. Run a final simulated mock session under timed constraints to solidify confidence.`;
  } else if (deltaTech < -4) {
    recommendedAction = `Target ${company.name}'s core technical pillar: practice 2-3 focused ${company.primaryFocus[0]} challenges with stringent complexity verification.`;
  } else if (deltaOpt < -3) {
    recommendedAction = `Strengthen asymptotic optimality: always articulate worst-case vs amortized Big-O analysis and explore alternative data structures.`;
  } else if (deltaComm < -3) {
    recommendedAction = `Work on vocalizing architectural trade-offs and structuring STAR stories (Situation, Task, Action, Result) for behavioral rounds.`;
  } else {
    recommendedAction = `You are within 3-5 points of the threshold. Completing one more full mock tailored for ${company.name} will bridge the remaining gap.`;
  }

  return {
    company,
    matchPercentage,
    status,
    statusLabel,
    statusColor,
    scoreDeltas: {
      overall: deltaOverall,
      technical: deltaTech,
      optimality: deltaOpt,
      communication: deltaComm
    },
    keyGaps,
    strengthsAgainstBar,
    recommendedAction
  };
}
