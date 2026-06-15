"use client";

import React, { useState, useEffect } from "react";
import {
  login as apiLogin,
  getAccounts,
  transfer as apiTransfer,
  getHealth,
  setToken,
  clearToken,
  type User,
  type Account,
  type HealthResponse,
} from "../lib/api";

/* ─── Icon components ─── */
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LayoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function ArrowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─── Types ─── */
type Tab = "dashboard" | "transfer" | "health";

interface TransferRecord {
  time: string;
  from: number;
  to: number;
  amount: number;
}

/* ─── Helpers ─── */
function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

/* ─── Main App ─── */
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAccounts()
      .then((data) => { if (!cancelled) setAccounts(data.accounts); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  function refreshAccounts() {
    getAccounts()
      .then((data) => setAccounts(data.accounts))
      .catch(() => {});
  }

  function handleLogin(loggedInUser: User) {
    setUser(loggedInUser);
    setActiveTab("dashboard");
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setAccounts([]);
    setTransfers([]);
    setActiveTab("dashboard");
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-bg/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <ShieldIcon className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Project Sentinel</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-text-muted">Online</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-medium text-accent">
                {user.username[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium leading-none">{user.username}</p>
                <p className="text-[10px] text-text-muted leading-none mt-0.5">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-elevated transition-all duration-200 cursor-pointer"
              title="Logout"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-bg">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {([
            { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutIcon },
            { id: "transfer" as Tab, label: "Transfer", icon: ArrowsIcon },
            { id: "health" as Tab, label: "System Health", icon: HeartPulseIcon },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${
                activeTab === id
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-secondary hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <DashboardView accounts={accounts} />
        )}
        {activeTab === "transfer" && (
          <TransferView
            accounts={accounts}
            transfers={transfers}
            onTransfer={(record) => {
              setTransfers((prev) => [record, ...prev]);
              refreshAccounts();
            }}
          />
        )}
        {activeTab === "health" && <HealthView />}
      </main>
    </div>
  );
}

/* ─── Login View ─── */
function LoginView({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiLogin(username, password);
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Subtle radial glow behind card */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <ShieldIcon className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Project Sentinel</h1>
          <p className="text-sm text-text-muted mt-1">Secure banking dashboard</p>
        </div>

        {/* Card with glassmorphism */}
        <div className="rounded-2xl border border-glass-border bg-glass backdrop-blur-xl shadow-2xl shadow-black/20 p-8">
          <h2 className="text-lg font-medium mb-1">Sign in</h2>
          <p className="text-sm text-text-muted mb-6">Enter your credentials to continue</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-danger-bg border border-danger/20 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border text-sm placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-all duration-200"
                placeholder="Enter username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border text-sm placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-all duration-200"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-all duration-200 cursor-pointer"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-5">
            Demo accounts: <span className="text-text-secondary font-medium">admin</span>,{" "}
            <span className="text-text-secondary font-medium">teller</span>,{" "}
            <span className="text-text-secondary font-medium">viewer</span> — any password
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard View ─── */
function DashboardView({ accounts }: { accounts: Account[] }) {
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-8">
      {/* Portfolio overview card */}
      <div className="rounded-2xl border border-glass-border bg-glass backdrop-blur-xl p-8">
        <p className="text-sm text-text-muted mb-1">Total Balance</p>
        <p className="text-4xl font-bold tracking-tight">{formatCurrency(total)}</p>
        <p className="text-xs text-text-muted mt-2">{accounts.length} active accounts</p>
      </div>

      {/* Account cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="group rounded-2xl border border-border bg-bg-card p-6 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {account.type}
              </span>
              <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-elevated">
                #{account.id}
              </span>
            </div>
            <p className="text-sm text-text-secondary mb-1">Available Balance</p>
            <p className="text-2xl font-semibold tracking-tight">{formatCurrency(account.balance)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Transfer View ─── */
function TransferView({
  accounts,
  transfers,
  onTransfer,
}: {
  accounts: Account[];
  transfers: TransferRecord[];
  onTransfer: (record: TransferRecord) => void;
}) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = fromId && toId && amount && Number(amount) > 0 && fromId !== toId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await apiTransfer(Number(fromId), Number(toId), Number(amount));
      setMessage("Transfer successful");
      onTransfer({
        time: formatTime(new Date()),
        from: Number(fromId),
        to: Number(toId),
        amount: Number(amount),
      });
      setAmount("");
    } catch (err) {
      setError((err as Error).message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Transfer form card */}
      <div className="rounded-2xl border border-glass-border bg-glass backdrop-blur-xl p-8">
        <h2 className="text-lg font-medium mb-1">New Transfer</h2>
        <p className="text-sm text-text-muted mb-6">Move funds between your accounts</p>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-success-bg border border-success/20 text-sm text-success">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-danger-bg border border-danger/20 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">From Account</label>
              <div className="relative">
                <select
                  id="from-account"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl bg-bg-input border border-border text-sm focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-all duration-200 cursor-pointer"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type} (#{a.id}) — {formatCurrency(a.balance)}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">To Account</label>
              <div className="relative">
                <select
                  id="to-account"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 rounded-xl bg-bg-input border border-border text-sm focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-all duration-200 cursor-pointer"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type} (#{a.id}) — {formatCurrency(a.balance)}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-bg-input border border-border text-sm placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-all duration-200"
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            {loading ? "Processing…" : "Transfer Funds"}
          </button>
        </form>
      </div>

      {/* Transfer history */}
      {transfers.length > 0 && (
        <div className="rounded-2xl border border-border bg-bg-card p-6">
          <h3 className="text-sm font-medium mb-4">Recent Transfers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs uppercase tracking-wider">
                  <th className="text-left pb-3 font-medium">Time</th>
                  <th className="text-left pb-3 font-medium">From</th>
                  <th className="text-left pb-3 font-medium">To</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transfers.map((t, i) => (
                  <tr key={i} className="text-text-secondary">
                    <td className="py-3 font-mono text-xs">{t.time}</td>
                    <td className="py-3">Account #{t.from}</td>
                    <td className="py-3">Account #{t.to}</td>
                    <td className="py-3 text-right font-medium text-danger">
                      -{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Health View ─── */
function HealthView() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((data) => { if (!cancelled) setHealth(data); })
      .catch(() => { if (!cancelled) setError("Unable to reach the API server"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function fetchHealth() {
    setLoading(true);
    setError("");
    getHealth()
      .then((data) => setHealth(data))
      .catch(() => setError("Unable to reach the API server"))
      .finally(() => setLoading(false));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">System Health</h2>
          <p className="text-sm text-text-muted">Real-time server status</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-bg-elevated disabled:opacity-50 transition-all duration-200 cursor-pointer"
        >
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-danger-bg border border-danger/20 text-sm text-danger">
          {error}
        </div>
      )}

      {health && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-bg-card p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Status</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-lg font-medium text-success">{health.status}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Version</p>
            <p className="text-lg font-medium font-mono">{health.version}</p>
          </div>
          <div className="rounded-2xl border border-border bg-bg-card p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Last Check</p>
            <p className="text-lg font-medium font-mono">
              {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
