import React, { useState } from 'react';

interface AuthModalProps {
  onSuccess: (user: { name: string; email: string }) => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logMessage, setLogMessage] = useState('');

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      setLogMessage("CRITICAL ERROR: MISSING PARAMETERS");
      return;
    }

    setLoading(true);
    setLogMessage("ESTABLISHING CONNECTIVITY UPLINK...");
    await delay(800);

    setLogMessage("COMMENCING CREDENTIAL SYNAPSE SCAN...");
    await delay(700);

    if (isRegister) {
      setLogMessage("GENERATING ENCRYPTED ACCESS SIGNATURE...");
      await delay(600);
    } else {
      setLogMessage("AUTHENTICATING COMPLIANCE SCHEMAS...");
      await delay(600);
    }

    setLogMessage("ACCESS GRANTED. MEMORY PROTOCOLS ONLINE.");
    await delay(400);

    setLoading(false);
    const loggedUser = {
      name: isRegister ? name : email.split('@')[0].toUpperCase(),
      email
    };
    
    // Store in localStorage to simulate persistent session
    localStorage.setItem('sim_auth_user', JSON.stringify(loggedUser));
    onSuccess(loggedUser);
  };

  return (
    <div style={styles.overlay} id="auth-modal-container">
      <div className="glass-panel glow-blue" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>AI</div>
          <h2 style={styles.title}>Cognitive Synapse Login</h2>
          <p style={styles.subtitle}>Interrogation Protocol V1.0</p>
        </div>

        <div style={styles.tabContainer}>
          <button
            id="auth-toggle-login-tab"
            type="button"
            className="cyber-font"
            style={{
              ...styles.tabBtn,
              borderBottomColor: !isRegister ? 'var(--neon-cyan)' : 'transparent',
              color: !isRegister ? 'var(--neon-cyan)' : 'var(--text-muted)'
            }}
            onClick={() => { setIsRegister(false); setLogMessage(''); }}
          >
            Access Terminal
          </button>
          <button
            id="auth-toggle-register-tab"
            type="button"
            className="cyber-font"
            style={{
              ...styles.tabBtn,
              borderBottomColor: isRegister ? 'var(--neon-pink)' : 'transparent',
              color: isRegister ? 'var(--neon-pink)' : 'var(--text-muted)'
            }}
            onClick={() => { setIsRegister(true); setLogMessage(''); }}
          >
            Generate Node
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.inputGroup}>
              <label htmlFor="auth-name-input" style={styles.label} className="cyber-font">Candidate Designation</label>
              <input
                id="auth-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ALAN TURING"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label htmlFor="auth-email-input" style={styles.label} className="cyber-font">Secure Comm Line (Email)</label>
            <input
              id="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@quantummail.net"
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="auth-password-input" style={styles.label} className="cyber-font">Decryption Key (Password)</label>
            <input
              id="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          {logMessage && (
            <div 
              id="auth-log-message"
              style={{
                ...styles.terminalLog,
                color: logMessage.includes("ERROR") ? 'var(--neon-pink)' : 'var(--neon-cyan)'
              }}
            >
              <span style={styles.cursor} className="cyber-font">&gt;</span> {logMessage}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            className={`btn-cyber ${isRegister ? 'btn-cyber-pink' : 'btn-cyber-cyan'}`}
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loaderSpinner}></span>
            ) : isRegister ? (
              "SPAWN PROTOCOL"
            ) : (
              "ESTABLISH LINK"
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Secure direct link standard ISO-2026. Bypass filters: online.</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 3, 6, 0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(16px)',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '36px',
    backgroundColor: 'rgba(10, 10, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    border: '1.5px solid var(--neon-cyan)',
    boxShadow: '0 0 15px rgba(129, 140, 248, 0.2)',
    backgroundColor: 'rgba(129, 140, 248, 0.05)',
    color: 'var(--neon-cyan)',
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  title: {
    fontSize: '20px',
    color: '#fff',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '24px',
  },
  tabBtn: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'var(--font-sans)',
  },
  terminalLog: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    padding: '10px',
    marginTop: '6px',
    lineHeight: '1.4',
    letterSpacing: '0.05em',
  },
  cursor: {
    animation: 'audioWavePulse 0.8s steps(2, start) infinite',
    marginRight: '4px',
  },
  submitBtn: {
    width: '100%',
    height: '46px',
    marginTop: '8px',
  },
  loaderSpinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spinSlow 1s linear infinite',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.25)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
};
