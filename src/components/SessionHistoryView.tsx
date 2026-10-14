import React, { useState } from 'react';
import { 
  type RecordedSession, 
  deleteRecordedSession, 
  calculateCandidateAggregates 
} from '../data/sessionStorage';
import { type Question } from '../data/interviewSimulator';

interface SessionHistoryViewProps {
  sessions: RecordedSession[];
  onRefresh: () => void;
  onInitiateSession: (company: string, role: string, roundType: string, customQuestions?: Question[], requirements?: string) => void;
}

export default function SessionHistoryView({ 
  sessions, 
  onRefresh, 
  onInitiateSession 
}: SessionHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRound, setFilterRound] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<RecordedSession | null>(null);

  const aggregates = calculateCandidateAggregates(sessions);

  // Filtered sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRound = filterRound === 'ALL' || session.roundType.toUpperCase().includes(filterRound);
    const matchesStatus = filterStatus === 'ALL' || session.status === filterStatus;

    return matchesSearch && matchesRound && matchesStatus;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this recorded interview session permanently?')) {
      deleteRecordedSession(id);
      if (selectedSessionForModal?.id === id) {
        setSelectedSessionForModal(null);
      }
      onRefresh();
    }
  };

  const handleRetake = (session: RecordedSession, e: React.MouseEvent) => {
    e.stopPropagation();
    onInitiateSession(
      session.company, 
      session.role, 
      session.roundType, 
      session.questions && session.questions.length > 0 ? session.questions : undefined, 
      session.requirements
    );
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container} id="profile-session-history-view">
      {/* KPI Overview Banner */}
      <div className="glass-panel glow-blue" style={styles.kpiBanner}>
        <div>
          <span style={styles.subBadge} className="cyber-font">Candidate Profile Telemetry</span>
          <h2 style={styles.sectionTitle} className="cyber-font">Recorded Sessions & Historical Logs</h2>
          <p style={styles.sectionDesc}>
            Persistent transcript and scoring logs of all interview sessions initiated, practiced, and evaluated.
          </p>
        </div>

        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel} className="cyber-font">Total Sessions</span>
            <span style={{ ...styles.kpiVal, color: 'var(--neon-cyan)' }}>
              {aggregates.completedSessions} <span style={styles.kpiUnit}>/ {aggregates.totalSessions}</span>
            </span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel} className="cyber-font">Composite Avg</span>
            <span style={{ ...styles.kpiVal, color: aggregates.averageOverall >= 80 ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
              {aggregates.averageOverall}%
            </span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel} className="cyber-font">Technical Avg</span>
            <span style={{ ...styles.kpiVal, color: 'var(--neon-blue)' }}>
              {aggregates.averageTechnical}%
            </span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel} className="cyber-font">Communication</span>
            <span style={{ ...styles.kpiVal, color: 'var(--neon-pink)' }}>
              {aggregates.averageCommunication}%
            </span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel} className="cyber-font">Pass Rate</span>
            <span style={{ ...styles.kpiVal, color: 'var(--neon-green)' }}>
              {aggregates.passRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="glass-panel" style={styles.filterBar}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            id="session-history-search-input"
            type="text"
            placeholder="Search by company or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filtersGroup}>
          <div style={styles.filterItem}>
            <span style={styles.filterLabel} className="cyber-font">Round:</span>
            <select
              id="session-round-filter-select"
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">All Rounds</option>
              <option value="DSA">DSA</option>
              <option value="SYSTEM">System Design</option>
              <option value="BEHAVIORAL">Behavioral</option>
              <option value="CS FUNDAMENTALS">CS Fundamentals</option>
            </select>
          </div>

          <div style={styles.filterItem}>
            <span style={styles.filterLabel} className="cyber-font">Status:</span>
            <select
              id="session-status-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Session Cards List */}
      {filteredSessions.length === 0 ? (
        <div className="glass-panel" style={styles.emptyState}>
          <div style={styles.emptyIcon}>📂</div>
          <h3 style={{ color: '#fff', marginBottom: '8px' }} className="cyber-font">No Recorded Sessions Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px', margin: '0 auto 20px auto' }}>
            No sessions match your search or filter filters. Complete a mock session in the Cockpit to populate this log automatically.
          </p>
        </div>
      ) : (
        <div style={styles.sessionList}>
          {filteredSessions.map((session) => {
            const breakdown = session.scoreBreakdown;
            const isCompleted = session.status === 'completed';
            const overallScore = breakdown ? breakdown.overall : 0;
            const scoreColor = overallScore >= 85 ? 'var(--neon-green)' : overallScore >= 70 ? 'var(--neon-cyan)' : 'var(--neon-pink)';

            return (
              <div
                key={session.id}
                className="glass-panel glow-cyan"
                style={styles.sessionCard}
                onClick={() => setSelectedSessionForModal(session)}
              >
                {/* Left: Company & Role info */}
                <div style={styles.sessionLeft}>
                  <div style={styles.companyBadgeRow}>
                    <div style={{ ...styles.companyAvatar, borderColor: scoreColor }}>
                      {session.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.companyTitleRow}>
                        <h3 style={styles.sessionCompany} className="cyber-font">{session.company}</h3>
                        <span style={styles.roundPill} className="cyber-font">{session.roundType}</span>
                        {session.isLiveAi && (
                          <span style={styles.liveAiBadge} className="cyber-font">AI EVALUATED</span>
                        )}
                      </div>
                      <div style={styles.sessionRole}>{session.role}</div>
                      <div style={styles.sessionTimestamp}>
                        📅 {formatDate(session.startTime)}
                        {session.durationMinutes ? ` • ⏱️ ${session.durationMinutes} min` : ''}
                        {session.questions ? ` • 📝 ${session.questions.length} Questions` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center: Score breakdown */}
                <div style={styles.sessionCenter}>
                  {isCompleted && breakdown ? (
                    <div style={styles.metricChips}>
                      <div style={styles.chip}>
                        <span style={styles.chipLabel} className="cyber-font">TECHNICAL</span>
                        <div style={styles.chipBarBg}>
                          <div style={{ ...styles.chipBarVal, width: `${breakdown.technical}%`, backgroundColor: 'var(--neon-green)' }} />
                        </div>
                        <span style={styles.chipVal}>{breakdown.technical}%</span>
                      </div>

                      <div style={styles.chip}>
                        <span style={styles.chipLabel} className="cyber-font">COMMUNICATION</span>
                        <div style={styles.chipBarBg}>
                          <div style={{ ...styles.chipBarVal, width: `${breakdown.communication}%`, backgroundColor: 'var(--neon-cyan)' }} />
                        </div>
                        <span style={styles.chipVal}>{breakdown.communication}%</span>
                      </div>

                      <div style={styles.chip}>
                        <span style={styles.chipLabel} className="cyber-font">OPTIMALITY</span>
                        <div style={styles.chipBarBg}>
                          <div style={{ ...styles.chipBarVal, width: `${breakdown.optimality}%`, backgroundColor: 'var(--neon-pink)' }} />
                        </div>
                        <span style={styles.chipVal}>{breakdown.optimality}%</span>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.inProgressBadge}>
                      <span style={styles.pulseLed}></span>
                      SESSION IN PROGRESS / CREATED
                    </div>
                  )}
                </div>

                {/* Right: Overall grade & action buttons */}
                <div style={styles.sessionRight}>
                  {isCompleted && breakdown ? (
                    <div style={styles.scoreContainer}>
                      <span style={{ ...styles.largeScore, color: scoreColor }}>
                        {overallScore}%
                      </span>
                      <span style={{ ...styles.statusTag, color: scoreColor }} className="cyber-font">
                        {overallScore >= 85 ? 'PASSED (HIGH)' : overallScore >= 70 ? 'COMPETENT' : 'NEEDS WORK'}
                      </span>
                    </div>
                  ) : (
                    <span style={styles.pendingScoreTag} className="cyber-font">PENDING</span>
                  )}

                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      id={`session-details-btn-${session.id}`}
                      className="btn-cyber btn-cyber-cyan"
                      style={styles.actionBtnSmall}
                      onClick={() => setSelectedSessionForModal(session)}
                    >
                      VIEW DEBRIEF
                    </button>
                    <button
                      type="button"
                      id={`session-retake-btn-${session.id}`}
                      className="btn-cyber btn-cyber-secondary"
                      style={styles.actionBtnSmall}
                      onClick={(e) => handleRetake(session, e)}
                      title="Retake session with these parameters"
                    >
                      RETAKE
                    </button>
                    <button
                      type="button"
                      id={`session-delete-btn-${session.id}`}
                      style={styles.deleteBtn}
                      onClick={(e) => handleDelete(session.id, e)}
                      title="Delete record"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Debrief Modal */}
      {selectedSessionForModal && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSessionForModal(null)}>
          <div 
            className="glass-panel glow-cyan" 
            style={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.subBadge} className="cyber-font">ARCHIVED SESSION DOSSIER</span>
                <h2 style={{ color: '#fff', fontSize: '20px', marginTop: '4px' }} className="cyber-font">
                  {selectedSessionForModal.company} — {selectedSessionForModal.roundType}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {selectedSessionForModal.role} • Completed {formatDate(selectedSessionForModal.startTime)}
                </p>
              </div>
              <button 
                type="button" 
                style={styles.closeBtn}
                onClick={() => setSelectedSessionForModal(null)}
              >
                ✕
              </button>
            </div>

            {selectedSessionForModal.scoreBreakdown && (
              <div style={styles.modalScoreHeader}>
                <div style={styles.modalScoreBox}>
                  <span style={styles.modalScoreLabel} className="cyber-font">OVERALL GRADE</span>
                  <span style={{ ...styles.modalScoreBig, color: selectedSessionForModal.scoreBreakdown.overall >= 80 ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
                    {selectedSessionForModal.scoreBreakdown.overall}%
                  </span>
                </div>
                <div style={styles.modalScoreBox}>
                  <span style={styles.modalScoreLabel} className="cyber-font">TECHNICAL</span>
                  <span style={{ ...styles.modalScoreVal, color: 'var(--neon-green)' }}>
                    {selectedSessionForModal.scoreBreakdown.technical}%
                  </span>
                </div>
                <div style={styles.modalScoreBox}>
                  <span style={styles.modalScoreLabel} className="cyber-font">COMMUNICATION</span>
                  <span style={{ ...styles.modalScoreVal, color: 'var(--neon-cyan)' }}>
                    {selectedSessionForModal.scoreBreakdown.communication}%
                  </span>
                </div>
                <div style={styles.modalScoreBox}>
                  <span style={styles.modalScoreLabel} className="cyber-font">OPTIMALITY</span>
                  <span style={{ ...styles.modalScoreVal, color: 'var(--neon-pink)' }}>
                    {selectedSessionForModal.scoreBreakdown.optimality}%
                  </span>
                </div>
              </div>
            )}

            {/* Strengths and Weaknesses */}
            {selectedSessionForModal.scoreBreakdown && (
              <div style={styles.swGrid}>
                <div style={styles.swCard}>
                  <h4 style={{ color: 'var(--neon-green)', fontSize: '12px', marginBottom: '8px' }} className="cyber-font">
                    ✓ Verified Strengths
                  </h4>
                  <ul style={styles.swList}>
                    {selectedSessionForModal.scoreBreakdown.strengths.map((str, i) => (
                      <li key={i} style={styles.swItem}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div style={styles.swCard}>
                  <h4 style={{ color: 'var(--neon-pink)', fontSize: '12px', marginBottom: '8px' }} className="cyber-font">
                    ⚠ Key Areas For Growth
                  </h4>
                  <ul style={styles.swList}>
                    {selectedSessionForModal.scoreBreakdown.weaknesses.map((wk, i) => (
                      <li key={i} style={styles.swItem}>{wk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Questions, Answers & Code */}
            <div style={styles.questionsContainer}>
              <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px' }} className="cyber-font">
                QUESTION LOGS & RESPONSES
              </h3>
              {selectedSessionForModal.questions.map((q, idx) => {
                const answer = selectedSessionForModal.answers[idx] || '[No Answer Provided]';
                const code = selectedSessionForModal.codes?.[idx];
                const feedback = selectedSessionForModal.scoreBreakdown?.feedbackByQuestion?.[idx];

                return (
                  <div key={idx} style={styles.questionBlock}>
                    <div style={styles.qHeader}>
                      <span style={styles.qNumber} className="cyber-font">QUESTION {idx + 1}</span>
                      {feedback && (
                        <span style={styles.qScoreBadge} className="cyber-font">Score: {feedback.score}%</span>
                      )}
                    </div>
                    <div style={styles.qText}>{q.text}</div>

                    <div style={styles.candidateAnswerBox}>
                      <span style={styles.answerLabel} className="cyber-font">CANDIDATE EXPLANATION:</span>
                      <p style={styles.answerText}>{answer}</p>
                    </div>

                    {code && (
                      <div style={styles.codeSnippetBox}>
                        <span style={styles.answerLabel} className="cyber-font">SUBMITTED CODE:</span>
                        <pre style={styles.codePre}>
                          <code>{code}</code>
                        </pre>
                      </div>
                    )}

                    {feedback && (
                      <div style={styles.evaluatorBox}>
                        <span style={styles.evaluatorLabel} className="cyber-font">AI EVALUATOR CRITIQUE:</span>
                        <p style={styles.evaluatorText}>{feedback.review}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                className="btn-cyber btn-cyber-secondary"
                onClick={() => setSelectedSessionForModal(null)}
              >
                CLOSE DOSSIER
              </button>
              <button
                type="button"
                className="btn-cyber btn-cyber-cyan"
                onClick={(e) => {
                  setSelectedSessionForModal(null);
                  handleRetake(selectedSessionForModal, e);
                }}
              >
                RE-ATTEMPT THIS SESSION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  kpiBanner: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    borderRadius: '16px',
  },
  subBadge: {
    fontSize: '10px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.12em',
  },
  sectionTitle: {
    fontSize: '22px',
    color: '#fff',
    marginTop: '4px',
    marginBottom: '6px',
  },
  sectionDesc: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    maxWidth: '650px',
    lineHeight: '1.4',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginTop: '6px',
  },
  kpiCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '14px 16px',
    textAlign: 'center',
  },
  kpiLabel: {
    display: 'block',
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    marginBottom: '6px',
  },
  kpiVal: {
    fontFamily: 'var(--font-title)',
    fontSize: '22px',
    fontWeight: 'bold',
  },
  kpiUnit: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: 'normal',
  },
  filterBar: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    borderRadius: '12px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1',
    minWidth: '220px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  searchIcon: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  },
  filtersGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
  },
  selectInput: {
    backgroundColor: 'rgba(10, 10, 18, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#fff',
    padding: '6px 12px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sessionCard: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.25s ease',
  },
  sessionLeft: {
    flex: '1.2',
    minWidth: '240px',
  },
  companyBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  companyAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-title)',
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#fff',
    flexShrink: 0,
  },
  companyTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  sessionCompany: {
    fontSize: '16px',
    color: '#fff',
    margin: 0,
  },
  roundPill: {
    fontSize: '9px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.05em',
  },
  liveAiBadge: {
    fontSize: '8px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--neon-green)',
    letterSpacing: '0.05em',
  },
  sessionRole: {
    fontSize: '12px',
    color: 'var(--text-light)',
    marginTop: '2px',
  },
  sessionTimestamp: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  sessionCenter: {
    flex: '1',
    minWidth: '200px',
  },
  metricChips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  chipLabel: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    width: '95px',
    letterSpacing: '0.05em',
  },
  chipBarBg: {
    flex: 1,
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  chipBarVal: {
    height: '100%',
    borderRadius: '2px',
  },
  chipVal: {
    fontSize: '11px',
    fontFamily: 'var(--font-title)',
    fontWeight: 'bold',
    color: '#fff',
    width: '32px',
    textAlign: 'right',
  },
  inProgressBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--neon-orange)',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  pulseLed: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--neon-orange)',
    animation: 'audioWavePulse 1s infinite',
  },
  sessionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  scoreContainer: {
    textAlign: 'center',
    minWidth: '85px',
  },
  largeScore: {
    fontFamily: 'var(--font-title)',
    fontSize: '26px',
    fontWeight: 'bold',
    display: 'block',
    lineHeight: '1',
  },
  statusTag: {
    fontSize: '8px',
    letterSpacing: '0.08em',
    marginTop: '4px',
    display: 'block',
  },
  pendingScoreTag: {
    fontSize: '10px',
    color: 'var(--neon-orange)',
    letterSpacing: '0.08em',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionBtnSmall: {
    padding: '8px 14px',
    fontSize: '10px',
    borderRadius: '6px',
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid rgba(243, 85, 136, 0.25)',
    color: 'var(--neon-pink)',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '36px',
    marginBottom: '12px',
    opacity: 0.7,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 3, 6, 0.85)',
    backdropFilter: 'blur(12px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: 'rgba(10, 10, 18, 0.95)',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    borderRadius: '16px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  modalScoreHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
  },
  modalScoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  },
  modalScoreLabel: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '4px',
  },
  modalScoreBig: {
    fontFamily: 'var(--font-title)',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  modalScoreVal: {
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  swGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px',
  },
  swCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '16px',
  },
  swList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  swItem: {
    fontSize: '12px',
    color: 'var(--text-light)',
    lineHeight: '1.4',
  },
  questionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  questionBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  qHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qNumber: {
    fontSize: '10px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.08em',
  },
  qScoreBadge: {
    fontSize: '10px',
    color: 'var(--neon-green)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  qText: {
    fontSize: '13px',
    color: '#fff',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  candidateAnswerBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    padding: '12px',
  },
  answerLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '6px',
  },
  answerText: {
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  codeSnippetBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px',
  },
  codePre: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#a7f3d0',
    overflowX: 'auto',
    margin: 0,
    lineHeight: '1.5',
  },
  evaluatorBox: {
    backgroundColor: 'rgba(129, 140, 248, 0.05)',
    border: '1px solid rgba(129, 140, 248, 0.15)',
    borderRadius: '8px',
    padding: '12px',
  },
  evaluatorLabel: {
    fontSize: '9px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '4px',
  },
  evaluatorText: {
    fontSize: '12px',
    color: 'var(--text-light)',
    lineHeight: '1.4',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
  },
};
