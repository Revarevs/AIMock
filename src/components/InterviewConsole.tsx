import React, { useState, useEffect, useRef } from 'react';
import { type InterviewSession, getHintForCurrent } from '../data/interviewSimulator';
import { askGeminiInterviewer, isApiKeyLoaded, evaluateCodeWithGemini } from '../data/gemini';

interface InterviewConsoleProps {
  session: InterviewSession;
  onFinishSession: (
    answers: string[],
    codes?: string[],
    languages?: string[],
    transcriptMessages?: ConsoleMessage[]
  ) => void;
  onAbort: () => void;
}

interface ConsoleMessage {
  id: string;
  sender: 'system' | 'interviewer' | 'candidate';
  text: string;
}

const DEFAULT_STARTER_CODES: Record<string, string> = {
  javascript: `function solve() {\n  // Write your code here\n  return;\n}`,
  python: `def solve():\n    # Write your code here\n    pass`,
  cpp: `class Solution {\npublic:\n    void solve() {\n        // Write code here\n    }\n};`,
  java: `class Solution {\n    public void solve() {\n        // Write code here\n    }\n}`,
  go: `func solve() {\n    // Write code here\n}`
};

function transpilePythonToJS(py: string): string {
  let js = py;
  
  // Remove comments
  js = js.replace(/#.*$/gm, '');

  // Map dictionary operations
  js = js.replace(/(\w+)\s*=\s*\{\}/g, 'var $1 = {};');
  js = js.replace(/(\w+)\s*=\s*\[\]/g, 'var $1 = [];');

  // Map general assignments to var
  js = js.replace(/^[ \t]*([a-zA-Z_]\w*)\s*=\s*(?![=])/gm, 'var $1 =');

  // Map class definitions
  js = js.replace(/class\s+(\w+)\s*:/g, 'class $1 {');
  
  // Map Python defs to JS functions
  js = js.replace(/def\s+(\w+)\((.*?)\)\s*(->\s*.*?)?:/g, (_match, name, params) => {
    let cleanParams = params.replace(/\bself\s*,?\s*/, '')
                            .replace(/:[^,)]+/g, '');
    return `function ${name}(${cleanParams}) {`;
  });

  // Map Python loop: for i, num in enumerate(nums):
  js = js.replace(/for\s+(\w+),\s*(\w+)\s+in\s+enumerate\((\w+)\):/g, 'for (let $1 = 0; $1 < $3.length; $1++) {\nlet $2 = $3[$1];');

  // Map standard for range loops: for i in range(n):
  js = js.replace(/for\s+(\w+)\s+in\s+range\((\w+)\):/g, 'for (let $1 = 0; $1 < $2; $1++) {');
  js = js.replace(/for\s+(\w+)\s+in\s+range\((.*?),\s*(.*?)\):/g, 'for (let $1 = $2; $1 < $3; $1++) {');

  // Map check key in dict: if complement in num_to_index:
  js = js.replace(/if\s+(.*?)\s+in\s+(\w+):/g, 'if ($1 in $2) {');

  // Map general Python if statements: if target == complement:
  js = js.replace(/if\s+(.*?):/g, 'if ($1) {');
  js = js.replace(/elif\s+(.*?):/g, 'else if ($1) {');
  js = js.replace(/else\s*:/g, 'else {');

  // Map return values
  js = js.replace(/return\s+(.*)$/gm, 'return $1;');

  // Map dictionary sets
  js = js.replace(/(\w+)\[(.*?)\]\s*=\s*(.*)$/gm, '$1[$2] = $3;');

  // Indentation scanner to generate Javascript block braces
  const lines = js.split('\n');
  let indentStack: number[] = [];
  let resultLines: string[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      resultLines.push(line);
      return;
    }

    const indent = line.length - line.trimStart().length;

    while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1]) {
      const lastIndent = indentStack.pop();
      resultLines.push(' '.repeat(lastIndent || 0) + '}');
    }

    if (line.endsWith('{') || line.includes('function ') || line.includes('for (') || line.includes('if (') || line.includes('else {')) {
      indentStack.push(indent);
    }

    resultLines.push(line);
  });

  while (indentStack.length > 0) {
    const lastIndent = indentStack.pop();
    resultLines.push(' '.repeat(lastIndent || 0) + '}');
  }

  js = resultLines.join('\n');

  // Translate Boolean / Null values
  js = js.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');

  return js;
}

function cleanCppJavaGoToJS(code: string, lang: string): string {
  let js = code;
  
  if (lang === 'cpp' || lang === 'java' || lang === 'go') {
    js = js.replace(/\bvector<.*?>\b/g, 'Array');
    js = js.replace(/\bint\[\]\b/g, 'Array');
    js = js.replace(/\bint\b/g, 'let');
    js = js.replace(/\bstring\b/g, 'let');
    js = js.replace(/\bboolean\b/g, 'let');
    js = js.replace(/\bListNode\*\b/g, 'let');
    js = js.replace(/\bListNode\b/g, 'let');
    js = js.replace(/\bvector<int>&/g, '');
    
    js = js.replace(/public\s+\w+(?:\[\])?\s+(\w+)\((.*?)\)/g, 'function $1($2)');
    js = js.replace(/vector<int>\s+(\w+)\((.*?)\)/g, 'function $1($2)');
    
    js = js.replace(/func\s+(\w+)\((.*?)\)\s*(?:\[\]\w+|\w+)?\s*\{/g, 'function $1($2) {');
    js = js.replace(/(\w+)\s+(?:\[\])?\w+/g, '$1');

    js = js.replace(/class\s+\w+\s*\{/g, '');
  }
  
  return js;
}

function formatLeetCodeDescription(text: string) {
  let html = text.replace(/`([^`]+)`/g, '<code style="background-color: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #fff; font-size: 13px;">$1</code>');
  
  html = html.replace(/(Example \d+:|Example:)/g, '<strong style="display: block; font-size: 14px; margin-top: 18px; margin-bottom: 6px; color: #fff;">$1</strong>');
  html = html.replace(/(Constraints:)/g, '<strong style="display: block; font-size: 14px; margin-top: 24px; margin-bottom: 8px; color: #fff;">$1</strong>');
  html = html.replace(/(Explanation:)/g, '<strong style="font-size: 13px; color: rgba(255,255,255,0.7);">$1</strong>');
  
  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ lineHeight: '1.6', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }} />;
}

function parseInputParams(code: string, inputStr: string): { name: string; value: string }[] {
  let paramNames: string[] = [];
  
  const match = code.match(/\(([^)]+)\)/);
  if (match) {
    const rawParams = match[1];
    paramNames = rawParams.split(',').map(p => {
      let part = p.trim();
      part = part.replace(/\b(self|vector<.*?>|int|string|boolean|Array|\[\]\w+)\b/g, '');
      part = part.replace(/[&*]/g, '');
      const tokens = part.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return '';
      if (tokens.length > 1 && (tokens[1].startsWith('[') || tokens[1] === 'int' || tokens[1] === 'string' || tokens[1] === 'bool')) {
        return tokens[0];
      }
      return tokens[tokens.length - 1];
    }).filter(p => p !== 'self' && p.trim() !== '');
  }
  
  const args: string[] = [];
  let currentArg = '';
  let bracketDepth = 0;
  
  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr[i];
    if (char === '[' || char === '{' || char === '(') {
      bracketDepth++;
      currentArg += char;
    } else if (char === ']' || char === '}' || char === ')') {
      bracketDepth--;
      currentArg += char;
    } else if (char === ',' && bracketDepth === 0) {
      args.push(currentArg.trim());
      currentArg = '';
    } else {
      currentArg += char;
    }
  }
  if (currentArg.trim()) {
    args.push(currentArg.trim());
  }
  
  return args.map((val, idx) => {
    const name = paramNames[idx] || `Param ${idx + 1}`;
    return { name, value: val };
  });
}

export default function InterviewConsole({ session, onFinishSession, onAbort }: InterviewConsoleProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Code Editor states for DSA
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [customTestInput, setCustomTestInput] = useState('');
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [activeTestTab, setActiveTestTab] = useState(0);
  const [languageCodes, setLanguageCodes] = useState<Record<string, string>>({});
  const [activeTerminalTab, setActiveTerminalTab] = useState<'testcase' | 'testresult'>('testcase');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [sessionTestCases, setSessionTestCases] = useState<Record<string, { input: string; output: string }[]>>({});
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(280);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);

  const handleCodeChange = (newVal: string) => {
    setCodeContent(newVal);
    if (currentQuestion) {
      const key = `${currentQuestion.id}_${selectedLanguage}`;
      setLanguageCodes(prev => ({
        ...prev,
        [key]: newVal
      }));
    }
  };

  const handleEditParam = (caseIdx: number, paramIdx: number, newVal: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const defaultCases = currentQuestion.testCases || [];
    const currentCases = [...(sessionTestCases[qId] || defaultCases)];
    if (currentCases[caseIdx]) {
      const params = parseInputParams(codeContent, currentCases[caseIdx].input);
      if (params[paramIdx]) {
        params[paramIdx].value = newVal;
      }
      const combinedInput = params.map(p => p.value).join(', ');
      currentCases[caseIdx] = {
        ...currentCases[caseIdx],
        input: combinedInput
      };
      setSessionTestCases(prev => ({
        ...prev,
        [qId]: currentCases
      }));
    }
  };

  const handleAddTestCase = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const defaultCases = currentQuestion.testCases || [];
    const currentCases = [...(sessionTestCases[qId] || defaultCases)];
    const defaultInput = currentCases[0]?.input || '';
    currentCases.push({
      input: defaultInput,
      output: ''
    });
    setSessionTestCases(prev => ({
      ...prev,
      [qId]: currentCases
    }));
    setSelectedCaseIdx(currentCases.length - 1);
  };

  const handleResetTestCases = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const defaultCases = currentQuestion.testCases || [];
    setSessionTestCases(prev => ({
      ...prev,
      [qId]: [...defaultCases]
    }));
    setSelectedCaseIdx(0);
  };

  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Dynamic conversation state
  const [hasProbed, setHasProbed] = useState(false);

  // Speech Recognition states
  const [isListening, setIsListening] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const compilerLogsEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const currentQuestion = session.questions[currentQuestionIndex];
  const totalQuestions = session.questions.length;
  const isDsa = session.roundType === 'DSA';

  // Load voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Scroll to bottom of compiler logs
  useEffect(() => {
    compilerLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  // Console panel height drag resizer
  useEffect(() => {
    const doResize = (e: MouseEvent) => {
      if (!isDraggingConsole) return;
      const container = document.getElementById('console-terminal-view');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const newHeight = containerRect.bottom - e.clientY;
        if (newHeight >= 120 && newHeight <= 500) {
          setConsoleHeight(newHeight);
        }
      }
    };

    const stopResize = () => {
      setIsDraggingConsole(false);
    };

    if (isDraggingConsole) {
      window.addEventListener('mousemove', doResize);
      window.addEventListener('mouseup', stopResize);
    }

    return () => {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isDraggingConsole]);

  // Update editor code template when question or language changes
  useEffect(() => {
    if (currentQuestion) {
      const key = `${currentQuestion.id}_${selectedLanguage}`;
      if (languageCodes[key] !== undefined) {
        setCodeContent(languageCodes[key]);
      } else {
        const codes = currentQuestion.starterCodes || {};
        const template = codes[selectedLanguage] || DEFAULT_STARTER_CODES[selectedLanguage] || '';
        setCodeContent(template);
      }
    }
  }, [currentQuestionIndex, selectedLanguage, currentQuestion]);

  // Initialize Interview Console
  useEffect(() => {
    const introMsg: ConsoleMessage = {
      id: 'sys-1',
      sender: 'system',
      text: `CONNECTION ESTABLISHED WITH ${session.company.toUpperCase()} UPLINK // ROLE: ${session.role.toUpperCase()} // ROUND: ${session.roundType.toUpperCase()}`
    };
    
    setMessages([introMsg]);
    triggerTypewriter(
      currentQuestion.text,
      `Welcome to your ${session.company} interview! I'll be your interrogator today. Let's start with this task: `
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom whenever messages or typing updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showHint]);

  // Voice Speech synthesis helper
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Strip markdown formatting before reading out loud
    const cleanText = text.replace(/[*_#`\-\[\]]/g, '').replace(/\[.*Context.*\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                      voices.find(v => v.lang.startsWith('en')) || 
                      voices[0];
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition transcription handler (STT)
  const toggleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (isDsa) {
        // Code commentary
        setCurrentAnswer(prev => prev + (prev ? '\n' : '') + transcript);
      } else {
        // General text answer
        setCurrentAnswer(prev => prev + (prev ? ' ' : '') + transcript);
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Run JavaScript Code Sandbox
  const handleRunCode = async () => {
    setConsoleLogs(['Compiling and executing Sandbox instance...']);
    setTestResults(null);

    // Live AI Interpreter Execution
    if (isApiKeyLoaded()) {
      try {
        setConsoleLogs(prev => [...prev, 'Running live code compilation via Gemini NLP Engine...']);
        const results = await evaluateCodeWithGemini(codeContent, selectedLanguage, sessionTestCases[currentQuestion.id] || currentQuestion.testCases || []);
        setTestResults(results);
        setConsoleLogs(prev => [...prev, 'Execution completed.']);
        setActiveTestTab(0);
        setActiveTerminalTab('testresult');
        setIsConsoleOpen(true);
        return;
      } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[AI RUNNER ERROR] ${err.message}. Falling back to browser sandbox.`]);
      }
    }

    // Local JS/Python Transpiler Execution
    let jsCode = codeContent;
    if (selectedLanguage === 'python') {
      jsCode = transpilePythonToJS(codeContent);
    } else if (selectedLanguage === 'cpp' || selectedLanguage === 'java' || selectedLanguage === 'go') {
      jsCode = cleanCppJavaGoToJS(codeContent, selectedLanguage);
    }

    const originalLog = console.log;
    const tempLogs: string[] = [];
    console.log = (...args) => {
      tempLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    try {
      const userFunc = new Function(`
        ${jsCode}
        return {
          run: typeof solve !== 'undefined' ? solve : 
               typeof twoSum !== 'undefined' ? twoSum : 
               typeof maxProfit !== 'undefined' ? maxProfit :
               typeof isValid !== 'undefined' ? isValid :
               typeof reverseList !== 'undefined' ? reverseList :
               typeof lengthOfLongestSubstring !== 'undefined' ? lengthOfLongestSubstring :
               typeof maxArea !== 'undefined' ? maxArea :
               typeof climbStairs !== 'undefined' ? climbStairs :
               typeof findKthLargest !== 'undefined' ? findKthLargest :
               typeof search !== 'undefined' ? search :
               typeof groupAnagrams !== 'undefined' ? groupAnagrams :
               typeof mergeTwoLists !== 'undefined' ? mergeTwoLists :
               typeof trap !== 'undefined' ? trap : null
        };
      `)();

      if (!userFunc.run) {
        // Fallback: try executing code directly to print logs
        new Function(jsCode)();
        throw new Error("Could not find a valid solution function. Make sure your function name matches the LeetCode template.");
      } else {
        const testCases = sessionTestCases[currentQuestion.id] || currentQuestion.testCases || [];
        const results: any[] = [];
        
        testCases.forEach((tc) => {
          const args = new Function(`return [${tc.input}];`)();
          const expected = new Function(`return ${tc.output};`)();
          
          try {
            const start = performance.now();
            const result = userFunc.run(...args);
            const duration = (performance.now() - start).toFixed(3);
            const passed = JSON.stringify(result) === JSON.stringify(expected);
            
            results.push({
              input: tc.input,
              output: JSON.stringify(result),
              expected: tc.output,
              passed,
              duration: `${duration}ms`
            });
          } catch (err: any) {
            results.push({
              input: tc.input,
              output: 'undefined',
              expected: tc.output,
              passed: false,
              error: err.message
            });
          }
        });

        setTestResults(results);
        setActiveTestTab(0);
        setActiveTerminalTab('testresult');
        setIsConsoleOpen(true);
        setConsoleLogs(prev => [...prev, 'Local execution sandbox completed.']);
      }
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `[RUNTIME ERROR] ${err.name}: ${err.message}`]);
    } finally {
      console.log = originalLog;
    }
  };

  const handleRunCustomCode = async () => {
    if (!customTestInput.trim()) {
      setConsoleLogs(prev => [...prev, '[CUSTOM RUNNER] Error: Please enter custom test case input first!']);
      return;
    }

    setConsoleLogs(prev => [...prev, 'Compiling and executing Custom sandbox instance...']);
    setTestResults(null);

    // Live AI Custom Execution
    if (isApiKeyLoaded()) {
      try {
        setConsoleLogs(prev => [...prev, 'Running custom test case via Gemini AI...']);
        const customResult = await evaluateCodeWithGemini(codeContent, selectedLanguage, [{ input: customTestInput, output: '' }]);
        setTestResults([{
          input: customTestInput,
          output: customResult[0]?.output || 'No output returned',
          expected: 'N/A (Custom Test Case)',
          passed: customResult[0]?.passed ?? true,
          error: customResult[0]?.error
        }]);
        setActiveTestTab(0);
        setActiveTerminalTab('testresult');
        setIsConsoleOpen(true);
        return;
      } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[AI RUNNER ERROR] ${err.message}. Falling back to browser sandbox.`]);
      }
    }

    // Local JS/Python Custom Execution
    let jsCode = codeContent;
    if (selectedLanguage === 'python') {
      jsCode = transpilePythonToJS(codeContent);
    } else if (selectedLanguage === 'cpp' || selectedLanguage === 'java' || selectedLanguage === 'go') {
      jsCode = cleanCppJavaGoToJS(codeContent, selectedLanguage);
    }

    const originalLog = console.log;
    const tempLogs: string[] = [];
    console.log = (...args) => {
      tempLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    try {
      const userFunc = new Function(`
        ${jsCode}
        return {
          run: typeof solve !== 'undefined' ? solve : 
               typeof twoSum !== 'undefined' ? twoSum : 
               typeof maxProfit !== 'undefined' ? maxProfit :
               typeof isValid !== 'undefined' ? isValid :
               typeof reverseList !== 'undefined' ? reverseList :
               typeof lengthOfLongestSubstring !== 'undefined' ? lengthOfLongestSubstring :
               typeof maxArea !== 'undefined' ? maxArea :
               typeof climbStairs !== 'undefined' ? climbStairs :
               typeof findKthLargest !== 'undefined' ? findKthLargest :
               typeof search !== 'undefined' ? search :
               typeof groupAnagrams !== 'undefined' ? groupAnagrams :
               typeof mergeTwoLists !== 'undefined' ? mergeTwoLists :
               typeof trap !== 'undefined' ? trap : null
        };
      `)();

      if (!userFunc.run) {
        new Function(jsCode)();
        throw new Error("Could not find a valid solution function. Make sure your function name matches the LeetCode template.");
      } else {
        const args = new Function(`return [${customTestInput}];`)();
        const start = performance.now();
        const result = userFunc.run(...args);
        const duration = (performance.now() - start).toFixed(3);
        
        setTestResults([{
          input: customTestInput,
          output: JSON.stringify(result),
          expected: 'N/A (Custom Test Case)',
          passed: true,
          duration: `${duration}ms`
        }]);
        setActiveTestTab(0);
        setActiveTerminalTab('testresult');
        setIsConsoleOpen(true);
      }
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `[RUNTIME ERROR] ${err.name}: ${err.message}`]);
    } finally {
      console.log = originalLog;
    }
  };

  // Typewriter effect logic
  const triggerTypewriter = (fullText: string, prefixText: string = '') => {
    setIsTyping(true);
    let index = 0;
    
    const messageId = `ai-q-${Date.now()}`;
    const newMsg: ConsoleMessage = {
      id: messageId,
      sender: 'interviewer',
      text: prefixText
    };

    setMessages(prev => [...prev, newMsg]);

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    typingTimerRef.current = setInterval(() => {
      index += 2; // Type 2 chars at a time for snappier scifi typewriter look
      const displayed = prefixText + fullText.substring(0, index);
      setMessages(prev => {
        return prev.map(m => {
          if (m.id === messageId) {
            return {
              ...m,
              text: displayed
            };
          }
          return m;
        });
      });

      if (index >= fullText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
        // Speak the text once it finishes or begins typing
        speakText(prefixText + fullText);
      }
    }, 10);
  };

  const handleNextStep = async (candidateResponse: string) => {
    // Append answer to terminal messages
    const candidateMsg: ConsoleMessage = {
      id: `cand-${Date.now()}`,
      sender: 'candidate',
      text: candidateResponse
    };
    const updatedMessages = [...messages, candidateMsg];
    setMessages(updatedMessages);
    setCurrentAnswer('');

    // If Gemini API is available and we haven't probed yet, generate follow-up
    if (isApiKeyLoaded()) {
      if (!hasProbed) {
        // Ask dynamic follow-up probing question
        setIsTyping(true);
        try {
          const reply = await askGeminiInterviewer(
            session.company,
            session.role,
            session.roundType,
            updatedMessages,
            currentQuestion.text
          );
          setHasProbed(true);
          triggerTypewriter(reply);
        } catch (err: any) {
          // Degrade gracefully
          console.error(err);
          advanceToNextQuestion(updatedMessages);
        }
      } else {
        // Proceed to next main question
        advanceToNextQuestion(updatedMessages);
      }
    } else {
      // Local offline mode (directly advance without probe)
      advanceToNextQuestion(updatedMessages);
    }
  };

  const advanceToNextQuestion = (currentMsgs: ConsoleMessage[]) => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < totalQuestions) {
      setCurrentQuestionIndex(nextIndex);
      setHasProbed(false);
      setIsTyping(true);
      setTimeout(() => {
        triggerTypewriter(
          session.questions[nextIndex].text,
          `Got it. Moving to question ${nextIndex + 1}: `
        );
      }, 500);
    } else {
      // Completed all questions
      handleFinish(currentMsgs);
    }
  };

  const handleFinish = (finalMsgs: ConsoleMessage[]) => {
    setIsTyping(true);
    const completionMsgId = `sys-done-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: completionMsgId, sender: 'system', text: "ALL EVALUATION METRIC FILES REGISTERED. COMPUTING FINAL scorecard GRADES..." }
    ]);
    
    // Stop speaking
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setTimeout(() => {
      setIsTyping(false);
      
      // Filter candidates inputs to list
      const candidateAnswers = finalMsgs
        .filter(m => m.sender === 'candidate')
        .map(m => m.text);
      
      // Extract codes and languages if DSA round
      const codes = isDsa ? [codeContent] : [];
      const languages = isDsa ? [selectedLanguage] : [];

      onFinishSession(candidateAnswers, codes, languages, finalMsgs);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTyping) return;

    let response = '';
    if (isDsa) {
      response = `[SELECTED LANGUAGE: ${selectedLanguage.toUpperCase()}]\n\nCODE SUBMISSION:\n${codeContent}\n\nCANDIDATE COMMENTARY:\n${currentAnswer.trim() || 'No additional comments.'}`;
    } else {
      response = currentAnswer.trim();
    }

    if (!response.trim()) return;
    handleNextStep(response);
  };

  const handleRequestHint = () => {
    if (showHint) return;
    const currentHint = getHintForCurrent(session.id);
    setShowHint(true);
    
    setMessages(prev => [
      ...prev,
      {
        id: `hint-${Date.now()}`,
        sender: 'system',
        text: `[DECRYPTED HINT DECODED]: ${currentHint}`
      }
    ]);
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel();
    }
    setIsMuted(!isMuted);
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingConsole(true);
  };

  // Render splitting code IDE vs LeetCode card
  if (isDsa) {
    return (
      <div style={styles.consoleGridDsa} id="console-terminal-view">
        {/* Left Side: LeetCode Details */}
        <div style={styles.dsaLeftCol}>
          {/* Question panel */}
          <div className="glass-panel glow-cyan" style={styles.leetcodeCard}>
            <div style={styles.hudHeader}>
              <span className="cyber-font" style={{ color: 'var(--neon-cyan)', fontSize: '11px' }}>
                LEETCODE TASK SCHEMA
              </span>
              <button
                type="button"
                className="btn-cyber btn-cyber-secondary"
                onClick={handleRequestHint}
                disabled={showHint}
                style={{ padding: '2px 8px', fontSize: '9px' }}
              >
                DECRYPT HINT
              </button>
            </div>
            <div style={styles.leetcodeContent}>
              <h2 style={{ fontSize: '24px', color: '#fff', margin: '10px 0', fontFamily: 'var(--font-sans)', fontWeight: '700', textTransform: 'none', letterSpacing: 'normal' }}>
                {currentQuestion.id === 'two_sum' ? '1. Two Sum' : 
                 currentQuestion.id === 'stock_profit' ? '121. Best Time to Buy and Sell Stock' :
                 currentQuestion.id === 'valid_parentheses' ? '20. Valid Parentheses' :
                 currentQuestion.id === 'reverse_linked_list' ? '206. Reverse Linked List' :
                 currentQuestion.id === 'longest_substring' ? '3. Longest Substring Without Repeating Characters' :
                 currentQuestion.id === 'container_water' ? '11. Container With Most Water' :
                 currentQuestion.id === 'climbing_stairs' ? '70. Climbing Stairs' :
                 currentQuestion.id === 'kth_largest' ? '215. Kth Largest Element in an Array' :
                 currentQuestion.id === 'rotated_binary_search' ? '33. Search in Rotated Sorted Array' :
                 currentQuestion.id === 'group_anagrams' ? '49. Group Anagrams' :
                 currentQuestion.id === 'merge_sorted_lists' ? '21. Merge Two Sorted Lists' :
                 currentQuestion.id === 'trapping_water' ? '42. Trapping Rain Water' :
                 currentQuestion.id.replace(/_/g, ' ')}
              </h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <span style={{ 
                  color: ['two_sum', 'valid_parentheses', 'reverse_linked_list', 'climbing_stairs', 'merge_sorted_lists'].includes(currentQuestion.id) ? '#00b8a3' : 
                         ['stock_profit', 'longest_substring', 'container_water', 'kth_largest', 'rotated_binary_search', 'group_anagrams'].includes(currentQuestion.id) ? '#ffb800' : '#ff375f', 
                  backgroundColor: ['two_sum', 'valid_parentheses', 'reverse_linked_list', 'climbing_stairs', 'merge_sorted_lists'].includes(currentQuestion.id) ? 'rgba(0, 184, 163, 0.1)' : 
                                   ['stock_profit', 'longest_substring', 'container_water', 'kth_largest', 'rotated_binary_search', 'group_anagrams'].includes(currentQuestion.id) ? 'rgba(255, 184, 0, 0.1)' : 'rgba(255, 55, 95, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {['two_sum', 'valid_parentheses', 'reverse_linked_list', 'climbing_stairs', 'merge_sorted_lists'].includes(currentQuestion.id) ? 'Easy' : 
                   ['stock_profit', 'longest_substring', 'container_water', 'kth_largest', 'rotated_binary_search', 'group_anagrams'].includes(currentQuestion.id) ? 'Medium' : 'Hard'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                  Topics
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                  Companies
                </span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: '18px' }} />
              {formatLeetCodeDescription(currentQuestion.text)}
              {showHint && (
                <div style={styles.dsaHintBox}>
                  <strong style={{ color: 'var(--neon-orange)', fontSize: '11px' }} className="cyber-font">
                    [HINT DECRYPTED]:
                  </strong>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                    {currentQuestion.hint}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Split Editor Panel */}
        <div style={styles.dsaRightCol} className="glass-panel">
          <div style={styles.editorToolbar}>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={styles.langSelect}
              className="cyber-font"
            >
              <option value="javascript">JavaScript (Runner Active)</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-cyber btn-cyber-secondary"
                onClick={handleRunCode}
                style={{ padding: '4px 12px', fontSize: '11px' }}
              >
                RUN SAMPLE TEST CASES ⚙
              </button>
              <button
                type="button"
                className={`btn-cyber ${isListening ? 'btn-cyber-pink' : 'btn-cyber-secondary'}`}
                onClick={toggleSpeechInput}
                style={{ padding: '4px 12px', fontSize: '11px' }}
              >
                {isListening ? '🎙 LISTENING...' : '🎙 DICTATE'}
              </button>
            </div>
          </div>

          {/* Monaco-styled IDE Textarea */}
          <div style={styles.codeTextareaContainer}>
            <div style={styles.lineNumbers}>
              {Array.from({ length: codeContent.split('\n').length + 5 }).map((_, i) => (
                <div key={i} style={styles.lineNumber}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={codeContent}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="// Write your optimal algorithm implementation here..."
              style={styles.codeEditor}
              disabled={isTyping}
            />
          </div>

          {/* Custom Test Case input box */}
          <div style={styles.customTestInputContainer}>
            <input
              type="text"
              value={customTestInput}
              onChange={(e) => setCustomTestInput(e.target.value)}
              placeholder="Enter custom test input parameters (e.g. [3, 2, 4], 6)"
              style={styles.customTestInputStyle}
              disabled={isTyping}
            />
            <button
              type="button"
              className="btn-cyber btn-cyber-secondary"
              onClick={handleRunCustomCode}
              disabled={isTyping || !customTestInput.trim()}
              style={{ padding: '0 16px', height: '36px', fontSize: '11px' }}
            >
              RUN CUSTOM TEST CASE
            </button>
                    {/* Compiler Terminal Outputs (LeetCode Style) */}
          <div style={{
            ...styles.compilerConsole,
            height: isConsoleOpen ? `${consoleHeight}px` : '38px',
            position: 'relative',
            transition: isDraggingConsole ? 'none' : 'height 0.2s ease',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Drag resize handle */}
            {isConsoleOpen && (
              <div
                onMouseDown={startResize}
                style={{
                  height: '4px',
                  cursor: 'ns-resize',
                  width: '100%',
                  backgroundColor: isDraggingConsole ? 'var(--neon-cyan)' : 'transparent',
                  transition: 'background-color 0.2s ease',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 10
                }}
              />
            )}

            {/* Headers row (Testcase vs Test Result) */}
            <div style={styles.leetcodeTerminalHeader}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTerminalTab('testcase');
                    setIsConsoleOpen(true);
                  }}
                  style={{
                    ...styles.leetcodeTerminalTabBtn,
                    ...(activeTerminalTab === 'testcase' && isConsoleOpen ? styles.leetcodeTerminalTabActive : {})
                  }}
                  className="cyber-font"
                >
                  <span style={{ marginRight: '6px', fontSize: '10px' }}>✓</span>
                  Testcase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTerminalTab('testresult');
                    setIsConsoleOpen(true);
                  }}
                  style={{
                    ...styles.leetcodeTerminalTabBtn,
                    ...(activeTerminalTab === 'testresult' && isConsoleOpen ? styles.leetcodeTerminalTabActive : {}),
                    color: testResults ? (testResults.every(r => r.passed) ? 'var(--neon-green)' : 'var(--neon-pink)') : 'var(--text-light)'
                  }}
                  className="cyber-font"
                >
                  <span style={{ marginRight: '6px', fontSize: '10px' }}>&gt;_</span>
                  Test Result
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {consoleLogs.length > 0 && isConsoleOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setConsoleLogs([]);
                      setTestResults(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '9px',
                      textDecoration: 'underline',
                      outline: 'none'
                    }}
                    className="cyber-font"
                  >
                    Clear Console
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '4px 10px',
                    outline: 'none',
                    marginRight: '6px'
                  }}
                  className="cyber-font"
                >
                  {isConsoleOpen ? '∨ Minimize' : '∧ Console'}
                </button>
              </div>
            </div>

            {/* Tab content panel */}
            {isConsoleOpen && (
              <div style={{ ...styles.compilerLogs, flex: 1 }}>
                {activeTerminalTab === 'testcase' ? (
                  <div>
                    {/* Case buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                      {(sessionTestCases[currentQuestion.id] || currentQuestion.testCases || []).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCaseIdx(idx)}
                          style={{
                            ...styles.leetcodeCaseSelectBtn,
                            ...(selectedCaseIdx === idx ? styles.leetcodeCaseSelectBtnActive : {})
                          }}
                          className="cyber-font"
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddTestCase}
                        style={{
                          ...styles.leetcodeCaseSelectBtn,
                          padding: '4px 12px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          backgroundColor: 'transparent',
                          borderColor: 'rgba(255,255,255,0.1)'
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Render parsed parameters */}
                    {(sessionTestCases[currentQuestion.id] || currentQuestion.testCases || [])[selectedCaseIdx] && (
                      <div>
                        {parseInputParams(codeContent, (sessionTestCases[currentQuestion.id] || currentQuestion.testCases || [])[selectedCaseIdx].input).map((param, pIdx) => (
                          <div key={pIdx} style={{ marginBottom: '12px' }}>
                            <div style={styles.testLabel} className="cyber-font">
                              {param.name} =
                            </div>
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleEditParam(selectedCaseIdx, pIdx, e.target.value)}
                              className="leetcode-input"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Source & Reset buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>&lt;/&gt; Source</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleResetTestCases}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          textDecoration: 'none',
                          outline: 'none'
                        }}
                        className="cyber-font"
                      >
                        Reset Testcases
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Test Result tab */
                  <div>
                    {!testResults ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>
                        &gt; Sandbox idle. Click 'RUN SAMPLE TEST CASES' or 'RUN CUSTOM TEST CASE' to execute.
                        {consoleLogs.length > 0 && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                            <strong>Console Logs:</strong>
                            {consoleLogs.map((log, idx) => (
                              <div key={idx} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
                                &gt; {log}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Status row: Accepted / Wrong Answer / Runtime Error */}
                        <div style={{
                          color: testResults.every(r => r.passed) ? 'var(--neon-green)' : 'var(--neon-pink)',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          marginBottom: '14px',
                          textShadow: testResults.every(r => r.passed) ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(244, 63, 94, 0.4)'
                        }} className="cyber-font">
                          {testResults.every(r => r.passed) ? 'Accepted ✓' : 'Wrong Answer ✗'}
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: 'normal' }}>
                            Runtime: {testResults[activeTestTab]?.duration || '1ms'}
                          </span>
                        </div>

                        {/* Case buttons side-by-side (like LeetCode checkbox style) */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          {testResults.map((result, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveTestTab(idx)}
                              style={{
                                ...styles.leetcodeCaseSelectBtn,
                                ...(activeTestTab === idx ? styles.leetcodeCaseSelectBtnActive : {}),
                                color: result.passed ? 'var(--neon-green)' : 'var(--neon-pink)'
                              }}
                              className="cyber-font"
                            >
                              <span style={{ marginRight: '6px' }}>{result.passed ? '✓' : '✗'}</span>
                              Case {idx + 1}
                            </button>
                          ))}
                        </div>

                        {/* Selected case results details */}
                        {testResults[activeTestTab]?.error ? (
                          <div>
                            <div style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }} className="cyber-font">
                              Runtime Error:
                            </div>
                            <pre style={styles.testPreError}>
                              {String(testResults[activeTestTab].error)}
                            </pre>
                          </div>
                        ) : (
                          <div>
                            {/* Input parameter box */}
                            <div style={styles.testDataRow}>
                              <div style={styles.testLabel} className="cyber-font">Input</div>
                              {parseInputParams(codeContent, testResults[activeTestTab].input).map((param, pIdx) => (
                                <div key={pIdx} style={{ marginBottom: '6px' }}>
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>
                                    {param.name} =
                                  </div>
                                  <pre style={styles.testPre}>{param.value}</pre>
                                </div>
                              ))}
                            </div>

                            {/* Output box */}
                            <div style={styles.testDataRow}>
                              <div style={styles.testLabel} className="cyber-font">Output</div>
                              <pre style={{
                                ...styles.testPre,
                                color: testResults[activeTestTab].passed ? 'var(--neon-green)' : 'var(--neon-pink)'
                              }}>
                                {testResults[activeTestTab].output}
                              </pre>
                            </div>

                            {/* Expected box */}
                            {testResults[activeTestTab].expected !== 'N/A (Custom Test Case)' && (
                              <div style={styles.testDataRow}>
                                <div style={styles.testLabel} className="cyber-font">Expected</div>
                                <pre style={styles.testPre}>{testResults[activeTestTab].expected}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
              <div ref={compilerLogsEndRef} />
            </div>
          </div>

          {/* Commentary & Submission block */}
          <form onSubmit={handleSubmit} style={styles.dsaSubmitBlock}>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Explain your trade-offs, space/time complexities, or design rationale..."
              style={{ ...styles.textarea, height: '60px' }}
              disabled={isTyping}
            />
            <div style={styles.dsaControlsRow}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-cyber btn-cyber-pink"
                  onClick={() => handleFinish(messages)}
                  style={{ fontSize: '11px', padding: '10px 16px' }}
                >
                  FINISH SESSION
                </button>
                <button
                  type="button"
                  className="btn-cyber btn-cyber-secondary"
                  onClick={onAbort}
                  style={{ fontSize: '11px', padding: '10px 16px' }}
                >
                  ABORT
                </button>
              </div>
              <button
                type="submit"
                className="btn-cyber btn-cyber-cyan"
                disabled={isTyping || !codeContent.trim()}
                style={{ fontSize: '11px', padding: '10px 24px' }}
              >
                SUBMIT ANSWER
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Fallback UI for non-DSA rounds (Behavioral, Systems, Fundamentals)
  return (
    <div className="console-grid" id="console-terminal-view">
      {/* Left HUD Panel */}
      <div className="glass-panel glow-cyan" style={styles.hudPanel}>
        <div style={styles.hudHeader}>
          <div style={styles.hudStatus}>
            <span style={styles.onlineLed}></span>
            <span style={styles.statusLabel} className="cyber-font">ACTIVE INTERROGATE UPLINK</span>
          </div>
          <div style={styles.logoBadge}>{session.company.substring(0, 3).toUpperCase()}</div>
        </div>

        {/* AI Avatar */}
        <div style={styles.avatarContainer}>
          <div className="spin-slow" style={styles.outerRing}></div>
          <div className="spin-reverse" style={styles.innerRing}></div>
          <div style={styles.avatarSphere}>
            <div style={styles.avatarCore}></div>
          </div>
        </div>

        {/* Audio Wave Visualizer */}
        <div style={styles.voiceVisualizer}>
          <p style={styles.avatarSub} className="cyber-font">
            {isTyping ? "AI INTERVIEWER SPEECH WAVE ACTIVE" : "INTERVIEWER CONSOLE STANDBY"}
          </p>
          <div className="audio-wave">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="audio-bar"
                style={{
                  animationPlayState: isTyping ? 'running' : 'paused',
                  transform: !isTyping ? 'scaleY(0.2)' : undefined
                }}
              />
            ))}
          </div>
        </div>

        {/* Session details */}
        <div style={styles.detailsList}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel} className="cyber-font">Target Role</span>
            <span style={styles.detailVal}>{session.role}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel} className="cyber-font">Assessment Metric</span>
            <span style={styles.detailVal}>{session.roundType}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel} className="cyber-font">Session Signature</span>
            <span style={{ ...styles.detailVal, fontFamily: 'var(--font-mono)' }}>{session.id}</span>
          </div>
        </div>

        <button
          id="console-finish-btn"
          type="button"
          className="btn-cyber btn-cyber-pink"
          style={styles.abortBtn}
          onClick={() => handleFinish(messages)}
        >
          FORCE FINISH & SCORE
        </button>
        <button
          id="console-abort-btn"
          type="button"
          className="btn-cyber btn-cyber-secondary"
          style={{ ...styles.abortBtn, marginTop: '10px' }}
          onClick={onAbort}
        >
          ABORT INTERVIEW
        </button>
      </div>

      {/* Right Chat Terminal */}
      <div style={styles.terminalContainer}>
        {/* Terminal Header */}
        <div style={styles.terminalHeader}>
          <div style={styles.headerTitle} className="cyber-font">TERMINAL SHELL v1.07</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleMuteToggle}
              style={styles.muteBtn}
              className="cyber-font"
            >
              {isMuted ? '🔇 MUTED' : '🔊 AUDIO'}
            </button>
            <div style={styles.progressCounter} className="cyber-font">
              QUESTION {String(currentQuestionIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Message Log */}
        <div style={styles.messageLog} id="console-message-log">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} style={styles.msgSys} className="cyber-font">
                  &gt;&gt; [SYS LOG] {msg.text}
                </div>
              );
            }
            if (msg.sender === 'interviewer') {
              return (
                <div key={msg.id} style={styles.msgAi}>
                  <div style={styles.msgAiLabel} className="cyber-font">AI INTERVIEWER:</div>
                  <div style={styles.msgAiBubble}>{msg.text}</div>
                </div>
              );
            }
            return (
              <div key={msg.id} style={styles.msgCand}>
                <div style={styles.msgCandLabel} className="cyber-font">CANDIDATE LOG:</div>
                <div style={styles.msgCandBubble}>{msg.text}</div>
              </div>
            );
          })}
          
          {isTyping && (
            <div style={styles.cursorCursor}>
              <span className="cyber-font" style={styles.blinker}>█</span>
            </div>
          )}
          
          <div ref={chatBottomRef} />
        </div>

        {/* Input Panel */}
        <form onSubmit={handleSubmit} style={styles.inputArea}>
          <div style={styles.textContainer}>
            <textarea
              id="console-textarea"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={isTyping ? "Interviewer speaking... uplink temporarily locked." : "Type your detailed response here..."}
              style={styles.textarea}
              disabled={isTyping}
              required
            />
            {currentAnswer.trim() && (
              <span style={styles.wordsCount}>
                Words: {currentAnswer.trim().split(/\s+/).filter(Boolean).length}
              </span>
            )}
          </div>

          <div style={styles.controlsRow}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                id="console-hint-btn"
                type="button"
                className="btn-cyber btn-cyber-secondary"
                onClick={handleRequestHint}
                disabled={isTyping || showHint}
              >
                REQUEST HINT
              </button>
              <button
                id="console-voice-input-btn"
                type="button"
                className={`btn-cyber ${isListening ? 'btn-cyber-pink' : 'btn-cyber-secondary'}`}
                onClick={toggleSpeechInput}
                disabled={isTyping}
              >
                {isListening ? '🎙 LISTENING...' : '🎙 SPEECH INPUT'}
              </button>
            </div>
            
            <button
              id="console-submit-btn"
              type="submit"
              className="btn-cyber btn-cyber-cyan"
              disabled={isTyping || !currentAnswer.trim()}
            >
              SUBMIT ANSWER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {

  consoleGridDsa: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.1fr',
    gap: '24px',
    flex: 1,
    minHeight: '80vh'
  },
  dsaLeftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
    maxHeight: '85vh'
  },
  dsaRightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    background: 'rgba(10, 10, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    height: '100%',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  leetcodeCard: {
    padding: '24px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    borderRadius: '12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  leetcodeContent: {
    marginTop: '10px'
  },
  leetcodeDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    whiteSpace: 'pre-wrap',
    fontFamily: 'var(--font-sans)',
    lineHeight: '1.5',
    maxHeight: '180px',
    overflowY: 'auto',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)'
  },
  dsaHintBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '8px',
    padding: '10px',
    marginTop: '10px'
  },
  dsaTranscriptContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--panel-border)',
    borderRadius: '12px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    overflow: 'hidden'
  },
  editorToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '12px'
  },
  langSelect: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    color: '#fff',
    padding: '6px 12px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer'
  },
  codeTextareaContainer: {
    display: 'flex',
    flex: 1,
    minHeight: '260px',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    backgroundColor: '#030306',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    overflow: 'hidden'
  },
  lineNumbers: {
    width: '45px',
    borderRight: '1px solid rgba(255,255,255,0.04)',
    padding: '12px 0',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.25)',
    userSelect: 'none',
    backgroundColor: 'rgba(255,255,255,0.01)'
  },
  lineNumber: {
    lineHeight: '1.6',
    fontSize: '11px'
  },
  codeEditor: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'rgba(0, 242, 254, 0.85)',
    fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '12px',
    outline: 'none',
    resize: 'none',
    whiteSpace: 'pre',
    overflowX: 'auto',
    tabSize: 4
  },
  compilerConsole: {
    border: '1px solid rgba(129, 140, 248, 0.3)',
    borderRadius: '8px',
    backgroundColor: '#030306',
    boxShadow: '0 0 15px rgba(0, 242, 254, 0.04)',
    overflow: 'hidden'
  },
  compilerHeader: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    padding: '6px 12px',
    letterSpacing: '0.08em'
  },
  compilerLogs: {
    padding: '12px',
    maxHeight: '160px',
    overflowY: 'auto',
    fontFamily: 'var(--font-mono)'
  },
  dsaSubmitBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '12px'
  },
  dsaControlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  muteBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    color: 'var(--text-muted)',
    padding: '3px 8px',
    fontSize: '9px',
    cursor: 'pointer',
    letterSpacing: '0.05em'
  },
  hudPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '24px',
    background: 'rgba(10, 10, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
    padding: '24px',
  },
  hudHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '14px',
  },
  hudStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  onlineLed: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--neon-cyan)',
    boxShadow: 'var(--shadow-cyan)',
    animation: 'audioWavePulse 1.2s infinite',
  },
  statusLabel: {
    fontSize: '9px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.08em',
  },
  logoBadge: {
    fontFamily: 'var(--font-title)',
    fontSize: '11px',
    fontWeight: 'bold',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '2px 8px',
    borderRadius: '4px',
    color: 'var(--text-muted)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  avatarContainer: {
    position: 'relative',
    height: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px 0',
  },
  outerRing: {
    position: 'absolute',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    border: '2px dashed var(--neon-cyan)',
    opacity: 0.25,
  },
  innerRing: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '1px dotted var(--neon-pink)',
    opacity: 0.35,
  },
  avatarSphere: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--neon-blue) 0%, rgba(10, 10, 18, 0.9) 100%)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'holographicPulse 2s ease-in-out infinite',
  },
  avatarCore: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    filter: 'blur(4px)',
    opacity: 0.7,
  },
  voiceVisualizer: {
    textAlign: 'center',
  },
  avatarSub: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    marginBottom: '8px',
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '16px',
    borderRadius: '12px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  detailVal: {
    fontSize: '12px',
    color: '#fff',
    fontWeight: '500',
  },
  abortBtn: {
    width: '100%',
    marginTop: 'auto',
  },
  terminalContainer: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--panel-border)',
    borderRadius: '16px',
    background: 'rgba(10, 10, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  terminalHeader: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
  progressCounter: {
    fontSize: '10px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.15em',
    fontWeight: 'bold',
  },
  messageLog: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    minHeight: '280px',
    maxHeight: '420px',
    lineHeight: '1.6',
    letterSpacing: '0.02em',
  },
  msgSys: {
    color: 'var(--text-muted)',
    fontSize: '11px',
    borderBottom: '1px dashed rgba(255,255,255,0.04)',
    paddingBottom: '4px',
  },
  msgAi: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  msgAiLabel: {
    fontSize: '10px',
    color: 'var(--neon-cyan)',
    marginBottom: '6px',
  },
  msgAiBubble: {
    backgroundColor: 'rgba(129, 140, 248, 0.05)',
    border: '1px solid rgba(129, 140, 248, 0.15)',
    padding: '14px 18px',
    borderRadius: '0 16px 16px 16px',
    color: '#fff',
    whiteSpace: 'pre-wrap',
  },
  msgCand: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    textAlign: 'right',
  },
  msgCandLabel: {
    fontSize: '10px',
    color: 'var(--neon-green)',
    marginBottom: '6px',
  },
  msgCandBubble: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    padding: '14px 18px',
    borderRadius: '16px 0 16px 16px',
    color: '#fff',
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
  },
  cursorCursor: {
    alignSelf: 'flex-start',
    marginLeft: '6px',
  },
  blinker: {
    color: 'var(--neon-cyan)',
    animation: 'audioWavePulse 0.6s step-end infinite',
  },
  inputArea: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'rgba(5, 5, 8, 0.4)',
  },
  textContainer: {
    position: 'relative',
  },
  textarea: {
    width: '100%',
    height: '110px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '14px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    resize: 'none',
    transition: 'all 0.3s ease',
  },
  wordsCount: {
    position: 'absolute',
    bottom: '10px',
    right: '12px',
    fontSize: '10px',
    color: 'var(--text-muted)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  customTestInputContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '10px 14px',
    borderRadius: '8px',
    marginTop: '5px'
  },
  customTestInputStyle: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    outline: 'none'
  },
  leetcodeTerminalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0c0c14',
    padding: '0 6px',
    height: '38px'
  },
  leetcodeTerminalTabBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    padding: '0 16px',
    height: '38px',
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  leetcodeTerminalTabActive: {
    color: '#fff',
    borderBottom: '2px solid #fff',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  leetcodeCaseSelectBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '11px',
    padding: '6px 14px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  leetcodeCaseSelectBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    fontWeight: 'bold'
  },
  testTabsContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '240px',
    backgroundColor: '#030306',
  },
  testTabsHeader: {
    display: 'flex',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  testTabBtn: {
    flex: 1,
    padding: '10px',
    fontSize: '11px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  activeTestTabBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottom: '2px solid var(--neon-cyan)',
    fontWeight: 'bold',
  },
  testTabContent: {
    padding: '16px',
    overflowY: 'auto',
    flex: 1,
  },
  testDataRow: {
    marginBottom: '10px',
  },
  testLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  testPre: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#fff',
    fontFamily: 'var(--font-mono)',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  },
  testPreError: {
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    color: 'var(--neon-pink)',
    fontFamily: 'var(--font-mono)',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  }
};

