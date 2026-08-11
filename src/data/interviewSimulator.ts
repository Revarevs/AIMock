export interface Question {
  id: string;
  text: string;
  hint: string;
  keywords: string[];
  starterCodes?: Record<string, string>;
  testCases?: { input: string; output: string }[];
}

export interface InterviewSession {
  id: string;
  company: string;
  role: string;
  roundType: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: string[];
  codes?: string[];
  languages?: string[];
  startTime: number;
}

export interface QuestionFeedback {
  question: string;
  answer: string;
  code?: string;
  language?: string;
  score: number;
  review: string;
}

export interface ScoreBreakdown {
  overall: number;
  technical: number;
  communication: number;
  optimality: number;
  strengths: string[];
  weaknesses: string[];
  feedbackByQuestion: QuestionFeedback[];
}

// Database of classic coding questions and conceptual topics
const QUESTION_BANK: Record<string, Record<string, Question[]>> = {
  Generic: {
    DSA: [
      {
        id: "two_sum",
        text: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]",
        hint: "Use a hash map to store the value and index as you iterate. For each element, check if (target - current_value) is already in the map. This achieves O(N) time complexity.",
        keywords: ["hashmap", "array", "indices", "target", "two sum", "O(n)"],
        starterCodes: {
          javascript: "function twoSum(nums, target) {\n  // Write your code here\n  \n}",
          python: "def twoSum(nums, target):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
          java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
          go: "func twoSum(nums []int, target int) []int {\n    \n}"
        },
        testCases: [
          { input: "[2, 7, 11, 15], 9", output: "[0, 1]" },
          { input: "[3, 2, 4], 6", output: "[1, 2]" },
          { input: "[3, 3], 6", output: "[0, 1]" }
        ]
      },
      {
        id: "stock_profit",
        text: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`-th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve. If you cannot achieve any profit, return 0.\n\nExample:\nInput: prices = [7,1,5,3,6,4]\nOutput: 5 (Buy on day 2 and sell on day 5)",
        hint: "Track the minimum price seen so far as you iterate through the prices array. At each element, calculate the potential profit and update the maximum profit.",
        keywords: ["stock", "maximize profit", "minimum", "dynamic programming", "linear time", "constant space"],
        starterCodes: {
          javascript: "function maxProfit(prices) {\n  // Write your code here\n  \n}",
          python: "def maxProfit(prices):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
          java: "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
          go: "func maxProfit(prices []int) int {\n    \n}"
        },
        testCases: [
          { input: "[7, 1, 5, 3, 6, 4]", output: "5" },
          { input: "[7, 6, 4, 3, 1]", output: "0" }
        ]
      },
      {
        id: "valid_parentheses",
        text: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\nExample:\nInput: s = \"()[]{}\"\nOutput: true",
        hint: "Use a stack structure. When encountering an opening bracket, push its corresponding closing bracket onto the stack. When encountering a closing bracket, pop from the stack and verify it matches.",
        keywords: ["stack", "string", "brackets", "valid parentheses", "matching"],
        starterCodes: {
          javascript: "function isValid(s) {\n  // Write your code here\n  \n}",
          python: "def isValid(s):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
          java: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
          go: "func isValid(s string) bool {\n    \n}"
        },
        testCases: [
          { input: '\"()\"', output: "true" },
          { input: '\"()[]{}\"', output: "true" },
          { input: '\"(]\"', output: "false" }
        ]
      },
      {
        id: "reverse_linked_list",
        text: "Given the `head` of a singly linked list, reverse the list, and return the reversed list.\n\nExample:\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]",
        hint: "Keep track of three node pointers: prev (null), curr (head), and next (null). Iterate through the list, setting curr.next to prev, then moving prev and curr forward.",
        keywords: ["linked list", "reverse", "pointers", "iterative", "recursive"],
        starterCodes: {
          javascript: "function reverseList(head) {\n  // Write your code here\n  \n}",
          python: "def reverseList(head):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
          java: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
          go: "func reverseList(head *ListNode) *ListNode {\n    \n}"
        },
        testCases: [
          { input: "[1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]" }
        ]
      },
      {
        id: "longest_substring",
        text: "Given a string `s`, find the length of the longest substring without repeating characters.\n\nExample:\nInput: s = \"abcabcbb\"\nOutput: 3 (The substring is \"abc\")",
        hint: "Use a sliding window with two pointers representing the current substring boundaries. Store seen characters and their indices in a hash map to shift the left pointer efficiently.",
        keywords: ["sliding window", "hashset", "longest substring", "repeating", "two pointers"],
        starterCodes: {
          javascript: "function lengthOfLongestSubstring(s) {\n  // Write your code here\n  \n}",
          python: "def lengthOfLongestSubstring(s):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
          java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
          go: "func lengthOfLongestSubstring(s string) int {\n    \n}"
        },
        testCases: [
          { input: '\"abcabcbb\"', output: "3" },
          { input: '\"bbbbb\"', output: "1" },
          { input: '\"pwwkew\"', output: "3" }
        ]
      },
      {
        id: "container_most_water",
        text: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`-th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum volume of water a container can store.\n\nExample:\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49",
        hint: "Use two pointers, one at the beginning and one at the end of the array. Calculate water volume, record the max, then move the pointer pointing to the shorter line inward.",
        keywords: ["two pointers", "container", "water volume", "area", "height", "O(N)"],
        starterCodes: {
          javascript: "function maxArea(height) {\n  // Write your code here\n  \n}",
          python: "def maxArea(height):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};",
          java: "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}",
          go: "func maxArea(height []int) int {\n    \n}"
        },
        testCases: [
          { input: "[1, 8, 6, 2, 5, 4, 8, 3, 7]", output: "49" },
          { input: "[1, 1]", output: "1" }
        ]
      },
      {
        id: "climbing_stairs",
        text: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nExample:\nInput: n = 3\nOutput: 3 (1+1+1, 1+2, 2+1)",
        hint: "This is a classic Fibonacci dynamic programming problem. The number of ways to reach step n is the sum of ways to reach step (n-1) and step (n-2). Optimize space to O(1) using two variables.",
        keywords: ["climbing stairs", "dynamic programming", "fibonacci", "memoization", "recursion"],
        starterCodes: {
          javascript: "function climbStairs(n) {\n  // Write your code here\n  \n}",
          python: "def climbStairs(n):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
          java: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
          go: "func climbStairs(n int) int {\n    \n}"
        },
        testCases: [
          { input: "2", output: "2" },
          { input: "3", output: "3" },
          { input: "5", output: "8" }
        ]
      },
      {
        id: "kth_largest",
        text: "Given an integer array `nums` and an integer `k`, return the `k`-th largest element in the array.\n\nNote that it is the `k`-th largest element in the sorted order, not the `k`-th distinct element.\n\nExample:\nInput: nums = [3,2,1,5,6,4], k = 2\nOutput: 5",
        hint: "You can solve this in O(N log K) time using a Min-Heap of size K. Alternatively, use Quickselect for an average O(N) time complexity.",
        keywords: ["heap", "priority queue", "quickselect", "sorting", "kth largest", "complexity"],
        starterCodes: {
          javascript: "function findKthLargest(nums, k) {\n  // Write your code here\n  \n}",
          python: "def findKthLargest(nums, k):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};",
          java: "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}",
          go: "func findKthLargest(nums []int, k int) int {\n    \n}"
        },
        testCases: [
          { input: "[3, 2, 1, 5, 6, 4], 2", output: "5" },
          { input: "[3, 2, 3, 1, 2, 4, 5, 5, 6], 4", output: "4" }
        ]
      },
      {
        id: "search_rotated_array",
        text: "There is an integer array `nums` sorted in ascending order (with distinct values).\n\nPrior to being passed to your function, `nums` is possibly rotated at an unknown pivot index. Given the array `nums` after rotation and an integer `target`, return the index of `target` if it is in `nums`, or -1 if it is not.\n\nYou must write an algorithm with O(log N) runtime complexity.\n\nExample:\nInput: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4",
        hint: "Modify standard binary search. Compare nums[mid] with nums[left] to determine which half is normally sorted. Then check if target lies within the boundaries of that sorted half.",
        keywords: ["binary search", "rotated sorted array", "index", "O(log n)", "pointers"],
        starterCodes: {
          javascript: "function search(nums, target) {\n  // Write your code here\n  \n}",
          python: "def search(nums, target):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
          java: "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
          go: "func search(nums []int, target int) int {\n    \n}"
        },
        testCases: [
          { input: "[4, 5, 6, 7, 0, 1, 2], 0", output: "4" },
          { input: "[4, 5, 6, 7, 0, 1, 2], 3", output: "-1" },
          { input: "[1], 0", output: "-1" }
        ]
      },
      {
        id: "group_anagrams",
        text: "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase.\n\nExample:\nInput: strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]\nOutput: [[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]",
        hint: "Use a hash map. For each string, sort its letters to form a key, and push the original string into the array corresponding to that key.",
        keywords: ["group anagrams", "hashmap", "string sorting", "array grouping", "complexity"],
        starterCodes: {
          javascript: "function groupAnagrams(strs) {\n  // Write your code here\n  \n}",
          python: "def groupAnagrams(strs):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};",
          java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
          go: "func groupAnagrams(strs []string) [][]string {\n    \n}"
        },
        testCases: [
          { input: '["eat", "tea", "tan", "ate", "nat", "bat"]', output: '[["eat","tea","ate"],["tan","nat"],["bat"]]' }
        ]
      },
      {
        id: "merge_two_lists",
        text: "You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.\n\nExample:\nInput: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]",
        hint: "Use a dummy head node to build the result list. Compare the current values of list1 and list2, appending the smaller node to the merged list and moving its pointer forward.",
        keywords: ["linked list", "merge", "sorted", "dummy node", "pointers"],
        starterCodes: {
          javascript: "function mergeTwoLists(list1, list2) {\n  // Write your code here\n  \n}",
          python: "def mergeTwoLists(list1, list2):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        \n    }\n};",
          java: "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        \n    }\n}",
          go: "func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {\n    \n}"
        },
        testCases: [
          { input: "[1, 2, 4], [1, 3, 4]", output: "[1, 1, 2, 3, 4, 4]" }
        ]
      },
      {
        id: "trapping_rain_water",
        text: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\nExample:\nInput: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6",
        hint: "Use a two-pointer approach (left and right pointers) and track the max height observed from the left and right. This calculates trapped water at each bar in O(N) time and O(1) space.",
        keywords: ["two pointer", "rainwater", "trapping water", "height map", "O(N) complexity", "O(1) space"],
        starterCodes: {
          javascript: "function trap(height) {\n  // Write your code here\n  \n}",
          python: "def trap(height):\n    # Write your code here\n    pass",
          cpp: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
          java: "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
          go: "func trap(height []int) int {\n    \n}"
        },
        testCases: [
          { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
          { input: "[4,2,0,3,2,5]", output: "9" }
        ]
      }
    ]
  }
};

// Fallback logic to get questions based on selection & requirements
export function getQuestions(_company: string, _role: string, roundType: string, requirements?: string): Question[] {
  // Collect all coding questions in the database
  const allCodingQuestions: Question[] = [];
  
  Object.keys(QUESTION_BANK).forEach(comp => {
    Object.keys(QUESTION_BANK[comp]).forEach(round => {
      if (round === "DSA") {
        QUESTION_BANK[comp][round].forEach(q => {
          if (!allCodingQuestions.some(existing => existing.id === q.id)) {
            allCodingQuestions.push(q);
          }
        });
      }
    });
  });

  // For non-DSA rounds, return standard questions (e.g. system design, behavioral)
  if (roundType !== "DSA") {
    // Generate simple mock questions for other categories if requested
    return [
      {
        id: "sys_design_1",
        text: `Design a distributed system for a URL Shortener like Bit.ly. Explain how you scale lookups, design database schemas, and manage consistent hashing.`,
        hint: "Discuss Base62 encoding, database indexing, caching strategies (Redis), and load balancers.",
        keywords: ["scale", "redis", "database", "load balancer", "base62"]
      },
      {
        id: "behavioral_1",
        text: `Tell me about a time you had a technical conflict with a colleague. How did you resolve it and what did you learn?`,
        hint: "Structure your answer using the STAR method. Focus on empathy, objective metrics, and compromise.",
        keywords: ["conflict", "collaboration", "star method", "communication"]
      }
    ];
  }

  // Slice down based on target requirements matching
  if (requirements && requirements.trim().length > 0) {
    const reqWords = requirements.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = allCodingQuestions.map(q => {
      let score = 0;
      const searchableText = `${q.id} ${q.text} ${q.hint} ${q.keywords.join(" ")}`.toLowerCase();
      reqWords.forEach(word => {
        if (searchableText.includes(word)) {
          score += 2; // direct keyword match
        }
      });
      return { q, score };
    });

    // Sort by relevance score desc
    scored.sort((a, b) => b.score - a.score);

    // Pick top 2 if score is positive
    if (scored[0].score > 0) {
      return scored.slice(0, 2).map(item => item.q);
    }
  }

  // Fallback: Pick Two Sum and Stock Profit
  return allCodingQuestions.slice(0, 2);
}

// Memory-based session storage
const activeSessions: Record<string, InterviewSession> = {};

export function startSession(
  company: string,
  role: string,
  roundType: string,
  customQuestions?: Question[],
  requirements?: string
): InterviewSession {
  const sessionId = Math.random().toString(36).substring(2, 11);
  let questions = customQuestions || getQuestions(company, role, roundType, requirements);
  
  // Always restrict the session to exactly 2 questions
  questions = questions.slice(0, 2);

  const session: InterviewSession = {
    id: sessionId,
    company,
    role,
    roundType,
    questions,
    currentQuestionIndex: 0,
    answers: [],
    codes: [],
    languages: [],
    startTime: Date.now()
  };
  
  activeSessions[sessionId] = session;
  return session;
}

export function getSession(sessionId: string): InterviewSession | undefined {
  return activeSessions[sessionId];
}

export function submitAnswer(sessionId: string, answer: string): { session: InterviewSession; isFinished: boolean } {
  const session = activeSessions[sessionId];
  if (!session) {
    throw new Error("Session not found");
  }
  
  session.answers.push(answer);
  session.currentQuestionIndex += 1;
  
  const isFinished = session.currentQuestionIndex >= session.questions.length;
  return {
    session,
    isFinished
  };
}

export function getHintForCurrent(sessionId: string): string {
  const session = activeSessions[sessionId];
  if (!session || session.currentQuestionIndex >= session.questions.length) {
    return "No active question.";
  }
  return session.questions[session.currentQuestionIndex].hint;
}

export function gradeSession(sessionId: string): ScoreBreakdown {
  const session = activeSessions[sessionId];
  if (!session) {
    throw new Error("Session not found");
  }

  const feedbackByQuestion: QuestionFeedback[] = [];
  let totalTechScore = 0;
  let totalCommScore = 0;
  let totalOptScore = 0;

  session.questions.forEach((question, idx) => {
    const answer = session.answers[idx] || "";
    const answerLower = answer.toLowerCase();

    // 1. Technical Accuracy
    let matchedKeywords = 0;
    const keywordsInQuestion = question.keywords;
    keywordsInQuestion.forEach(keyword => {
      if (answerLower.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    });

    const keywordRatio = keywordsInQuestion.length > 0 ? matchedKeywords / keywordsInQuestion.length : 1;
    let techScore = Math.round(50 + keywordRatio * 45); 

    // Length check
    const wordsCount = answer.trim().split(/\s+/).filter(Boolean).length;
    if (wordsCount === 0) techScore = 10;

    // 2. Communication Clarity
    let commScore = 50;
    if (wordsCount > 80) commScore += 35;
    else if (wordsCount > 40) commScore += 20;
    else commScore -= 10;
    commScore = Math.max(10, Math.min(100, commScore));

    // 3. Solution Optimality
    let optScore = 60;
    if (answerLower.includes("complexity") || answerLower.includes("o(")) {
      optScore += 30;
    }
    if (wordsCount === 0) optScore = 10;
    optScore = Math.max(10, Math.min(100, optScore));

    const qOverall = Math.round((techScore * 0.5) + (commScore * 0.25) + (optScore * 0.25));

    feedbackByQuestion.push({
      question: question.text,
      answer: answer || "[No Answer Provided]",
      score: qOverall,
      review: `Response length: ${wordsCount} words. Evaluation registers relevant keyword alignment at ${Math.round(keywordRatio * 100)}%. Consider reviewing optimal data structure trade-offs for scaling.`
    });

    totalTechScore += techScore;
    totalCommScore += commScore;
    totalOptScore += optScore;
  });

  const numQuestions = session.questions.length || 1;
  const technical = Math.round(totalTechScore / numQuestions);
  const communication = Math.round(totalCommScore / numQuestions);
  const optimality = Math.round(totalOptScore / numQuestions);
  const overall = Math.round((technical * 0.5) + (communication * 0.25) + (optimality * 0.25));

  return {
    overall,
    technical,
    communication,
    optimality,
    strengths: ["Attempted all code challenges.", "Structure details logged correctly."],
    weaknesses: ["Review runtime bottlenecks.", "Detail structural analysis further."],
    feedbackByQuestion
  };
}
