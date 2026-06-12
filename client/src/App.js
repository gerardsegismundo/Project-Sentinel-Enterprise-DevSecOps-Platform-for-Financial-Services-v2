import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { getAccounts, getHealth, transfer, login, setToken, clearToken } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data.accounts);
      setError(null);
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
        return;
      }
      setError(err.message);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchAccounts().finally(() => setLoading(false));
    }
  }, [user, fetchAccounts]);

  const handleLogin = async (username, password) => {
    try {
      const data = await login(username, password);
      setToken(data.token);
      setUser(data.user);
      setError(null);
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setAccounts([]);
    setView('dashboard');
  };

  if (!user) {
    return (
      <div className="app">
        <Header health={health} user={null} onLogout={handleLogout} />
        <main className="main">
          <LoginView onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header health={health} user={user} onLogout={handleLogout} />
      <Nav view={view} onNavigate={setView} />
      <main className="main">
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <Loading />
        ) : view === 'dashboard' ? (
          <Dashboard accounts={accounts} />
        ) : view === 'transfer' ? (
          <TransferView accounts={accounts} onTransfer={fetchAccounts} />
        ) : (
          <HealthView health={health} onRefresh={fetchHealth} />
        )}
      </main>
    </div>
  );
}

function Header({ health, user, onLogout }) {
  const online = health && health.status === 'healthy';
  return (
    <header className="header">
      <h1>Project Sentinel Banking</h1>
      <div className="header-right">
        {user && (
          <div className="user-info">
            <span className="user-role">{user.role}</span>
            <span className="user-name">{user.username}</span>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        )}
        <div className="header-status">
          <span className={`status-dot ${online ? '' : 'offline'}`} />
          {online ? 'Online' : 'Offline'}
        </div>
      </div>
    </header>
  );
}

function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Sign In</h2>
          <p>Access your banking dashboard</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-hint">
          Demo accounts: admin, teller, viewer (any password)
        </div>
      </div>
    </div>
  );
}

function Nav({ view, onNavigate }) {
  return (
    <nav className="nav">
      <button className={view === 'dashboard' ? 'active' : ''} onClick={() => onNavigate('dashboard')}>
        Dashboard
      </button>
      <button className={view === 'transfer' ? 'active' : ''} onClick={() => onNavigate('transfer')}>
        Transfer
      </button>
      <button className={view === 'health' ? 'active' : ''} onClick={() => onNavigate('health')}>
        System Health
      </button>
    </nav>
  );
}

function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      Loading...
    </div>
  );
}

function Dashboard({ accounts }) {
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <>
      <div className="accounts-grid">
        {accounts.map((account) => (
          <div key={account.id} className="account-card">
            <div className="account-type">{account.type}</div>
            <div className="account-id">Account #{account.id}</div>
            <div className="account-balance-label">Available Balance</div>
            <div className="account-balance">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header">Portfolio Summary</div>
        <div className="card-body">
          <div className="account-balance-label">Total Balance</div>
          <div className="account-balance">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
    </>
  );
}

function TransferView({ accounts, onTransfer }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [txError, setTxError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setTxError(null);

    try {
      const data = await transfer(Number(fromId), Number(toId), Number(amount));
      setResult(data.message);
      setHistory((prev) => [
        {
          id: Date.now(),
          from: fromId,
          to: toId,
          amount: Number(amount),
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setAmount('');
      await onTransfer();
    } catch (err) {
      setTxError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">New Transfer</div>
        <div className="card-body">
          {result && <div className="alert alert-success">{result}</div>}
          {txError && <div className="alert alert-error">{txError}</div>}
          <form className="transfer-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="from-account">From Account</label>
              <select id="from-account" value={fromId} onChange={(e) => setFromId(e.target.value)} required>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type} (#{a.id}) &mdash; ${a.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="to-account">To Account</label>
              <select id="to-account" value={toId} onChange={(e) => setToId(e.target.value)} required>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type} (#{a.id}) &mdash; ${a.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount ($)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting || !fromId || !toId || !amount}>
              {submitting ? 'Processing...' : 'Transfer Funds'}
            </button>
          </form>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card">
          <div className="card-header">Recent Transfers (This Session)</div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.time}</td>
                    <td>Account #{tx.from}</td>
                    <td>Account #{tx.to}</td>
                    <td className="tx-amount debit">-${tx.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function HealthView({ health, onRefresh }) {
  return (
    <div className="card">
      <div className="card-header">
        System Health
        <button className="btn btn-primary" onClick={onRefresh} style={{ padding: '0.35rem 1rem', fontSize: '0.85rem' }}>
          Refresh
        </button>
      </div>
      <div className="card-body">
        {health ? (
          <div className="health-grid">
            <div className="health-item">
              <div className="health-item-label">Status</div>
              <div className={`health-item-value ${health.status === 'healthy' ? 'healthy' : ''}`}>
                {health.status}
              </div>
            </div>
            <div className="health-item">
              <div className="health-item-label">Version</div>
              <div className="health-item-value">{health.version || 'N/A'}</div>
            </div>
            <div className="health-item">
              <div className="health-item-label">Last Check</div>
              <div className="health-item-value" style={{ fontSize: '0.9rem' }}>
                {new Date(health.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-error">Unable to connect to the API server</div>
        )}
      </div>
    </div>
  );
}

export default App;
