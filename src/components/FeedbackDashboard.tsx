import React from 'react';
import { type ScoreBreakdown } from '../data/interviewSimulator';

interface FeedbackDashboardProps {
  company: string;
  role: string;
  roundType: string;
  breakdown: ScoreBreakdown;
  onRestart: (tab?: 'cockpit' | 'history' | 'benchmark') => void;
}

export default function FeedbackDashboard({
  company,
  role,
  roundType,
  breakdown,
  onRestart
}: FeedbackDashboardProps) {
  // SVG Radial Gauge definitions
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (breakdown.overall / 100) * circumference;

  // Tailored recommendations based on roundType & role
  const getRecommendations = () => {
    if (roundType === 'DSA') {
      return [
        { title: "Review LeetCode Patterns", desc: "Brush up on Sliding Window, Two-Pointer, and Monotonic Stack approaches." },
        { title: "Big-O Analysis Mastery", desc: "Ensure you clearly specify worst-case and average-case space/time complexities." },
        { title: "Data Structure Deep-Dive", desc: "Study hashmap collision strategies and priority queue operations." }
      ];
    }
    if (roundType === 'System Design') {
      return [
        { title: "Study System Design Primer", desc: "Review sharding key strategies, replication modes, and consistent hashing." },
        { title: "Caching & Fan-Out Architectures", desc: "Investigate hybrid push/pull models and Redis caching layout for celebrities." },
        { title: "Latency & Throughput Trade-offs", desc: "Understand database isolation levels and the CAP theorem boundaries." }
      ];
    }
    if (roundType === 'Behavioral') {
      return [
        { title: "STAR Method Formatting", desc: "Structure responses into Situation, Task, Action, and measurable Results." },
        { title: "Conflict Resolution Rationale", desc: "Emphasize collaborative trade-offs, objective metrics, and growth mindset." },
        { title: "Core Leadership Alignment", desc: "Familiarize yourself with company values (e.g. Googleyness, Customer Obsession)." }
      ];
    }
    return [
      { title: "OS Kernel Internals", desc: "Contrast process and thread overheads, virtual memory mapping, and scheduling." },
      { title: "Network Communication Stack", desc: "Review TCP/UDP differences, QUIC protocols, and DNS caching loops." },
      { title: "Database Transaction isolation", desc: "Understand MVCC, locks, write-skew anomalies, and ACID principles." }
    ];
  };

  const recommendations = getRecommendations();

  return (
    <div style={styles.container} id="feedback-report-view">
      {/* Header Info */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.metaTag} className="cyber-font">Assessment Protocol Complete</span>
          <h2 style={styles.title} className="cyber-font">Performance debrief: {company}</h2>
          <p style={styles.subtitle}>{role} — {roundType} Evaluation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            id="feedback-history-btn"
            type="button"
            className="btn-cyber btn-cyber-secondary"
            onClick={() => onRestart('history')}
          >
            📋 VIEW IN SESSIONS LOG
          </button>
          <button
            id="feedback-benchmark-btn"
            type="button"
            className="btn-cyber btn-cyber-blue"
            onClick={() => onRestart('benchmark')}
          >
            🏢 COMPARE MARKET CRITERIA
          </button>
          <button
            id="feedback-retry-btn"
            type="button"
            className="btn-cyber btn-cyber-cyan"
            onClick={() => onRestart('cockpit')}
          >
            🚀 NEW MOCK SESSION
          </button>
        </div>
      </div>

      {/* Scoring Panels Grid */}
      <div className="scoring-grid">
        {/* Radial Score Gauge Card */}
        <div className="glass-panel glow-cyan" style={styles.radialCard}>
          <h4 style={styles.cardHeader} className="cyber-font">Composite Score</h4>
          <div style={styles.gaugeContainer}>
            <div className="radial-gauge">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle
                  className="radial-gauge-circle radial-gauge-bg"
                  cx="80"
                  cy="80"
                  r={radius}
                />
                <circle
                  className="radial-gauge-circle radial-gauge-val"
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={breakdown.overall >= 80 ? 'var(--neon-green)' : breakdown.overall >= 50 ? 'var(--neon-cyan)' : 'var(--neon-pink)'}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    filter: breakdown.overall >= 80 ? 'drop-shadow(var(--shadow-green))' : breakdown.overall >= 50 ? 'drop-shadow(var(--shadow-cyan))' : 'drop-shadow(var(--shadow-pink))'
                  }}
                />
              </svg>
              <div className="radial-gauge-content">
                <span style={styles.gaugeScore}>{breakdown.overall}%</span>
                <span style={styles.gaugeLabel} className="cyber-font">Grade</span>
              </div>
            </div>
          </div>
          <div style={styles.gaugeVerdict} className="cyber-font">
            {breakdown.overall >= 85 ? "STATUS: EXCELLENT PASS" : breakdown.overall >= 70 ? "STATUS: COMPETENT PASS" : "STATUS: CRITIQUE & RETRY"}
          </div>
        </div>

        {/* Breakdown Metric Sliders Card */}
        <div className="glass-panel glow-blue" style={styles.breakdownCard}>
          <h4 style={styles.cardHeader} className="cyber-font">Metric Breakdown</h4>
          
          <div style={styles.metricRow}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel} className="cyber-font">Technical Accuracy</span>
              <span style={styles.metricVal}>{breakdown.technical}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarVal,
                  width: `${breakdown.technical}%`,
                  backgroundColor: 'var(--neon-green)',
                  boxShadow: 'var(--shadow-green)'
                }}
              />
            </div>
          </div>

          <div style={styles.metricRow}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel} className="cyber-font">Communication & Clarity</span>
              <span style={styles.metricVal}>{breakdown.communication}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarVal,
                  width: `${breakdown.communication}%`,
                  backgroundColor: 'var(--neon-cyan)',
                  boxShadow: 'var(--shadow-cyan)'
                }}
              />
            </div>
          </div>

          <div style={styles.metricRow}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel} className="cyber-font">Solution Optimality</span>
              <span style={styles.metricVal}>{breakdown.optimality}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarVal,
                  width: `${breakdown.optimality}%`,
                  backgroundColor: 'var(--neon-blue)',
                  boxShadow: 'var(--shadow-blue)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid-2">
        {/* Strengths panel */}
        <div className="glass-panel glow-green" style={styles.critiqueListPanel}>
          <h4 style={{ ...styles.cardHeader, color: 'var(--neon-green)' }} className="cyber-font">✔ Core Strengths</h4>
          <ul style={styles.critiqueList}>
            {breakdown.strengths.map((str, idx) => (
              <li key={idx} style={styles.critiqueItem}>
                <span style={styles.bulletCheck}>✔</span> {str}
              </li>
            ))}
          </ul>
        </div>

        {/* Areas of Improvement panel */}
        <div className="glass-panel glow-pink" style={styles.critiqueListPanel}>
          <h4 style={{ ...styles.cardHeader, color: 'var(--neon-pink)' }} className="cyber-font">⚠️ Gap Areas Identified</h4>
          <ul style={styles.critiqueList}>
            {breakdown.weaknesses.map((weak, idx) => (
              <li key={idx} style={styles.critiqueItem}>
                <span style={styles.bulletWarn}>⚠️</span> {weak}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question Transcripts and Critiques */}
      <div className="glass-panel" style={styles.transcriptPanel}>
        <h4 style={styles.transcriptHeader} className="cyber-font">Detailed Response Transcript & Critique</h4>
        
        <div style={styles.transcriptGrid} id="feedback-transcript-list">
          {breakdown.feedbackByQuestion.map((item, idx) => {
            // Helper to extract code vs commentary
            const parseCodeResponse = (answer: string) => {
              if (answer && answer.startsWith('[SELECTED LANGUAGE:')) {
                const langMatch = answer.match(/\[SELECTED LANGUAGE:\s*(.*?)\]/);
                const lang = langMatch ? langMatch[1] : 'javascript';
                
                const codeStart = answer.indexOf('CODE SUBMISSION:\n');
                const commentaryStart = answer.indexOf('CANDIDATE COMMENTARY:\n');
                
                if (codeStart !== -1 && commentaryStart !== -1) {
                  const code = answer.substring(codeStart + 17, commentaryStart).trim();
                  const commentary = answer.substring(commentaryStart + 21).trim();
                  return { language: lang, code, commentary };
                }
              }
              return { language: null, code: null, commentary: answer };
            };

            const parsed = parseCodeResponse(item.answer);

            return (
              <div key={idx} style={styles.transcriptCard} className="glass-panel">
                <div style={styles.transcriptCardHeader}>
                  <span style={styles.transcriptQNum} className="cyber-font">Question {idx + 1}</span>
                  <span
                    style={{
                      ...styles.transcriptQScore,
                      color: item.score >= 80 ? 'var(--neon-green)' : item.score >= 50 ? 'var(--neon-cyan)' : 'var(--neon-pink)'
                    }}
                    className="cyber-font"
                  >
                    Score: {item.score}%
                  </span>
                </div>
                
                <div style={styles.transcriptQText}>
                  <strong>Prompt:</strong> {item.question}
                </div>

                {parsed.code ? (
                  <div style={styles.dsaFeedbackWrapper}>
                    <div style={styles.dsaCodeHeader}>
                      <span className="cyber-font" style={{ fontSize: '9px', color: 'var(--neon-cyan)' }}>
                        SUBMITTED {parsed.language?.toUpperCase()} CODE
                      </span>
                    </div>
                    <div style={styles.dsaCodeBox}>
                      <div style={styles.dsaLineNumbers}>
                        {parsed.code.split('\n').map((_, i) => (
                          <div key={i} style={styles.dsaLineNum}>{i + 1}</div>
                        ))}
                      </div>
                      <pre style={styles.dsaPreCode}>{parsed.code}</pre>
                    </div>

                    <div style={styles.transcriptAnswerText}>
                      <strong>Candidate Commentary:</strong>
                      <p style={{ marginTop: '4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.4' }}>
                        {parsed.commentary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={styles.transcriptAnswerText}>
                    <strong>Candidate Answer:</strong>
                    <pre style={styles.answerPre}>{item.answer}</pre>
                  </div>
                )}

                <div style={styles.transcriptCritique}>
                  <strong>Critique Analysis:</strong>
                  <p style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.4' }}>{item.review}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Guidelines */}
      <div className="glass-panel glow-blue" style={styles.recommendationsPanel}>
        <h4 style={styles.cardHeader} className="cyber-font">Recommended Preparation Matrix</h4>
        <p style={styles.recommendationsSub}>Specific reading guidelines generated based on your session variables.</p>
        
        <div className="grid-3" style={styles.recGrid}>
          {recommendations.map((rec, idx) => (
            <div key={idx} style={styles.recCard} className="glass-panel glow-blue">
              <div style={styles.recBadge} className="cyber-font">DOCS #{idx+1}</div>
              <h5 style={styles.recTitle} className="cyber-font">{rec.title}</h5>
              <p style={styles.recDesc}>{rec.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.actionsFooter, display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          id="feedback-back-btn"
          type="button"
          className="btn-cyber btn-cyber-secondary"
          onClick={() => onRestart('cockpit')}
          style={styles.backBtn}
        >
          RETURN TO COCKPIT
        </button>
        <button
          id="feedback-footer-history-btn"
          type="button"
          className="btn-cyber btn-cyber-cyan"
          onClick={() => onRestart('history')}
          style={styles.backBtn}
        >
          VIEW IN SESSION HISTORY
        </button>
        <button
          id="feedback-footer-benchmark-btn"
          type="button"
          className="btn-cyber btn-cyber-blue"
          onClick={() => onRestart('benchmark')}
          style={styles.backBtn}
        >
          COMPARE MARKET BENCHMARKS
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '20px',
  },
  metaTag: {
    fontSize: '9px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.15em',
    marginBottom: '6px',
    display: 'block',
  },
  title: {
    fontSize: '24px',
    color: '#fff',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },

  radialCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '28px',
    borderRadius: '16px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  cardHeader: {
    fontSize: '13px',
    color: '#fff',
    marginBottom: '20px',
    width: '100%',
    textAlign: 'left',
  },
  gaugeContainer: {
    margin: '10px 0 20px',
  },
  gaugeScore: {
    fontFamily: 'var(--font-mono)',
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#fff',
  },
  gaugeLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
  gaugeVerdict: {
    fontSize: '11px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.05em',
    backgroundColor: 'rgba(255,255,255,0.01)',
    padding: '8px 18px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  breakdownCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '28px',
    borderRadius: '16px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  metricRow: {
    marginBottom: '16px',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  metricLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  metricVal: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarVal: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.8s ease',
  },
  critiqueListPanel: {
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  critiqueList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px',
  },
  critiqueItem: {
    fontSize: '13px',
    color: 'var(--text-light)',
    lineHeight: '1.4',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  bulletCheck: {
    color: 'var(--neon-green)',
    fontWeight: 'bold',
  },
  bulletWarn: {
    color: 'var(--neon-pink)',
    fontWeight: 'bold',
  },
  transcriptPanel: {
    padding: '28px',
    borderRadius: '16px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  transcriptHeader: {
    fontSize: '14px',
    color: '#fff',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '12px',
  },
  transcriptGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  transcriptCard: {
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.01)',
  },
  transcriptCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    paddingBottom: '8px',
  },
  transcriptQNum: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  transcriptQScore: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  transcriptQText: {
    fontSize: '13px',
    color: 'var(--text-light)',
    marginBottom: '10px',
    lineHeight: '1.4',
  },
  transcriptAnswerText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '10px',
    background: 'rgba(0,0,0,0.15)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.02)',
  },
  answerPre: {
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'pre-wrap',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: '6px',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  transcriptCritique: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    borderLeft: '2px solid var(--neon-blue)',
    paddingLeft: '10px',
  },
  recommendationsPanel: {
    padding: '28px',
    borderRadius: '16px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  recommendationsSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '20px',
  },
  recGrid: {
    marginTop: '10px',
  },
  recCard: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all 0.3s ease',
  },
  recBadge: {
    fontSize: '9px',
    color: 'var(--neon-blue)',
    letterSpacing: '0.08em',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  recTitle: {
    fontSize: '13px',
    color: '#fff',
  },
  recDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  actionsFooter: {
    textAlign: 'center',
    marginTop: '30px',
  },
  backBtn: {
    padding: '14px 30px',
  },
  dsaFeedbackWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px'
  },
  dsaCodeHeader: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderBottom: 'none',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    padding: '6px 12px',
  },
  dsaCodeBox: {
    display: 'flex',
    backgroundColor: '#030306',
    border: '1px solid rgba(255,255,255,0.05)',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    maxHeight: '250px',
    overflowY: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px'
  },
  dsaLineNumbers: {
    width: '35px',
    borderRight: '1px solid rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.2)',
    padding: '10px 0',
    textAlign: 'center',
    userSelect: 'none',
  },
  dsaLineNum: {
    lineHeight: '1.5',
    fontSize: '10px'
  },
  dsaPreCode: {
    flex: 1,
    color: 'var(--neon-cyan)',
    padding: '10px 12px',
    lineHeight: '1.5',
    margin: 0,
    whiteSpace: 'pre',
    overflowX: 'auto',
    textAlign: 'left'
  }
};


