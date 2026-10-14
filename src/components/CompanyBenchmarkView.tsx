import React, { useState } from 'react';
import { 
  type CompanyCriteria, 
  MARKET_COMPANIES, 
  evaluateCompanyMatch 
} from '../data/marketCriteria';
import { type CandidateAggregateStats } from '../data/sessionStorage';
import { type Question } from '../data/interviewSimulator';

interface CompanyBenchmarkViewProps {
  stats: CandidateAggregateStats;
  onInitiateSession: (company: string, role: string, roundType: string, customQuestions?: Question[], requirements?: string) => void;
}

export default function CompanyBenchmarkView({ stats, onInitiateSession }: CompanyBenchmarkViewProps) {
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

  // Candidate current capability vector
  const candidateScores = {
    overall: stats.averageOverall,
    technical: stats.averageTechnical,
    communication: stats.averageCommunication,
    optimality: stats.averageOptimality
  };

  // Evaluate comparison against all companies
  const comparisons = MARKET_COMPANIES.map(company => evaluateCompanyMatch(candidateScores, company));

  // Compute market summary metrics
  const totalCompanies = comparisons.length;
  const readyCount = comparisons.filter(c => c.status === 'READY_TO_INTERVIEW').length;
  const competitiveCount = comparisons.filter(c => c.status === 'COMPETITIVE').length;
  const marketReadinessScore = Math.round(
    (comparisons.reduce((acc, c) => acc + c.matchPercentage, 0) / totalCompanies)
  );

  // Filtered comparisons
  const filteredComparisons = comparisons.filter(item => {
    const matchesTier = selectedTier === 'ALL' || item.company.tier === selectedTier;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchesSearch = 
      item.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.primaryFocus.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTier && matchesStatus && matchesSearch;
  });

  const handleLaunchTargetedMock = (company: CompanyCriteria, focusRound: string = 'DSA') => {
    onInitiateSession(
      company.name,
      'Software Development Engineer (SDE)',
      focusRound,
      undefined,
      `Targeting ${company.name} criteria. Focus on: ${company.primaryFocus.slice(0, 2).join(', ')}`
    );
  };

  return (
    <div style={styles.container} id="market-benchmarking-view">
      {/* Top Banner: Market Index & Aggregate Candidate Bar */}
      <div className="glass-panel glow-cyan" style={styles.topBanner}>
        <div style={styles.bannerHeader}>
          <div>
            <span style={styles.subBadge} className="cyber-font">MARKET INTELLIGENCE // HIRING BAR RADAR</span>
            <h2 style={styles.sectionTitle} className="cyber-font">Industry Hiring Criteria & Candidate Match</h2>
            <p style={styles.sectionDesc}>
              Compare your aggregate interview telemetry against published technical and behavioral standards from top-tier tech companies.
            </p>
          </div>

          <div style={styles.overallReadinessBox}>
            <span style={styles.readinessLabel} className="cyber-font">MARKET READINESS INDEX</span>
            <div style={styles.readinessGaugeRow}>
              <span style={{ 
                ...styles.readinessScoreBig, 
                color: marketReadinessScore >= 80 ? 'var(--neon-green)' : marketReadinessScore >= 70 ? 'var(--neon-cyan)' : 'var(--neon-pink)' 
              }}>
                {marketReadinessScore}%
              </span>
              <div>
                <span style={styles.readinessSubtext}>
                  {readyCount} of {totalCompanies} Target Bars Cleared
                </span>
                <span style={styles.readinessSubBadge}>
                  {competitiveCount} Competitive in Range
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Capability Vector vs Market Benchmark */}
        <div style={styles.candidateVectorGrid}>
          <div style={styles.vectorItem}>
            <span style={styles.vectorLabel} className="cyber-font">Your Composite Score</span>
            <div style={styles.vectorValRow}>
              <span style={{ ...styles.vectorVal, color: 'var(--neon-cyan)' }}>{stats.averageOverall}%</span>
              <span style={styles.vectorTarget}>Market Bar: ~86%</span>
            </div>
            <div style={styles.vectorBarBg}>
              <div style={{ ...styles.vectorBarFill, width: `${stats.averageOverall}%`, backgroundColor: 'var(--neon-cyan)' }} />
            </div>
          </div>

          <div style={styles.vectorItem}>
            <span style={styles.vectorLabel} className="cyber-font">Your Technical Accuracy</span>
            <div style={styles.vectorValRow}>
              <span style={{ ...styles.vectorVal, color: 'var(--neon-green)' }}>{stats.averageTechnical}%</span>
              <span style={styles.vectorTarget}>Market Bar: ~88%</span>
            </div>
            <div style={styles.vectorBarBg}>
              <div style={{ ...styles.vectorBarFill, width: `${stats.averageTechnical}%`, backgroundColor: 'var(--neon-green)' }} />
            </div>
          </div>

          <div style={styles.vectorItem}>
            <span style={styles.vectorLabel} className="cyber-font">Your Solution Optimality</span>
            <div style={styles.vectorValRow}>
              <span style={{ ...styles.vectorVal, color: 'var(--neon-pink)' }}>{stats.averageOptimality}%</span>
              <span style={styles.vectorTarget}>Market Bar: ~86%</span>
            </div>
            <div style={styles.vectorBarBg}>
              <div style={{ ...styles.vectorBarFill, width: `${stats.averageOptimality}%`, backgroundColor: 'var(--neon-pink)' }} />
            </div>
          </div>

          <div style={styles.vectorItem}>
            <span style={styles.vectorLabel} className="cyber-font">Your Communication Clarity</span>
            <div style={styles.vectorValRow}>
              <span style={{ ...styles.vectorVal, color: 'var(--neon-blue)' }}>{stats.averageCommunication}%</span>
              <span style={styles.vectorTarget}>Market Bar: ~84%</span>
            </div>
            <div style={styles.vectorBarBg}>
              <div style={{ ...styles.vectorBarFill, width: `${stats.averageCommunication}%`, backgroundColor: 'var(--neon-blue)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Tier Selection Bar */}
      <div className="glass-panel" style={styles.filterBar}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🏢</span>
          <input
            id="company-criteria-search-input"
            type="text"
            placeholder="Search company or skill (e.g. Google, Graph, Concurrency)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filtersGroup}>
          <div style={styles.filterItem}>
            <span style={styles.filterLabel} className="cyber-font">Market Tier:</span>
            <select
              id="company-tier-filter-select"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">All Tiers ({totalCompanies})</option>
              <option value="Tier 1 FAANG+">Tier 1 FAANG+</option>
              <option value="Enterprise Cloud">Enterprise Cloud</option>
              <option value="High-Growth Tech">High-Growth Tech</option>
            </select>
          </div>

          <div style={styles.filterItem}>
            <span style={styles.filterLabel} className="cyber-font">Readiness Bar:</span>
            <select
              id="company-readiness-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={styles.selectInput}
            >
              <option value="ALL">All Criteria Matches</option>
              <option value="READY_TO_INTERVIEW">Bar Cleared (Ready)</option>
              <option value="COMPETITIVE">Competitive Range</option>
              <option value="PREPARATION_NEEDED">Preparation Needed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company Cards Grid */}
      <div style={styles.companiesGrid}>
        {filteredComparisons.map((result) => {
          const { company, matchPercentage, statusLabel, statusColor, scoreDeltas, keyGaps, strengthsAgainstBar, recommendedAction } = result;
          const isExpanded = expandedCompanyId === company.id;

          return (
            <div
              key={company.id}
              className={`glass-panel glow-${company.color}`}
              style={styles.companyCard}
            >
              {/* Card Top: Logo, Company Name, Tier, Match Pill */}
              <div style={styles.cardTopRow}>
                <div style={styles.companyIdentity}>
                  <div style={{ ...styles.companyLogoBadge, color: `var(--neon-${company.color})`, borderColor: `var(--neon-${company.color})` }}>
                    {company.logoLetter}
                  </div>
                  <div>
                    <div style={styles.nameRow}>
                      <h3 style={styles.companyName} className="cyber-font">{company.name}</h3>
                      <span style={styles.tierTag} className="cyber-font">{company.tier}</span>
                    </div>
                    <p style={styles.companySlogan}>{company.slogan}</p>
                  </div>
                </div>

                <div style={styles.matchScoreBox}>
                  <span style={styles.matchScoreLabel} className="cyber-font">MATCH INDEX</span>
                  <span style={{ ...styles.matchPercentage, color: statusColor === 'green' ? 'var(--neon-green)' : statusColor === 'cyan' ? 'var(--neon-cyan)' : 'var(--neon-pink)' }}>
                    {matchPercentage}%
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div style={{
                ...styles.statusBanner,
                backgroundColor: statusColor === 'green' ? 'rgba(16, 185, 129, 0.08)' : statusColor === 'cyan' ? 'rgba(129, 140, 248, 0.08)' : 'rgba(217, 70, 239, 0.08)',
                borderColor: statusColor === 'green' ? 'rgba(16, 185, 129, 0.25)' : statusColor === 'cyan' ? 'rgba(129, 140, 248, 0.25)' : 'rgba(217, 70, 239, 0.25)',
                color: statusColor === 'green' ? 'var(--neon-green)' : statusColor === 'cyan' ? 'var(--neon-cyan)' : 'var(--neon-pink)'
              }} className="cyber-font">
                <span style={{
                  ...styles.statusDot,
                  backgroundColor: statusColor === 'green' ? 'var(--neon-green)' : statusColor === 'cyan' ? 'var(--neon-cyan)' : 'var(--neon-pink)'
                }}></span>
                {statusLabel}
              </div>

              {/* Side-by-Side Comparison Metrics: Candidate vs Company Bar */}
              <div style={styles.comparisonTable}>
                {/* Overall */}
                <div style={styles.compRow}>
                  <div style={styles.compMetricHeader}>
                    <span style={styles.compMetricName} className="cyber-font">Overall Score</span>
                    <span style={styles.compDeltaText}>
                      {scoreDeltas.overall >= 0 ? (
                        <span style={{ color: 'var(--neon-green)' }}>▲ +{scoreDeltas.overall}% Above Bar</span>
                      ) : (
                        <span style={{ color: 'var(--neon-pink)' }}>▼ {scoreDeltas.overall}% Below Bar</span>
                      )}
                    </span>
                  </div>
                  <div style={styles.compBarWrapper}>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>You: {candidateScores.overall}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${candidateScores.overall}%`, backgroundColor: 'var(--neon-cyan)' }} />
                      </div>
                    </div>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>Bar: {company.minOverall}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${company.minOverall}%`, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Accuracy */}
                <div style={styles.compRow}>
                  <div style={styles.compMetricHeader}>
                    <span style={styles.compMetricName} className="cyber-font">Technical Accuracy</span>
                    <span style={styles.compDeltaText}>
                      {scoreDeltas.technical >= 0 ? (
                        <span style={{ color: 'var(--neon-green)' }}>▲ +{scoreDeltas.technical}% Above Bar</span>
                      ) : (
                        <span style={{ color: 'var(--neon-pink)' }}>▼ {scoreDeltas.technical}% Below Bar</span>
                      )}
                    </span>
                  </div>
                  <div style={styles.compBarWrapper}>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>You: {candidateScores.technical}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${candidateScores.technical}%`, backgroundColor: 'var(--neon-green)' }} />
                      </div>
                    </div>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>Bar: {company.minTechnical}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${company.minTechnical}%`, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solution Optimality */}
                <div style={styles.compRow}>
                  <div style={styles.compMetricHeader}>
                    <span style={styles.compMetricName} className="cyber-font">Solution Optimality</span>
                    <span style={styles.compDeltaText}>
                      {scoreDeltas.optimality >= 0 ? (
                        <span style={{ color: 'var(--neon-green)' }}>▲ +{scoreDeltas.optimality}% Above Bar</span>
                      ) : (
                        <span style={{ color: 'var(--neon-pink)' }}>▼ {scoreDeltas.optimality}% Below Bar</span>
                      )}
                    </span>
                  </div>
                  <div style={styles.compBarWrapper}>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>You: {candidateScores.optimality}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${candidateScores.optimality}%`, backgroundColor: 'var(--neon-pink)' }} />
                      </div>
                    </div>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>Bar: {company.minOptimality}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${company.minOptimality}%`, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communication Clarity */}
                <div style={styles.compRow}>
                  <div style={styles.compMetricHeader}>
                    <span style={styles.compMetricName} className="cyber-font">Communication</span>
                    <span style={styles.compDeltaText}>
                      {scoreDeltas.communication >= 0 ? (
                        <span style={{ color: 'var(--neon-green)' }}>▲ +{scoreDeltas.communication}% Above Bar</span>
                      ) : (
                        <span style={{ color: 'var(--neon-pink)' }}>▼ {scoreDeltas.communication}% Below Bar</span>
                      )}
                    </span>
                  </div>
                  <div style={styles.compBarWrapper}>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>You: {candidateScores.communication}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${candidateScores.communication}%`, backgroundColor: 'var(--neon-blue)' }} />
                      </div>
                    </div>
                    <div style={styles.compBarContainer}>
                      <span style={styles.barLegend}>Bar: {company.minCommunication}%</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${company.minCommunication}%`, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Focus Tags */}
              <div style={styles.focusTagsWrapper}>
                <span style={styles.focusTitle} className="cyber-font">PRIMARY FOCUS DOMAINS:</span>
                <div style={styles.focusTagsList}>
                  {company.primaryFocus.map((f, i) => (
                    <span key={i} style={styles.focusTagPill}>{f}</span>
                  ))}
                </div>
              </div>

              {/* Expandable Deep-Dive Criteria Drawer */}
              {isExpanded && (
                <div style={styles.expandedDrawer}>
                  <div style={styles.drawerSection}>
                    <h4 style={styles.drawerTitle} className="cyber-font">INTERVIEW FORMAT & STRUCTURE</h4>
                    <p style={styles.drawerText}>{company.interviewFormat}</p>
                  </div>

                  <div style={styles.drawerSection}>
                    <h4 style={styles.drawerTitle} className="cyber-font">CULTURE & EVALUATION INSIGHT</h4>
                    <p style={styles.drawerText}>{company.cultureInsight}</p>
                  </div>

                  <div style={styles.drawerSection}>
                    <h4 style={styles.drawerTitle} className="cyber-font">EVALUATED PILLARS & WEIGHTS</h4>
                    <div style={styles.pillarsGrid}>
                      {company.evaluatedPillars.map((p, i) => (
                        <div key={i} style={styles.pillarBox}>
                          <div style={styles.pillarHeader}>
                            <span style={styles.pillarTitle} className="cyber-font">{p.title}</span>
                            <span style={styles.pillarWeight} className="cyber-font">{p.weight}% Wt</span>
                          </div>
                          <p style={styles.pillarDesc}>{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Concrete Gap Analysis & Recommendations */}
                  <div style={styles.gapRecBox}>
                    {strengthsAgainstBar.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <h4 style={{ color: 'var(--neon-green)', fontSize: '11px', marginBottom: '6px' }} className="cyber-font">
                          STRENGTHS AGAINST COMPANY BAR:
                        </h4>
                        <ul style={styles.gapList}>
                          {strengthsAgainstBar.map((s, i) => (
                            <li key={i} style={{ ...styles.gapItem, color: 'var(--neon-green)' }}>✓ {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <h4 style={{ color: 'var(--neon-pink)', fontSize: '11px', marginBottom: '6px' }} className="cyber-font">
                      CRITERIA GAP ANALYSIS:
                    </h4>
                    {keyGaps.length > 0 ? (
                      <ul style={styles.gapList}>
                        {keyGaps.map((g, i) => (
                          <li key={i} style={styles.gapItem}>• {g}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: 'var(--neon-green)', fontSize: '12px' }}>
                        ✓ All numerical score thresholds are currently cleared!
                      </p>
                    )}

                    <h4 style={{ color: 'var(--neon-cyan)', fontSize: '11px', marginTop: '10px', marginBottom: '6px' }} className="cyber-font">
                      STRATEGIC ACTION RECOMMENDATION:
                    </h4>
                    <p style={styles.recActionText}>{recommendedAction}</p>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div style={styles.cardActionsRow}>
                <button
                  type="button"
                  id={`company-details-toggle-${company.id.toLowerCase()}`}
                  style={styles.toggleDetailsBtn}
                  onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                  className="cyber-font"
                >
                  {isExpanded ? '▲ HIDE CRITERIA DETAILS' : '▼ VIEW FULL CRITERIA & PILLARS'}
                </button>

                <button
                  type="button"
                  id={`launch-mock-for-${company.id.toLowerCase()}`}
                  className={`btn-cyber btn-cyber-${company.color}`}
                  style={styles.launchMockBtn}
                  onClick={() => handleLaunchTargetedMock(company)}
                >
                  PRACTICE FOR {company.name.toUpperCase()}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  topBanner: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    borderRadius: '16px',
  },
  bannerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
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
  overallReadinessBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px 20px',
    minWidth: '240px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  readinessLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
  },
  readinessGaugeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  readinessScoreBig: {
    fontFamily: 'var(--font-title)',
    fontSize: '32px',
    fontWeight: 'bold',
    lineHeight: '1',
  },
  readinessSubtext: {
    display: 'block',
    fontSize: '12px',
    color: '#fff',
    fontWeight: '600',
  },
  readinessSubBadge: {
    display: 'block',
    fontSize: '10px',
    color: 'var(--neon-cyan)',
    marginTop: '2px',
  },
  candidateVectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '18px',
  },
  vectorItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  vectorLabel: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
  },
  vectorValRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  vectorVal: {
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  vectorTarget: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  vectorBarBg: {
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  vectorBarFill: {
    height: '100%',
    borderRadius: '2px',
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
    minWidth: '240px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  searchIcon: {
    fontSize: '14px',
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
  companiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: '20px',
  },
  companyCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
  },
  companyIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
  },
  companyLogoBadge: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-title)',
    fontWeight: 'bold',
    fontSize: '18px',
    flexShrink: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  companyName: {
    fontSize: '18px',
    color: '#fff',
    margin: 0,
  },
  tierTag: {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--text-light)',
    letterSpacing: '0.05em',
  },
  companySlogan: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '3px',
    lineHeight: '1.3',
  },
  matchScoreBox: {
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '8px 12px',
    minWidth: '80px',
  },
  matchScoreLabel: {
    fontSize: '7px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '2px',
  },
  matchPercentage: {
    fontFamily: 'var(--font-title)',
    fontSize: '22px',
    fontWeight: 'bold',
  },
  statusBanner: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '10px',
    letterSpacing: '0.08em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  comparisonTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '14px',
  },
  compRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  compMetricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compMetricName: {
    fontSize: '10px',
    color: '#cbd5e1',
    letterSpacing: '0.05em',
  },
  compDeltaText: {
    fontSize: '10px',
    fontWeight: '600',
  },
  compBarWrapper: {
    display: 'flex',
    gap: '12px',
  },
  compBarContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  barLegend: {
    fontSize: '9px',
    color: 'var(--text-muted)',
  },
  barTrack: {
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '2px',
  },
  focusTagsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  focusTitle: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
  },
  focusTagsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  focusTagPill: {
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: 'var(--text-light)',
  },
  expandedDrawer: {
    borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
    paddingTop: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  drawerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  drawerTitle: {
    fontSize: '9px',
    color: 'var(--neon-cyan)',
    letterSpacing: '0.08em',
  },
  drawerText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '8px',
    marginTop: '4px',
  },
  pillarBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    padding: '8px',
  },
  pillarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  pillarTitle: {
    fontSize: '9px',
    color: '#fff',
  },
  pillarWeight: {
    fontSize: '9px',
    color: 'var(--neon-green)',
  },
  pillarDesc: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    lineHeight: '1.3',
  },
  gapRecBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px',
  },
  gapList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    margin: 0,
    padding: 0,
  },
  gapItem: {
    fontSize: '11px',
    color: 'var(--neon-pink)',
    lineHeight: '1.3',
  },
  recActionText: {
    fontSize: '11px',
    color: 'var(--text-light)',
    lineHeight: '1.4',
  },
  cardActionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '14px',
    flexWrap: 'wrap',
  },
  toggleDetailsBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--neon-cyan)',
    fontSize: '9px',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    padding: '6px 0',
  },
  launchMockBtn: {
    padding: '10px 18px',
    fontSize: '11px',
    borderRadius: '6px',
  },
};
