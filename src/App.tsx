import { useState, useEffect } from 'react';
import './App.css'; 
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import InterviewConsole from './components/InterviewConsole';
import FeedbackDashboard from './components/FeedbackDashboard';
import { 
  type InterviewSession, 
  type ScoreBreakdown, 
  type Question,
  startSession, 
  getSession, 
  gradeSession 
} from './data/interviewSimulator';
import { isApiKeyLoaded, gradeGeminiSession } from './data/gemini';
import { saveRecordedSession, type RecordedSession } from './data/sessionStorage';

function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [screen, setScreen] = useState<'dashboard' | 'console' | 'feedback'>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<'cockpit' | 'history' | 'benchmark'>('cockpit');
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [feedbackBreakdown, setFeedbackBreakdown] = useState<ScoreBreakdown | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [apiStatusText, setApiStatusText] = useState('SIMULATOR LINK: SECURE');

  // Check for stored user session on mount
  useEffect(() => {
    const stored = localStorage.getItem('sim_auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('sim_auth_user');
      }
    }
  }, []);

  // Update status pill based on API Key presence
  useEffect(() => {
    if (isApiKeyLoaded()) {
      setApiStatusText('AI UPLINK: GEMINI LIVE');
    } else {
      setApiStatusText('SIMULATOR LINK: LOCAL');
    }
  }, [screen]);

  const handleAuthSuccess = (loggedUser: { name: string; email: string }) => {
    setUser(loggedUser);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('sim_auth_user');
    setUser(null);
    setScreen('dashboard');
    setActiveSession(null);
    setFeedbackBreakdown(null);
  };

  const handleInitiateSession = (company: string, role: string, roundType: string, customQuestions?: Question[], requirements?: string) => {
    const session = startSession(company, role, roundType, customQuestions, requirements);
    setActiveSession(session);

    // Save initial session record to persistent storage
    const recorded: RecordedSession = {
      id: session.id,
      company: session.company,
      role: session.role,
      roundType: session.roundType,
      startTime: session.startTime,
      durationMinutes: 0,
      status: 'in-progress',
      questions: session.questions,
      answers: session.answers,
      codes: session.codes || [],
      languages: session.languages || [],
      isLiveAi: isApiKeyLoaded(),
      requirements
    };
    saveRecordedSession(recorded);

    setScreen('console');
  };

  const handleFinishSession = async (
    answers: string[],
    codes?: string[],
    languages?: string[],
    transcriptMessages?: { sender: 'system' | 'interviewer' | 'candidate'; text: string }[]
  ) => {
    if (!activeSession) return;

    // Update the simulation memory database with the final answers
    const session = getSession(activeSession.id);
    if (session) {
      session.answers = answers;
      session.codes = codes || [];
      session.languages = languages || [];
      session.currentQuestionIndex = answers.length;
    }

    setIsGrading(true);

    try {
      let finalBreakdown: ScoreBreakdown;
      if (isApiKeyLoaded() && transcriptMessages && transcriptMessages.length > 0) {
        // Grade and generate detailed review scores via Gemini
        finalBreakdown = await gradeGeminiSession(
          activeSession.company,
          activeSession.role,
          activeSession.roundType,
          transcriptMessages
        );
      } else {
        // Grade locally
        finalBreakdown = gradeSession(activeSession.id);
      }

      setFeedbackBreakdown(finalBreakdown);

      // Persist completed session record with detailed feedback and scores
      const duration = activeSession.startTime 
        ? Math.max(1, Math.round((Date.now() - activeSession.startTime) / 60000)) 
        : 15;

      const completedRecord: RecordedSession = {
        id: activeSession.id,
        company: activeSession.company,
        role: activeSession.role,
        roundType: activeSession.roundType,
        startTime: activeSession.startTime,
        completedAt: Date.now(),
        durationMinutes: duration,
        status: 'completed',
        scoreBreakdown: finalBreakdown,
        questions: activeSession.questions,
        answers: answers,
        codes: codes || [],
        languages: languages || [],
        isLiveAi: isApiKeyLoaded(),
        requirements: (activeSession as any).requirements
      };
      saveRecordedSession(completedRecord);

      setScreen('feedback');
    } catch (err: any) {
      alert(`AI grading failed: ${err.message}. Falling back to offline grading.`);
      const breakdown = gradeSession(activeSession.id);
      setFeedbackBreakdown(breakdown);

      const duration = activeSession.startTime 
        ? Math.max(1, Math.round((Date.now() - activeSession.startTime) / 60000)) 
        : 15;

      const completedRecord: RecordedSession = {
        id: activeSession.id,
        company: activeSession.company,
        role: activeSession.role,
        roundType: activeSession.roundType,
        startTime: activeSession.startTime,
        completedAt: Date.now(),
        durationMinutes: duration,
        status: 'completed',
        scoreBreakdown: breakdown,
        questions: activeSession.questions,
        answers: answers,
        codes: codes || [],
        languages: languages || [],
        isLiveAi: isApiKeyLoaded(),
        requirements: (activeSession as any).requirements
      };
      saveRecordedSession(completedRecord);

      setScreen('feedback');
    } finally {
      setIsGrading(false);
    }
  };

  const handleRestart = (tab: 'cockpit' | 'history' | 'benchmark' = 'cockpit') => {
    setDashboardTab(tab);
    setScreen('dashboard');
    setActiveSession(null);
    setFeedbackBreakdown(null);
  };

  // Auth Protection Shield
  if (!user) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  // AI Evaluation Loading State
  if (isGrading) {
    return (
      <div style={styles.gradingOverlay}>
        <div className="glass-panel glow-cyan" style={styles.gradingCard}>
          <div style={styles.loaderSpinnerBig}></div>
          <h2 style={{ color: '#fff', marginTop: '20px', fontFamily: 'var(--font-title)', letterSpacing: '0.15em' }}>AI SYNAPSE SCORING ACTIVE</h2>
          <div style={{ textAlign: 'left', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ color: 'var(--neon-cyan)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              &gt; UPLINKING CONVERSATION LOGS...
            </p>
            <p style={{ color: 'var(--neon-pink)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              &gt; ANALYZING CODE CORRECTNESS & OPTIMALITY...
            </p>
            <p style={{ color: 'var(--neon-green)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              &gt; DEPLOYING NLP DEBRIEF GENERATORS...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Cyber Header */}
      <header className="app-header" id="app-global-header">
        <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => { setDashboardTab('cockpit'); setScreen('dashboard'); }}>
          <div style={styles.logoBadge} className="cyber-font">AI</div>
          <span className="logo-logo">INTERVIEW SIMULATOR</span>
        </div>

        {/* Global Navigation Shortcuts */}
        <div style={styles.headerNavLinks}>
          <button
            type="button"
            id="global-nav-cockpit"
            style={{
              ...styles.headerTabBtn,
              color: screen === 'dashboard' && dashboardTab === 'cockpit' ? 'var(--neon-cyan)' : 'var(--text-muted)',
              borderColor: screen === 'dashboard' && dashboardTab === 'cockpit' ? 'rgba(129, 140, 248, 0.3)' : 'transparent',
              backgroundColor: screen === 'dashboard' && dashboardTab === 'cockpit' ? 'rgba(129, 140, 248, 0.08)' : 'transparent',
            }}
            className="cyber-font"
            onClick={() => { setDashboardTab('cockpit'); setScreen('dashboard'); }}
          >
            COCKPIT
          </button>
          <button
            type="button"
            id="global-nav-history"
            style={{
              ...styles.headerTabBtn,
              color: screen === 'dashboard' && dashboardTab === 'history' ? 'var(--neon-blue)' : 'var(--text-muted)',
              borderColor: screen === 'dashboard' && dashboardTab === 'history' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              backgroundColor: screen === 'dashboard' && dashboardTab === 'history' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            }}
            className="cyber-font"
            onClick={() => { setDashboardTab('history'); setScreen('dashboard'); }}
          >
            SESSIONS LOG
          </button>
          <button
            type="button"
            id="global-nav-benchmark"
            style={{
              ...styles.headerTabBtn,
              color: screen === 'dashboard' && dashboardTab === 'benchmark' ? 'var(--neon-green)' : 'var(--text-muted)',
              borderColor: screen === 'dashboard' && dashboardTab === 'benchmark' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
              backgroundColor: screen === 'dashboard' && dashboardTab === 'benchmark' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
            }}
            className="cyber-font"
            onClick={() => { setDashboardTab('benchmark'); setScreen('dashboard'); }}
          >
            MARKET CRITERIA
          </button>
        </div>

        <div style={styles.headerStatusPanel}>
          <div style={{
            ...styles.statusPill,
            borderColor: isApiKeyLoaded() ? 'rgba(16, 185, 129, 0.2)' : 'rgba(129, 140, 248, 0.2)',
            backgroundColor: isApiKeyLoaded() ? 'rgba(16, 185, 129, 0.03)' : 'rgba(129, 140, 248, 0.03)'
          }}>
            <span style={{
              ...styles.pingLed,
              backgroundColor: isApiKeyLoaded() ? 'var(--neon-green)' : 'var(--neon-cyan)',
              boxShadow: isApiKeyLoaded() ? 'var(--shadow-green)' : 'var(--shadow-cyan)'
            }}></span>
            <span style={{
              ...styles.pingText,
              color: isApiKeyLoaded() ? 'var(--neon-green)' : 'var(--neon-cyan)'
            }} className="cyber-font">{apiStatusText}</span>
          </div>

          <div style={styles.userProfile}>
            <span style={styles.profileBadge} className="cyber-font">{user.name.charAt(0)}</span>
            <span style={styles.userNameText}>{user.name}</span>
            <button
              id="header-logout-btn"
              type="button"
              style={styles.logoutBtn}
              onClick={handleLogout}
              className="cyber-font"
            >
              DISCONNECT
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Router */}
      <main className="app-main">
        {screen === 'dashboard' && (
          <Dashboard
            userName={user.name}
            onInitiateSession={handleInitiateSession}
            initialTab={dashboardTab}
            onTabChange={setDashboardTab}
          />
        )}
        {screen === 'console' && activeSession && (
          <InterviewConsole
            session={activeSession}
            onFinishSession={handleFinishSession}
            onAbort={handleRestart}
          />
        )}
        {screen === 'feedback' && activeSession && feedbackBreakdown && (
          <FeedbackDashboard
            company={activeSession.company}
            role={activeSession.role}
            roundType={activeSession.roundType}
            breakdown={feedbackBreakdown}
            onRestart={handleRestart}
          />
        )}
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  logoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1.5px solid var(--neon-cyan)',
    boxShadow: '0 0 8px rgba(0, 242, 254, 0.2)',
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    color: 'var(--neon-cyan)',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  headerNavLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTabBtn: {
    background: 'none',
    border: '1px solid transparent',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '11px',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    transition: 'all 0.2s ease',
  },
  headerStatusPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    backgroundColor: 'rgba(0, 242, 254, 0.03)',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  pingLed: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: 'var(--neon-cyan)',
    boxShadow: 'var(--shadow-cyan)',
  },
  pingText: {
    fontSize: '8px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.08em',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    paddingLeft: '20px',
  },
  profileBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--neon-blue)',
    color: '#000',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: '12px',
    color: '#fff',
    fontWeight: '500',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid rgba(243, 85, 136, 0.4)',
    color: 'var(--neon-pink)',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    marginLeft: '6px',
    transition: 'all 0.2s ease',
  },
  gradingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 3, 6, 0.9)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(16px)',
  },
  gradingCard: {
    width: '100%',
    maxWidth: '450px',
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'rgba(10, 10, 18, 0.8)',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-cyan)',
  },
  loaderSpinnerBig: {
    display: 'inline-block',
    width: '60px',
    height: '60px',
    border: '3px solid rgba(129, 140, 248, 0.1)',
    borderTopColor: 'var(--neon-cyan)',
    borderRadius: '50%',
    animation: 'spinSlow 1.5s linear infinite',
  }
};

export default App;
