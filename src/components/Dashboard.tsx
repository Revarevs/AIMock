import React, { useState, useEffect } from 'react';
import { type Question } from '../data/interviewSimulator';
import { getApiKey, setApiKey, isApiKeyLoaded, fetchLeetCodeQuestion, generateDynamicQuestions } from '../data/gemini';

interface DashboardProps {
  userName: string;
  onInitiateSession: (company: string, role: string, roundType: string, customQuestions?: Question[], requirements?: string) => void;
}

const COMPANIES = [
  { id: 'Google', name: 'Google', color: 'cyan', slogan: 'Organize the world\'s information' },
  { id: 'Meta', name: 'Meta', color: 'blue', slogan: 'Move fast, build social connection' },
  { id: 'Netflix', name: 'Netflix', color: 'pink', slogan: 'Freedom and responsibility' },
  { id: 'Microsoft', name: 'Microsoft', color: 'green', slogan: 'Empower every person on the planet' },
  { id: 'Amazon', name: 'Amazon', color: 'blue', slogan: 'Customer obsession & scale' }
];

const ROLES = [
  { id: 'Software Development Engineer (SDE)', label: 'SDE (Generalist)', desc: 'Backend, algorithms, and logic' },
  { id: 'Frontend Engineer', label: 'Frontend Engineer', desc: 'UI architecture and client performance' },
  { id: 'Systems Architect', label: 'Systems Architect', desc: 'Distributed databases, scaling, and redundancy' },
  { id: 'Core CS Graduate', label: 'Core CS Graduate', desc: 'Academic theory and operating system internals' }
];

const ROUNDS = [
  { id: 'DSA', name: 'Algorithms (DSA)', icon: '🌲', desc: 'LeetCode, complexity analyses, and graph algorithms' },
  { id: 'System Design', name: 'System Design', icon: '🌐', desc: 'Scaling feed rankings, rate limiters, and cache invalidation' },
  { id: 'Behavioral', name: 'Behavioral (HR)', icon: '🤝', desc: 'STAR format answers, conflict resolution, and core values' },
  { id: 'Computer Science Fundamentals', name: 'CS Fundamentals', icon: '💻', desc: 'Virtual memory, processes vs threads, TCP, and isolation levels' }
];

export default function Dashboard({ userName, onInitiateSession }: DashboardProps) {
  const [selectedCompany, setSelectedCompany] = useState('Google');
  const [customCompany, setCustomCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState('Software Development Engineer (SDE)');
  const [selectedRound, setSelectedRound] = useState('DSA');

  // Gemini & LeetCode Integration State
  const [apiKeyVal, setApiKeyVal] = useState(getApiKey());
  const [isApiActive, setIsApiActive] = useState(isApiKeyLoaded());
  const [useLiveAI, setUseLiveAI] = useState(isApiKeyLoaded());
  
  const [leetcodeQuery, setLeetcodeQuery] = useState('');
  const [fetchedQuestion, setFetchedQuestion] = useState<Question | null>(null);
  const [isLoadingLeetCode, setIsLoadingLeetCode] = useState(false);
  const [leetcodeStatus, setLeetcodeStatus] = useState('');

  const [extraRequirements, setExtraRequirements] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  useEffect(() => {
    setIsApiActive(!!apiKeyVal);
  }, [apiKeyVal]);

  const handleSaveApiKey = () => {
    setApiKey(apiKeyVal);
    const active = isApiKeyLoaded();
    setIsApiActive(active);
    setUseLiveAI(active);
    alert(active ? 'Gemini API Link established successfully!' : 'API Key disconnected.');
  };

  const handleSyncLeetCode = async () => {
    if (!leetcodeQuery.trim()) return;
    if (!isApiActive) {
      alert('Syncing LeetCode requires a Gemini API Key to scrape and format the problem parameters.');
      return;
    }

    setIsLoadingLeetCode(true);
    setLeetcodeStatus('Synchronizing with LeetCode API node...');
    try {
      const result = await fetchLeetCodeQuestion(leetcodeQuery);
      // Map fetched structure to local Question interface
      const mappedQuestion: Question = {
        id: result.id,
        text: `[LeetCode Synced - ${result.title}]\n\n${result.description}`,
        hint: result.hint,
        keywords: result.constraints,
        starterCodes: result.starterCodes,
        testCases: result.testCases
      };
      setFetchedQuestion(mappedQuestion);
      setLeetcodeStatus(`SUCCESSFULLY SYNCED: ${result.title}`);
    } catch (err: any) {
      setLeetcodeStatus(`SYNC ERROR: ${err.message}`);
    } finally {
      setIsLoadingLeetCode(false);
    }
  };

  const handleStart = async () => {
    const finalCompany = selectedCompany === 'Custom' ? (customCompany || 'CustomTech') : selectedCompany;
    
    if (useLiveAI && isApiActive) {
      setIsGeneratingQuestions(true);
      try {
        let sessionQuestions: Question[] = [];
        if (fetchedQuestion) {
          // Use synced LeetCode question, and generate a complementary second question to make exactly 2
          const companion = await generateDynamicQuestions(
            finalCompany,
            selectedRole,
            selectedRound,
            `Include a question that is different but complementary to: ${fetchedQuestion.id}. Candidate requirements: ${extraRequirements}`
          );
          sessionQuestions = [fetchedQuestion, companion[0]];
        } else {
          // Generate 2 fresh dynamic questions based on profile & requirements
          sessionQuestions = await generateDynamicQuestions(
            finalCompany,
            selectedRole,
            selectedRound,
            extraRequirements
          );
        }
        onInitiateSession(finalCompany, selectedRole, selectedRound, sessionQuestions, extraRequirements);
      } catch (err: any) {
        alert(`Failed to load dynamic AI questions: ${err.message}. Starting standard session.`);
        onInitiateSession(finalCompany, selectedRole, selectedRound, undefined, extraRequirements);
      } finally {
        setIsGeneratingQuestions(false);
      }
    } else {
      // Offline Local Mode
      if (fetchedQuestion) {
        onInitiateSession(finalCompany, selectedRole, selectedRound, [fetchedQuestion], extraRequirements);
      } else {
        onInitiateSession(finalCompany, selectedRole, selectedRound, undefined, extraRequirements);
      }
    }
  };

  return (
    <div style={styles.container} id="dashboard-cockpit-view">
      {/* Welcome Banner */}
      <div className="glass-panel glow-cyan" style={styles.banner}>
        <div style={styles.bannerLeft}>
          <p style={styles.bannerTag} className="cyber-font">Candidate Protocol Active</p>
          <h1 style={styles.bannerTitle} className="cyber-font">Welcome back, {userName}</h1>
          <p style={styles.bannerDesc}>Configure interview parameters, connect to Google Gemini, or sync real LeetCode questions below.</p>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel} className="cyber-font">Active Uplink</span>
            <span style={{ ...styles.statValue, color: isApiActive ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
              {isApiActive ? 'LIVE AI' : 'LOCAL'}
            </span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel} className="cyber-font">Round Limit</span>
            <span style={{ ...styles.statValue, color: 'var(--neon-cyan)' }}>02 Qs</span>
          </div>
        </div>
      </div>

      {/* Main Cockpit Configuration */}
      <div className="grid-main">
        {/* Company Card Selection */}
        <div className="glass-panel" style={styles.panelSection}>
          <h3 style={styles.sectionTitle} className="cyber-font">Select target entity</h3>
          <p style={styles.sectionSub}>Pick a tech giant to load their specific questions or type a custom profile.</p>
          
          <div className="grid-3" style={styles.gridMargin}>
            {COMPANIES.map(company => (
              <button
                key={company.id}
                id={`dashboard-company-${company.id.toLowerCase()}`}
                type="button"
                className={`glass-panel glow-${company.color}`}
                style={{
                  ...styles.compCard,
                  borderColor: selectedCompany === company.id ? `var(--neon-${company.color})` : 'rgba(255, 255, 255, 0.08)',
                  background: selectedCompany === company.id ? `rgba(255, 255, 255, 0.03)` : '',
                  boxShadow: selectedCompany === company.id ? `var(--shadow-${company.color})` : '',
                }}
                onClick={() => setSelectedCompany(company.id)}
              >
                <div style={{ ...styles.compLogo, color: `var(--neon-${company.color})` }}>
                  {company.name.charAt(0)}
                </div>
                <div style={styles.compName} className="cyber-font">{company.name}</div>
                <div style={styles.compSlogan}>{company.slogan}</div>
              </button>
            ))}

            {/* Custom Option */}
            <button
              id="dashboard-company-custom-btn"
              type="button"
              className="glass-panel glow-pink"
              style={{
                ...styles.compCard,
                borderColor: selectedCompany === 'Custom' ? 'var(--neon-pink)' : 'rgba(255, 255, 255, 0.08)',
                background: selectedCompany === 'Custom' ? 'rgba(255, 255, 255, 0.03)' : '',
                boxShadow: selectedCompany === 'Custom' ? 'var(--shadow-pink)' : '',
              }}
              onClick={() => setSelectedCompany('Custom')}
            >
              <div style={{ ...styles.compLogo, color: 'var(--neon-pink)' }}>C</div>
              <div style={styles.compName} className="cyber-font">Custom Profile</div>
              <div style={styles.compSlogan}>Construct your own company parameters</div>
            </button>
          </div>

          {selectedCompany === 'Custom' && (
            <div style={styles.customInputContainer} id="dashboard-custom-company-input-block">
              <label htmlFor="dashboard-custom-company-input" style={styles.customInputLabel} className="cyber-font">Designate Custom Company</label>
              <input
                id="dashboard-custom-company-input"
                type="text"
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder="e.g. OpenAI, Stripe, Spotify..."
                style={styles.customInput}
              />
            </div>
          )}
        </div>

        {/* Role & Round Selection */}
        <div style={styles.sideSettings}>
          {/* Role selector */}
          <div className="glass-panel glow-blue" style={styles.panelSection}>
            <h3 style={styles.sectionTitle} className="cyber-font">Target Role</h3>
            <p style={styles.sectionSub}>Sets the evaluation context and question filter settings.</p>
            
            <div style={styles.verticalList}>
              {ROLES.map(role => (
                <button
                  key={role.id}
                  id={`dashboard-role-${role.id.split(' ')[0].toLowerCase()}`}
                  type="button"
                  style={{
                    ...styles.listItem,
                    borderColor: selectedRole === role.id ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)',
                    backgroundColor: selectedRole === role.id ? 'rgba(79, 172, 254, 0.08)' : 'rgba(0,0,0,0.1)'
                  }}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={styles.listItemLabel} className="cyber-font">{role.label}</span>
                    {selectedRole === role.id && <span style={styles.bulletActive}></span>}
                  </div>
                  <span style={styles.listItemDesc}>{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Round Selector */}
          <div className="glass-panel glow-cyan" style={styles.panelSection}>
            <h3 style={styles.sectionTitle} className="cyber-font">Interview Round Type</h3>
            <p style={styles.sectionSub}>Select the cognitive assessment module.</p>
            
            <div className="grid-2" style={styles.gridMargin}>
              {ROUNDS.map(round => (
                <button
                  key={round.id}
                  id={`dashboard-round-${round.id.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  className="glass-panel glow-cyan"
                  style={{
                    ...styles.roundCard,
                    borderColor: selectedRound === round.id ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: selectedRound === round.id ? 'rgba(129, 140, 248, 0.08)' : '',
                    boxShadow: selectedRound === round.id ? 'var(--shadow-cyan)' : '',
                  }}
                  onClick={() => setSelectedRound(round.id)}
                >
                  <span style={styles.roundIcon}>{round.icon}</span>
                  <span style={styles.roundName} className="cyber-font">{round.name}</span>
                  <span style={styles.roundDesc}>{round.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NLP Engine Controls */}
      <div className="glass-panel glow-blue" style={styles.aiConfigPanel}>
        <div style={styles.apiTitleRow}>
          <h3 className="cyber-font" style={{ color: '#fff', fontSize: '15px' }}>AI Integration Control Center</h3>
          <span style={{
            fontSize: '9px',
            backgroundColor: isApiActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(243, 85, 136, 0.1)',
            color: isApiActive ? 'var(--neon-green)' : 'var(--neon-pink)',
            border: `1px solid ${isApiActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(243, 85, 136, 0.3)'}`,
            padding: '3px 8px',
            borderRadius: '4px'
          }} className="cyber-font">
            {isApiActive ? 'UPLINK ONLINE // GEMINI READY' : 'LOCAL SIMULATOR MODE ACTIVE'}
          </span>
        </div>
        <p style={{ ...styles.sectionSub, marginBottom: '15px' }}>
          Connect to Google's NLP API node to unlock dynamic conversational loops, LeetCode question synchronization, and detailed technical code analysis.
        </p>

        <div style={styles.apiKeyInputContainer}>
          <input
            type="password"
            value={apiKeyVal}
            onChange={(e) => setApiKeyVal(e.target.value)}
            placeholder="Paste your Gemini API Key here (e.g. AIzaSy...)"
            style={{ ...styles.customInput, flex: 1 }}
          />
          <button
            type="button"
            className={`btn-cyber ${isApiActive ? 'btn-cyber-pink' : 'btn-cyber-cyan'}`}
            onClick={handleSaveApiKey}
            style={{ padding: '0 20px', height: '45px' }}
          >
            {isApiActive ? 'DISCONNECT KEY' : 'ESTABLISH LINK'}
          </button>
        </div>

        {isApiActive && (
          <div style={styles.aiToggles}>
            <div style={styles.toggleRow}>
              <input
                type="checkbox"
                id="use-live-ai-checkbox"
                checked={useLiveAI}
                onChange={(e) => setUseLiveAI(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="use-live-ai-checkbox" style={{ fontSize: '13px', color: '#fff', cursor: 'pointer' }}>
                <strong>Enable Dynamic NLP Interviewer</strong> (AI Interrogator will follow up dynamically based on your code and replies)
              </label>
            </div>

            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '15px', marginTop: '10px' }}>
              <h4 style={{ color: '#fff', fontSize: '12px', marginBottom: '8px' }} className="cyber-font">Candidate Requirements / Custom Focus Topics</h4>
              <textarea
                value={extraRequirements}
                onChange={(e) => setExtraRequirements(e.target.value)}
                placeholder="e.g. Give me 2 hard dynamic programming questions; focus on graph search; ask about big-O complexities..."
                style={styles.reqTextarea}
              />
            </div>

            {selectedRound === 'DSA' && (
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#fff', fontSize: '12px', marginBottom: '8px' }} className="cyber-font">Sync LeetCode Question</h4>
                <div style={styles.apiKeyInputContainer}>
                  <input
                    type="text"
                    value={leetcodeQuery}
                    onChange={(e) => setLeetcodeQuery(e.target.value)}
                    placeholder="Enter LeetCode ID or URL (e.g. 146, or Two Sum, or leetcode.com/problems/lru-cache)"
                    style={{ ...styles.customInput, flex: 1 }}
                    disabled={isLoadingLeetCode}
                  />
                  <button
                    type="button"
                    className="btn-cyber btn-cyber-secondary"
                    onClick={handleSyncLeetCode}
                    disabled={isLoadingLeetCode || !leetcodeQuery.trim()}
                    style={{ padding: '0 20px', height: '45px' }}
                  >
                    {isLoadingLeetCode ? 'SYNCING...' : 'SYNC PROBLEM'}
                  </button>
                </div>
                {leetcodeStatus && (
                  <p style={{
                    fontSize: '11px',
                    color: leetcodeStatus.includes('SUCCESS') ? 'var(--neon-green)' : leetcodeStatus.includes('ERROR') ? 'var(--neon-pink)' : 'var(--neon-cyan)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '8px'
                  }}>
                    &gt; {leetcodeStatus}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start Button */}
      <div style={styles.ctaContainer}>
        <button
          id="dashboard-initiate-btn"
          type="button"
          className="btn-cyber btn-cyber-cyan"
          style={styles.startBtn}
          onClick={handleStart}
          disabled={isGeneratingQuestions}
        >
          {isGeneratingQuestions ? (
            <>
              <span style={styles.loaderSpinner}></span> GENERATING COGNITIVE QUESTIONS...
            </>
          ) : (
            <>
              <span style={styles.pulseIndicator}></span> INITIATE INTERSECTION LINK (START MOCK)
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  banner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '36px 48px',
    flexWrap: 'wrap',
    gap: '24px',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  },
  bannerLeft: {
    flex: 1,
    minWidth: '300px',
  },
  bannerTag: {
    fontSize: '10px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.15em',
    marginBottom: '8px',
  },
  bannerTitle: {
    fontSize: '26px',
    color: '#fff',
    marginBottom: '10px',
  },
  bannerDesc: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
  },
  statsGrid: {
    display: 'flex',
    gap: '20px',
  },
  statBox: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '16px 20px',
    minWidth: '130px',
    textAlign: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.01)',
  },
  statLabel: {
    display: 'block',
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    marginBottom: '6px',
  },
  statValue: {
    fontFamily: 'var(--font-title)',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
  },

  panelSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  sideSettings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionTitle: {
    fontSize: '15px',
    color: '#fff',
    marginBottom: '6px',
  },
  sectionSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '20px',
  },
  gridMargin: {
    marginTop: '6px',
  },
  compCard: {
    padding: '24px 20px',
    textAlign: 'left',
    cursor: 'pointer',
    background: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    transition: 'all 0.3s ease',
  },
  compLogo: {
    fontFamily: 'var(--font-title)',
    fontSize: '28px',
    fontWeight: 'bold',
    lineHeight: '1',
  },
  compName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },
  compSlogan: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  customInputContainer: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  customInputLabel: {
    fontSize: '10px',
    color: 'var(--neon-pink)',
    letterSpacing: '0.05em',
  },
  customInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  verticalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listItem: {
    display: 'block',
    textAlign: 'left',
    padding: '16px 18px',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#fff',
  },
  listItemLabel: {
    fontSize: '13px',
    fontWeight: '600',
  },
  listItemDesc: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '4px',
    lineHeight: '1.3',
  },
  bulletActive: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--neon-blue)',
    boxShadow: 'var(--shadow-blue)',
  },
  roundCard: {
    padding: '20px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    background: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  roundIcon: {
    fontSize: '20px',
  },
  roundName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
  },
  roundDesc: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    lineHeight: '1.3',
  },
  aiConfigPanel: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
  },
  apiTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  apiKeyInputContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  aiToggles: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  reqTextarea: {
    width: '100%',
    height: '60px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '10px',
    color: '#fff',
    fontSize: '13px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  },
  ctaContainer: {
    textAlign: 'center',
    marginTop: '10px',
  },
  startBtn: {
    padding: '18px 40px',
    fontSize: '15px',
    fontWeight: 'bold',
    letterSpacing: '0.12em',
    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.15)',
  },
  pulseIndicator: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--neon-cyan)',
    boxShadow: 'var(--shadow-cyan)',
    animation: 'audioWavePulse 1s ease-in-out infinite',
  },
  loaderSpinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spinSlow 1s linear infinite',
    marginRight: '8px',
    verticalAlign: 'middle',
  }
};


